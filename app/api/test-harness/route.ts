import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/test-harness — Compile user's C++ code and run the 12-test regression harness.
 *
 * Accepts: { code: string }
 * Returns: { success: boolean, stdout: string, stderr: string, passed: number, failed: number, total: number }
 *
 * Uses Piston API to execute a bash script that:
 * 1. Writes the user's C++ code to main.cpp
 * 2. Compiles it with g++ -std=c++20
 * 3. Runs the 12-test harness inline
 */

const JUDGE0_URL = process.env.JUDGE0_URL || "https://ce.judge0.com";
const BASH_LANG_ID = 46; // Bash (5.0.0)
const MAX_OUTPUT = 15_000;
const MAX_CODE_LENGTH = 50_000;

function truncate(str: string, max: number) {
  if (str.length > max) return str.slice(0, max) + "\n... (output truncated)";
  return str;
}

/**
 * The 12-test regression harness for Week 01 (trustctl v0.1).
 * This bash script is the test runner — it compiles the user's code
 * and runs all 12 tests with clear PASS/FAIL output.
 */
function buildHarnessScript(cppCode: string): string {
  return `#!/usr/bin/env bash
set -uo pipefail

# ── Write user code ──
cat > main.cpp << 'CPPEOF'
${cppCode}
CPPEOF

# ── Compile ──
g++ -std=c++20 -Wall -Wextra -pedantic -O2 -o trustctl main.cpp 2>compile_err.txt
if [[ $? -ne 0 ]]; then
  echo "COMPILE ERROR:"
  cat compile_err.txt
  exit 1
fi

# ── Test helpers ──
pass_count=0
fail_count=0
total=12

pass() {
  pass_count=$((pass_count+1))
  echo "PASS ($pass_count/$total): $*"
}

xfail() {
  fail_count=$((fail_count+1))
  echo "FAIL ($((pass_count+fail_count))/$total): $*" >&2
}

assert_eq() {
  local got="$1" want="$2" msg="\${3:-}"
  if [[ "$got" == "$want" ]]; then return 0; fi
  echo "  ASSERT FAIL: $msg (got='$got' want='$want')" >&2
  return 1
}

assert_contains() {
  local hay="$1" needle="$2" msg="\${3:-}"
  if echo "$hay" | grep -Fq -- "$needle"; then return 0; fi
  echo "  ASSERT FAIL: $msg (missing '$needle')" >&2
  return 1
}

run_capture() {
  local pfx="$1"; shift
  local out_file err_file
  out_file="$(mktemp)"
  err_file="$(mktemp)"
  set +e
  "$@" >"$out_file" 2>"$err_file"
  local code=$?
  set -e
  eval "\${pfx}_OUT=\\$(cat \\"$out_file\\")"
  eval "\${pfx}_ERR=\\$(cat \\"$err_file\\")"
  eval "\${pfx}_CODE=$code"
  rm -f "$out_file" "$err_file"
}

run_test() {
  local name="$1"; shift
  if "$@"; then pass "$name"; else xfail "$name"; fi
}

# ── 12 Tests ──
t01_help() {
  run_capture R ./trustctl --help
  assert_eq "$R_CODE" "0" "help exit code" && \\
  assert_contains "$R_OUT" "Usage:" "help output"
}

t02_version() {
  run_capture R ./trustctl --version
  assert_eq "$R_CODE" "0" "version exit code" && \\
  assert_contains "$R_OUT" "trustctl" "version output"
}

t03_missing_command() {
  run_capture R ./trustctl --testing
  assert_eq "$R_CODE" "64" "missing command exit code" && \\
  assert_contains "$R_ERR" "missing command" "missing command error"
}

t04_unknown_command() {
  run_capture R ./trustctl --testing nope
  assert_eq "$R_CODE" "64" "unknown command exit code" && \\
  assert_contains "$R_ERR" "unknown command" "unknown command error"
}

t05_missing_trust_home_value() {
  run_capture R ./trustctl --testing --trust-home
  assert_eq "$R_CODE" "64" "missing trust-home value exit code" && \\
  assert_contains "$R_ERR" "--trust-home requires a value" "missing trust-home value msg"
}

t06_config_default() {
  run_capture R ./trustctl --testing config show
  assert_eq "$R_CODE" "0" "config show exit code" && \\
  assert_contains "$R_OUT" "source=default" "default source" && \\
  assert_contains "$R_OUT" "trust_home=" "trust_home printed"
}

t07_config_env() {
  TRUST_HOME="/tmp/t1" run_capture R ./trustctl --testing config show
  assert_eq "$R_CODE" "0" "env override exit" && \\
  assert_contains "$R_OUT" "trust_home=/tmp/t1" "env trust_home" && \\
  assert_contains "$R_OUT" "source=env" "env source"
}

t08_config_flag_wins() {
  TRUST_HOME="/tmp/t1" run_capture R ./trustctl --testing --trust-home /tmp/t2 config show
  assert_eq "$R_CODE" "0" "flag wins exit" && \\
  assert_contains "$R_OUT" "trust_home=/tmp/t2" "flag trust_home" && \\
  assert_contains "$R_OUT" "source=flag" "flag source"
}

t09_token_overflow() {
  longtok="$(python3 -c "print('A'*2000)")"
  run_capture R ./trustctl --testing "$longtok"
  assert_eq "$R_CODE" "64" "overflow exit" && \\
  assert_contains "$R_ERR" "1024" "overflow mentions limit"
}

t10_sigint_exit_130() {
  set +e
  ./trustctl --testing wait > /dev/null 2>&1 &
  pid=$!
  sleep 0.3
  kill -INT "$pid" 2>/dev/null
  wait "$pid"
  code=$?
  set -e
  assert_eq "$code" "130" "SIGINT exit code"
}

t11_init_layout() {
  rm -rf ./.trustctl-test
  run_capture R ./trustctl --testing init
  assert_eq "$R_CODE" "0" "init exit code" && \\
  [[ -d ./.trustctl-test/logs ]] && \\
  [[ -d ./.trustctl-test/store ]] && \\
  [[ -d ./.trustctl-test/keys ]]
}

t12_structured_log_stderr() {
  run_capture R ./trustctl --testing config show
  assert_contains "$R_ERR" "level=" "log has level" && \\
  assert_contains "$R_ERR" "event=" "log has event"
}

echo "Running $total tests..."
echo ""
run_test "01 help to stdout + exit 0" t01_help
run_test "02 version to stdout + exit 0" t02_version
run_test "03 missing command -> EX_USAGE(64)" t03_missing_command
run_test "04 unknown command -> EX_USAGE(64)" t04_unknown_command
run_test "05 missing --trust-home value -> EX_USAGE(64)" t05_missing_trust_home_value
run_test "06 config show default source" t06_config_default
run_test "07 env TRUST_HOME override" t07_config_env
run_test "08 flag wins over env" t08_config_flag_wins
run_test "09 reject token > 1024 bytes" t09_token_overflow
run_test "10 SIGINT exits 130" t10_sigint_exit_130
run_test "11 init creates TRUST_HOME layout" t11_init_layout
run_test "12 structured logs on stderr" t12_structured_log_stderr

echo ""
echo "Summary: PASS=$pass_count FAIL=$fail_count TOTAL=$total"

if [[ "$pass_count" -eq "$total" ]]; then
  echo "$total/$total PASS — ALL PASS"
else
  echo "$pass_count/$total PASS"
fi
`;
}

export async function POST(req: NextRequest) {
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

    const harnessScript = buildHarnessScript(code);

    const b64e = (s: string) => Buffer.from(s, "utf-8").toString("base64");
    const b64d = (s: string | null | undefined) => {
      if (!s) return "";
      try { return Buffer.from(s, "base64").toString("utf-8"); } catch { return s; }
    };

    // Submit bash script to Judge0
    const submitRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        language_id: BASH_LANG_ID,
        source_code: b64e(harnessScript),
        stdin: b64e(""),
        cpu_time_limit: 30,
        wall_time_limit: 45,
        memory_limit: 256000,
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text().catch(() => "Unknown error");
      return NextResponse.json({
        success: false,
        error: `Test service error (${submitRes.status}): ${errText}`,
      });
    }

    const { token } = await submitRes.json();
    if (!token) {
      return NextResponse.json({
        success: false,
        error: "Failed to get execution token",
      });
    }

    // Poll for result
    let data;
    for (let i = 0; i < 25; i++) {
      const r = await fetch(
        `${JUDGE0_URL}/submissions/${token}?base64_encoded=true&fields=status,stdout,stderr,compile_output,exit_code`,
        { headers: { Accept: "application/json" } }
      );
      if (!r.ok) throw new Error(`Judge0 poll: ${r.status}`);
      data = await r.json();
      if (data.status?.id === 1 || data.status?.id === 2) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      break;
    }

    if (!data) {
      return NextResponse.json({ success: false, error: "Execution timed out" });
    }

    const stdout = b64d(data.stdout);
    const stderr = b64d(data.stderr);

    // Parse pass/fail counts from output
    const summaryMatch = stdout.match(/PASS=(\d+)\s+FAIL=(\d+)\s+TOTAL=(\d+)/);
    const passed = summaryMatch ? parseInt(summaryMatch[1], 10) : 0;
    const failed = summaryMatch ? parseInt(summaryMatch[2], 10) : 0;
    const total = summaryMatch ? parseInt(summaryMatch[3], 10) : 12;

    // Check if it was a compile error
    if (stdout.includes("COMPILE ERROR:")) {
      return NextResponse.json({
        success: false,
        phase: "compile",
        stdout: truncate(stdout, MAX_OUTPUT),
        stderr: truncate(stderr, MAX_OUTPUT),
        passed: 0,
        failed: total,
        total,
      });
    }

    return NextResponse.json({
      success: passed === total,
      phase: "complete",
      stdout: truncate(stdout, MAX_OUTPUT),
      stderr: truncate(stderr, MAX_OUTPUT),
      passed,
      failed,
      total,
    });
  } catch (err) {
    console.error("Test harness error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
