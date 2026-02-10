---
id: w01-l05
title: "Lesson 5 — Correlation IDs: Trace One Run"
order: 5
duration_min: 120
type: lesson
---

# Lesson 5 (5/7): Correlation IDs — Trace One Run

**Goal:** Add a `request_id` to every log event so you can filter all events from a single run with one grep.

**What you build:** A `--request-id` flag that overrides auto-generated UUIDs. Every log event includes `request_id`. One run = one ID = complete trace.

## Why it matters

- In production, dozens of requests overlap in the same log file. Without a correlation ID, you cannot reconstruct what happened during one run. This is the foundation of [distributed tracing](https://opentelemetry.io/docs/concepts/signals/traces/).
- The `--request-id` override lets operators inject their own ID during debugging or incident response. Without it, you can't tie a CI pipeline run to its log output.
- [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119): `request_id` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be present in every event. No exceptions.

## TRAINING SESSION

### Warmup (5 min)
- Q: What happens when two overlapping runs write to the same log file and neither has a correlation ID?
- Q: Why would an operator override the auto-generated request_id?
- Recall: Name the 6 required log schema fields from Lesson 4.

### Work

**Task 1: Generate request_id automatically**

1. Do this: At startup, generate a UUID (or short random hex string). Store it as the run-level request_id. Add `request_id` to the log schema as a required field.
2. How to test it:
   ```
   trustctl config show
   ```
3. Expected result: Both log events include the same `request_id`:
   ```
   {"ts":"...","level":"info","event":"cmd_start","cmd":"config show","request_id":"a3f8c2d1"}
   {"ts":"...","level":"info","event":"cmd_finish","cmd":"config show","exit":0,"duration_ms":1,"request_id":"a3f8c2d1"}
   ```

**Task 2: Implement --request-id override**

1. Do this: Add a `--request-id <value>` flag. When present, it replaces the auto-generated ID. This lets CI systems or operators inject their own trace ID.
2. How to test it:
   ```
   trustctl config show --request-id MY-DEBUG-123
   ```
3. Expected result:
   ```
   {"ts":"...","event":"cmd_start","cmd":"config show","request_id":"MY-DEBUG-123"}
   ```

**Task 3: Confirm consistency within a run**

1. Do this: Run a command that produces multiple log events. Verify every event has the same request_id.
2. How to test it:
   ```
   trustctl log demo "test message" | jq '.request_id'
   ```
3. Expected result: Every line outputs the same ID.

**Task 4: Confirm override beats auto-generated**

1. Do this: Run with and without override. Verify override replaces the auto ID.
2. How to test it:
   ```
   trustctl config show 2>&1 | head -1 | jq '.request_id'
   trustctl config show --request-id FORCED 2>&1 | head -1 | jq '.request_id'
   ```
3. Expected result: First → random UUID. Second → `"FORCED"`.

### Prove (10 min)
- Run two back-to-back commands without override. Confirm each has a different auto-ID.
- Run one command with override. Confirm the override appears in every event.
- Explain in 4 lines: Why is request_id per-run, not per-line?

### Ship (5 min)
- Submit: updated source with request_id support
- Paste: 2 log lines from one run showing same request_id
- Paste: 1 log line showing overridden request_id

## Done when
- Every event has `request_id`.
- Auto-generated when no flag is passed.
- `--request-id` override beats auto-generated.
- All events in one run share the same ID.

## Common mistakes
- New ID per log line → Fix: Generate once at startup, pass to every emit call.
- request_id missing on error events → Fix: It's a required schema field. Add it in the emit function, not in each handler.
- Override flag parsed too late → Fix: Parse request_id during config resolution (same phase as TRUST_HOME).
- No way to filter by ID → Fix: `grep "request_id\":\"abc\"" trustctl.log` must work.

## Proof
- Submit: source code
- Paste: 2 log lines from one run (same request_id)
- Paste: 1 log line with overridden request_id

## Hero Visual

```
┌─────────────────────────────────────────────┐
│           Correlation ID Flow               │
│                                             │
│  startup ──► generate UUID ──► request_id   │
│                    │                        │
│              (or --request-id flag)         │
│                    │                        │
│                    ▼                        │
│  ┌─────────────────────────────────┐        │
│  │ cmd_start  { request_id: "abc" }│        │
│  │ ...work...                      │        │
│  │ cmd_finish { request_id: "abc" }│        │
│  └─────────────────────────────────┘        │
│                                             │
│  grep "abc" trustctl.log → full trace       │
└─────────────────────────────────────────────┘
```

### What you should notice
- One ID per run, not per line.
- Override enables external systems to inject their trace context.

## Future Lock
Later in **Week 11** (Replication), election debugging requires correlating events across multiple nodes. In **Week 16** (Monitoring), the monitor aggregates events by request_id. Without this field, multi-node debugging is impossible.
