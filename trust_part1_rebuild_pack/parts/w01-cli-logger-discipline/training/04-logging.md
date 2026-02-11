---
id: w01-t04
title: "Training: Structured Logging + request_id"
order: 4
duration: 120
kind: training
part: w01
---
# Training 4: Structured Logging + request_id

## Goal
Emit structured logs for every run and include request_id for correlation.

## Warmup (5–10 min)
- Why treat logs as an event stream?
- What debugging problem does request_id solve?

## Work (main)
### Step 1
**Do this:** Pick log format (key=value or JSON) and document required fields in CLI contract.

**How to test it:**
- Run: `grep -n "request_id" docs/cli-contract.md | head`

**Expected result:**
- Docs mention request_id and required log fields.

### Step 2
**Do this:** Add `--request-id <id>` that forces the request_id used in logs.

**How to test it:**
- Run: `trustctl config show --request-id abc123 2>&1 | head -n 5`

**Expected result:**
- A log line contains `abc123`.

### Step 3
**Do this:** Auto-generate a request_id if none provided.

**How to test it:**
- Run: `trustctl config show 2>&1 | head -n 5`

**Expected result:**
- A log line contains a non-empty request_id.


## Prove (10–20 min)
- Paste: one log line from a run with `--request-id abc123`.
- Paste: one log line from a run without request-id.
- Explain in 4 lines: how you will use request_id in Week 11 debugging.

## Ship (5 min)
- Submit: logging changes
- Paste: two example log lines

## Done when
- Logs are structured (machine-parsable).
- Every run includes request_id (override or auto).

## Common mistakes
- request_id missing on error path → assign at start of run.
- Multi-line logs per event → one event per line.

## Proof (what you submit)
- Paste log line with request_id=abc123
- Paste log line with auto request_id

## Hero Visual
Each command run emits log events; request_id tags all events from the same run.

## Future Lock
Week 11+ debugging relies on filtering logs by request_id across steps and nodes.

## References
- [12‑Factor Logs](https://12factor.net/logs)
- [Command Line Interface Guidelines](https://clig.dev/)
