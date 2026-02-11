---
id: w01-t06
title: "Training: Regression Harness: 12 exact tests"
order: 6
duration: 120
kind: training
part: w01
---
# Training 6: Regression Harness: 12 exact tests

## Goal
Build a regression harness and implement exactly 12 tests (listed below).

## Warmup (5–10 min)
- Why does a harness reduce decision fatigue later?
- Which 2 tests protect you against the worst inputs?

## Work (main)
### Step 1
**Do this:** Create one command that runs all tests and returns correct exit code (0 all-pass, non-zero if any fail).

**How to test it:**
- Run: `./tests/run.sh; echo $?`

**Expected result:**
- Exit is `0` only when all pass.

### Step 2
**Do this:** Implement the 12 tests exactly (do not replace with vague 'test stuff'). Use clear PASS/FAIL output.

**How to test it:**
- Run: `./tests/run.sh | head -n 30`

**Expected result:**
- You see PASS/FAIL lines. Total tests = 12.

### Step 3
**Do this:** Ensure tests check both output and exit code where needed (help/version/errors/SIGINT).

**How to test it:**
- Run: `./tests/run.sh; echo $?`

**Expected result:**
- If one test fails, harness exits non-zero.


## Prove (10–20 min)
- Paste: full output of `./tests/run.sh` (or summary + 12 lines).
- Explain in 4 lines: which future week breaks first without these tests and why.
- Exact 12 regression tests:

1. Help: `trustctl --help` exits 0 and output includes `Usage:`
2. Version: `trustctl --version` exits 0 and output matches `trustctl v0.1`
3. No args: `trustctl` exits non-zero and prints a short help hint
4. Unknown command: `trustctl wat` exits non-zero and mentions unknown command
5. Env override: `TRUST_HOME=/tmp/t1 trustctl config show` prints `/tmp/t1` and marks env as source
6. Flag beats env: `TRUST_HOME=/tmp/t1 trustctl config show --trust-home /tmp/t2` prints `/tmp/t2`
7. Oversize token rejected: piping 2000 'A's fails fast with non-zero exit
8. Structured log present: a normal run emits at least 1 structured log line
9. Log file path: a run produces a log file under `TRUST_HOME/logs/` with at least 1 event
10. request_id override: `--request-id abc123` appears in logs
11. Auto request_id: without `--request-id`, logs contain a non-empty request_id
12. SIGINT: run a hang command, press Ctrl+C, exit code is 130

## Ship (5 min)
- Submit: `tests/run.sh` (or equivalent)
- Paste: `./tests/run.sh` output

## Done when
- Exactly 12 tests exist.
- Harness returns 0 only if all pass.
- Tests cover env override, 1KB rejection, request_id, and SIGINT=130.

## Common mistakes
- Tests depend on machine paths → always set TRUST_HOME to temp dir in tests.
- Tests check text but not exit codes → assert exit code per case.
- SIGINT test is manual only → document manual step clearly if automation is hard.

## Proof (what you submit)
- Submit `tests/run.sh`
- Paste full output with 12 PASS lines

## Hero Visual
Harness loop: run → capture stdout/stderr/exit → compare → PASS/FAIL.

## Future Lock
Week 2+ adds network input; harness prevents regressions in CLI behavior and safety rules.

## References
- [GNU: --help behavior](https://www.gnu.org/prep/standards/html_node/_002d_002dhelp.html)
- [CWE‑120 (classic overflow)](https://cwe.mitre.org/data/definitions/120.html)
- [IBM: exit code 130 = SIGINT](https://www.ibm.com/docs/sr/SSWRJV_10.1.0/lsf_admin/job_exit_codes_lsf.html)
- [Command Line Interface Guidelines](https://clig.dev/)
