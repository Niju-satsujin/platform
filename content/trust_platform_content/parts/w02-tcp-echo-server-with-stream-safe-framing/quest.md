---
id: w02-tcp-echo-server-with-stream-safe-framing-quest
part: w02-tcp-echo-server-with-stream-safe-framing
title: "BOSS FIGHT: Echo Server Demo  4h"
order: 6
duration_minutes: 240
prereqs: ["w02-tcp-echo-server-with-stream-safe-framing-d05-quest-client-retry-rules-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
---

+--------------------------------------------------------------+
| DAY 13: BOSS FIGHT - ECHO SERVER DEMO                        |
+--------------------------------------------------------------+

## Visual Model

![Visual Model](/visuals/w02-tcp-echo-server-with-stream-safe-framing.svg)

## Goal
Ship a working single-client TCP echo demo with proof logs.

## WHAT YOU'RE BUILDING TODAY

A runnable echo server demo and a short baseline report.

By end of this session, you will have:
- File: `week-2/day6-echo-demo.md`
- File: `week-2/day6-baseline-report.md`
- 1 working demo run log
- 1 forced failure log (port in use)
- 1 timing or count baseline

What "done" looks like:

```markdown
Demo log:
- Server started on 8080
- Client sent "hello"
- Server echoed "hello"
```

You can:
- Start the server and echo one message.
- Show logs for success and failure.

You cannot yet:
- Handle multiple clients (Week 3).

## WHY THIS MATTERS

Without a demo, specs are only words.
You need proof that the rules work in real runs.

With this demo, you can trust your Week 2 work.
It is the base for multi-client in Week 3.

How this connects:
- Day 8 to Day 12 define the rules you must follow.
- Week 3 will reuse your echo loop and error handling.
- Week 4 HTTP client uses the same read/write logic.

Mental model:
"Proof over claims" = show logs, not just statements.

## WARMUP (8 min)

Step 1 (3 min): Review your spec
- Do: Read `week-2/day1-tcp-lifecycle-spec.md`.
- Why: The demo must match the spec.

Step 2 (3 min): Review timeout and retry rules
- Do: Scan Day 11 and Day 12 docs.
- Why: Demo must respect them.

Step 3 (2 min): Mental model
- Think: "A demo is a tiny production run."
- Answer: It must be clean and repeatable.
- Why: Repeatable runs prove quality.

## WORK (180 min total)

### SET 1 (60 min): Run a clean demo

Build: `week-2/day6-echo-demo.md`

Do:
1. Start server on port 8080.
2. Connect one client and send one message.
3. Capture stdout and stderr output.

Done when:
- Demo log shows server start and echo.

Proof:
- Paste the demo log.

### SET 2 (60 min): Force a failure

Build: `week-2/day6-echo-demo.md`

Do:
1. Start a server on port 8080.
2. Try to start a second server on the same port.
3. Capture stderr and exit code 2.

Done when:
- Failure log shows port in use and exit code 2.

Proof:
- Paste the failure log.

### SET 3 (60 min): Baseline report

Build: `week-2/day6-baseline-report.md`

Do:
1. Run 5 echo requests.
2. Record total time or per-request time.
3. Save the numbers in a small table.

Done when:
- Baseline table exists with 5 rows.

Proof:
- Paste the baseline table.

## PROVE (20 min)

Checklist:
- Demo log exists.
- Failure log exists.
- Baseline table exists.

Self-test:
1) What exit code for port in use? Answer: 2.
2) Where do errors go? Answer: stderr.
3) What is stdout for? Answer: main output.

Commands:
- `grep -c "Server" week-2/day6-echo-demo.md`
  Expected: at least 2

## SHIP (5 min)

Artifacts:
- `week-2/day6-echo-demo.md`
- `week-2/day6-baseline-report.md`

Git:
```bash
git add week-2/day6-echo-demo.md week-2/day6-baseline-report.md
git commit -m "Day 13: echo server demo and baseline"
```

Quality check:
- Logs show stdout vs stderr clearly.
- Exit codes are 0/1/2 only.
- Baseline table has 5 rows.
