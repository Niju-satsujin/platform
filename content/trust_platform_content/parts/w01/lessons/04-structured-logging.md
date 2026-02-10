---
id: w01-l04
title: "Lesson 4 — Structured Logging: Evidence, Not Vibes"
order: 4
duration_min: 120
type: lesson
---

# Lesson 4 (4/7): Structured Logging — Evidence, Not Vibes

**Goal:** Implement structured JSON logging to stdout and to a file under TRUST_HOME, with a stable schema that every command emits.

**What you build:** A logger that writes structured events (JSON) to both stdout and `$TRUST_HOME/logs/trustctl.log`. Every command produces start and finish events.

## Why it matters

- [12-Factor Logs](https://12factor.net/logs) says: treat logs as event streams. Write to stdout; let the platform route them. We also write to a file because trustctl runs locally and operators need persistent evidence.
- Structured logs (JSON with stable fields) are greppable, parseable, and machine-readable. Unstructured `printf` debugging doesn't scale.
- The schema you define now [MUST](https://datatracker.ietf.org/doc/html/rfc2119) stay stable. Every future week adds events on top of this schema. Breaking it means breaking every debug tool.

## TRAINING SESSION

### Warmup (5 min)
- Q: What does [12-Factor](https://12factor.net/logs) say about where logs should go?
- Q: Name three fields that every log event should have.
- Recall: Why is structured logging better than `printf("error happened")`?

### Work

**Task 1: Define the log schema**

1. Do this: Define required fields for every event:
   - `ts` — ISO 8601 timestamp
   - `level` — info / warn / error
   - `event` — event name (e.g., "cmd_start", "cmd_finish")
   - `cmd` — command name (e.g., "config show")
   - `exit` — exit code (on finish events)
   - `duration_ms` — elapsed time (on finish events)
2. How to test it: Write a schema doc and validate one sample event against it.
3. Expected result: A documented schema with at least 6 required fields.

**Task 2: Emit start + finish events for every command**

1. Do this: At the beginning of every command handler, emit a `cmd_start` event. At the end (success or failure), emit a `cmd_finish` event with exit code and duration.
2. How to test it:
   ```
   trustctl config show
   ```
3. Expected result: Two log lines on stdout:
   ```
   {"ts":"...","level":"info","event":"cmd_start","cmd":"config show"}
   {"ts":"...","level":"info","event":"cmd_finish","cmd":"config show","exit":0,"duration_ms":2}
   ```

**Task 3: Write to file under TRUST_HOME**

1. Do this: In addition to stdout, append every event to `$TRUST_HOME/logs/trustctl.log`. Create the directory if it doesn't exist.
2. How to test it:
   ```
   TRUST_HOME=/tmp/test-trust trustctl config show
   cat /tmp/test-trust/logs/trustctl.log
   ```
3. Expected result: The log file contains the same structured events. File is append-only.

**Task 4: Log failures with full context**

1. Do this: Error events [MUST](https://datatracker.ietf.org/doc/html/rfc2119) include `level: "error"` and the error message. The finish event still fires with the correct exit code.
2. How to test it:
   ```
   trustctl gibberish 2>/dev/null
   cat /tmp/test-trust/logs/trustctl.log | tail -2
   ```
3. Expected result: Even for errors, both start and finish events appear. Finish shows `exit: 64`.

### Prove (15 min)
- Run 2 commands (one success, one failure). Confirm stdout has structured lines.
- Check the log file has matching events.
- Explain in 4 lines: Why log on failure too? (Hint: failures need the best evidence.)

### Ship (5 min)
- Submit: logger source code + schema doc
- Paste: one stdout log line (full JSON)
- Paste: last 5 lines of the log file

## Done when
- Every command emits start + finish events.
- Events go to both stdout and file.
- Error commands still produce structured events.
- Schema has at least 6 stable fields.

## Common mistakes
- Only log on success → Fix: Log start unconditionally. Log finish with exit code always.
- Unstable schema (fields change per command) → Fix: Required fields are ALWAYS present. Optional fields are additive.
- Log file directory doesn't exist → Fix: Create `$TRUST_HOME/logs/` at startup.
- printf instead of JSON → Fix: Use a single emit function that serializes to JSON.

## Proof
- Submit: source code
- Paste: one stdout log line
- Paste: last 5 lines of log file

## Hero Visual

```
┌────────────────────────────────────────────────┐
│              Logging Pipeline                   │
│                                                │
│  command ──► [cmd_start] ──► execute ──► [cmd_finish]│
│                 │                          │    │
│                 ▼                          ▼    │
│           ┌─────────┐              ┌──────────┐│
│           │ stdout   │              │ stdout   ││
│           │ log file │              │ log file ││
│           └─────────┘              └──────────┘│
│                                                │
│  Schema: ts, level, event, cmd, exit, duration │
└────────────────────────────────────────────────┘
```

### What you should notice
- Two outputs (stdout + file) from one emit call.
- Start fires before work. Finish fires even on failure.
- Schema stability is non-negotiable.

## Future Lock
Later in **Week 10** (WAL), the write-ahead log uses structured records with checksums — the same discipline. In **Week 15** (Transparency Log), append-only evidence trails build directly on this logging model. In **Week 21** (SLO), dashboards parse these structured fields.
