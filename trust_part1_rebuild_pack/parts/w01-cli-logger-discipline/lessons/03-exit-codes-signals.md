---
id: w01-l03-overview
title: "Exit Codes + Signals: Ctrl+C → 130"
order: 3
duration: 120
kind: lesson_overview
part: w01
---
# Lesson 3 (3/7): Exit Codes + Signals: Ctrl+C → 130

## Goal
Make trustctl return consistent exit codes, and handle SIGINT (Ctrl+C) by exiting with code 130.

## Concept
Exit codes are the contract between your CLI and automation. Signals are how the OS interrupts your process.

## What you will build
- Exit code map (success / usage / runtime error)
- SIGINT handler that exits 130
- Errors go to stderr with non-zero exit

## How to use it (examples)
- Run: `trustctl wat`
  - You should see: non-zero exit + clear 'unknown command' error
- Run: `trustctl config set`
  - You should see: non-zero exit + 'missing args' error
- Run: `(run a hang command) then Ctrl+C`
  - You should see: process exits with 130

## Start Training
Open the training page for step-by-step tasks:
- `parts/w01-cli-logger-discipline/training/03-*.md`

## Future Lock
Week 5+ long-running tasks need graceful shutdown. Wrong signal behavior corrupts state and breaks tests.

## References
- [man7: sysexits.h](https://man7.org/linux/man-pages/man3/sysexits.h.3head.html)
- [man7: sigaction(2)](https://man7.org/linux/man-pages/man2/sigaction.2.html)
- [man7: signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html)
- [IBM: exit code 130 = SIGINT](https://www.ibm.com/docs/sr/SSWRJV_10.1.0/lsf_admin/job_exit_codes_lsf.html)
- [Command Line Interface Guidelines](https://clig.dev/)
