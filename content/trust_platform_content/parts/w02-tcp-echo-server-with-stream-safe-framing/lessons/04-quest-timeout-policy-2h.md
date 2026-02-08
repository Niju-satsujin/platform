---
id: w02-tcp-echo-server-with-stream-safe-framing-d04-quest-timeout-policy-2h
part: w02-tcp-echo-server-with-stream-safe-framing
title: "Quest: Timeout Policy  2h"
order: 4
duration_minutes: 20
prereqs: ["w02-tcp-echo-server-with-stream-safe-framing-d03-quest-frame-parser-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [1,3,7,14]
---

+--------------------------------------------------------------+
| DAY 11: TIMEOUT POLICY                                       |
+--------------------------------------------------------------+

## Visual Model

![Visual Model](/visuals/w02-tcp-echo-server-with-stream-safe-framing.svg)

## Goal
Define clear timeout rules for connect, read, and write.

## WHAT YOU'RE BUILDING TODAY

A timeout policy that stops stuck sockets safely.

By end of this session, you will have:
- File: `week-2/day4-timeout-policy.md`
- 3 timeout values (connect, read, write)
- 6 rules for what to do on timeout
- 6 tests for timeout behavior

What "done" looks like:

```markdown
Read timeout: 5s
If read times out -> log to stderr, close socket, exit 2
```

You can:
- Explain what to do on timeout.
- Set stable timeout values.

You cannot yet:
- Handle retries (Day 12).

## WHY THIS MATTERS

Without timeouts, your server can hang forever.
That blocks tests and wastes time.

With timeouts, your server fails fast and predictable.
This is required for Week 6 overload control.

How this connects:
- Day 10 parser uses read timeouts to avoid dead waits.
- Day 12 retry rules depend on timeout outcomes.
- Week 6 uses timeouts for overload handling.

Mental model:
"Timeout" = stop waiting, take a clear action.

## WARMUP (7 min)

Step 1 (2 min): Review frame size limit
- Do: Read your max size rule from Day 10.
- Why: Timeouts protect the parser too.

Step 2 (3 min): Pick values
- Do: Write 3 numbers: connect=2s, read=5s, write=5s.
- Why: You need fixed numbers for tests.

Step 3 (2 min): Mental model
- Think: "Timeout is a guardrail."
- Answer: It stops infinite waiting.
- Why: It keeps systems responsive.

## WORK (80 min total)

### SET 1 (25 min): Timeout values

Build: `week-2/day4-timeout-policy.md`

Do:
1. Define connect timeout.
2. Define read timeout.
3. Define write timeout.

Done when:
- Three values are listed with units.

Proof:
- Paste the values section.

### SET 2 (25 min): Actions on timeout

Build: `week-2/day4-timeout-policy.md`

Do:
1. Write 6 rules for timeout handling.
2. Include: log to stderr, close socket, exit 2.
3. State any retry is not done yet.

Done when:
- 6 rules are written.

Proof:
- Paste the rules.

### SET 3 (30 min): Timeout tests

Build: `week-2/day4-timeout-policy.md`

Do:
1. Create 6 test cases (2 per timeout type).
2. For each: trigger, expected stderr, exit code.
3. Mark timeout tests as exit 2.

Done when:
- Test table has 6 rows.

Proof:
- Paste the test table.

## PROVE (20 min)

Checklist:
- 3 timeout values exist.
- 6 rules exist.
- 6 tests exist.

Self-test:
1) What exit code on timeout? Answer: 2.
2) Where do timeout errors go? Answer: stderr.
3) Why do we need timeouts? Answer: avoid hangs.

Commands:
- `grep -c "timeout" week-2/day4-timeout-policy.md`
  Expected: at least 6

## SHIP (5 min)

Artifacts:
- `week-2/day4-timeout-policy.md`

Git:
```bash
git add week-2/day4-timeout-policy.md
git commit -m "Day 11: timeout policy and tests"
```

Quality check:
- All timeouts have numbers and units.
- Exit codes are 0/1/2 only.
- Errors are in stderr.
