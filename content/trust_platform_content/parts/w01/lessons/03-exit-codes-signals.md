---
id: w01-l03-overview
title: "Exit Codes + Signals: Ctrl+C → 130"
order: 5
duration: 120
kind: lesson_overview
part: w01
---
# Lesson 3 (3/6): Exit Codes + SIGINT (Ctrl+C) Contract

## Goal

Make trustctl behave correctly in shell scripts and when interrupted:
- consistent exit codes for usage errors
- Ctrl+C exits with **130** (signal hygiene)

References:
- [Signal (IPC)](https://en.wikipedia.org/wiki/Signal_(IPC))
- [sysexits.h](https://man7.org/linux/man-pages/man3/sysexits.h.3head.html)

---

## What you will build

1) Exit code taxonomy:
- success → 0
- usage error → EX_USAGE (64)

2) **Signal handling mandate**
- catch SIGINT (Ctrl+C)
- exit with code **130**

Why 130:
- common shell convention is `128 + signal_number` (SIGINT is 2 → 130)

---

## Practice

### Task 1 — Standardize usage errors

Do this:
1) Ensure these cases exit EX_USAGE (64):
   - missing command
   - unknown command
   - missing value for `--trust-home`

How to test:
```bash
./trustctl --testing
echo $?

./trustctl --testing nope
echo $?

./trustctl --testing --trust-home
echo $?
```

Expected result:
- all three exit codes are `64`

---

### Task 2 — Add a “wait” command for SIGINT testing

Do this:
1) Add a command for testing signal handling:
- `trustctl wait` runs until interrupted (simple loop / sleep)
- On Ctrl+C, exit 130

How to test:
Terminal 1:
```bash
./trustctl --testing wait
```

Press Ctrl+C.

Then:
```bash
echo $?
```

Expected result:
- exit code is `130`

---

## Done when

- Usage errors always exit 64
- Ctrl+C on `trustctl wait` exits 130

---

## Common mistakes

- Catching SIGINT but still exiting 0 (scripts will think success).
- Printing help on usage errors (help belongs behind `--help`; errors should be short).
- Handling SIGINT only in some commands.

---

## Future Lock

We build SIGINT handling today so your long-running operations in Week 11–12 (leader election / replication debugging) can stop cleanly without corrupting state.

---

## Proof

Paste:
1) `./trustctl --testing --trust-home; echo $?`
2) exit code after Ctrl+C on `./trustctl --testing wait`
