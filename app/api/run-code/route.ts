import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdtemp, rm } from "fs/promises";
import { execFile } from "child_process";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const MAX_CODE_LENGTH = 50_000;
const COMPILE_TIMEOUT = 10_000; // 10s
const RUN_TIMEOUT = 5_000; // 5s
const MAX_OUTPUT = 10_000; // chars

function truncate(str: string, max: number) {
  if (str.length > max) return str.slice(0, max) + "\n... (output truncated)";
  return str;
}

export async function POST(req: NextRequest) {
  let tmpDir: string | null = null;

  try {
    const body = await req.json();
    const { code } = body as { code: string };

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "No code provided" },
        { status: 400 }
      );
    }

    if (code.length > MAX_CODE_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Code too long (max ${MAX_CODE_LENGTH} chars)` },
        { status: 400 }
      );
    }

    // Create temp directory
    tmpDir = await mkdtemp(path.join(tmpdir(), "tsp-"));
    const srcPath = path.join(tmpDir, "solution.cpp");
    const binPath = path.join(tmpDir, "solution");

    await writeFile(srcPath, code, "utf-8");

    // Compile
    let compileResult;
    try {
      compileResult = await execFileAsync(
        "g++",
        ["-std=c++17", "-Wall", "-Wextra", "-o", binPath, srcPath],
        { timeout: COMPILE_TIMEOUT, maxBuffer: 1024 * 1024 }
      );
    } catch (err: unknown) {
      const compileErr = err as { stderr?: string; code?: number };
      const stderr = compileErr.stderr || "Compilation failed";
      return NextResponse.json({
        success: false,
        phase: "compile",
        error: truncate(stderr, MAX_OUTPUT),
        stdout: "",
        stderr: truncate(stderr, MAX_OUTPUT),
      });
    }

    // Run
    let runResult;
    try {
      runResult = await execFileAsync(binPath, [], {
        timeout: RUN_TIMEOUT,
        maxBuffer: 1024 * 1024,
      });
    } catch (err: unknown) {
      const runErr = err as {
        stderr?: string;
        stdout?: string;
        killed?: boolean;
        signal?: string;
        code?: number;
      };

      if (runErr.killed || runErr.signal === "SIGTERM") {
        return NextResponse.json({
          success: false,
          phase: "runtime",
          error: `Program timed out after ${RUN_TIMEOUT / 1000}s`,
          stdout: truncate(runErr.stdout || "", MAX_OUTPUT),
          stderr: truncate(runErr.stderr || "", MAX_OUTPUT),
        });
      }

      return NextResponse.json({
        success: false,
        phase: "runtime",
        error: `Runtime error (exit code ${runErr.code})`,
        stdout: truncate(runErr.stdout || "", MAX_OUTPUT),
        stderr: truncate(runErr.stderr || "", MAX_OUTPUT),
      });
    }

    return NextResponse.json({
      success: true,
      phase: "complete",
      stdout: truncate(runResult.stdout, MAX_OUTPUT),
      stderr: truncate(runResult.stderr || "", MAX_OUTPUT),
      ...(compileResult.stderr
        ? { warnings: truncate(compileResult.stderr, MAX_OUTPUT) }
        : {}),
    });
  } catch (err) {
    console.error("Run code error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (tmpDir) {
      rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
