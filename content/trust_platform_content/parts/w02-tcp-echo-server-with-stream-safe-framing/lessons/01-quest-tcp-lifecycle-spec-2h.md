---
id: w02-tcp-echo-server-with-stream-safe-framing-d01-quest-tcp-lifecycle-spec-2h
part: w02-tcp-echo-server-with-stream-safe-framing
title: "Quest: TCP Lifecycle Spec  2h"
order: 1
duration_minutes: 20
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [1,3,7,14]
---

+--------------------------------------------------------------+
| DAY 8: TCP LIFECYCLE SPEC (SINGLE CLIENT)                    |
+--------------------------------------------------------------+

## Visual Model

![Visual Model](/visuals/w02-tcp-echo-server-with-stream-safe-framing.svg)

## Goal
Write a clear TCP server lifecycle spec for one client.

## WHAT YOU'RE BUILDING TODAY

A written protocol and lifecycle spec for a single client TCP echo server.

By end of this session, you will have:
- File: `week-2/day1-tcp-lifecycle-spec.md`
- File: `week-2/echo-server.cpp` (skeleton with TODOs)
- 6 lifecycle steps documented (socket, bind, listen, accept, read/write, close)
- 8 error scenarios listed with exit codes
- 6 test cases listed for startup/shutdown

What "done" looks like:

```markdown
## Server Lifecycle
1) socket() -> create TCP socket
2) bind() -> claim port 8080
3) listen() -> start listening
4) accept() -> wait for a client
5) read()/write() -> echo bytes
6) close() -> cleanup

Exit codes:
- 0 success
- 1 no-results for search
- 2 error
```

You can:
- Explain the server steps in order.
- List exact errors and exit codes.

You cannot yet:
- Run a working server (Day 9 and Day 10).

## WHY THIS MATTERS

Without this, you will:
- Change behavior every time you debug.
- Miss error cases (like port in use) and crash later.
- Waste time writing tests with no target behavior.

With this, you will:
- Know exactly what "correct" means.
- Write tests on Day 10 that match the spec.
- Reuse the same spec pattern in Week 3 and Week 4.

How this connects:
- Day 9: You implement socket/bind/listen from this spec.
- Day 10: You implement accept and echo loop from this spec.
- Week 3: Multi-client server extends this same lifecycle.

Mental model:
"TCP server lifecycle" = a fixed 6-step flow.
You should always know where you are in the flow.

By Week 11 (replication), you will still use this same flow for network code.
This habit starts today.

## WARMUP (8 min)

Step 1 (3 min): Review Day 1 contract format
- Do: Open `week-1/day1-cli-contract.md` and scan the table format.
- Why: You will use the same clear structure here.

Step 2 (3 min): Quick TCP refresh
- Do: Write the 6 steps in your own words.
- Why: You need the order before writing the spec.

Step 3 (2 min): Mental model
- Think: "A TCP server is like a front desk."
- Answer: socket=building, bind=address, listen=open, accept=greet.
- Why: This helps you remember the steps.

Warmup complete when:
- You can list the 6 steps without looking.
- You can state exit codes 0,1,2 and their meaning.
- You remember stdout vs stderr.

## WORK (80 min total)

### SET 1 (30 min): Lifecycle spec

Build: `week-2/day1-tcp-lifecycle-spec.md`

Do:
1. Write a section called "Server Lifecycle".
2. List the 6 steps in order.
3. For each step, add errors and exit code 2.

Done when:
- Each step has at least one error case.

Proof:
- Paste the lifecycle section.

Template:
```markdown
## Step N: [name]
What it does:
Errors:
- [error] -> stderr message -> exit 2
```

Common mistake:
- Forgetting to say what goes to stderr.

### SET 2 (25 min): Error table

Build: `week-2/day1-tcp-lifecycle-spec.md`

Do:
1. Add an "Error Table" with 8 rows.
2. Include port in use (EADDRINUSE).
3. Include client disconnect (read returns 0).

Done when:
- Table has 8 rows and exit codes.

Proof:
- Paste the table.

Template:
```markdown
| Error | Detect | stderr | Exit code |
|-------|--------|--------|-----------|
| Port in use | bind() -> EADDRINUSE | "port busy" | 2 |
```

### SET 3 (25 min): Skeleton code

Build: `week-2/echo-server.cpp`

Do:
1. Create a main() with TODO for each step.
2. Include constants for exit codes (0,1,2).
3. Add comments for stdout/stderr rules.

Done when:
- File has 6 TODO blocks.

Proof:
- Paste the file header and TODO list.

## PROVE (20 min)

Checklist:
- Spec file exists with 6 steps.
- Error table has 8 rows.
- Skeleton has 6 TODO blocks.

Self-test:
1) What exit code for port in use? Answer: 2.
2) What does read() return on clean disconnect? Answer: 0.
3) What is stdout for? Answer: main output.

Commands:
- `grep -c "Step" week-2/day1-tcp-lifecycle-spec.md`
  Expected: 6
- `grep -c "TODO" week-2/echo-server.cpp`
  Expected: 6

## SHIP (5 min)

Artifacts:
- `week-2/day1-tcp-lifecycle-spec.md` (spec)
- `week-2/echo-server.cpp` (code skeleton)

Git:
```bash
git add week-2/day1-tcp-lifecycle-spec.md week-2/echo-server.cpp
git commit -m "Day 8: TCP lifecycle spec and skeleton"
```

Quality check:
- Errors are in stderr.
- Exit codes use 0/1/2 only.
- Steps are numbered and clear.
