---
id: w01-l02-overview
title: "Router: Safe Parsing + 1KB Token Limit"
order: 2
duration: 120
kind: lesson_overview
part: w01
---
# Lesson 2 (2/6): Router — Safe Parse + 1KB Token Limit

## Goal

Make your CLI parser **safe and strict**:
- route commands reliably
- reject dangerous input sizes (1KB max token)

This is your memory-safety mindset starting line.

References:
- [sysexits.h](https://man7.org/linux/man-pages/man3/sysexits.h.3head.html)

---

## What you will build

1) A router that correctly understands:
- `trustctl config show`
- `trustctl init`
- (and rejects unknown commands)

2) **Buffer safety mandate**
- If any single token (argument) is longer than **1024 bytes**, reject with a clear error and non-zero exit.
- The rejection happens **before** deeper parsing.

Why:
- CLIs are attack surfaces. A “tiny tool” can still crash if parsing is sloppy.

---

## Practice

### Task 1 — Extract “command tokens” safely

Do this:
1) In `src/main.cpp`, centralize parsing into a function:
   - reads argv
   - identifies flags vs command tokens
2) Add token validation:
   - if any token length > 1024 → fail early

How to test (manual):
```bash
python3 - << 'PY'
print("A"*2000)
PY
```

Now use that long token:
```bash
./trustctl --testing AAAAAAAAAA...(2000 chars)
echo $?
```

Expected result:
- exit is non-zero (use EX_USAGE=64)
- error message mentions the limit “1024”

---

### Task 2 — Route unknown commands as usage errors

Do this:
1) Unknown command should:
   - print one-line error to stderr
   - suggest `--help`
   - exit EX_USAGE (64)

How to test:
```bash
./trustctl --testing nope
echo $?
```

Expected result:
- stderr includes “unknown command”
- exit code is `64`

---

## Done when

- Any token >1024 bytes is rejected with a clear error
- Unknown commands exit 64
- Existing Lesson 1 behaviors still pass

---

## Common mistakes

- Checking total input size instead of **per-token** size (we want per-token).
- Rejecting after routing (too late).
- Using exit code 1 for everything (we want EX_USAGE for CLI syntax errors).

---

## Future Lock

We build safe parsing today so your future network services (Week 2+) don’t inherit “accept garbage, crash later” behavior.

---

## Proof

Paste:
1) The error output for the 2000-char token rejection
2) `./trustctl --testing nope; echo $?`
