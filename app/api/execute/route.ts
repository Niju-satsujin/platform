import { NextRequest, NextResponse } from "next/server";

/**
 * Cloud code execution via Piston API.
 * Works on Vercel — no local g++ required.
 *
 * Piston supports 50+ languages including C++ (g++ 10.2.0).
 * Public API: https://emkc.org/api/v2/piston/execute
 */

const PISTON_URL =
  process.env.PISTON_URL || "https://emkc.org/api/v2/piston/execute";
const MAX_CODE_LENGTH = 50_000;
const MAX_OUTPUT = 10_000;

function truncate(str: string, max: number) {
  if (str.length > max) return str.slice(0, max) + "\n... (output truncated)";
  return str;
}

/** Map of file extensions to Piston language identifiers */
const LANG_MAP: Record<string, { language: string; version: string }> = {
  cpp: { language: "c++", version: "10.2.0" },
  cc: { language: "c++", version: "10.2.0" },
  cxx: { language: "c++", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
  py: { language: "python", version: "3.10.0" },
  js: { language: "javascript", version: "18.15.0" },
  ts: { language: "typescript", version: "5.0.3" },
  rs: { language: "rust", version: "1.68.2" },
  go: { language: "go", version: "1.16.2" },
  java: { language: "java", version: "15.0.2" },
  sh: { language: "bash", version: "5.2.0" },
  bash: { language: "bash", version: "5.2.0" },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      stdin = "",
      language = "cpp",
      files = [],
    } = body as {
      code: string;
      stdin?: string;
      language?: string;
      files?: { name: string; content: string }[];
    };

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

    const langConfig = LANG_MAP[language] || LANG_MAP["cpp"];

    // Build Piston request
    const pistonBody = {
      language: langConfig.language,
      version: langConfig.version,
      files: [
        { name: `main.${language === "cpp" ? "cpp" : language}`, content: code },
        ...files.map((f) => ({ name: f.name, content: f.content })),
      ],
      stdin: stdin || "",
      args: [],
      compile_timeout: 10000,
      run_timeout: 5000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    };

    const pistonRes = await fetch(PISTON_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pistonBody),
    });

    if (!pistonRes.ok) {
      const errText = await pistonRes.text().catch(() => "Unknown error");
      console.error("Piston API error:", pistonRes.status, errText);
      return NextResponse.json({
        success: false,
        error: `Code execution service error (${pistonRes.status})`,
      });
    }

    const result = await pistonRes.json();

    // Piston returns: { run: { stdout, stderr, code, signal, output }, compile?: { ... } }
    const compile = result.compile;
    const run = result.run;

    // Compilation failed
    if (compile && compile.code !== 0) {
      return NextResponse.json({
        success: false,
        phase: "compile",
        error: truncate(compile.stderr || compile.output || "Compilation failed", MAX_OUTPUT),
        stdout: truncate(compile.stdout || "", MAX_OUTPUT),
        stderr: truncate(compile.stderr || compile.output || "", MAX_OUTPUT),
        exitCode: compile.code,
      });
    }

    // Runtime error
    if (run && run.code !== 0) {
      return NextResponse.json({
        success: false,
        phase: "runtime",
        error: truncate(
          run.stderr || run.output || `Runtime error (exit code ${run.code})`,
          MAX_OUTPUT
        ),
        stdout: truncate(run.stdout || "", MAX_OUTPUT),
        stderr: truncate(run.stderr || "", MAX_OUTPUT),
        exitCode: run.code,
        signal: run.signal,
      });
    }

    // Success
    return NextResponse.json({
      success: true,
      phase: "complete",
      stdout: truncate(run?.stdout || run?.output || "", MAX_OUTPUT),
      stderr: truncate(run?.stderr || "", MAX_OUTPUT),
      ...(compile?.stderr
        ? { warnings: truncate(compile.stderr, MAX_OUTPUT) }
        : {}),
      exitCode: run?.code ?? 0,
    });
  } catch (err) {
    console.error("Run code error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
