---
id: w02-tcp-echo-server-with-stream-safe-framing-d05-quest-client-retry-rules-2h
part: w02-tcp-echo-server-with-stream-safe-framing
title: "Quest: Client Retry Rules  2h"
order: 5
duration_minutes: 20
prereqs: ["w02-tcp-echo-server-with-stream-safe-framing-d04-quest-timeout-policy-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [1,3,7,14]
---

+--------------------------------------------------------------+
| DAY 12: CLIENT RETRY RULES                                   |
+--------------------------------------------------------------+

## Visual Model

![Visual Model](/visuals/w02-tcp-echo-server-with-stream-safe-framing.svg)

## Goal
Define when a client should retry and when it must stop.

## WHAT YOU'RE BUILDING TODAY

A retry policy for a TCP client talking to your echo server.

By end of this session, you will have:
- File: `week-2/day5-client-retry-rules.md`
- 5 retry rules (when to retry or stop)
- 4 backoff settings
- 6 test cases for retry behavior

What "done" looks like:

```markdown
Rule: Timeout on connect -> retry up to 3 times.
Backoff: 200ms, 400ms, 800ms.
```

You can:
- Explain retry logic and limits.
- Define stable exit codes.

You cannot yet:
- Run full load tests (Week 6).

## WHY THIS MATTERS

Without retry rules, clients will spam or give up too early.
That causes flaky demos and false failures.

With retry rules, tests are stable and behavior is predictable.
This is reused in Week 3 and Week 11 replication.

How this connects:
- Day 11 timeouts decide when retries happen.
- Week 3 multi-client relies on clean retry behavior.
- Week 11 replication uses retry for log shipping.

Mental model:
"Retry policy" = clear limits + backoff to avoid storms.

## WARMUP (7 min)

Step 1 (2 min): Review timeout values
- Do: Read your Day 11 timeouts.
- Why: Retries depend on timeouts.

Step 2 (3 min): Pick retry limits
- Do: Write max retries = 3, backoff = 200/400/800ms.
- Why: Fixed numbers make tests easy.

Step 3 (2 min): Mental model
- Think: "Retry is a polite knock, not a hammer."
- Answer: Space retries out and stop.
- Why: It avoids overload.

## WORK (80 min total)

### SET 1 (25 min): Retry rules

Build: `week-2/day5-client-retry-rules.md`

Do:
1. Write 5 rules (timeout, connection reset, refusal, success, fatal error).
2. For each rule: retry or stop.
3. Add exit code (0,1,2).

Done when:
- 5 rules listed with actions.

Proof:
- Paste the rules section.

### SET 2 (25 min): Backoff table

Build: `week-2/day5-client-retry-rules.md`

Do:
1. Create a table of retry attempt -> wait time.
2. Include max attempts = 3.
3. Include total max wait time.

Done when:
- Table has 3 rows.

Proof:
- Paste the table.

### SET 3 (30 min): Retry tests

Build: `week-2/day5-client-retry-rules.md`

Do:
1. Write 6 test cases.
2. Include 2 timeout cases and 2 refusal cases.
3. List expected stdout/stderr and exit code.

Done when:
- Test table has 6 rows.

Proof:
- Paste the test table.

## PROVE (20 min)

Checklist:
- 5 rules exist.
- Backoff table exists.
- 6 tests exist.

Self-test:
1) What exit code for fatal error? Answer: 2.
2) What exit code for no-results search? Answer: 1.
3) Where do errors go? Answer: stderr.

Commands:
- `grep -c "Rule" week-2/day5-client-retry-rules.md`
  Expected: at least 5

## SHIP (5 min)

Artifacts:
- `week-2/day5-client-retry-rules.md`

Git:
```bash
git add week-2/day5-client-retry-rules.md
git commit -m "Day 12: client retry policy"
```

Quality check:
- Backoff values are numeric.
- Max retries is explicit.
- Exit codes are stable.
