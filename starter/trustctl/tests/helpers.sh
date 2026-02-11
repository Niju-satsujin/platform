#!/usr/bin/env bash
set -euo pipefail

# Simple assertion helpers for bash tests.

fail() {
  echo "FAIL: $*" >&2
  return 1
}

assert_eq() {
  local got="$1"
  local want="$2"
  local msg="${3:-}"
  [[ "$got" == "$want" ]] || fail "${msg} (got='$got' want='$want')"
}

assert_contains() {
  local hay="$1"
  local needle="$2"
  local msg="${3:-}"
  grep -Fq -- "$needle" <<<"$hay" || fail "${msg} (missing '$needle')"
}

run_capture() {
  # Usage: run_capture VAR_PREFIX -- cmd args...
  # Sets:
  #   <pfx>_OUT, <pfx>_ERR, <pfx>_CODE
  local pfx="$1"; shift
  local out_file err_file
  out_file="$(mktemp)"
  err_file="$(mktemp)"
  set +e
  "$@" >"$out_file" 2>"$err_file"
  local code=$?
  set -e
  local out err
  out="$(cat "$out_file")"
  err="$(cat "$err_file")"
  rm -f "$out_file" "$err_file"
  printf -v "${pfx}_OUT" "%s" "$out"
  printf -v "${pfx}_ERR" "%s" "$err"
  printf -v "${pfx}_CODE" "%s" "$code"
}

is_macos() {
  [[ "$(uname -s)" == "Darwin" ]]
}
