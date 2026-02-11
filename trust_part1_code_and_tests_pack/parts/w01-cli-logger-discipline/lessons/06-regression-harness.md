---
id: w01-l06-overview
title: "Regression Harness: 12 exact tests"
order: 6
duration: 120
kind: lesson_overview
part: w01
---
# Lesson 6 (6/6): Regression Harness — The 12 Tests

## Goal

Lock your Week 01 contract so it never rots.

You will implement **exactly 12 regression tests**.
They must run with one command and print clear PASS/FAIL output.

---

## What you will build

1) A test runner:
- `starter/trustctl/tests/run.sh`

2) A helper library:
- `starter/trustctl/tests/helpers.sh`

3) A make target:
- `make test`

4) A UI hook (platform requirement):
- Add a “Testing” option/button in the lesson UI that runs `make test` and shows output.
- If “Testing” currently exists but does nothing, wire it to the command runner.

---

## The exact 12 tests (mandatory)

All tests must run with `--testing` to avoid flaky output.

### Help + Version (2)
1) `--help` prints `Usage:` and exits 0
2) `--version` prints `trustctl` and exits 0

### Usage + Routing (3)
3) Missing command exits 64 and prints “missing command”
4) Unknown command exits 64 and prints “unknown command”
5) Missing value for `--trust-home` exits 64 and prints a clear error

### Config precedence (3)
6) default: `config show` prints `source=default`
7) env: `TRUST_HOME=/tmp/t1` → prints `trust_home=/tmp/t1` and `source=env`
8) flag wins: env set, plus `--trust-home /tmp/t2` → prints `/tmp/t2` and `source=flag`

### Buffer safety (1)
9) Any token >1024 bytes is rejected:
   - error mentions `1024`
   - exits 64

### SIGINT contract (1)
10) `trustctl wait` interrupted by Ctrl+C exits 130

### Persistence layout (1)
11) `trustctl --testing init` creates:
   - `./.trustctl-test/logs`
   - `./.trustctl-test/store`
   - `./.trustctl-test/keys`

### Structured logs (1)
12) `trustctl --testing config show` produces at least one structured log line on stderr:
   - contains `level=`
   - contains `event=`

---

## Practice

### Task 1 — Run the harness

How to test:
```bash
cd starter/trustctl
make test
```

Expected result:
- failing tests show which contract is broken
- when complete: all 12 show PASS

---

## Done when

- `make test` runs all 12 tests
- they pass on a clean machine
- tests are deterministic (no random output)

---

## Common mistakes

- Tests that depend on local machine paths (use `--testing`)
- Tests that don’t check exit codes
- “Sleep and hope” tests for SIGINT (send the signal reliably)

---

## Future Lock

This harness is your safety net:
- Week 2 will add networking commands.
- Week 11 will stress the logger and exit codes while debugging distributed failures.

---

## Proof

Paste the last lines of:
- `make test`
(showing `12/12 PASS`)
