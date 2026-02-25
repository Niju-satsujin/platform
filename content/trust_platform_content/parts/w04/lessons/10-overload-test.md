---
id: w04-l10
title: "Overload test — push the server to the limit"
order: 10
duration_minutes: 25
xp: 50
kind: lesson
part: w04
proof:
  type: paste
  instructions: "Paste: (1) overload test output showing gradual load increase, (2) the point where the server starts rejecting, (3) recovery after load decreases."
  regex_patterns:
    - "overload|reject|busy"
    - "recover"
---
# Overload test — push the server to the limit

## Concept

You need to find your server's breaking point. How many concurrent requests can it handle before backpressure kicks in? What happens when load exceeds capacity? Does it recover when load decreases?

The overload test ramps up load gradually:
1. Start with 5 clients — everything should work
2. Increase to 20 clients — still fine
3. Increase to 50 clients — maybe some "server busy" responses
4. Increase to 100 clients — significant backpressure
5. Decrease back to 10 clients — server should recover

This is a **ramp test**. It tells you the server's capacity curve: below X clients everything is fine, between X and Y some requests are rejected, above Y the server is overwhelmed.

The key observation: does the server recover after load decreases? If it does, the backpressure mechanism works. If it stays overloaded even after load drops, you have a bug (maybe the queue is stuck or workers are deadlocked).

## Task

1. Write an overload test that:
   - Ramps clients from 5 → 20 → 50 → 100 → 10 (each step runs for 5 seconds)
   - At each step, records: throughput, rejection rate, average latency
   - Prints a summary table at the end
2. Run it against your server with 4 workers and queue size 64
3. Identify the "saturation point" where rejections start

## Hints

- Spawn N client threads, let them run for 5 seconds, join them, then spawn the next batch
- Track per-step metrics: total frames, total retries, total failures
- Recovery means: at the 10-client step, rejection rate should be 0%
- If recovery fails, check for resource leaks: file descriptors, memory, stuck threads

## Verify

```bash
./server --port 9000 --workers 4 --queue-size 64 &
./overload_test --port 9000
kill -INT $(pgrep server)
```

Expected: a table showing throughput and rejection rate at each load level. Recovery to 0% rejection at the 10-client step.

## Done When

You know your server's saturation point and you have verified it recovers after overload.
