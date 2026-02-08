import { NextRequest, NextResponse } from "next/server";

const PISTON_URL = "https://emkc.org/api/v2/piston/execute";
const MAX_CODE_LENGTH = 50_000;
const MAX_OUTPUT = 10_000;

function truncate(str: string, max: number) {
  if (str.length > max) return str.slice(0, max) + "\n... (output truncated)";
  return str;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, stdin } = body as { code: string; stdin?: string };

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

    // Execute via Piston API
    const pistonRes = await fetch(PISTON_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "c++",
        version: "10.2.0",
        files: [{ name: "main.cpp", content: code }],
        stdin: stdin || "",
        compile_timeout: 10000,
        run_timeout: 5000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
    });

    if (!pistonRes.ok) {
      const text = await pistonRes.text();
      return NextResponse.json({
        success: false,
        phase: "compile",
        error: `Execution service error: ${text}`,
        stdout: "",
        stderr: "",
      });
    }

    const data = await pistonRes.json();
    const compile = data.compile || {};
    const run = data.run || {};

    // Compilation failure
    if (compile.code !== undefined && compile.code !== 0) {
      return NextResponse.json({
        success: false,
        phase: "compile",
        error: truncate(compile.stderr || compile.output || "Compilation failed", MAX_OUTPUT),
        stdout: "",
        stderr: truncate(compile.stderr || "", MAX_OUTPUT),
      });
    }

    // Runtime error
    if (run.code !== 0) {
      return NextResponse.json({
        success: false,
        phase: "runtime",
        error: run.signal
          ? `Killed by signal ${run.signal}`
          : `Runtime error (exit code ${run.code})`,
        stdout: truncate(run.stdout || "", MAX_OUTPUT),
        stderr: truncate(run.stderr || "", MAX_OUTPUT),
      });
    }

    // Success
    return NextResponse.json({
      success: true,
      phase: "complete",
      stdout: truncate(run.stdout || "", MAX_OUTPUT),
      stderr: truncate(run.stderr || "", MAX_OUTPUT),
      ...(compile.stderr ? { warnings: truncate(compile.stderr, MAX_OUTPUT) } : {}),
    });
  } catch (err) {
    console.error("Run code error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
