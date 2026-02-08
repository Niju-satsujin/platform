---
id: w02-tcp-echo-server-with-stream-safe-framing-d02-quest-partial-io-mastery-2h
part: w02-tcp-echo-server-with-stream-safe-framing
title: "Quest: Partial I/O Mastery  2h"
order: 2
duration_minutes: 20
prereqs: ["w02-tcp-echo-server-with-stream-safe-framing-d01-quest-tcp-lifecycle-spec-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [1,3,7,14]
---

+--------------------------------------------------------------+
| DAY 9: PARTIAL I/O RULES                                     |
+--------------------------------------------------------------+

## Visual Model

![Visual Model](/visuals/w02-tcp-echo-server-with-stream-safe-framing.svg)

## Goal
Write exact rules for partial reads and partial writes.

## WHAT YOU'RE BUILDING TODAY

A clear rule set for how the server handles partial I/O on TCP.

By end of this session, you will have:
- File: `week-2/day2-partial-io-rules.md`
- 6 rules for read() and write() behavior
- 4 edge cases with expected outcomes
- 6 test cases for partial I/O

What "done" looks like:

```markdown
Rule: read() may return fewer bytes than requested.
Action: loop until full frame length is received or socket closes.
```

You can:
- Explain why TCP is a byte stream (not messages).
- Describe loop logic for reads and writes.

You cannot yet:
- Implement framing (Day 10).

## WHY THIS MATTERS

Without this, you will:
- Lose data when reads are short.
- Mis-handle writes and send broken responses.
- Debug random truncation bugs for hours.

With this, you will:
- Build correct loops that work under load.
- Pass Day 10 framing tests.
- Reuse the same logic in Week 3 multi-client.

How this connects:
- Day 8: Uses the lifecycle spec.
- Day 10: Framing depends on these rules.
- Week 4: HTTP parsing also needs partial I/O logic.

Mental model:
"TCP is a stream" = bytes arrive in chunks of any size.
You must loop until you have what you need.

## WARMUP (7 min)

Step 1 (2 min): Review Day 8 error table
- Do: Read the error table and find read() and write() cases.
- Why: Today you define their exact behavior.

Step 2 (3 min): Read a short note on short reads
- Do: Write this line: "read() can return < requested bytes".
- Why: This is the core rule.

Step 3 (2 min): Mental model
- Think: "TCP is like a hose, not a bucket."
- Answer: Data flows in parts, not fixed messages.
- Why: It stops you from assuming full reads.

## WORK (80 min total)

### SET 1 (25 min): Read rules

Build: `week-2/day2-partial-io-rules.md`

Do:
1. Write 3 rules for read() behavior.
2. Include: short read, zero (EOF), and EINTR.
3. State stdout/stderr and exit codes (0/1/2).

Done when:
- Read rules section has 3 rules.

Proof:
- Paste the read rules.

Template:
```markdown
Rule: read() may return 0 (EOF).
Action: close socket and stop reading.
```

### SET 2 (25 min): Write rules

Build: `week-2/day2-partial-io-rules.md`

Do:
1. Write 3 rules for write() behavior.
2. Include: short write, EPIPE, and EINTR.
3. Add exact action for each rule.

Done when:
- Write rules section has 3 rules.

Proof:
- Paste the write rules.

### SET 3 (30 min): Test cases

Build: `week-2/day2-partial-io-rules.md`

Do:
1. Create 6 test cases (3 read, 3 write).
2. For each: input size, bytes returned, action.
3. Add exit code if it is an error.

Done when:
- Test table has 6 rows.

Proof:
- Paste the test table.

## PROVE (20 min)

Checklist:
- 3 read rules exist.
- 3 write rules exist.
- 6 test cases exist.

Self-test:
1) If read() returns 0, what do you do? Answer: close socket.
2) If write() returns EPIPE, what code? Answer: stderr + exit 2.
3) Is TCP a message protocol? Answer: no.

Commands:
- `grep -c "Rule:" week-2/day2-partial-io-rules.md`
  Expected: 6
- `grep -c "|" week-2/day2-partial-io-rules.md`
  Expected: at least 7 (header + 6 rows)

## SHIP (5 min)

Artifacts:
- `week-2/day2-partial-io-rules.md` (rules + tests)

Git:
```bash
git add week-2/day2-partial-io-rules.md
git commit -m "Day 9: partial I/O rules and tests"
```

Quality check:
- Every rule states action + exit code.
- stderr is used for errors.
- No vague words like "handle" without a step.
