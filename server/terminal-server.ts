/**
 * Terminal + Filesystem WebSocket Server
 *
 * Spawns a real PTY (pseudo-terminal) for each WebSocket connection,
 * AND serves filesystem operations (browse, tree, read, write, create, delete, rename)
 * over the same WebSocket so the web IDE works even when deployed to Vercel.
 *
 * Run: npx tsx server/terminal-server.ts
 *
 * Protocol:
 *  Browser → Server:
 *    { type: "input", data: "..." }          → PTY stdin
 *    { type: "resize", cols: N, rows: N }    → PTY resize
 *    { type: "fs", action: "browse"|"tree"|"read"|"write"|"create"|"delete"|"rename", ... }
 *  Server → Browser:
 *    { type: "output", data: "..." }         → PTY stdout
 *    { type: "fs-result", id: "...", ... }   → FS operation result
 */

import { WebSocketServer, type WebSocket } from "ws";
import * as pty from "node-pty";
import * as os from "os";
import * as fs from "fs";
import * as fsP from "fs/promises";
import * as pathMod from "path";
import http from "http";

const PORT = parseInt(process.env.TERMINAL_PORT || "3061", 10);
const SHELL = process.env.SHELL || "/bin/bash";
const AUTH_TOKEN = process.env.TERMINAL_AUTH_TOKEN || "";

/* ── HTTP server to handle CORS preflight + upgrade ── */
const httpServer = http.createServer((_req, res) => {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
  });
  res.end("Terminal server OK");
});

const wss = new WebSocketServer({ noServer: true });

httpServer.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  // Auth check
  if (AUTH_TOKEN) {
    const token = url.searchParams.get("token");
    if (token !== AUTH_TOKEN) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

httpServer.listen(PORT, () => {
  console.log(`\x1b[32m✓ Terminal server listening on ws://localhost:${PORT}\x1b[0m`);
  console.log(`  Shell: ${SHELL}`);
  console.log(`  Home:  ${os.homedir()}`);
  if (AUTH_TOKEN) console.log("  Auth:  token required");
});

/* ── FS helpers ── */
const IGNORED = new Set([
  "node_modules", ".git", ".next", "__pycache__", ".DS_Store",
  "dist", "build", ".cache", "$RECYCLE.BIN", "System Volume Information",
]);

interface TreeEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: TreeEntry[];
}

async function buildTree(dirPath: string, depth: number): Promise<TreeEntry[]> {
  if (depth <= 0) return [];
  const dirents = await fsP.readdir(dirPath, { withFileTypes: true });
  const entries: TreeEntry[] = [];
  const sorted = dirents
    .filter((d) => !IGNORED.has(d.name) && !d.name.startsWith("."))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
  for (const dirent of sorted) {
    const fullPath = pathMod.join(dirPath, dirent.name);
    if (dirent.isDirectory()) {
      const children = await buildTree(fullPath, depth - 1);
      entries.push({ name: dirent.name, path: fullPath, type: "directory", children });
    } else if (dirent.isFile()) {
      entries.push({ name: dirent.name, path: fullPath, type: "file" });
    }
  }
  return entries;
}

async function handleFS(msg: Record<string, unknown>, ws: WebSocket) {
  const id = (msg.id as string) || "";
  const send = (data: Record<string, unknown>) => {
    try {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "fs-result", id, ...data }));
      }
    } catch { /* closed */ }
  };

  try {
    switch (msg.action) {
      case "browse": {
        const dirPath = msg.path as string | undefined;
        if (!dirPath) {
          const home = os.homedir();
          const roots: { name: string; path: string; type: string }[] = [
            { name: "Home", path: home, type: "directory" },
            { name: "/", path: "/", type: "directory" },
          ];
          const devDirs = ["Documents", "Projects", "projects", "dev", "src", "code", "Desktop"];
          for (const d of devDirs) {
            const full = pathMod.join(home, d);
            try {
              const stat = await fsP.stat(full);
              if (stat.isDirectory()) roots.push({ name: d, path: full, type: "directory" });
            } catch { /* */ }
          }
          send({ path: null, entries: roots, home });
          return;
        }
        const dirents = await fsP.readdir(dirPath, { withFileTypes: true });
        const entries: { name: string; path: string; type: string }[] = [];
        const sorted = dirents
          .filter((d) => !IGNORED.has(d.name))
          .sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
          });
        for (const d of sorted) {
          if (d.isDirectory()) entries.push({ name: d.name, path: pathMod.join(dirPath, d.name), type: "directory" });
          else if (d.isFile()) entries.push({ name: d.name, path: pathMod.join(dirPath, d.name), type: "file" });
        }
        const parent = dirPath === "/" ? null : pathMod.dirname(dirPath);
        send({ path: dirPath, parent, entries });
        return;
      }
      case "tree": {
        const dirPath = msg.path as string;
        const depth = (msg.depth as number) || 3;
        const entries = await buildTree(dirPath, depth);
        send({ path: dirPath, entries });
        return;
      }
      case "read": {
        const filePath = msg.path as string;
        const stat = await fsP.stat(filePath);
        if (stat.size > 5 * 1024 * 1024) { send({ error: "File too large (>5MB)" }); return; }
        const content = await fsP.readFile(filePath, "utf-8");
        send({ path: filePath, content });
        return;
      }
      case "write": {
        const filePath = msg.path as string;
        const content = msg.content as string;
        await fsP.mkdir(pathMod.dirname(filePath), { recursive: true });
        await fsP.writeFile(filePath, content, "utf-8");
        send({ success: true, path: filePath });
        return;
      }
      case "create": {
        const targetPath = msg.path as string;
        const itemType = msg.itemType as string; // "file" | "directory"
        try { await fsP.stat(targetPath); send({ error: "Already exists" }); return; } catch { /* good */ }
        if (itemType === "directory") {
          await fsP.mkdir(targetPath, { recursive: true });
        } else {
          await fsP.mkdir(pathMod.dirname(targetPath), { recursive: true });
          await fsP.writeFile(targetPath, "", "utf-8");
        }
        send({ success: true, path: targetPath, itemType });
        return;
      }
      case "delete": {
        const targetPath = msg.path as string;
        if (targetPath === "/" || targetPath === os.homedir()) { send({ error: "Refusing to delete root" }); return; }
        await fsP.rm(targetPath, { recursive: true, force: true });
        send({ success: true, path: targetPath });
        return;
      }
      case "rename": {
        const oldPath = msg.oldPath as string;
        const newPath = msg.newPath as string;
        await fsP.rename(oldPath, newPath);
        send({ success: true, oldPath, newPath });
        return;
      }
      default:
        send({ error: `Unknown action: ${msg.action}` });
    }
  } catch (err: unknown) {
    send({ error: (err as Error).message || "FS operation failed" });
  }
}

/* ── WebSocket connections ── */
wss.on("connection", (ws: WebSocket, req) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  let initialCwd = url.searchParams.get("cwd") || os.homedir();

  // Resolve Vercel-style /var/task paths to the local project directory.
  // On Vercel, process.cwd() is /var/task, but locally the project lives
  // at the directory where this server is running.
  const PROJECT_ROOT = pathMod.resolve(pathMod.dirname(new URL(import.meta.url).pathname), "..");
  if (initialCwd.startsWith("/var/task/")) {
    initialCwd = pathMod.join(PROJECT_ROOT, initialCwd.slice("/var/task/".length));
  } else if (initialCwd === "/var/task") {
    initialCwd = PROJECT_ROOT;
  }

  // Fall back to project root or home if the directory doesn't exist
  if (!fs.existsSync(initialCwd)) {
    console.log(`[terminal] cwd not found: ${initialCwd}, falling back`);
    initialCwd = fs.existsSync(PROJECT_ROOT) ? PROJECT_ROOT : os.homedir();
  }

  console.log(`[terminal] New session → cwd: ${initialCwd}`);

  const ptyProcess = pty.spawn(SHELL, [], {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: initialCwd,
    env: {
      ...process.env,
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
    } as Record<string, string>,
  });

  // PTY stdout → Browser
  ptyProcess.onData((data: string) => {
    try {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "output", data }));
      }
    } catch { /* closed */ }
  });

  // Browser → PTY / FS
  ws.on("message", (raw: Buffer | string) => {
    try {
      const msg = JSON.parse(raw.toString());
      switch (msg.type) {
        case "input":
          ptyProcess.write(msg.data);
          break;
        case "resize":
          if (msg.cols > 0 && msg.rows > 0) ptyProcess.resize(msg.cols, msg.rows);
          break;
        case "fs":
          handleFS(msg, ws);
          break;
        default:
          break;
      }
    } catch {
      ptyProcess.write(raw.toString());
    }
  });

  ws.on("close", () => {
    console.log("[terminal] Session closed");
    ptyProcess.kill();
  });

  ws.on("error", (err) => {
    console.error("[terminal] WS error:", err.message);
    ptyProcess.kill();
  });

  ptyProcess.onExit(({ exitCode }) => {
    console.log(`[terminal] PTY exited (code ${exitCode})`);
    try { ws.close(); } catch { /* */ }
  });
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[terminal] Shutting down…");
  wss.clients.forEach((ws) => ws.close());
  httpServer.close(() => process.exit(0));
});
process.on("SIGTERM", () => {
  wss.clients.forEach((ws) => ws.close());
  httpServer.close(() => process.exit(0));
});
