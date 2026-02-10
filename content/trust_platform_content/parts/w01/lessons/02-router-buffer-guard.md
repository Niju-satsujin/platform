---
id: w01-l02
title: "Lesson 2 — Router: Safe Dispatch + 1KB Buffer Guard"
order: 2
duration_min: 120
type: lesson
---

# Lesson 2 (2/7): Router — Safe Dispatch + 1 KB Buffer Guard

**Goal:** Build a command router that dispatches known commands safely and rejects unknown commands and oversized input tokens.

**What you build:** Command router with [POSIX-style](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html) dispatch + a 1024-byte token guard that prevents [buffer overflow class (CWE-120)](https://cwe.mitre.org/data/definitions/120.html) issues.

## Why it matters

- Unknown commands [MUST](https://datatracker.ietf.org/doc/html/rfc2119) produce a clear usage error, not silence or a crash. Operators need to know what went wrong.
- Buffer overflows are a top vulnerability class. [CWE-120](https://cwe.mitre.org/data/definitions/120.html) says: validate input size at the earliest boundary. Our rule: any single argument token > 1024 bytes is rejected before routing.
- [POSIX utility conventions](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html) define how options and operands should behave. Following them makes your tool predictable.

## TRAINING SESSION

### Warmup (5 min)
- Q: What is [CWE-120](https://cwe.mitre.org/data/definitions/120.html) and why does it matter for CLI tools?
- Q: What exit code should an unknown command produce? (Hint: [sysexits](https://man7.org/linux/man-pages/man3/sysexits.h.3head.html) — EX_USAGE = 64.)

### Work

**Task 1: Define the command table**

1. Do this: Implement routing for these commands: `config show`, `log demo <msg>`, `hold --seconds <n>`. Any other input is "unknown command."
2. How to test it:
   ```
   trustctl config show
   trustctl log demo "hello"
   trustctl hold --seconds 3
   ```
3. Expected result: Each command executes its handler. No crashes.

**Task 2: Unknown command → usage error**

1. Do this: If the command doesn't match the table, print a usage error with a hint listing valid commands. Exit with code 64 ([EX_USAGE](https://man7.org/linux/man-pages/man3/sysexits.h.3head.html)).
2. How to test it:
   ```
   trustctl gibberish
   echo $?
   ```
3. Expected result:
   ```
   error: unknown command "gibberish"
   valid commands: config, log, hold
   hint: run 'trustctl --help' for usage
   ```
   Exit code: 64

**Task 3: Enforce 1 KB token limit**

1. Do this: Before routing, scan every argument token. If any single token exceeds 1024 bytes, reject the entire command. Print what was too large and exit 64.
2. How to test it:
   ```
   python3 -c "print('A'*2000)" | xargs trustctl log demo
   echo $?
   ```
3. Expected result:
   ```
   error: argument token exceeds 1024-byte limit (got 2000 bytes)
   ```
   Exit code: 64. No routing or execution happened.

**Task 4: Missing required arguments**

1. Do this: `hold` without `--seconds` prints a usage error. `log demo` without a message prints a usage error. Both exit 64.
2. How to test it:
   ```
   trustctl hold
   echo $?
   trustctl log demo
   echo $?
   ```
3. Expected result: Clear error messages. Exit 64 in both cases.

### Prove (15 min)
- Run all four test scenarios and confirm outputs.
- Explain in 4 lines: Why validate token size before routing, not inside each handler?

### Ship (5 min)
- Submit: updated source files
- Paste: unknown command output, oversize rejection output, missing args output

## Done when
- Known commands route to their handlers.
- Unknown command → exit 64 with hint.
- Token > 1024 bytes → exit 64 before routing.
- Missing required args → exit 64 with usage.

## Common mistakes
- Validation after routing → Fix: Parse and validate before dispatch.
- Unknown command exits 0 → Fix: Make it a hard error (64).
- Oversize check only on some args → Fix: Check ALL tokens in one loop.
- Error message doesn't say what was wrong → Fix: Include the bad value and the limit.

## Proof
- Submit: source code
- Paste: unknown command output + exit code
- Paste: oversize rejection output + exit code
- Paste: missing args output + exit code

## Hero Visual

```
┌─────────────────────────────────────────┐
│              Input Pipeline              │
│                                         │
│  argv ──► [1KB token scan] ──► [router] │
│               │                    │    │
│            reject ≥1KB         unknown?  │
│            exit 64              exit 64  │
│                                    │    │
│                                 handler  │
└─────────────────────────────────────────┘
```

### What you should notice
- The 1 KB guard sits BEFORE the router. Bad input never reaches handlers.
- Two separate rejection paths: oversized tokens and unknown commands.

## Future Lock
Later in **Week 2** (TCP framing), you enforce frame size limits using the same "validate at boundary" pattern. In **Week 4** (HTTP parsing), Content-Length limits follow this model. The habit of early rejection starts here.
