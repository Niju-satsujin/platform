---
id: w01-cli-logger-discipline-d04-quest-error-catalog-2h
part: w01-cli-logger-discipline
title: "Quest: Error Catalog  2h"
order: 4
duration_minutes: 120
prereqs: ["w01-cli-logger-discipline-d03-quest-validation-boundaries-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Error Catalog  2h

## Goal

Create a **complete error catalog** — a single reference table where every possible failure in your CLI has a stable name, a human-readable stderr message, and a consistent exit code.

By end of this session you will have:

- ✅ An **error catalog table** with: Error name, Trigger condition, stderr message, Exit code
- ✅ **Search no-results** correctly categorized as exit 1 (not a real error)
- ✅ **5 example calls** showing the exact stderr line for each error
- ✅ The **stdout/stderr rule** restated and applied to every entry

**PASS CRITERIA:**

| # | Criterion | Check |
|---|-----------|-------|
| 1 | Error catalog has ≥ 8 named errors | Count rows |
| 2 | Every error has a stable name (e.g. ERR_EMPTY_MSG) | Check name column |
| 3 | stderr messages are human-readable sentences | Read each message |
| 4 | All real errors use exit 2 consistently | Scan exit column |
| 5 | Search no-results uses exit 1 (not listed as an error) | Find the entry |

## What You're Building Today

An **error catalog** — a single reference table where every possible failure has a stable name (`ERR_EMPTY_MSG`), a human-readable message, and a consistent exit code.

By end of this session, you will have:
- ✅ File: `week-1/day4-error-catalog.md` (error reference)
- ✅ 10+ named errors organized by category (command, validation, I/O)
- ✅ 5 example calls showing the exact stderr line for each error
- ✅ The `NO_RESULTS` special case documented (exit 1, not exit 2)

What "done" looks like:
```
| Error Name       | Trigger                  | stderr                        | Exit |
|------------------|--------------------------|-------------------------------|------|
| ERR_UNKNOWN_CMD  | command not in list       | "Error: unknown command 'X'"  | 2    |
| ERR_EMPTY_MSG    | append message is ""      | "Error: message cannot be empty" | 2 |
| NO_RESULTS       | search found zero matches | (no stderr)                   | 1    |
```

You **can**: Look up any error by name and know its trigger, message, and exit code.
You **cannot yet**: Test these errors automatically — that is Day 5.

## Why This Matters

🔴 **Without an error catalog, you will:**
- Write inconsistent error messages ("invalid" in one place, "bad" in another)
- Forget error names and re-invent them during debugging
- Confuse NO_RESULTS (exit 1) with real errors (exit 2) — breaking scripted usage
- Spend time in Week 3 hunting down "what was that error called again?"

🟢 **With an error catalog, you will:**
- Have one source of truth: look up any error by name → get its exact behavior
- Write consistent, professional error messages across the entire codebase
- Debug by name: "Got ERR_EMPTY_MSG → check append input validation"
- Reuse this pattern for every project in the curriculum

🔗 **How this connects:**
- **To Day 3:** Every row in the validation matrix now has a stable name and category
- **To Day 5:** Test cases reference error names: "Test T6 → expects ERR_MISSING_ARG"
- **To Week 2:** TCP protocol errors will follow this same catalog pattern
- **To Week 7:** Hash integrity errors (ERR_HASH_MISMATCH, ERR_CORRUPT_DATA) use this exact structure
- **To Week 12:** Leader election failure modes (ERR_SPLIT_BRAIN, ERR_TIMEOUT) are just another error catalog

🧠 **Mental model you are building: "Name Every Failure"**

Unnamed errors are invisible. Named errors are debuggable, testable, and documentable.
When you name an error, you turn chaos into a category you can reason about.

By Week 12, when leader election fails, you will not say "something went wrong."
You will say "ERR_ELECTION_TIMEOUT: follower did not receive heartbeat within 500ms."
This precision starts TODAY.

## Visual Model

```
┌──────────────────────────────────────────────────────┐
│               ERROR CATALOG STRUCTURE                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Error Name         Trigger              Exit Code   │
│  ──────────         ───────              ─────────   │
│                                                      │
│  COMMAND ERRORS (bad input from user):               │
│  ├─ ERR_UNKNOWN_CMD    command not in list      2    │
│  ├─ ERR_UNKNOWN_FLAG   flag not recognized      2    │
│  └─ ERR_MISSING_ARG    required arg absent      2    │
│                                                      │
│  VALIDATION ERRORS (input fails rules):              │
│  ├─ ERR_EMPTY_MSG      message is ""            2    │
│  ├─ ERR_EMPTY_TERM     search term is ""        2    │
│  ├─ ERR_BAD_COUNT      count not positive int   2    │
│  └─ ERR_MSG_TOO_LONG   message > 4096 chars     2    │
│                                                      │
│  IO ERRORS (system/file failures):                   │
│  ├─ ERR_FILE_NOT_FOUND log file missing (read)  2    │
│  ├─ ERR_PERMISSION     cannot write to file     2    │
│  └─ ERR_DISK_FULL      write failed             2    │
│                                                      │
│  SPECIAL (not errors):                               │
│  └─ NO_RESULTS         search matched nothing   1    │
│                                                      │
│  ⚠️ Rule: exit 2 = error. exit 1 = "ok, no data."   │
│  ⚠️ Rule: stderr = errors. stdout = data. Never mix. │
└──────────────────────────────────────────────────────┘
```

## Build

File: `week-1/day4-error-catalog.md`

## Do

1. **Create the error catalog table** — every error gets a stable name, trigger, message, and code:
   > 💡 *WHY: Named errors are debuggable. "ERR_EMPTY_MSG" tells you exactly what failed. By Week 12, your leader election module will have ERR_SPLIT_BRAIN — same pattern, bigger system.*

   | Error Name | Trigger Condition | stderr Message | Exit |
   |-----------|-------------------|---------------|------|
   | ERR_UNKNOWN_CMD | Command not in [append, read, search] | "Error: unknown command '{cmd}'" | 2 |
   | ERR_UNKNOWN_FLAG | Flag not in [--timestamp, --reverse, --count] | "Error: unknown flag '{flag}'" | 2 |
   | ERR_MISSING_ARG | Required argument not provided | "Error: {arg} argument required" | 2 |
   | ERR_EMPTY_MSG | append message is empty string | "Error: message cannot be empty" | 2 |
   | ERR_EMPTY_TERM | search term is empty string | "Error: search term cannot be empty" | 2 |
   | ERR_BAD_COUNT | read count is not a positive integer | "Error: count must be a positive integer" | 2 |
   | ERR_MSG_TOO_LONG | append message exceeds 4096 chars | "Error: message exceeds 4096 character limit" | 2 |
   | ERR_FILE_NOT_FOUND | read/search but log file missing | "Error: log file not found" | 2 |
   | ERR_PERMISSION | Cannot open file for writing | "Error: permission denied for '{path}'" | 2 |
   | ERR_DISK_FULL | Write operation failed | "Error: failed to write to log file" | 2 |
   | NO_RESULTS | search found zero matches | (no stderr — this is not an error) | 1 |

2. **Write 5 example calls** — show the exact command, stderr output, and exit code:
   ```bash
   # Example 1: Unknown command
   $ ./logger delete
   # stderr: Error: unknown command 'delete'
   # exit: 2

   # Example 2: Missing message
   $ ./logger append
   # stderr: Error: message argument required
   # exit: 2

   # Example 3: Bad count
   $ ./logger read -5
   # stderr: Error: count must be a positive integer
   # exit: 2

   # Example 4: Empty search term
   $ ./logger search ""
   # stderr: Error: search term cannot be empty
   # exit: 2

   # Example 5: File not found on read
   $ ./logger read       # (no log file exists yet)
   # stderr: Error: log file not found
   # exit: 2
   ```

3. **Document the NO_RESULTS special case** — explain why it is exit 1 and not exit 2:
   > 💡 *WHY: You document this AGAIN because it's that important. Scripts will branch on exit code: 0=data, 1=empty, 2=broken. Getting this wrong breaks automation.*
   ```markdown
   ## Special Case: NO_RESULTS

   When `search` runs successfully but finds zero matching lines:
   - stdout: (empty)
   - stderr: (empty — no error occurred)
   - exit code: 1

   Why exit 1 and not exit 2?
   The search WORKED — it just found nothing. Exit 1 means "ran fine, no data."
   Exit 2 means "something was WRONG with your input."
   Scripts can distinguish: `if ($? == 0)` → got data, `if ($? == 1)` → no data,
   `if ($? == 2)` → error, check stderr.
   ```

4. **Restate the output separation rule** — write it once more for reinforcement:
   ```markdown
   ## Output Rule (stated every day until it is automatic)

   | Stream | Contains | Example |
   |--------|----------|---------|
   | stdout | Data and results ONLY | log lines, search matches |
   | stderr | Error messages ONLY | "Error: message cannot be empty" |
   | exit 0 | Success | Command completed normally |
   | exit 1 | No results | Search found nothing |
   | exit 2 | Error | Bad input, file problem, system error |
   ```

5. **Cross-reference check** — verify this catalog matches Day 1 (test cases) and Day 3 (validation matrix):
   ```markdown
   ## Cross-Reference
   - Day 1 test #6 → ERR_MISSING_ARG ✓
   - Day 1 test #10 → ERR_EMPTY_MSG ✓
   - Day 3 case #9 → NO_RESULTS, exit 1 ✓
   [... verify all entries match]
   ```

## Done when

- [ ] Error catalog with ≥ 8 named errors + NO_RESULTS — *every failure now has a name you can grep for*
- [ ] Every error has: name, trigger, stderr message, exit code — *four columns = complete debuggability*
- [ ] All real errors use exit 2 consistently — *inconsistent codes break scripts*
- [ ] NO_RESULTS is exit 1 with no stderr (documented why) — *the distinction that separates pros from beginners*
- [ ] 5 example calls with exact stderr text — *Day 5 tests will verify these exact messages*
- [ ] Cross-reference with Day 1 + Day 3 — no contradictions — *contradictions are hidden bugs*

## Proof

Paste your error catalog table and the NO_RESULTS explanation, or upload `week-1/day4-error-catalog.md`.

**Quick self-test:**
> 💡 *WHY these questions: Error names should be instant recall. In production, you debug by name — "got ERR_EMPTY_MSG, check input validation." If you hesitate, review the catalog.*

1. What is the error name for an empty append message? → **ERR_EMPTY_MSG**
2. Does NO_RESULTS write to stderr? → **No** — stderr is empty for no-results
3. If a user passes `--verbose` as a flag, what happens? → **ERR_UNKNOWN_FLAG, stderr, exit 2**
