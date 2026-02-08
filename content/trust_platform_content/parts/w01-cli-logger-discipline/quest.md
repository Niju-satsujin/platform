---
id: w01-cli-logger-discipline-quest
part: w01-cli-logger-discipline
title: "BOSS FIGHT: Package for Reuse  4h"
order: 6
duration_minutes: 240
prereqs: ["w01-cli-logger-discipline-d05-quest-test-plan-design-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
---

# BOSS FIGHT: Package for Reuse  4h

## Goal

Package your CLI logger into a **clean, reusable project** with a README, a working demo, a test run log, and a baseline performance report. Someone who has never seen your code should be able to clone, build, run, and verify it in under 5 minutes.

By end of this session you will have:

- ✅ A **project README** with structure, build steps, and usage examples
- ✅ A **working demo** that runs all 3 commands (append, read, search) end-to-end
- ✅ A **test run log** proving all 21 tests pass
- ✅ A **baseline report** with timing data and at least one forced failure captured
- ✅ A **clean folder layout** that could be shared as a library

**PASS CRITERIA:**

| # | Criterion | Check |
|---|-----------|-------|
| 1 | README has build + run steps that work | Follow the steps — does it build? |
| 2 | Demo runs all 3 commands without error | Run it and verify exit codes |
| 3 | Test log shows ≥ 18/21 tests passing | Count PASS lines |
| 4 | Baseline report has timing for append + read + search | Find 3 timing numbers |
| 5 | At least 1 forced failure captured with stderr + exit code | Find the error example |

## What You're Building Today

A **shippable project** — the kind you would put on GitHub for another developer to clone, build, run, and verify in under 5 minutes. This is the "final exam" for Week 1.

By end of this session, you will have:
- ✅ File: `week-1/README.md` (project overview with build + run steps)
- ✅ File: `week-1/day6-baseline-report.md` (test results + timing + failure log)
- ✅ A working demo: all 3 commands (append, read, search) run end-to-end
- ✅ A test run log: proof that ≥ 18/21 tests pass
- ✅ A clean folder layout that could be shared as a library

What "done" looks like:
```bash
$ cd week-1 && mkdir build && cd build && cmake .. && make
$ ./logger append "System started"     # exit 0
$ ./logger read                         # prints 1 line
$ ./logger search "System"              # prints match
$ bash ../tests/test-cli.sh
# Results: 21 passed, 0 failed
```

You **can**: Share this project and have someone else run it cold.
You **cannot yet**: Handle network I/O — that is Week 2.

## Why This Matters

🔴 **Without packaging, you will:**
- Have scattered files that only work on your machine
- Forget how to build the project in 2 weeks ("what was that cmake command?")
- Be unable to show your work in a job interview or portfolio
- Start Week 2 without a clean baseline to compare against

🟢 **With a shippable package, you will:**
- Have proof of competence: "Here is a working project with passing tests"
- Return to this code in any future week and rebuild it in 60 seconds
- Compare Week 2 performance against Week 1 baseline numbers
- Practice the professional workflow: spec → code → test → package → ship

🔗 **How this connects:**
- **To Days 1-5:** Everything you built this week goes into this package
- **To Week 2:** You start fresh but follow the same packaging pattern for the TCP server
- **To Week 6:** Your backpressure handler will be packaged the same way
- **To Week 12:** Leader election is packaged as a standalone module — same structure, bigger system
- **To Week 23:** Your final portfolio demo references these weekly packages as proof of progression

🧠 **Mental model you are building: "Ship Complete Work"**

Incomplete work teaches nothing. Shipped work creates evidence.
A README, passing tests, and a baseline report transform "I worked on something"
into "I built something that works, and here is the proof."

By Week 23, you will have 24 shippable packages — each one a portfolio artifact
that demonstrates growing engineering skill. This first package sets the standard.

## Visual Model

```
┌──────────────────────────────────────────────────────┐
│                DELIVERABLE STRUCTURE                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  week-1/                                             │
│  ├── README.md              ← project overview       │
│  │   ├── Project structure                           │
│  │   ├── Build steps                                 │
│  │   ├── Usage examples (3 commands)                 │
│  │   └── How to run tests                            │
│  ├── day1-cli-contract.md   ← from Day 1             │
│  ├── day2-logger-write-path.md  ← from Day 2         │
│  ├── day3-validation-boundaries.md ← from Day 3      │
│  ├── day4-error-catalog.md  ← from Day 4             │
│  ├── day5-test-plan.md      ← from Day 5             │
│  ├── day6-baseline-report.md ← TODAY                 │
│  ├── src/                                            │
│  │   ├── main.cpp           ← CLI entry point        │
│  │   ├── logger.h           ← logger interface       │
│  │   └── logger.cpp         ← logger implementation  │
│  ├── tests/                                          │
│  │   ├── test-cli.sh        ← CLI integration tests  │
│  │   └── test-run.log       ← captured test output   │
│  └── CMakeLists.txt         ← build configuration    │
│                                                      │
│  DEMO FLOW:                                          │
│  $ cd week-1 && mkdir build && cd build              │
│  $ cmake .. && make                                  │
│  $ ./logger append "System started"    → exit 0      │
│  $ ./logger append "User connected"    → exit 0      │
│  $ ./logger read 2                     → 2 lines     │
│  $ ./logger search "User"              → 1 match     │
│  $ ./logger search "MISSING"           → exit 1      │
│  $ ./logger append ""                  → exit 2      │
└──────────────────────────────────────────────────────┘
```

## Build

Files: `week-1/README.md`, `week-1/day6-baseline-report.md`

## Do

1. **Create the folder layout and README** — write a README with exact build steps:
   > 💡 *WHY: A README is the first thing anyone reads. If they can't build your project in 5 minutes from your README, the project doesn't exist to them.*
   ```markdown
   # File Logger — Week 1

   ## Project Structure
   ```
   week-1/
   ├── README.md
   ├── CMakeLists.txt
   ├── src/
   │   ├── main.cpp
   │   ├── logger.h
   │   └── logger.cpp
   ├── tests/
   │   ├── test-cli.sh
   │   └── test-run.log
   └── docs/
       ├── day1-cli-contract.md
       ├── day2-logger-write-path.md
       ├── day3-validation-boundaries.md
       ├── day4-error-catalog.md
       └── day5-test-plan.md
   ```

   ## Build
   ```bash
   cd week-1
   mkdir -p build && cd build
   cmake ..
   make
   ```

   ## Usage
   ```bash
   # Append a log entry
   ./logger append "Server started on port 8080"

   # Read last 5 entries
   ./logger read 5

   # Search for entries
   ./logger search "error"
   ```

   ## Run Tests
   ```bash
   cd tests
   bash test-cli.sh
   ```
   ```

2. **Run a live demo** and capture the output — execute all 3 commands and save the terminal session:
   ```bash
   # demo-run.sh
   echo "=== DEMO: append ==="
   ./logger append "System initialized at $(date)"
   echo "exit code: $?"

   echo "=== DEMO: read ==="
   ./logger read
   echo "exit code: $?"

   echo "=== DEMO: search ==="
   ./logger search "System"
   echo "exit code: $?"

   echo "=== DEMO: search no-results ==="
   ./logger search "ZZZZZ"
   echo "exit code: $?"
   ```

3. **Run all tests and capture the log** — execute the test script and save to `tests/test-run.log`:
   > 💡 *WHY: Captured test output is evidence. "I ran the tests" is a claim. "Here's the log showing 21 passed" is proof. In Week 23 your portfolio references these logs.*
   ```bash
   bash tests/test-cli.sh 2>&1 | tee tests/test-run.log
   # Expected output:
   # T1 PASS
   # T2 PASS
   # ...
   # Results: 21 passed, 0 failed
   ```

4. **Force one failure and capture it** — intentionally trigger an error and document exactly what happened:
   ```bash
   # Forced failure: append with empty message
   $ ./logger append ""
   Error: message cannot be empty    ← this goes to stderr
   $ echo $?
   2                                 ← exit code 2 as expected
   ```

5. **Write the baseline report** — create `week-1/day6-baseline-report.md` with timing and metrics:
   > 💡 *WHY: Baseline numbers let you measure progress. In Week 10, you'll compare WAL write latency against this Week 1 append time. Without a baseline, you can't know if you got faster.*
   ```markdown
   # Baseline Report — Week 1

   ## Test Results
   - Tests run: 21
   - Passed: ___
   - Failed: ___
   - Pass rate: ___%

   ## Timing Baseline
   | Operation | Time | Notes |
   |-----------|------|-------|
   | append 1 entry | ___ms | Single write |
   | read 100 entries | ___ms | Full file read |
   | search 100 entries | ___ms | Linear scan |

   ## Forced Failure Log
   Command: `./logger append ""`
   stderr: "Error: message cannot be empty"
   exit code: 2
   Matches error catalog entry: ERR_EMPTY_MSG ✓

   ## Confidence Check
   - [ ] I can explain the write path from memory
   - [ ] I can list all exit codes without looking
   - [ ] I can name 3 error types from the catalog
   - [ ] My test plan covers happy + error + edge cases
   ```

## Done when

- [ ] README has folder structure, build steps, and usage examples — *someone else can build your project cold*
- [ ] Demo runs successfully (all 3 commands work) — *proof the implementation matches the spec*
- [ ] Test run log shows ≥ 18/21 passing — *evidence, not a claim*
- [ ] At least 1 forced failure captured with stderr + exit code — *proves error handling works too*
- [ ] Baseline report has timing numbers for 3 operations — *Week 2 compares against these*
- [ ] Confidence checklist completed honestly — *self-awareness is engineering skill #1*

## Proof

Paste your README (structure + usage section) and the test results summary, or upload both `week-1/README.md` and `week-1/day6-baseline-report.md`.

**Quick self-test:**
> 💡 *WHY these questions: Question 1 is the shipping test. Question 3 is the learning test. If you can't answer both, the week isn't done.*

1. Can someone clone your repo and build in under 5 minutes? → If not, your README needs more detail
2. How many tests should pass? → **At least 18 out of 21** (85%+)
3. What was your top failure root cause this week? → Write it in one sentence
