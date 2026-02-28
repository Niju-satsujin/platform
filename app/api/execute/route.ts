import { NextRequest, NextResponse } from "next/server";

/**
 * Cloud code execution via Judge0 CE.
 * Works on Vercel — no local g++ required.
 *
 * Judge0 CE is free, no auth required.
 * Public API: https://ce.judge0.com
 * Docs: https://ce.judge0.com/
 */

const JUDGE0_URL =
  process.env.JUDGE0_URL || "https://ce.judge0.com";
const MAX_CODE_LENGTH = 50_000;
const MAX_OUTPUT = 10_000;

/** Language IDs for Judge0 CE */
const LANG_IDS: Record<string, number> = {
  cpp: 105,   // C++ (GCC 14.1.0)
  cc: 105,
  cxx: 105,
  c: 75,      // C (GCC 14.1.0) — or use 50 for older
  py: 92,     // Python (3.11.2)
  python: 92,
  js: 93,     // JavaScript (Node.js 18.15.0)
  javascript: 93,
  ts: 94,     // TypeScript (5.0.3)
  typescript: 94,
  rs: 73,     // Rust (1.40.0)
  rust: 73,
  go: 95,     // Go (1.21.0)
  java: 91,   // Java (JDK 17.0.6)
  sh: 46,     // Bash (5.0.0)
  bash: 46,
};

function truncate(str: string, max: number) {
  if (str.length > max) return str.slice(0, max) + "\n... (output truncated)";
  return str;
}

function base64Encode(str: string): string {
  return Buffer.from(str, "utf-8").toString("base64");
}

function base64Decode(str: string | null | undefined): string {
  if (!str) return "";
  try {
    return Buffer.from(str, "base64").toString("utf-8");
  } catch {
    return str;
  }
}

async function pollSubmission(token: string): Promise<Record<string, unknown>> {
  const maxAttempts = 20;
  const pollInterval = 1500; // ms

  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=true&fields=status,stdout,stderr,compile_output,exit_code,time,memory,message`,
      { headers: { Accept: "application/json" } }
    );

    if (!res.ok) {
      throw new Error(`Judge0 poll error: ${res.status}`);
    }

    const data = await res.json();
    const statusId = data.status?.id;

    // Status 1 = In Queue, 2 = Processing — keep polling
    if (statusId === 1 || statusId === 2) {
      await new Promise((r) => setTimeout(r, pollInterval));
      continue;
    }

    return data;
  }

  throw new Error("Execution timed out waiting for result");
}

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

    const languageId = LANG_IDS[language] || LANG_IDS["cpp"];

    // Judge0 free tier only compiles a single source file.
    // Inline all #include "local_file" directives with the actual content
    // from the uploaded extra files so compilation succeeds.
    let fullCode = code;
    if (files.length > 0) {
      const fileMap = new Map(files.map((f) => [f.name, f.content]));

      // Replace #include "filename" with the file's content (if we have it).
      // Try exact match first, then case-insensitive, then basename-only match.
      fullCode = fullCode.replace(
        /^(\s*)#include\s*"([^"]+)"/gm,
        (_match, indent, includePath) => {
          // Try exact match
          let content = fileMap.get(includePath);
          let matchedKey = includePath;

          // Try case-insensitive match
          if (content === undefined) {
            const lower = includePath.toLowerCase();
            for (const [key, val] of fileMap.entries()) {
              if (key.toLowerCase() === lower) {
                content = val;
                matchedKey = key;
                break;
              }
            }
          }

          // Try basename match (e.g. #include "src/logger.hpp" vs "logger.hpp")
          if (content === undefined) {
            const basename = includePath.split("/").pop()?.toLowerCase() || "";
            for (const [key, val] of fileMap.entries()) {
              if (key.toLowerCase() === basename || key.split("/").pop()?.toLowerCase() === basename) {
                content = val;
                matchedKey = key;
                break;
              }
            }
          }

          if (content !== undefined) {
            fileMap.delete(matchedKey);
            return `${indent}// --- inlined: ${matchedKey} ---\n${content}\n// --- end: ${matchedKey} ---`;
          }
          return _match;
        }
      );

      // Also inline .cpp files that weren't #included (e.g. Logger.cpp)
      const remaining = Array.from(fileMap.entries())
        .filter(([name]) => name.endsWith(".cpp") || name.endsWith(".cc") || name.endsWith(".cxx"));
      if (remaining.length > 0) {
        const extras = remaining
          .map(([name, content]) => `// --- inlined: ${name} ---\n${content}\n// --- end: ${name} ---`)
          .join("\n\n");
        // Insert extra .cpp files before main() if possible, otherwise prepend
        const mainIdx = fullCode.indexOf("int main");
        if (mainIdx > 0) {
          fullCode = fullCode.slice(0, mainIdx) + extras + "\n\n" + fullCode.slice(mainIdx);
        } else {
          fullCode = extras + "\n\n" + fullCode;
        }
      }
    }

    // Submit to Judge0
    const submitRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        language_id: languageId,
        source_code: base64Encode(fullCode),
        stdin: base64Encode(stdin),
        cpu_time_limit: 10,
        wall_time_limit: 15,
        memory_limit: 256000, // 256 MB
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text().catch(() => "Unknown error");
      console.error("Judge0 submit error:", submitRes.status, errText);
      return NextResponse.json({
        success: false,
        error: `Code execution service error (${submitRes.status})`,
      });
    }

    const submitData = await submitRes.json();
    const token = submitData.token;

    if (!token) {
      return NextResponse.json({
        success: false,
        error: "Failed to get execution token",
      });
    }

    // Poll for result
    const result = await pollSubmission(token);

    const stdout = base64Decode(result.stdout as string);
    const stderr = base64Decode(result.stderr as string);
    const compileOutput = base64Decode(result.compile_output as string);
    const statusId = (result.status as { id: number })?.id;
    const exitCode = (result.exit_code as number) ?? 1;

    // Judge0 status codes:
    // 3 = Accepted (success)
    // 4 = Wrong Answer
    // 5 = Time Limit Exceeded
    // 6 = Compilation Error
    // 7-12 = Runtime errors (SIGSEGV, SIGXFSZ, SIGFPE, SIGABRT, NZEC, Other)
    // 13 = Internal Error
    // 14 = Exec Format Error

    // Compilation error
    if (statusId === 6) {
      return NextResponse.json({
        success: false,
        phase: "compile",
        error: truncate(compileOutput || "Compilation failed", MAX_OUTPUT),
        stdout: "",
        stderr: truncate(compileOutput || "", MAX_OUTPUT),
        exitCode: 1,
      });
    }

    // Time limit exceeded
    if (statusId === 5) {
      return NextResponse.json({
        success: false,
        phase: "runtime",
        error: "Time limit exceeded (10s)",
        stdout: truncate(stdout, MAX_OUTPUT),
        stderr: truncate(stderr, MAX_OUTPUT),
        exitCode: 1,
      });
    }

    // Runtime errors (SIGSEGV, etc.)
    if (statusId && statusId >= 7 && statusId <= 12) {
      const signals: Record<number, string> = {
        7: "SIGSEGV (segmentation fault)",
        8: "SIGXFSZ (output limit)",
        9: "SIGFPE (floating point error)",
        10: "SIGABRT (aborted)",
        11: "Non-zero exit code",
        12: "Runtime error",
      };
      return NextResponse.json({
        success: false,
        phase: "runtime",
        error: truncate(
          stderr || signals[statusId] || `Runtime error (status ${statusId})`,
          MAX_OUTPUT
        ),
        stdout: truncate(stdout, MAX_OUTPUT),
        stderr: truncate(stderr, MAX_OUTPUT),
        exitCode,
      });
    }

    // Internal error
    if (statusId === 13 || statusId === 14) {
      return NextResponse.json({
        success: false,
        phase: "runtime",
        error: "Internal execution error — try again",
        stdout: truncate(stdout, MAX_OUTPUT),
        stderr: truncate(stderr, MAX_OUTPUT),
        exitCode: 1,
      });
    }

    // Success (status 3 = Accepted, or status 4 = Wrong Answer but code ran)
    return NextResponse.json({
      success: true,
      phase: "complete",
      stdout: truncate(stdout, MAX_OUTPUT),
      stderr: truncate(stderr, MAX_OUTPUT),
      ...(compileOutput ? { warnings: truncate(compileOutput, MAX_OUTPUT) } : {}),
      exitCode: exitCode ?? 0,
    });
  } catch (err) {
    console.error("Run code error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
