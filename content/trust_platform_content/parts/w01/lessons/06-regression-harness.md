---
id: w01-l06
title: "Lesson 6 — Regression Harness: The Exact 12 Tests"
order: 6
duration_min: 120
type: lesson
---

# Lesson 6 (6/7): Regression Harness — The Exact 12 Tests

**Goal:** Lock every behavior from Lessons 1–5 with exactly 12 regression tests. One command runs all 12. If any fail, you know immediately.

**What you build:** A test runner (`make test` or `./tests/run_all.sh`) that executes 12 specific tests covering happy paths, error paths, env overrides, buffer guards, signal handling, and log correlation.

## Why it matters

- Long-lived tools die from silent regressions. You will change trustctl every week for 24 weeks. Without a harness, you'll break something in Week 8 and not notice until Week 15.
- Each test checks one [MUST](https://datatracker.ietf.org/doc/html/rfc2119) rule from your CLI contract. If the test passes, the rule holds. If it fails, you broke a promise.
- This is not unit testing. This is contract testing. You run the real binary and check real exit codes and real output.

## TRAINING SESSION

### Warmup (10 min)
- Q: Why is contract testing (run the binary, check exit code) different from unit testing?
- Q: If test #7 (oversize rejection) fails after a refactor, what probably happened?
- Recall: List the 4 exit codes trustctl uses and what each means.

### Work

**Task 1: Create the test runner**

1. Do this: Create a script or Makefile target that runs all tests in sequence. Each test prints PASS or FAIL with the test name. At the end, print a summary: `12/12 passed` or `N/12 passed, M failed`.
2. How to test it:
   ```
   make test
   ```
3. Expected result: All 12 tests run. Summary at the end.

**Task 2: Implement the exact 12 tests**

Here are the 12 tests. Implement every one:

| # | Test Name | What it checks | Expected |
|---|-----------|---------------|----------|
| 1 | `test_help` | `trustctl --help` | exit 0, output contains "usage" |
| 2 | `test_version` | `trustctl --version` | exit 0, output contains version string |
| 3 | `test_unknown_cmd` | `trustctl gibberish` | exit 64, output contains "unknown" |
| 4 | `test_missing_args` | `trustctl hold` (no --seconds) | exit 64, output contains "required" or "missing" |
| 5 | `test_env_override` | `TRUST_HOME=/tmp/t1 trustctl config show` | output shows `/tmp/t1` |
| 6 | `test_flag_beats_env` | `TRUST_HOME=/tmp/t1 trustctl config show --trust-home /tmp/t2` | output shows `/tmp/t2` (flag wins) |
| 7 | `test_oversize_reject` | Send a 2000-byte argument token | exit 64, output contains "1024" or "limit" |
| 8 | `test_stdout_logs` | `trustctl config show` | stdout contains JSON with `"event":"cmd_start"` |
| 9 | `test_file_logs` | `TRUST_HOME=/tmp/t1 trustctl config show` then check log file | `/tmp/t1/logs/trustctl.log` exists and contains events |
| 10 | `test_request_id_override` | `trustctl config show --request-id TEST123` | log contains `"request_id":"TEST123"` |
| 11 | `test_auto_request_id` | `trustctl config show` (no --request-id flag) | log contains `"request_id":"<something>"` (non-empty) |
| 12 | `test_sigint_exit_130` | Send SIGINT to `trustctl hold --seconds 30` | exit 130 |

For each test:
1. Do this: Write the test as a shell function or script block.
2. How to test it: Run the individual test and confirm PASS.
3. Expected result: PASS with correct exit code and output pattern.

**Task 3: Run the full suite twice**

1. Do this: Run `make test` twice back-to-back. Both runs must produce 12/12.
2. How to test it:
   ```
   make test && make test
   ```
3. Expected result: `12/12 passed` both times. Tests are repeatable. No state leaks between runs.

**Task 4: Use clean TRUST_HOME for isolation**

1. Do this: Each test run creates a temporary TRUST_HOME (`mktemp -d`) and cleans up after. No test depends on previous state.
2. How to test it: Run tests, then check `/tmp` for leftover directories.
3. Expected result: No leftover temp directories. Each run starts clean.

### Prove (15 min)
- Run `make test`. Confirm 12/12.
- Break one thing intentionally (remove the 1KB guard). Run tests. Confirm test #7 fails.
- Fix it. Run tests again. Confirm 12/12.
- Explain in 4 lines: Why does test #12 (SIGINT) need a background process + kill?

### Ship (5 min)
- Submit: test runner script + all test files
- Paste: full `make test` output showing 12/12 passed

## Done when
- `make test` runs 12 named tests.
- All 12 pass on a clean run.
- Tests are repeatable (no state leaks).
- Each test uses isolated TRUST_HOME.

## Common mistakes
- Tests depend on user's home directory → Fix: Use `mktemp -d` for TRUST_HOME.
- SIGINT test hangs → Fix: Run process in background, sleep 1s, send `kill -INT`, check exit code.
- Overly strict string matching → Fix: Match patterns (contains "unknown"), not exact strings.
- Tests pass but can't detect regressions → Fix: Intentionally break something and verify the test catches it.
- Test runner exits on first failure → Fix: Run all 12, report summary at end.

## Proof
- Submit: test runner + test scripts
- Paste: full `make test` output showing 12/12 passed

## Hero Visual

```
┌──────────────────────────────────────────────┐
│            Regression Harness (12 tests)      │
│                                              │
│  #1  help          ✓   #7  oversize reject ✓│
│  #2  version       ✓   #8  stdout logs     ✓│
│  #3  unknown cmd   ✓   #9  file logs       ✓│
│  #4  missing args  ✓   #10 request_id flag ✓│
│  #5  env override  ✓   #11 auto request_id ✓│
│  #6  flag beats env✓   #12 SIGINT → 130    ✓│
│                                              │
│  Result: 12/12 passed                        │
└──────────────────────────────────────────────┘
```

### What you should notice
- 12 tests = 12 promises. Each test maps to one MUST rule.
- The harness is your safety net for 24 weeks of changes.

## Future Lock
Later in **Weeks 2–24**, every change to trustctl runs through this harness. If you add TCP commands in Week 2, you add tests. If you add crypto commands in Week 7, you add tests. The harness grows with the project. Without it, regressions hide for weeks.
