---
id: w01-t03
title: "Training: Exit Codes + Signals: Ctrl+C → 130"
order: 6
duration: 120
kind: training
part: w01
---
# Training 3: Exit Codes + Signals: Ctrl+C → 130

## Goal
Implement consistent exit codes and handle Ctrl+C (SIGINT) with exit 130.

## Warmup (5–10 min)
- Why do scripts care about exit codes?
- What should happen when the user presses Ctrl+C?

## Work (main)
### Step 1
**Do this:** Implement and verify exit code behavior in code (success / usage / runtime).  
Optional: write docs if you want.

**How to test it:**
- Run: `./tests/run.sh`

**Expected result:**
- Harness checks exit-code behavior and reports PASS/FAIL.

### Step 2
**Do this:** Ensure unknown commands return non-zero exit and print error to stderr.

**How to test it:**
- Run: `trustctl wat 2>&1; echo $?`

**Expected result:**
- Non-zero exit. Output mentions unknown command.

### Step 3
**Do this:** Install SIGINT handling so Ctrl+C exits with code 130.

**How to test it:**
- Run: `(trustctl debug hang) ; echo $?`

**Expected result:**
- After pressing Ctrl+C, exit code prints `130`.


## Prove (10–20 min)
- Paste: output + exit code for unknown command.
- Paste: exit code after Ctrl+C = 130.
- Explain in 4 lines: why is 130 useful for automation?

## Ship (5 min)
- Submit: signal handling + exit code changes in code/tests
- Paste: unknown command proof + SIGINT proof

## Done when
- Unknown command returns non-zero exit.
- Ctrl+C exits with 130 consistently.

## Common mistakes
- Errors printed on stdout → errors go to stderr.
- Signal handler installed too late → install early in main.

## Proof (what you submit)
- Paste unknown command output + exit code
- Paste SIGINT proof (press Ctrl+C)

## Hero Visual
Exit path: error → stderr → exit code. Signal path: SIGINT → handler → exit 130.

## Future Lock
Week 5+ needs correct shutdown to avoid partial writes and test flakes.

## References
- [man7: sigaction(2)](https://man7.org/linux/man-pages/man2/sigaction.2.html)
- [man7: signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html)
- [IBM: exit code 130 = SIGINT](https://www.ibm.com/docs/sr/SSWRJV_10.1.0/lsf_admin/job_exit_codes_lsf.html)
- [man7: sysexits.h](https://man7.org/linux/man-pages/man3/sysexits.h.3head.html)
