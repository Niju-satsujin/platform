import { NextRequest, NextResponse } from "next/server";

const JUDGE0_URL = process.env.JUDGE0_URL || "https://ce.judge0.com";
const CPP_LANG_ID = 105; // C++ (GCC 14.1.0)
const MAX_CODE_LENGTH = 50_000;
const MAX_OUTPUT = 10_000;

function truncate(str: string, max: number) {
  if (str.length > max) return str.slice(0, max) + "\n... (output truncated)";
  return str;
}

function b64e(s: string) { return Buffer.from(s, "utf-8").toString("base64"); }
function b64d(s: string | null | undefined) {
  if (!s) return "";
  try { return Buffer.from(s, "base64").toString("utf-8"); } catch { return s; }
}

async function pollResult(token: string) {
  for (let i = 0; i < 20; i++) {
    const r = await fetch(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=true&fields=status,stdout,stderr,compile_output,exit_code`,
      { headers: { Accept: "application/json" } }
    );
    if (!r.ok) throw new Error(`Judge0 poll: ${r.status}`);
    const d = await r.json();
    if (d.status?.id === 1 || d.status?.id === 2) {
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }
    return d;
  }
  throw new Error("Execution timed out");
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

    // Submit to Judge0 CE
    const submitRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        language_id: CPP_LANG_ID,
        source_code: b64e(code),
        stdin: b64e(stdin || ""),
        cpu_time_limit: 10,
        wall_time_limit: 15,
        memory_limit: 256000,
      }),
    });

    if (!submitRes.ok) {
      const text = await submitRes.text();
      return NextResponse.json({
        success: false,
        phase: "compile",
        error: `Execution service error (${submitRes.status}): ${text}`,
        stdout: "",
        stderr: "",
      });
    }

    const { token } = await submitRes.json();
    if (!token) {
      return NextResponse.json({
        success: false,
        error: "Failed to get execution token",
        stdout: "",
        stderr: "",
      });
    }

    const data = await pollResult(token);
    const statusId = data.status?.id;
    const stdout = b64d(data.stdout);
    const stderr = b64d(data.stderr);
    const compileOutput = b64d(data.compile_output);

    // Compilation failure
    if (statusId === 6) {
      return NextResponse.json({
        success: false,
        phase: "compile",
        error: truncate(compileOutput || "Compilation failed", MAX_OUTPUT),
        stdout: "",
        stderr: truncate(compileOutput || "", MAX_OUTPUT),
      });
    }

    // Runtime / TLE errors
    if (statusId && statusId >= 5 && statusId <= 12 && statusId !== 3 && statusId !== 4) {
      const signals: Record<number, string> = {
        5: "Time limit exceeded",
        7: "SIGSEGV (segmentation fault)",
        8: "Output limit exceeded",
        9: "SIGFPE (floating point error)",
        10: "SIGABRT (aborted)",
        11: `Non-zero exit code (${data.exit_code})`,
        12: "Runtime error",
      };
      return NextResponse.json({
        success: false,
        phase: "runtime",
        error: signals[statusId] || `Runtime error (status ${statusId})`,
        stdout: truncate(stdout, MAX_OUTPUT),
        stderr: truncate(stderr, MAX_OUTPUT),
      });
    }

    // Success
    return NextResponse.json({
      success: true,
      phase: "complete",
      stdout: truncate(stdout, MAX_OUTPUT),
      stderr: truncate(stderr, MAX_OUTPUT),
      ...(compileOutput ? { warnings: truncate(compileOutput, MAX_OUTPUT) } : {}),
    });
  } catch (err) {
    console.error("Run code error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
