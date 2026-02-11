#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

source tests/helpers.sh

BIN="./a.out"

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

run_test() {
  local name="$1"; shift
  if "$@"; then pass "$name"; else xfail "$name"; fi
}

t01_help() {
  run_capture R "$BIN" --testing --help
  assert_eq "$R_CODE" "0" "help exit code"
  assert_contains "$R_OUT" "Usage:" "help output"
}

t02_version() {
  run_capture R "$BIN" --testing --version
  assert_eq "$R_CODE" "0" "version exit code"
  assert_contains "$R_OUT" "trustctl" "version output"
}

t03_missing_command_usage() {
  run_capture R "$BIN" --testing
  assert_eq "$R_CODE" "64" "missing command exit code"
  assert_contains "$R_ERR" "missing command" "missing command error"
}

t04_unknown_command_usage() {
  run_capture R "$BIN" --testing nope
  assert_eq "$R_CODE" "64" "unknown command exit code"
  assert_contains "$R_ERR" "unknown command" "unknown command error"
}

t05_missing_trust_home_value() {
  run_capture R "$BIN" --testing --trust-home
  assert_eq "$R_CODE" "64" "missing trust-home value exit code"
  assert_contains "$R_ERR" "--trust-home requires a value" "missing trust-home value msg"
}

t06_config_default_source() {
  run_capture R "$BIN" --testing config show
  assert_eq "$R_CODE" "0" "config show exit code"
  assert_contains "$R_OUT" "source=default" "default source"
  assert_contains "$R_OUT" "trust_home=" "trust_home printed"
}

t07_config_env_override() {
  TRUST_HOME="/tmp/t1" run_capture R "$BIN" --testing config show
  assert_eq "$R_CODE" "0" "env override exit"
  assert_contains "$R_OUT" "trust_home=/tmp/t1" "env trust_home"
  assert_contains "$R_OUT" "source=env" "env source"
}

t08_config_flag_wins() {
  TRUST_HOME="/tmp/t1" run_capture R "$BIN" --testing --trust-home /tmp/t2 config show
  assert_eq "$R_CODE" "0" "flag wins exit"
  assert_contains "$R_OUT" "trust_home=/tmp/t2" "flag trust_home"
  assert_contains "$R_OUT" "source=flag" "flag source"
}

t09_token_overflow_rejected() {
  longtok="$(python3 - << 'PY'
print("A"*2000)
PY
)"
  run_capture R "$BIN" --testing "$longtok"
  # Should be usage error and mention 1024
  assert_eq "$R_CODE" "64" "overflow exit"
  assert_contains "$R_ERR" "1024" "overflow mentions limit"
}

t10_sigint_exit_130() {
  # Start wait in background then send SIGINT.
  set +e
  "$BIN" --testing wait > /tmp/trustctl_wait_out.txt 2> /tmp/trustctl_wait_err.txt &
  pid=$!
  sleep 0.2
  kill -INT "$pid" 2>/dev/null
  wait "$pid"
  code=$?
  set -e
  assert_eq "$code" "130" "SIGINT exit code"
}

t11_init_creates_layout() {
  rm -rf ./.trustctl-test
  run_capture R "$BIN" --testing init
  assert_eq "$R_CODE" "0" "init exit code"
  [[ -d ./.trustctl-test/logs ]] || fail "missing logs dir"
  [[ -d ./.trustctl-test/store ]] || fail "missing store dir"
  [[ -d ./.trustctl-test/keys ]] || fail "missing keys dir"
}

t12_structured_log_on_stderr() {
  run_capture R "$BIN" --testing config show
  # Must produce structured log on stderr
  assert_contains "$R_ERR" "level=" "log has level"
  assert_contains "$R_ERR" "event=" "log has event"
}

echo "Running $total tests..."
run_test "01 help to stdout + exit 0" t01_help
run_test "02 version to stdout + exit 0" t02_version
run_test "03 missing command -> EX_USAGE(64)" t03_missing_command_usage
run_test "04 unknown command -> EX_USAGE(64)" t04_unknown_command_usage
run_test "05 missing --trust-home value -> EX_USAGE(64)" t05_missing_trust_home_value
run_test "06 config show default source" t06_config_default_source
run_test "07 env TRUST_HOME override" t07_config_env_override
run_test "08 flag wins over env" t08_config_flag_wins
run_test "09 reject token > 1024 bytes" t09_token_overflow_rejected
run_test "10 SIGINT exits 130" t10_sigint_exit_130
run_test "11 init creates TRUST_HOME layout" t11_init_creates_layout
run_test "12 structured logs on stderr" t12_structured_log_on_stderr

echo
echo "Summary: PASS=$pass_count FAIL=$fail_count TOTAL=$total"
if [[ "$fail_count" -ne 0 ]]; then
  exit 1
fi
