---
id: w03-l11
title: "In-process metrics counters"
order: 11
duration_minutes: 20
xp: 50
kind: lesson
part: w03
proof:
  type: paste
  instructions: "Paste the metrics output after running the stress test, showing counters for connections, frames, errors."
  regex_patterns:
    - "connections|frames|errors"
    - "\\d+"
---
# In-process metrics counters

## Concept

Logs tell you WHAT happened. Metrics tell you HOW MUCH happened. You need both.

A metric is a counter or gauge that you increment as events occur:

```cpp
struct Metrics {
    uint64_t connections_accepted = 0;
    uint64_t connections_closed = 0;
    uint64_t frames_received = 0;
    uint64_t frames_sent = 0;
    uint64_t errors_malformed = 0;
    uint64_t errors_timeout = 0;
    uint64_t bytes_received = 0;
    uint64_t bytes_sent = 0;
};
```

At any point, you can print these numbers to see the server's state. After a stress test, you check: did the server process the expected number of frames? Were there any errors?

Metrics are also useful for detecting problems over time. If `errors_malformed` suddenly spikes, something is sending bad data. If `connections_closed` is much higher than expected, clients are dropping.

For now, keep metrics in a simple struct — no external libraries needed. You will add proper metrics export (Prometheus-style) in Week 21.

## Task

1. Define a `Metrics` struct with the counters listed above
2. Create a global `Metrics` instance in the server
3. Increment the appropriate counter at each event (accept, close, recv, send, error)
4. Add a `--metrics` flag: when the server shuts down, print all metrics to stderr
5. Also print metrics on SIGUSR1 (so you can check them while the server is running)

## Hints

- Increment: `metrics.frames_received++` at each successful recv_frame
- For bytes: `metrics.bytes_received += frame_size` after each recv
- For SIGUSR1: `signal(SIGUSR1, print_metrics_handler)` — the handler prints the metrics
- Send SIGUSR1 with: `kill -USR1 $(pgrep server)`
- Metrics are single-threaded here (no locking needed — your server is single-threaded with poll)

## Verify

```bash
./server --port 9000 --metrics &
./stress_test --port 9000 --clients 10 --frames 50
kill -USR1 $(pgrep server)
kill $(pgrep server)
```

Expected: metrics show ~500 frames_received, ~500 frames_sent, connections_accepted=10, etc.

## Done When

Metrics are tracked for all major events and can be printed on demand (SIGUSR1) or at shutdown.
