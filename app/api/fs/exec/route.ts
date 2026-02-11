import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";

type ExecPayload = {
  cwd?: string;
  command?: string;
  timeoutMs?: number;
};

const ALLOWED_COMMANDS = new Set([
  "make test",
  "make build",
  "make clean",
]);

function isWithin(parent: string, target: string): boolean {
  const rel = path.relative(parent, target);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function hasBuildRoot(dir: string): Promise<boolean> {
  const makefile = await pathExists(path.join(dir, "Makefile"));
  const cmake = await pathExists(path.join(dir, "CMakeLists.txt"));
  return makefile || cmake;
}

async function findNearestBuildRoot(startDir: string): Promise<string | null> {
  let current = path.resolve(startDir);

  for (let i = 0; i < 8; i += 1) {
    if (await hasBuildRoot(current)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return null;
}

async function resolveExecutionCwd(cwd: string, command: string): Promise<string> {
  if (!command.startsWith("make ")) {
    return cwd;
  }

  const nearest = await findNearestBuildRoot(cwd);
  if (nearest) {
    return nearest;
  }

  // Fallback for stale/incorrect workspace roots: run from canonical starter/trustctl.
  const starterTrustctl = path.join(process.cwd(), "starter", "trustctl");
  if (await hasBuildRoot(starterTrustctl)) {
    return starterTrustctl;
  }

  return cwd;
}

async function runCommand(
  cwd: string,
  command: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
  return new Promise((resolve, reject) => {
    const child = spawn("sh", ["-lc", command], {
      cwd,
      env: {
        ...process.env,
        TERM: "dumb",
      },
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let finished = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode: typeof code === "number" ? code : 1,
        timedOut,
      });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExecPayload;
    const cwd = body.cwd?.trim();
    const command = body.command?.trim() ?? "";
    const timeoutMs = Math.max(1000, Math.min(120000, body.timeoutMs ?? 45000));

    if (!cwd) {
      return NextResponse.json({ error: "Missing 'cwd'" }, { status: 400 });
    }
    if (!path.isAbsolute(cwd)) {
      return NextResponse.json({ error: "'cwd' must be absolute" }, { status: 400 });
    }
    if (!ALLOWED_COMMANDS.has(command)) {
      return NextResponse.json(
        { error: `Command not allowed: ${command}` },
        { status: 400 }
      );
    }

    const stat = await fs.stat(cwd).catch(() => null);
    if (!stat || !stat.isDirectory()) {
      return NextResponse.json({ error: "Workspace directory not found" }, { status: 404 });
    }

    const workspacesRoot = path.join(os.homedir(), ".tsp-workspaces");
    const starterRoot = path.join(process.cwd(), "starter");
    if (!isWithin(workspacesRoot, cwd) && !isWithin(starterRoot, cwd)) {
      return NextResponse.json(
        { error: "Workspace path is outside allowed directories" },
        { status: 403 }
      );
    }

    const execCwd = await resolveExecutionCwd(cwd, command);
    if (!isWithin(workspacesRoot, execCwd) && !isWithin(starterRoot, execCwd)) {
      return NextResponse.json(
        { error: "Resolved workspace path is outside allowed directories" },
        { status: 403 }
      );
    }

    const result = await runCommand(execCwd, command, timeoutMs);
    return NextResponse.json({ ...result, cwd: execCwd });
  } catch (err) {
    console.error("[fs/exec]", err);
    return NextResponse.json({ error: "Failed to execute command" }, { status: 500 });
  }
}
