import { NextRequest, NextResponse } from "next/server";

const JUDGE0_URL = process.env.JUDGE0_URL || "https://ce.judge0.com";
const CPP_LANG_ID = 105; // C++ (GCC 14.1.0)

const MAX_CODE_LENGTH = 50_000;
const MAX_OUTPUT = 10_000;

function truncate(str: string, max: number) {
  if (str.length > max) return str.slice(0, max) + "\n... (output truncated)";
  return str;
}

export interface TestCase {
  name: string;
  input?: string;
  expectedOutput: string;
  comparison?: "exact" | "contains" | "regex";
}

export interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

function normalizeOutput(s: string): string {
  return s.replace(/\r\n/g, "\n").trim();
}

function checkOutput(
  actual: string,
  expected: string,
  comparison: string = "exact"
): boolean {
  const normActual = normalizeOutput(actual);
  const normExpected = normalizeOutput(expected);

  switch (comparison) {
    case "contains":
      return normActual.includes(normExpected);
    case "regex":
      try {
        return new RegExp(normExpected, "m").test(normActual);
      } catch {
        return false;
      }
    case "exact":
    default:
      return normActual === normExpected;
  }
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

/* ── Judge0 execution helper ── */
async function judge0Run(
  code: string,
  stdin: string = ""
): Promise<{
  compileOk: boolean;
  compileError?: string;
  warnings?: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  signal?: string;
}> {
  const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      language_id: CPP_LANG_ID,
      source_code: b64e(code),
      stdin: b64e(stdin),
      cpu_time_limit: 10,
      wall_time_limit: 15,
      memory_limit: 256000,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      compileOk: false,
      compileError: `Execution service error (${res.status}): ${text}`,
      stdout: "",
      stderr: "",
      exitCode: 1,
    };
  }

  const { token } = await res.json();
  if (!token) {
    return { compileOk: false, compileError: "No execution token", stdout: "", stderr: "", exitCode: 1 };
  }

  const data = await pollResult(token);
  const statusId = data.status?.id;
  const stdout = b64d(data.stdout);
  const stderr = b64d(data.stderr);
  const compileOutput = b64d(data.compile_output);

  // 6 = Compilation Error
  if (statusId === 6) {
    return {
      compileOk: false,
      compileError: compileOutput || "Compilation failed",
      stdout: "",
      stderr: compileOutput || "",
      exitCode: 1,
    };
  }

  // 7-12 = Runtime errors
  if (statusId && statusId >= 5 && statusId <= 12 && statusId !== 3 && statusId !== 4) {
    return {
      compileOk: true,
      stdout,
      stderr: stderr || compileOutput || `Runtime error (status ${statusId})`,
      exitCode: data.exit_code ?? 1,
      signal: statusId === 7 ? "SIGSEGV" : statusId === 5 ? "TLE" : undefined,
    };
  }

  return {
    compileOk: true,
    warnings: compileOutput || undefined,
    stdout,
    stderr,
    exitCode: data.exit_code ?? 0,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, testCode, testCases, expectedOutput } = body as {
      code: string;
      testCode?: string;
      testCases?: TestCase[];
      expectedOutput?: string;
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

    // --- Mode 1: testCode (C++ test harness that includes the solution) ---
    if (testCode) {
      return await runTestHarness(code, testCode);
    }

    // --- Mode 2: testCases (multiple input/output pairs) ---
    if (testCases && testCases.length > 0) {
      return await runTestCases(code, testCases);
    }

    // --- Mode 3: simple expectedOutput comparison ---
    if (expectedOutput !== undefined && expectedOutput !== "") {
      return await runTestCases(code, [
        {
          name: "Output Check",
          expectedOutput,
          comparison: "exact",
        },
      ]);
    }

    // --- Mode 4: self-testing code ---
    return await runSelfTest(code);
  } catch (err) {
    console.error("Test code error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function runTestHarness(code: string, testCode: string) {
  // Inline the solution into the test harness instead of #include
  // Replace #include "solution.h" with the actual code
  const combined = testCode.replace(
    /#include\s*["']solution\.h["']/g,
    `// === USER SOLUTION ===\n${code}\n// === END USER SOLUTION ===`
  );

  const result = await judge0Run(combined);

  if (!result.compileOk) {
    return NextResponse.json({
      success: false,
      phase: "compile",
      error: result.compileError,
      results: [],
    });
  }

  if (result.exitCode !== 0 && !result.stdout) {
    return NextResponse.json({
      success: false,
      phase: "runtime",
      error: result.signal
        ? `Killed by signal ${result.signal}`
        : `Runtime error (exit code ${result.exitCode})`,
      stdout: truncate(result.stdout, MAX_OUTPUT),
      stderr: truncate(result.stderr, MAX_OUTPUT),
      results: [],
    });
  }

  const results = parseTestOutput(result.stdout);
  const allPassed = results.length > 0 && results.every((r) => r.passed);

  return NextResponse.json({
    success: allPassed,
    phase: "complete",
    results,
    stdout: truncate(result.stdout, MAX_OUTPUT),
    stderr: truncate(result.stderr, MAX_OUTPUT),
    warnings: result.warnings,
  });
}

async function runTestCases(code: string, testCases: TestCase[]) {
  // Run each test case as a separate Piston call with different stdin
  const results: TestResult[] = [];

  for (const tc of testCases) {
    const result = await judge0Run(code, tc.input || "");

    if (!result.compileOk) {
      return NextResponse.json({
        success: false,
        phase: "compile",
        error: result.compileError,
        results: [],
      });
    }

    if (result.exitCode !== 0 && !result.stdout) {
      results.push({
        name: tc.name,
        passed: false,
        expected: tc.expectedOutput,
        actual: result.signal
          ? `Killed by signal ${result.signal}`
          : `Runtime error (exit code ${result.exitCode})`,
        error: result.stderr || undefined,
      });
      continue;
    }

    const passed = checkOutput(
      result.stdout,
      tc.expectedOutput,
      tc.comparison || "exact"
    );

    results.push({
      name: tc.name,
      passed,
      expected: tc.expectedOutput,
      actual: normalizeOutput(result.stdout),
      error: result.stderr ? truncate(result.stderr, 500) : undefined,
    });
  }

  const allPassed = results.every((r) => r.passed);

  return NextResponse.json({
    success: allPassed,
    phase: "complete",
    results,
  });
}

async function runSelfTest(code: string) {
  const result = await judge0Run(code);

  if (!result.compileOk) {
    return NextResponse.json({
      success: false,
      phase: "compile",
      error: result.compileError,
      results: [],
    });
  }

  if (result.exitCode !== 0 && !result.stdout) {
    return NextResponse.json({
      success: false,
      phase: "runtime",
      error: result.signal
        ? `Killed by signal ${result.signal}`
        : `Runtime error (exit code ${result.exitCode})`,
      stdout: truncate(result.stdout, MAX_OUTPUT),
      stderr: truncate(result.stderr, MAX_OUTPUT),
      results: [],
    });
  }

  const results = parseTestOutput(result.stdout);

  if (results.length === 0) {
    results.push({
      name: "Program Output",
      passed: true,
      expected: "",
      actual: normalizeOutput(result.stdout),
    });
  }

  const allPassed = results.every((r) => r.passed);

  return NextResponse.json({
    success: allPassed,
    phase: "complete",
    results,
    stdout: truncate(result.stdout, MAX_OUTPUT),
    stderr: truncate(result.stderr, MAX_OUTPUT),
    warnings: result.warnings,
  });
}

function parseTestOutput(stdout: string): TestResult[] {
  const lines = stdout.split("\n");
  const results: TestResult[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("PASS:")) {
      const name = trimmed.slice(5).trim();
      results.push({ name, passed: true, expected: "", actual: "" });
    } else if (trimmed.startsWith("FAIL:")) {
      const parts = trimmed.slice(5).split("|").map((s) => s.trim());
      const name = parts[0] || "Unknown";
      const expected = (parts[1] || "").replace(/^expected:\s*/, "");
      const actual = (parts[2] || "").replace(/^got:\s*/, "");
      results.push({ name, passed: false, expected, actual });
    }
  }

  return results;
}
