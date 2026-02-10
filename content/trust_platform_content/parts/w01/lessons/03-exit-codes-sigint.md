---
id: w01-l03
title: "Lesson 3 — Exit Codes + SIGINT (Ctrl+C → 130)"
order: 3
duration_min: 120
type: lesson
---

# Lesson 3 (3/7): Exit Codes + SIGINT (Ctrl+C → 130)

**Goal:** Implement automation-friendly exit codes and graceful SIGINT handling so Ctrl+C during any command exits 130.

**What you build:** Centralized exit code table + a [sigaction](https://man7.org/linux/man-pages/man2/sigaction.2.html)-based SIGINT handler that exits [130 (128 + SIGINT)](https://www.ibm.com/docs/sr/SSWRJV_10.1.0/lsf_admin/job_exit_codes_lsf.html).

## Why it matters

- Exit codes are the contract between your tool and automation scripts. [sysexits.h](https://man7.org/linux/man-pages/man3/sysexits.h.3head.html) defines standard categories: 0 = success, 64 = usage error, 70 = internal error.
- When a [signal](https://man7.org/linux/man-pages/man7/signal.7.html) kills a process, the convention is exit code = 128 + signal number. SIGINT = 2, so [Ctrl+C → exit 130](https://www.ibm.com/docs/sr/SSWRJV_10.1.0/lsf_admin/job_exit_codes_lsf.html).
- Use [sigaction](https://man7.org/linux/man-pages/man2/sigaction.2.html) (not `signal()`) because sigaction has well-defined behavior across platforms.
- Without signal handling, your tool leaves resources open and corrupts state on interrupt. Week 11 (replication) and Week 10 (WAL) depend on clean shutdown.

## TRAINING SESSION

### Warmup (5 min)
- Q: What does exit code 64 mean? (Hint: [EX_USAGE](https://man7.org/linux/man-pages/man3/sysexits.h.3head.html).)
- Q: Why is the Ctrl+C exit code 130 and not 2?
- Recall: Explain in 2 lines what [sigaction](https://man7.org/linux/man-pages/man2/sigaction.2.html) does that `signal()` doesn't guarantee.

### Work

**Task 1: Define the exit code table**

1. Do this: Create a central exit code mapping. Every error category maps to one code:
   - 0 = success
   - 64 = usage error (bad args, unknown command, oversize token)
   - 70 = internal/software error
   - 130 = interrupted by SIGINT
2. How to test it: Trigger each category:
   ```
   trustctl --help && echo $?
   trustctl gibberish; echo $?
   ```
3. Expected result: `--help` → 0. `gibberish` → 64.

**Task 2: Install SIGINT handler with sigaction**

1. Do this: At the very start of main(), install a SIGINT handler using [sigaction](https://man7.org/linux/man-pages/man2/sigaction.2.html). The handler sets a flag. The main loop checks the flag and calls a clean shutdown function that exits 130.
2. How to test it:
   ```
   trustctl hold --seconds 30 &
   PID=$!
   sleep 1
   kill -INT $PID
   wait $PID
   echo $?
   ```
3. Expected result: Exit code is 130. No crash. No hang.

**Task 3: Test Ctrl+C interactively**

1. Do this: Run `trustctl hold --seconds 30` in a terminal. Press Ctrl+C. Check exit code.
2. How to test it:
   ```
   trustctl hold --seconds 30
   # Press Ctrl+C
   echo $?
   ```
3. Expected result: `130`

**Task 4: Log the signal event**

1. Do this: When the SIGINT handler fires, emit a structured log event: `{"level":"warn","event":"signal_received","signal":"SIGINT","action":"shutdown"}`. This log event [MUST](https://datatracker.ietf.org/doc/html/rfc2119) appear before exit.
2. How to test it: Send SIGINT and check log output.
3. Expected result: Signal event appears in logs, then process exits 130.

### Prove (10 min)
- Run the kill-based test. Confirm exit 130.
- Run the interactive Ctrl+C test. Confirm exit 130.
- Explain in 4 lines: Why use sigaction instead of signal()? (Hint: portable semantics.)

### Ship (5 min)
- Submit: updated source with exit code mapping + signal handler
- Paste: `echo $?` output showing 130 after Ctrl+C
- Paste: log line showing signal_received event

## Done when
- Exit 0 on success. Exit 64 on usage errors. Exit 70 on internal errors.
- Ctrl+C → exit 130, every time.
- Signal event logged before exit.
- No resource leaks on interrupt.

## Common mistakes
- Random exit codes per error → Fix: Centralize the mapping. One function, one table.
- Using signal() instead of sigaction → Fix: [sigaction](https://man7.org/linux/man-pages/man2/sigaction.2.html) gives reliable behavior.
- Handler calls exit() directly → Fix: Set a flag; let the main loop exit cleanly.
- No log on signal → Fix: Signal handler sets flag, main loop logs then exits.
- SIGINT handler not installed early → Fix: Install in main() before any work.

## Proof
- Submit: source code with signal handler
- Paste: exit code 130 after Ctrl+C
- Paste: signal_received log line

## Hero Visual

```
┌────────────────────────────────────────┐
│           Exit Code Funnel             │
│                                        │
│  success ─────────────────────► exit 0 │
│  bad args / unknown cmd ──────► exit 64│
│  internal error ──────────────► exit 70│
│  SIGINT (Ctrl+C) ────────────► exit 130│
│                                        │
│  130 = 128 + signal_number(SIGINT=2)   │
└────────────────────────────────────────┘
```

### What you should notice
- Exit codes are a finite, documented set — not random numbers.
- SIGINT is not a crash. It's a clean, expected shutdown path.

## Future Lock
Later in **Week 10** (WAL), crash recovery needs clean shutdown to avoid partial writes. In **Week 11** (Replication), stopping a node must not corrupt replicated state. The SIGINT handler pattern you build here is the foundation.
