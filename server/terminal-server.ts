/**
 * Terminal WebSocket Server
 *
 * Spawns a real PTY (pseudo-terminal) for each WebSocket connection,
 * giving the browser a full interactive shell — just like VS Code's terminal.
 *
 * Run: npx tsx server/terminal-server.ts
 */

import { WebSocketServer, type WebSocket } from "ws";
import * as pty from "node-pty";
import * as os from "os";

const PORT = parseInt(process.env.TERMINAL_PORT || "3061", 10);
const SHELL = process.env.SHELL || "/bin/bash";

const wss = new WebSocketServer({ port: PORT });

console.log(`\x1b[32m✓ Terminal server listening on ws://localhost:${PORT}\x1b[0m`);
console.log(`  Shell: ${SHELL}`);
console.log(`  Home:  ${os.homedir()}`);

wss.on("connection", (ws: WebSocket, req) => {
  // Parse initial cwd from query string: ws://localhost:3061?cwd=/some/path
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const initialCwd = url.searchParams.get("cwd") || os.homedir();

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
    } catch {
      // ws already closed
    }
  });

  // Browser → PTY
  ws.on("message", (raw: Buffer | string) => {
    try {
      const msg = JSON.parse(raw.toString());
      switch (msg.type) {
        case "input":
          ptyProcess.write(msg.data);
          break;
        case "resize":
          if (msg.cols > 0 && msg.rows > 0) {
            ptyProcess.resize(msg.cols, msg.rows);
          }
          break;
        default:
          // Unknown message type — ignore
          break;
      }
    } catch {
      // Not JSON — treat as raw input
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
    try {
      ws.close();
    } catch {
      // already closed
    }
  });
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[terminal] Shutting down…");
  wss.clients.forEach((ws) => ws.close());
  wss.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  wss.clients.forEach((ws) => ws.close());
  wss.close(() => process.exit(0));
});
