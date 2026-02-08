---
id: w01-cli-logger-discipline-d05-quest-test-plan-design-2h
part: w01-cli-logger-discipline
title: "Quest: Test Plan Design  2h"
order: 5
duration_minutes: 120
prereqs: ["w01-cli-logger-discipline-d04-quest-error-catalog-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Test Plan Design  2h

## Goal

Write a **complete test plan** that covers your entire CLI + logger. Every test has an input, expected output, and pass/fail criteria — copy-paste ready for automation.

By end of this session you will have:

- ✅ **12 CLI tests** covering all 3 commands (append, read, search)
- ✅ **6 logger unit tests** covering write path, format, and validation
- ✅ **3 search no-results tests** confirming exit code 1 behavior
- ✅ Every test has: **input**, **expected stdout**, **expected stderr**, **expected exit code**

**PASS CRITERIA:**

| # | Criterion | Check |
|---|-----------|-------|
| 1 | 12 CLI integration tests | Count test rows in CLI section |
| 2 | 6 logger unit tests | Count test rows in logger section |
| 3 | 3 search no-results tests with exit 1 | Find the 3 specific rows |
| 4 | Every test has input + expected stdout + expected stderr + exit | Check all columns |
| 5 | Tests are copy-paste ready (exact commands, exact expected output) | Try copying one |

## What You're Building Today

A **complete test plan** — 21 tests that verify your entire CLI logger, copy-paste ready to run as a shell script.

By end of this session, you will have:
- ✅ File: `week-1/day5-test-plan.md` (test specification)
- ✅ 12 CLI integration tests (4 per command × 3 commands)
- ✅ 6 logger unit tests (write path, format, validation)
- ✅ 3 search no-results tests (exit 1 specific)
- ✅ A bash test runner template you can execute

What "done" looks like:
```bash
# T1: Append happy path
./logger append "hello world"
if [ $? -eq 0 ]; then echo "T1 PASS"; else echo "T1 FAIL"; fi

# T10: Search no results → exit 1
./logger search "zzz_not_in_log"
if [ $? -eq 1 ]; then echo "T10 PASS"; else echo "T10 FAIL"; fi

# Results: 21 passed, 0 failed
```

You **can**: Run a script that tells you pass/fail for every behavior.
You **cannot yet**: Run it against real code — that is the Boss Fight.

## Why This Matters

🔴 **Without a test plan, you will:**
- Ship code that "works on my machine" but breaks on edge cases
- Have no way to know if a change broke something
- Spend 30 min manually testing the same thing over and over
- Feel anxious about refactoring because you cannot verify correctness

🟢 **With a test plan, you will:**
- Run one command and know if everything works (21 pass/fail results)
- Refactor fearlessly — if tests pass, behavior is preserved
- Catch regressions instantly ("T7 was passing yesterday, now it fails")
- Build confidence through evidence, not hope

🔗 **How this connects:**
- **To Days 1-4:** Every test traces back to a spec: Day 1 (commands), Day 3 (validation), Day 4 (errors)
- **To Boss Fight:** You will run this test plan against your actual code and capture the results
- **To Week 2:** TCP echo server tests follow this same pattern: send input → check output
- **To Week 3:** Concurrent client tests reuse this matrix structure but add timing constraints
- **To Week 10:** WAL crash recovery tests are just "write → crash → recover → verify" — same structure

🧠 **Mental model you are building: "Test from Spec, Not from Code"**

Most beginners write tests AFTER coding, testing what the code happens to do.
Professionals write test plans FROM THE SPEC, testing what the code SHOULD do.

Your 21 tests came from Days 1-4 specs, not from reading code.
By Week 10, when testing crash recovery, you will write tests from the WAL spec
("after crash, all committed entries must be recoverable") — not from the code.
This discipline starts TODAY.

## Visual Model

```
┌──────────────────────────────────────────────────────┐
│                TEST PLAN STRUCTURE                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  TEST HIERARCHY:                                     │
│                                                      │
│  CLI Integration Tests (12 tests)                    │
│  ├── append command (4 tests)                        │
│  │   ├─ T1: happy path - message stored              │
│  │   ├─ T2: error - empty message                    │
│  │   ├─ T3: error - missing argument                 │
│  │   └─ T4: error - unknown flag                     │
│  ├── read command (4 tests)                          │
│  │   ├─ T5: happy path - read all                    │
│  │   ├─ T6: happy path - read with count             │
│  │   ├─ T7: error - negative count                   │
│  │   └─ T8: error - file not found                   │
│  └── search command (4 tests)                        │
│      ├─ T9:  happy path - term found                 │
│      ├─ T10: no results - exit 1                     │
│      ├─ T11: error - empty term                      │
│      └─ T12: error - unknown command                 │
│                                                      │
│  Logger Unit Tests (6 tests)                         │
│  ├── Write path                                      │
│  │   ├─ U1: format - timestamp + space + message     │
│  │   ├─ U2: append - file created if missing         │
│  │   └─ U3: append - file grows, never overwrites    │
│  ├── Validation                                      │
│  │   ├─ U4: reject empty message                     │
│  │   └─ U5: reject message > 4096 chars              │
│  └── Search                                          │
│      └─ U6: case-sensitive match                     │
│                                                      │
│  Search No-Results Specific (3 tests)                │
│  ├─ S1: search term not in log → exit 1              │
│  ├─ S2: search on empty log → exit 1                 │
│  └─ S3: search after append → exit 0 (control test)  │
│                                                      │
│  TOTAL: 21 tests (12 + 6 + 3)                       │
└──────────────────────────────────────────────────────┘
```

## Build

File: `week-1/day5-test-plan.md`

## Do

1. **Write 12 CLI integration tests** — each test is a row with exact command, expected stdout, expected stderr, and exit code. Group by command:
   > 💡 *WHY: Each test traces to a Day 1 spec or Day 3 validation row. Tests written from specs catch real bugs. Tests written from code only confirm the code does what it does.*

   **Append Tests:**

   | # | Test Name | Command | Expected stdout | Expected stderr | Exit |
   |---|-----------|---------|----------------|-----------------|------|
   | T1 | Append happy path | `./logger append "hello world"` | (none) | (none) | 0 |
   | T2 | Append empty message | `./logger append ""` | (none) | "Error: message cannot be empty" | 2 |
   | T3 | Append missing arg | `./logger append` | (none) | "Error: message argument required" | 2 |
   | T4 | Append bad flag | `./logger append --oops "hi"` | (none) | "Error: unknown flag '--oops'" | 2 |

   **Read Tests:**

   | # | Test Name | Command | Expected stdout | Expected stderr | Exit |
   |---|-----------|---------|----------------|-----------------|------|
   | T5 | Read all lines | `./logger read` | all log lines | (none) | 0 |
   | T6 | Read with count | `./logger read 3` | last 3 lines | (none) | 0 |
   | T7 | Read bad count | `./logger read -5` | (none) | "Error: count must be a positive integer" | 2 |
   | T8 | Read no file | `./logger read` (no file) | (none) | "Error: log file not found" | 2 |

   **Search Tests:**

   | # | Test Name | Command | Expected stdout | Expected stderr | Exit |
   |---|-----------|---------|----------------|-----------------|------|
   | T9 | Search found | `./logger search "hello"` | matching lines | (none) | 0 |
   | T10 | Search no results | `./logger search "zzz"` | (none) | (none) | 1 |
   | T11 | Search empty term | `./logger search ""` | (none) | "Error: search term cannot be empty" | 2 |
   | T12 | Unknown command | `./logger delete` | (none) | "Error: unknown command 'delete'" | 2 |

2. **Write 6 logger unit tests** — these test internal behavior, not the CLI wrapper:

   | # | Test Name | Setup | Action | Expected Result |
   |---|-----------|-------|--------|----------------|
   | U1 | Format check | — | format_line("hello") | "2024-01-15T10:00:00 hello\n" |
   | U2 | File creation | no log file | append("first entry") | file created with 1 line |
   | U3 | Append grows | file with 3 lines | append("fourth") | file now has 4 lines |
   | U4 | Reject empty | — | append("") | throws/returns ERR_EMPTY_MSG |
   | U5 | Reject long | — | append(string of 5000 chars) | throws/returns ERR_MSG_TOO_LONG |
   | U6 | Case-sensitive search | log has "Error" and "error" | search("Error") | returns only exact case matches |

3. **Write 3 search no-results tests** — specifically testing exit code 1 behavior:

   | # | Test Name | Setup | Command | Expected |
   |---|-----------|-------|---------|----------|
   | S1 | Term not in log | Log has "hello world" | `search "goodbye"` | stdout: empty, stderr: empty, exit: 1 |
   | S2 | Empty log file | Log file exists but is empty | `search "anything"` | stdout: empty, stderr: empty, exit: 1 |
   | S3 | Control: term found | Log has "hello world" | `search "hello"` | stdout: matching line, exit: 0 |

4. **Add a test execution template** — show how to run these as shell commands:
   > 💡 *WHY: A test plan that can't be executed is just documentation. A runnable script is proof. In the Boss Fight, you'll run this script and capture the output.*
   ```bash
   #!/bin/bash
   # test-cli.sh — Run all CLI tests
   PASS=0; FAIL=0

   # T1: Append happy path
   ./logger append "hello world"
   if [ $? -eq 0 ]; then echo "T1 PASS"; ((PASS++)); else echo "T1 FAIL"; ((FAIL++)); fi

   # T10: Search no results
   ./logger search "zzz_not_in_log"
   if [ $? -eq 1 ]; then echo "T10 PASS"; ((PASS++)); else echo "T10 FAIL"; ((FAIL++)); fi

   echo "Results: $PASS passed, $FAIL failed"
   ```

5. **Write a test summary** — the big picture at the bottom:
   ```markdown
   ## Test Summary
   - Total tests: 21 (12 CLI + 6 unit + 3 search-specific)
   - Coverage: all 3 commands × (happy + error + edge)
   - Exit codes tested: 0 (success), 1 (no results), 2 (error)
   - Every test has exact expected output — no ambiguity
   ```

## Done when

- [ ] 12 CLI integration tests with exact input/output for each — *one test per Day 1 spec row*
- [ ] 6 logger unit tests with setup/action/expected for each — *unit tests catch internal logic bugs*
- [ ] 3 search no-results tests explicitly testing exit code 1 — *this edge case deserves its own category*
- [ ] Test execution template (bash script) included — *untestable tests are useless*
- [ ] Every test has all columns filled (no blanks) — *blanks mean ambiguity, ambiguity means bugs*

## Proof

Paste your complete test matrix (all 21 tests), or upload `week-1/day5-test-plan.md`.

**Quick self-test:**
> 💡 *WHY these questions: Question 3 is the most important test in the entire plan. If you can explain T10 vs T11 instantly, you understand exit code semantics — a skill used every week.*

1. How many total tests should your plan have? → **21** (12 + 6 + 3)
2. Test T10 expects what exit code? → **1** (no results, not an error)
3. What is the difference between T11 (empty term, exit 2) and T10 (no results, exit 1)? → **T11 is invalid input (error). T10 is valid input that found nothing (not an error).**
