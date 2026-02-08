---
id: w01-cli-logger-discipline-d02-quest-logger-write-path-2h
part: w01-cli-logger-discipline
title: "Quest: Logger Write Path  2h"
order: 2
duration_minutes: 120
prereqs: ["w01-cli-logger-discipline-d01-quest-define-your-cli-contract-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Logger Write Path  2h

## Goal

Describe the **complete write path** — every step from the moment the user types `./logger append "msg"` to the moment bytes hit disk — so anyone can follow the data flow and implement it.

By end of this session you will have:

- ✅ A **6-step write path** describing input → parse → validate → format → write → confirm
- ✅ The **exact log line format** with field order and delimiter
- ✅ **Append rules**: when to write, when to reject, how to handle the file
- ✅ **3 valid examples** and **3 error cases** with exact output
- ✅ **stdout/stderr/exit code** contract applied to every case

**PASS CRITERIA:**

| # | Criterion | Check |
|---|-----------|-------|
| 1 | Write path has 4-6 numbered steps | Count steps |
| 2 | Log line format specifies field order | Look for format spec |
| 3 | Append rules cover: empty msg, file missing, file permissions | 3 rules present |
| 4 | 3 success examples with exact log line output | Count examples |
| 5 | 3 error examples with stderr + exit code | Count error examples |

## What You're Building Today

A step-by-step trace of the **write path** — every operation from user input to bytes on disk — so anyone reading it can implement or debug the append command.

By end of this session, you will have:
- ✅ File: `week-1/day2-logger-write-path.md` (write path document)
- ✅ 6-step write path: parse → validate → format → open → write → confirm
- ✅ The exact log line format: `<ISO-8601 timestamp> <message>\n`
- ✅ 3 success examples and 3 error examples with exact output

What "done" looks like:
```
Step 1: PARSE — extract command and message from argv
Step 2: VALIDATE — reject empty message → stderr, exit 2
Step 3: FORMAT — build line: "2024-01-15T10:30:00 Server started"
Step 4: OPEN — append mode, create if missing
Step 5: WRITE — formatted line + newline
Step 6: CONFIRM — exit 0, no stdout
```

You **can**: Trace any append call from input to disk in your head.
You **cannot yet**: Handle read or search — those come in Day 3-4.

## Why This Matters

🔴 **Without a write path, you will:**
- Code the append command by guessing the order of operations
- Forget to handle file creation (crash when log file doesn't exist)
- Mix up when to validate vs. when to write (bugs in error handling)
- Spend 45 min debugging "why is my file empty?" on Day 3

🟢 **With a write path, you will:**
- Implement append in order, step by step, with no guessing
- Know exactly where each error check goes (Step 2, not Step 5)
- Debug any problem by asking "which step failed?"
- Reuse this exact pattern for read and search paths

🔗 **How this connects:**
- **To Day 1:** The exit codes and commands you specified are now traced through actual operations
- **To Day 3:** Validation boundaries map directly to Step 2 of this path
- **To Day 4:** Error catalog entries correspond to failures at each step
- **To Week 10:** WAL (Write-Ahead Log) crash recovery uses the SAME write-path pattern — parse → validate → format → write → confirm — but for database entries
- **To Week 11:** Replication write path follows this identical structure across nodes

🧠 **Mental model you are building: "Data Flow Tracing"**

When something breaks, you do not stare at code hoping to spot the bug.
You trace: "Input entered at step 1. Was it valid at step 2? Was it formatted correctly at step 3? Did the file open at step 4?"

By Week 10, when a replicated write fails, you will automatically think:
"Which step in the write path failed? Parse? Validate? Network? Disk?"
This systematic debugging starts TODAY.

## Visual Model

```
┌──────────────────────────────────────────────────────┐
│              WRITE PATH: append command               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Step 1: PARSE                                       │
│  $ ./logger append "Server started"                  │
│       │                                              │
│       ▼                                              │
│  Step 2: VALIDATE                                    │
│  ┌──────────────────────────┐                        │
│  │ message != empty?    YES ──▶ continue             │
│  │ message != empty?    NO  ──▶ stderr + exit 2      │
│  └──────────────────────────┘                        │
│       │                                              │
│       ▼                                              │
│  Step 3: FORMAT the log line                         │
│  ┌──────────────────────────────────────┐            │
│  │ [ISO-8601 timestamp] [message text]  │            │
│  │ 2024-01-15T10:30:00 Server started   │            │
│  └──────────────────────────────────────┘            │
│       │                                              │
│       ▼                                              │
│  Step 4: OPEN file (append mode)                     │
│  ┌──────────────────────────┐                        │
│  │ File exists?  YES ──▶ open for append             │
│  │ File exists?  NO  ──▶ create new file             │
│  │ Permission?   NO  ──▶ stderr + exit 2             │
│  └──────────────────────────┘                        │
│       │                                              │
│       ▼                                              │
│  Step 5: WRITE line + newline                        │
│  ┌──────────────────────────┐                        │
│  │ write(formatted_line)     │                        │
│  │ write("\n")               │                        │
│  └──────────────────────────┘                        │
│       │                                              │
│       ▼                                              │
│  Step 6: CONFIRM (silent exit 0)                     │
│  stdout: (nothing)                                   │
│  stderr: (nothing)                                   │
│  exit:   0                                           │
│                                                      │
└──────────────────────────────────────────────────────┘

LOG LINE FORMAT:
┌─────────────────────┬───┬─────────────────────┐
│  ISO-8601 timestamp │ ␣ │  message text        │
│  (20 chars fixed)   │   │  (variable length)   │
└─────────────────────┴───┴─────────────────────┘
Example: 2024-01-15T10:30:00 Server started on port 8080
```

## Build

File: `week-1/day2-logger-write-path.md`

## Do

1. **Document the write path** — write 4-6 numbered steps that trace data from CLI input to disk. Each step should name the operation and what can go wrong:
   > 💡 *WHY: This trace is how you debug. In Week 10, WAL crash recovery uses this same pattern — if you can trace a write path, you can find where a crash interrupted it.*
   ```markdown
   ## Write Path

   1. **Parse** — extract command ("append") and message from argv
   2. **Validate** — reject if message is empty → stderr, exit 2
   3. **Format** — build log line: `{ISO-8601 timestamp} {message}`
   4. **Open** — open log file in append mode; create if missing
   5. **Write** — write formatted line + newline to file
   6. **Confirm** — exit 0, no stdout (silence = success)
   ```

2. **Define the log line format** — specify the exact format with field order, delimiter, and example:
   > 💡 *WHY: Ambiguous formats cause parsing bugs. In Week 2, TCP frame formats use the same precision — every byte position matters.*
   ```markdown
   ## Log Line Format

   Format: `<ISO-8601-timestamp><space><message-text><newline>`
   Fields: timestamp (20 chars, e.g. 2024-01-15T10:30:00) + space + message
   Delimiter: single space character
   Terminator: newline (\n)

   Example: `2024-01-15T10:30:00 Connection accepted from 10.0.0.5`
   ```

3. **Write append rules** — when to write and when to reject:
   > 💡 *WHY: Explicit rules prevent "should this case write?" debates during implementation. Day 3 validation boundaries expand on these rules.*
   ```markdown
   ## Append Rules

   WRITE when:
   - Message is non-empty string
   - Log file is writable (or can be created)

   REJECT when (stderr + exit 2):
   - Message is empty or whitespace-only
   - Log file path is not writable (permission denied)
   - Disk is full (write fails)

   ALWAYS:
   - Create the log file if it does not exist
   - Append, never overwrite existing content
   - One log line = one newline-terminated entry
   ```

4. **Write 3 success examples** — show exact input, the log line written, and exit code:
   ```bash
   # Example 1: Normal append
   $ ./logger append "Server started on port 8080"
   # Written to log: 2024-01-15T10:30:00 Server started on port 8080
   # stdout: (none)  exit: 0

   # Example 2: First entry (file created)
   $ ./logger append "System initialized"
   # File created: logger.log
   # Written: 2024-01-15T10:30:01 System initialized
   # stdout: (none)  exit: 0

   # Example 3: Append with special characters
   $ ./logger append "GET /api/users?id=42 200 OK"
   # Written: 2024-01-15T10:30:02 GET /api/users?id=42 200 OK
   # stdout: (none)  exit: 0
   ```

5. **Write 3 error examples** — show the exact stderr message and exit code:
   ```bash
   # Error 1: Empty message
   $ ./logger append ""
   # stderr: Error: message cannot be empty
   # exit: 2

   # Error 2: No message argument
   $ ./logger append
   # stderr: Error: message argument required
   # exit: 2

   # Error 3: Permission denied
   $ ./logger append "test" --file /root/secret.log
   # stderr: Error: cannot write to /root/secret.log: permission denied
   # exit: 2
   ```

## Done when

- [ ] Write path documented with 4-6 numbered steps — *your Day 3 validation plugs directly into step 2*
- [ ] Log line format specified (timestamp + space + message + newline) — *ambiguity here causes parsing bugs on Day 5*
- [ ] Append rules: write conditions and reject conditions listed — *becomes your implementation guard clauses*
- [ ] 3 success examples with exact log line output — *these become test assertions*
- [ ] 3 error examples with stderr text and exit code — *Day 4 error catalog references these*
- [ ] stdout/stderr/exit code consistent with Day 1 contract — *if these don't match, fix the contract first*

## Proof

Paste your write path steps and the 6 examples, or upload `week-1/day2-logger-write-path.md`.

**Quick self-test:**
> 💡 *WHY these questions: If you can trace the full write path from memory, you can debug any append failure by asking "which step broke?"*

1. What is the log line format? → **ISO-8601 timestamp + space + message + newline**
2. What happens if the log file does not exist? → **Create it, then append**
3. Does a successful append print anything to stdout? → **No — silence means success**
