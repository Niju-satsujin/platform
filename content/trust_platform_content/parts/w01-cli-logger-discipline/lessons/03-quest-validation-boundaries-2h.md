---
id: w01-cli-logger-discipline-d03-quest-validation-boundaries-2h
part: w01-cli-logger-discipline
title: "Quest: Validation Boundaries  2h"
order: 3
duration_minutes: 120
prereqs: ["w01-cli-logger-discipline-d02-quest-logger-write-path-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Validation Boundaries  2h

## Goal

Map **every validation boundary** in your CLI logger — the exact point where you reject bad input and what error the user sees. No input should pass unchecked.

By end of this session you will have:

- ✅ A clear **definition of "validation boundary"** in one sentence
- ✅ An **input field table** listing every field with its validation rule
- ✅ A **12-case validation matrix** (Input → Valid/Invalid → stderr → exit code)
- ✅ The **search no-results** case explicitly handled (exit 1, not exit 2)

**PASS CRITERIA:**

| # | Criterion | Check |
|---|-----------|-------|
| 1 | "Validation boundary" defined in one sentence | Look for definition |
| 2 | Every input field has min/max/allowed chars | Count fields in table |
| 3 | 12 validation cases with exact stderr messages | Count test rows |
| 4 | Search no-results returns exit 1 (not 2) | Find row #5 |
| 5 | All errors return exit 2 consistently | Scan exit column |

## What You're Building Today

A **validation matrix** — a single document that maps every possible bad input to its rejection point, error message, and exit code.

By end of this session, you will have:
- ✅ File: `week-1/day3-validation-boundaries.md` (validation spec)
- ✅ A one-sentence definition of "validation boundary"
- ✅ Input field table: 5+ fields with type, min, max, and rejection message
- ✅ 12-case validation matrix with exact stderr text for every rejection

What "done" looks like:
```
| # | Input            | Valid? | stderr                         | Exit |
|---|------------------|--------|--------------------------------|------|
| 1 | append "hello"   | ✅     | (none)                         | 0    |
| 2 | append ""        | ❌     | "Error: message cannot be empty" | 2  |
| 3 | search "x" (0 matches) | ✅ | (none)                        | 1    |
```

You **can**: Look up any input and know exactly what will happen.
You **cannot yet**: Name the errors — that is Day 4 (error catalog).

## Why This Matters

🔴 **Without validation boundaries, you will:**
- Let bad input flow deep into your code before crashing
- Get inconsistent error messages ("invalid" vs "missing" vs "bad")
- Forget the search no-results case (exit 1 vs exit 2 confusion)
- Spend 1+ hour on Day 5 writing tests for edge cases you never planned

🟢 **With validation boundaries, you will:**
- Reject bad input at the boundary, before any processing happens
- Give users clear, consistent error messages every time
- Distinguish "no results" (exit 1) from "bad input" (exit 2) — scripts depend on this
- Write Day 4 error catalog directly from this matrix

🔗 **How this connects:**
- **To Day 1:** Your command table defined WHAT is valid — today you define WHERE validation happens
- **To Day 2:** Step 2 of the write path (validate) is expanded into a full matrix here
- **To Day 4:** Every row in this matrix becomes a named error in the catalog
- **To Week 2:** TCP frame validation uses the same boundary pattern: check length → check format → check content
- **To Week 8:** Signature replay protection is literally a validation boundary: "Has this nonce been seen before?"

🧠 **Mental model you are building: "Reject Early, Reject Clearly"**

Bad input should never reach your core logic. Every boundary is a checkpoint:
Input arrives → Is it valid? → **YES**: proceed. **NO**: stop, tell the user WHY, exit with the right code.

By Week 8, when validating cryptographic signatures, you will instinctively build a validation chain:
"Check format → check expiry → check signature → check replay."
This pattern of layered validation starts TODAY.

## Visual Model

```
┌──────────────────────────────────────────────────────┐
│             VALIDATION BOUNDARY MAP                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  USER INPUT                                          │
│  $ ./logger <command> <args>                         │
│       │                                              │
│       ▼                                              │
│  BOUNDARY 1: Command Validation                      │
│  ┌─────────────────────────────────────────┐        │
│  │ Is command one of: append, read, search? │        │
│  │   YES → continue                         │        │
│  │   NO  → stderr "unknown command" exit 2  │        │
│  └─────────────────────────────────────────┘        │
│       │                                              │
│       ▼                                              │
│  BOUNDARY 2: Argument Validation                     │
│  ┌─────────────────────────────────────────┐        │
│  │ append: message present + non-empty?     │        │
│  │ read:   count is positive integer?       │        │
│  │ search: term present + non-empty?        │        │
│  │   YES → continue                         │        │
│  │   NO  → stderr "Error: ..." exit 2       │        │
│  └─────────────────────────────────────────┘        │
│       │                                              │
│       ▼                                              │
│  BOUNDARY 3: Resource Validation                     │
│  ┌─────────────────────────────────────────┐        │
│  │ Log file accessible?                     │        │
│  │   YES → continue                         │        │
│  │   NO  → stderr "file not found" exit 2   │        │
│  └─────────────────────────────────────────┘        │
│       │                                              │
│       ▼                                              │
│  BOUNDARY 4: Result Validation (search only)         │
│  ┌─────────────────────────────────────────┐        │
│  │ Search found results?                    │        │
│  │   YES → stdout results, exit 0           │        │
│  │   NO  → no stdout, exit 1 (NOT exit 2!)  │        │
│  └─────────────────────────────────────────┘        │
│                                                      │
│  ⚠️  exit 1 = "no results" (not an error)           │
│  ⚠️  exit 2 = "your input was wrong" (real error)   │
└──────────────────────────────────────────────────────┘
```

## Build

File: `week-1/day3-validation-boundaries.md`

## Do

1. **Define "validation boundary"** — write one clear sentence:
   > 💡 *WHY: If you can define it in one sentence, you understand it. If you can't, you'll validate inconsistently. In Week 8, this exact concept protects against replay attacks.*
   ```markdown
   ## Definition
   A **validation boundary** is a checkpoint in the code where input is
   inspected and rejected with a specific error message and exit code
   before any processing continues.
   ```

2. **Create the input field table** — list every input your CLI accepts and its validation rule:

   | Field | Type | Required? | Min | Max | Allowed | Reject message |
   |-------|------|-----------|-----|-----|---------|---------------|
   | command | string | yes | 1 char | — | append, read, search | "Error: unknown command '{cmd}'" |
   | message (append) | string | yes | 1 char | 4096 chars | any printable | "Error: message cannot be empty" |
   | count (read) | int | no | 1 | 100000 | positive int | "Error: count must be positive integer" |
   | term (search) | string | yes | 1 char | 256 chars | any printable | "Error: search term cannot be empty" |
   | flags | string | no | — | — | --timestamp, --reverse, --count | "Error: unknown flag '{flag}'" |

3. **Write the 12-case validation matrix** — every row must have the exact stderr text:
   > 💡 *WHY: Each row becomes a test case on Day 5 and an error catalog entry on Day 4. One matrix → three deliverables.*

   | # | Input | Valid? | stderr | Exit |
   |---|-------|--------|--------|------|
   | 1 | `append "hello"` | ✅ Valid | (none) | 0 |
   | 2 | `append ""` | ❌ Invalid | "Error: message cannot be empty" | 2 |
   | 3 | `append` (no arg) | ❌ Invalid | "Error: message argument required" | 2 |
   | 4 | `read 5` | ✅ Valid | (none) | 0 |
   | 5 | `read -1` | ❌ Invalid | "Error: count must be positive integer" | 2 |
   | 6 | `read abc` | ❌ Invalid | "Error: count must be a number" | 2 |
   | 7 | `search "error"` | ✅ Valid | (none) | 0 |
   | 8 | `search ""` | ❌ Invalid | "Error: search term cannot be empty" | 2 |
   | 9 | `search "term"` (no results) | ✅ Valid | (none) | 1 |
   | 10 | `delete` | ❌ Invalid | "Error: unknown command 'delete'" | 2 |
   | 11 | `read --oops` | ❌ Invalid | "Error: unknown flag '--oops'" | 2 |
   | 12 | `read` (no log file) | ❌ Invalid | "Error: log file not found" | 2 |

4. **Explicitly handle the search no-results case** — write a callout:
   > 💡 *WHY: This is the #1 bug source. Beginners treat "no results" as an error. Professionals distinguish "worked but empty" (exit 1) from "broken" (exit 2). This pattern recurs in Week 7 hash lookups.*
   ```markdown
   ## ⚠️ Important: Search No-Results Is NOT an Error

   When `search` finds zero matches:
   - stdout: (empty — nothing to show)
   - stderr: (empty — no error occurred)
   - exit code: 1 (means "no results found")

   This is DIFFERENT from exit 2 (which means the input was bad).
   A user can check: `if ($? == 1)` to know "search worked, just no matches."
   ```

5. **Cross-reference with Day 1** — verify your 12 test cases from Day 1 match these validation rules. Note any inconsistencies:
   ```markdown
   ## Cross-Reference Check
   - Day 1 test case #5 (no results) → matches exit 1 ✓
   - Day 1 test case #6 (missing arg) → matches boundary 2 ✓
   [... check all 12]
   ```

## Done when

- [ ] "Validation boundary" defined in one sentence — *if you can't define it, you can't implement it*
- [ ] Input field table with 5+ fields, each with type/min/max/allowed/reject message — *becomes your guard clause spec*
- [ ] 12-case validation matrix with exact stderr messages and exit codes — *one matrix feeds Day 4 + Day 5*
- [ ] Search no-results explicitly documented as exit 1 (not exit 2) — *the #1 bug you'll prevent*
- [ ] Cross-reference with Day 1 contract — no contradictions — *contradictions become bugs later*

## Proof

Paste your 12-case validation matrix and the search no-results callout, or upload `week-1/day3-validation-boundaries.md`.

**Quick self-test:**
> 💡 *WHY these questions: Question 2 is the #1 mistake in this week. If you get it wrong, go back to the no-results callout immediately.*

1. What is a validation boundary? → **A checkpoint where bad input is rejected with a specific error and exit code**
2. What exit code does `search "term"` return when nothing matches? → **1** (not 2!)
3. What is the max allowed message length? → **4096 characters** (your choice, but it must be defined)
