import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdtemp, rm } from "fs/promises";
import { execFile } from "child_process";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const MAX_CODE_LENGTH = 50_000;
const COMPILE_TIMEOUT = 10_000;
const RUN_TIMEOUT = 5_000;
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

export async function POST(req: NextRequest) {
  let tmpDir: string | null = null;

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

    tmpDir = await mkdtemp(path.join(tmpdir(), "tsp-test-"));

    // --- Mode 1: testCode (C++ test harness that includes the solution) ---
    if (testCode) {
      return await runTestHarness(tmpDir, code, testCode);
    }

    // --- Mode 2: testCases (multiple input/output pairs) ---
    if (testCases && testCases.length > 0) {
      return await runTestCases(tmpDir, code, testCases);
    }

    // --- Mode 3: simple expectedOutput comparison ---
    if (expectedOutput !== undefined && expectedOutput !== "") {
      return await runTestCases(tmpDir, code, [
        {
          name: "Output Check",
          expectedOutput,
          comparison: "exact",
        },
      ]);
    }

    // --- Mode 4: self-testing code (PASS/FAIL printed by student's main) ---
    // When no external tests are defined, compile and run the student code
    // directly and parse PASS/FAIL lines from stdout.
    return await runSelfTest(tmpDir, code);
  } catch (err) {
    console.error("Test code error:", err);
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

async function compileCpp(
  srcPath: string,
  binPath: string
): Promise<{ success: boolean; error?: string; warnings?: string }> {
  try {
    const result = await execFileAsync(
      "g++",
      ["-std=c++17", "-Wall", "-Wextra", "-o", binPath, srcPath],
      { timeout: COMPILE_TIMEOUT, maxBuffer: 1024 * 1024 }
    );
    return {
      success: true,
      warnings: result.stderr || undefined,
    };
  } catch (err: unknown) {
    const e = err as { stderr?: string };
    return {
      success: false,
      error: truncate(e.stderr || "Compilation failed", MAX_OUTPUT),
    };
  }
}

async function runBinary(
  binPath: string
): Promise<{ success: boolean; stdout: string; stderr: string; error?: string }> {
  try {
    const result = await execFileAsync(binPath, [], {
      timeout: RUN_TIMEOUT,
      maxBuffer: 1024 * 1024,
    });
    return {
      success: true,
      stdout: result.stdout,
      stderr: result.stderr || "",
    };
  } catch (err: unknown) {
    const e = err as {
      stderr?: string;
      stdout?: string;
      killed?: boolean;
      signal?: string;
      code?: number;
    };

    if (e.killed || e.signal === "SIGTERM") {
      return {
        success: false,
        stdout: e.stdout || "",
        stderr: e.stderr || "",
        error: `Timed out after ${RUN_TIMEOUT / 1000}s`,
      };
    }

    return {
      success: false,
      stdout: e.stdout || "",
      stderr: e.stderr || "",
      error: `Runtime error (exit code ${e.code})`,
    };
  }
}

async function runTestHarness(
  tmpDir: string,
  code: string,
  testCode: string
) {
  // Write user solution
  const solutionPath = path.join(tmpDir, "solution.h");
  await writeFile(solutionPath, code, "utf-8");

  // Write test harness that includes the solution
  const testPath = path.join(tmpDir, "test_main.cpp");
  await writeFile(testPath, testCode, "utf-8");

  const binPath = path.join(tmpDir, "test_runner");

  // Compile test harness (it #includes "solution.h")
  const compile = await compileCpp(testPath, binPath);
  if (!compile.success) {
    return NextResponse.json({
      success: false,
      phase: "compile",
      error: compile.error,
      results: [],
    });
  }

  // Run test binary
  const run = await runBinary(binPath);

  if (!run.success) {
    return NextResponse.json({
      success: false,
      phase: "runtime",
      error: run.error,
      stdout: truncate(run.stdout, MAX_OUTPUT),
      stderr: truncate(run.stderr, MAX_OUTPUT),
      results: [],
    });
  }

  // Parse test output — expecting lines like:
  // PASS: test_name
  // FAIL: test_name | expected: X | got: Y
  const results = parseTestOutput(run.stdout);
  const allPassed = results.length > 0 && results.every((r) => r.passed);

  return NextResponse.json({
    success: allPassed,
    phase: "complete",
    results,
    stdout: truncate(run.stdout, MAX_OUTPUT),
    stderr: truncate(run.stderr, MAX_OUTPUT),
    warnings: compile.warnings,
  });
}

async function runTestCases(
  tmpDir: string,
  code: string,
  testCases: TestCase[]
) {
  const srcPath = path.join(tmpDir, "solution.cpp");
  const binPath = path.join(tmpDir, "solution");

  await writeFile(srcPath, code, "utf-8");

  // Compile once
  const compile = await compileCpp(srcPath, binPath);
  if (!compile.success) {
    return NextResponse.json({
      success: false,
      phase: "compile",
      error: compile.error,
      results: [],
    });
  }

  // Run each test case
  const results: TestResult[] = [];

  for (const tc of testCases) {
    const run = await runBinary(binPath);

    if (!run.success) {
      results.push({
        name: tc.name,
        passed: false,
        expected: tc.expectedOutput,
        actual: run.error || "Runtime error",
        error: run.error,
      });
      continue;
    }

    const passed = checkOutput(
      run.stdout,
      tc.expectedOutput,
      tc.comparison || "exact"
    );

    results.push({
      name: tc.name,
      passed,
      expected: tc.expectedOutput,
      actual: normalizeOutput(run.stdout),
      error: run.stderr ? truncate(run.stderr, 500) : undefined,
    });
  }

  const allPassed = results.every((r) => r.passed);

  return NextResponse.json({
    success: allPassed,
    phase: "complete",
    results,
    warnings: compile.warnings,
  });
}

async function runSelfTest(tmpDir: string, code: string) {
  const srcPath = path.join(tmpDir, "solution.cpp");
  const binPath = path.join(tmpDir, "solution");

  await writeFile(srcPath, code, "utf-8");

  const compile = await compileCpp(srcPath, binPath);
  if (!compile.success) {
    return NextResponse.json({
      success: false,
      phase: "compile",
      error: compile.error,
      results: [],
    });
  }

  const run = await runBinary(binPath);
  if (!run.success) {
    return NextResponse.json({
      success: false,
      phase: "runtime",
      error: run.error,
      stdout: truncate(run.stdout, MAX_OUTPUT),
      stderr: truncate(run.stderr, MAX_OUTPUT),
      results: [],
    });
  }

  const results = parseTestOutput(run.stdout);

  // If no PASS/FAIL lines were found, treat a clean exit as a single pass
  if (results.length === 0) {
    results.push({
      name: "Program Output",
      passed: true,
      expected: "",
      actual: normalizeOutput(run.stdout),
    });
  }

  const allPassed = results.every((r) => r.passed);

  return NextResponse.json({
    success: allPassed,
    phase: "complete",
    results,
    stdout: truncate(run.stdout, MAX_OUTPUT),
    stderr: truncate(run.stderr, MAX_OUTPUT),
    warnings: compile.warnings,
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
