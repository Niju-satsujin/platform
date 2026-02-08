---
id: w01-cli-logger-discipline-d01-quest-define-your-cli-contract-2h
part: w01-cli-logger-discipline
title: "Quest: Define Your CLI Contract  2h"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Define Your CLI Contract  2h

## Goal

Write the **complete CLI contract** for your file logger so every command, argument, output, and error is specified before you write a single line of C++.

By end of this session you will have:

- ✅ A **command table** listing every CLI command with args, stdout, stderr, and exit codes
- ✅ **3 concrete usage examples** showing exact input → output
- ✅ **12 test cases** covering valid inputs, missing args, bad flags, and edge cases
- ✅ A **stable exit code contract**: 0 = success, 1 = no-results, 2 = error

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Command table has ≥ 3 commands | Count rows |
| 2 | Each command lists: args, stdout, stderr, exit code | Check all 5 columns filled |
| 3 | 3 examples with exact expected output | Look for `$` prompts with output |
| 4 | 12 test cases with pass/fail criteria | Count numbered test rows |
| 5 | Exit codes are consistent (0, 1, 2 only) | Scan the exit code column |

## What You're Building Today

A written specification document for a command-line logger tool — your "blueprint" before writing any C++.

By end of this session, you will have:
- ✅ File: `week-1/day1-cli-contract.md` (the specification document)
- ✅ 3 command specs documented: `append`, `read`, `search`
- ✅ 3 exit codes defined: 0 = success, 1 = no-results, 2 = error
- ✅ 12 test scenarios in a matrix (3 commands × 4 cases each)

What "done" looks like — your contract will contain:
```markdown
## Command: append
Usage: ./logger append <message>
Args: message (string, required)
stdout: (none — silence means success)
stderr: "Error: message cannot be empty"
Exit codes: 0 = ok, 2 = error
```

You **can**: Describe exactly what the tool does for any input.
You **cannot yet**: Run the tool — that starts on Day 2.

## Why This Matters

🔴 **Without a spec, you will:**
- Start coding blindly and change behavior randomly as you go
- Forget edge cases and discover them as bugs on Day 5
- Waste 2+ hours rewriting tests because behavior is unclear
- Be unable to answer "what does this tool do?" in one sentence

🟢 **With a spec, you will:**
- Know exactly when you are "done" (objective pass criteria)
- Catch errors in the planning phase, before writing buggy code
- Write tests on Day 5 directly from this spec (tests verify contract)
- Have documentation ready for Week 6 when you package the project

🔗 **How this connects:**
- **To Day 2:** You will implement the `append` command from this spec
- **To Day 3:** Your validation rules come directly from this command table
- **To Day 5:** You will write automated tests for these 12 test scenarios
- **To Week 2:** You will use this same pattern to spec TCP protocol messages
- **To Week 7:** You will spec hash verification APIs the same way

🧠 **Mental model you are building: "Specification Thinking"**

In traditional coding: Code → Test → Fix → Ship.
In professional engineering: **Spec → Code → Verify against spec → Ship.**

By Week 12 when building leader election, you will automatically ask:
"What are the valid states? What are the transitions? What are the error cases?"
You will not start coding blindly. This habit starts TODAY.

## Visual Model

```
┌──────────────────────────────────────────────────────┐
│                  CLI CONTRACT MAP                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  User Input                                          │
│  $ ./logger <command> [args] [flags]                 │
│       │                                              │
│       ▼                                              │
│  ┌─────────────┐     ┌──────────────────────┐       │
│  │   PARSER     │────▶│  Validate args       │       │
│  │  (command +  │     │  - required present? │       │
│  │   flags)     │     │  - types correct?    │       │
│  └─────────────┘     └──────────┬───────────┘       │
│                                  │                    │
│                    ┌─────────────┼─────────────┐     │
│                    ▼             ▼              ▼     │
│               ┌────────┐  ┌──────────┐  ┌─────────┐ │
│               │ append  │  │  read    │  │ search  │ │
│               └────┬───┘  └────┬─────┘  └────┬────┘ │
│                    │           │              │       │
│                    ▼           ▼              ▼       │
│               ┌─────────────────────────────────┐    │
│               │         OUTPUT RULES             │    │
│               ├─────────────────────────────────┤    │
│               │  stdout → data/results only      │    │
│               │  stderr → error messages only    │    │
│               │  exit 0 → success                │    │
│               │  exit 1 → no results (search)    │    │
│               │  exit 2 → error (bad input/IO)   │    │
│               └─────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

## Build

File: `week-1/day1-cli-contract.md`

## Do

1. **Create the contract file** — create `week-1/day1-cli-contract.md` with a header:
   > 💡 *WHY: Every professional spec starts with metadata. When you revisit this in Week 6, you'll know who wrote it and when.*
   ```markdown
   # CLI Contract — File Logger v1.0
   Date: [today's date]
   Author: [your name]
   ```

2. **Write the command table** — add a markdown table with these exact columns. Fill in all three commands:
   > 💡 *WHY: This table IS your API. On Day 2 you implement from it. On Day 5 you test against it. In Week 2, you'll spec TCP protocol messages the same way.*
   ```markdown
   | Command | Args | Flags | stdout | stderr | Exit Code |
   |---------|------|-------|--------|--------|-----------|
   | append  | <message> | --timestamp | (none, silent) | "Error: empty message" | 0=ok, 2=error |
   | read    | [count]   | --reverse   | log lines      | "Error: file not found" | 0=ok, 2=error |
   | search  | <term>    | --count     | matching lines  | "Error: empty term" | 0=found, 1=none, 2=error |
   ```

3. **Write 3 concrete examples** — show exact terminal input and expected output:
   ```bash
   # Example 1: Append a log entry
   $ ./logger append "Server started on port 8080"
   # (no stdout — success is silent)
   # exit code: 0

   # Example 2: Read last 5 lines
   $ ./logger read 5
   2024-01-15T10:00:00 Server started on port 8080
   2024-01-15T10:00:01 Connection from 192.168.1.1
   2024-01-15T10:00:02 GET /index.html 200
   2024-01-15T10:00:03 GET /style.css 200
   2024-01-15T10:00:04 Connection closed
   # exit code: 0

   # Example 3: Search with no results
   $ ./logger search "CRITICAL"
   # (no stdout — nothing matched)
   # exit code: 1
   ```

4. **Write 12 test cases** — create a numbered matrix covering happy paths, edge cases, and errors:
   > 💡 *WHY: 12 cases for 3 commands catches failures you'd otherwise find on Day 5. By Week 7, you'll write 50+ test cases for hash integrity — start the habit now.*

   | # | Category | Input | Expected stdout | Expected stderr | Exit |
   |---|----------|-------|----------------|-----------------|------|
   | 1 | Happy path | `append "hello"` | (none) | (none) | 0 |
   | 2 | Happy path | `read` | all lines | (none) | 0 |
   | 3 | Happy path | `read 3` | last 3 lines | (none) | 0 |
   | 4 | Happy path | `search "error"` | matching lines | (none) | 0 |
   | 5 | No results | `search "zzz_not_found"` | (none) | (none) | 1 |
   | 6 | Missing arg | `append` | (none) | "Error: message required" | 2 |
   | 7 | Missing arg | `search` | (none) | "Error: search term required" | 2 |
   | 8 | Bad flag | `append --oops "hi"` | (none) | "Error: unknown flag" | 2 |
   | 9 | Bad count | `read -5` | (none) | "Error: count must be positive" | 2 |
   | 10 | Empty msg | `append ""` | (none) | "Error: empty message" | 2 |
   | 11 | No log file | `read` (file missing) | (none) | "Error: log file not found" | 2 |
   | 12 | Bad command | `delete` | (none) | "Error: unknown command" | 2 |

5. **Define the exit code contract** — add a clear section at the bottom:

   | Code | Meaning | When |
   |------|---------|------|
   | 0 | Success | Command completed normally |
   | 1 | No results | Search found zero matches (not an error) |
   | 2 | Error | Bad input, missing file, unknown command |

   > **Rule:** stdout = data only. stderr = errors only. Never mix them.

## Done when

- [ ] Command table with 3+ commands and all columns filled — *becomes your Day 2 implementation checklist*
- [ ] 3 examples with exact terminal input/output — *you'll copy these into Day 5 test assertions*
- [ ] 12 numbered test cases with expected output for each — *catches edge cases before coding*
- [ ] Exit code contract section (0, 1, 2 defined) — *scripts depend on these codes being consistent*
- [ ] stdout/stderr separation rule stated explicitly — *this rule applies to every project through Week 24*

## Proof

Paste your complete command table and test case matrix, or upload `week-1/day1-cli-contract.md`.

**Quick self-test** (answer without looking at your notes):
> 💡 *WHY these questions: If you can answer all 3 instantly, you've internalized the contract. If not, re-read — these come back on Day 5.*

1. What exit code does `search` return when no matches are found? → **1**
2. Where do error messages go — stdout or stderr? → **stderr**
3. What happens if you run `append` with no message? → **exit 2, stderr says "Error: message required"**
