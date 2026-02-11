---
id: w01-l06-overview
title: "Regression Harness: 12 exact tests"
order: 6
duration: 120
kind: lesson_overview
part: w01
---
# Lesson 6 (6/7): Regression Harness: 12 exact tests

## Goal
Write and run exactly 12 regression tests that cover happy paths, errors, env overrides, oversize rejection, logs, and SIGINT=130.

## Concept
A harness is a repeatable way to prove you didn’t break old behavior. It saves you from future-you.

## What you will build
- One command to run tests (e.g., `./tests/run.sh` or `make test`)
- Exactly 12 tests with clear PASS/FAIL output

## How to use it (examples)
- Run: `./tests/run.sh`
  - You should see: prints 12 PASS lines and exits 0
- Run: `./tests/run.sh; echo $?`
  - You should see: exit 0 if pass, non-zero if fail

## Start Training
Open the training page for step-by-step tasks:
- `parts/w01-cli-logger-discipline/training/06-*.md`

## Future Lock
Week 2+ adds sockets and concurrency. Without a harness, you will re-break basic CLI behavior constantly.

## References
- [Command Line Interface Guidelines](https://clig.dev/)
- [GNU: --help behavior](https://www.gnu.org/prep/standards/html_node/_002d_002dhelp.html)
- [IBM: exit code 130 = SIGINT](https://www.ibm.com/docs/sr/SSWRJV_10.1.0/lsf_admin/job_exit_codes_lsf.html)
- [CWE‑120 (classic overflow)](https://cwe.mitre.org/data/definitions/120.html)
