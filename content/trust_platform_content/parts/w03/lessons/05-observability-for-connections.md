---
id: w03-l05
title: "Observability for Connections"
order: 5
duration_min: 120
type: lesson
---

# Lesson 5 (5/7): Observability for Connections

**Goal:** Add structured logging, per-connection metrics, and a stats command so you can see what the server is doing at runtime.

**What you build:** A logging system that tags every line with connection id and timestamp, per-connection byte counters, and an admin `STATS` command via stdin.

**Why it matters:**
You cannot fix what you cannot see.
Production servers expose metrics for monitoring.
Your W01 logging foundation now extends to per-connection context.
Without observability, debugging a multi-client server is guessing.
Tools like [Prometheus](https://prometheus.io/) and [Grafana](https://grafana.com/) consume exactly this kind of data.

---

## TRAINING SESSION

### Warmup (15 min)

1. Review your W01 logging macros. What fields do they include?
2. Define three metrics that matter for a multi-client server: connections_total, bytes_in_total, bytes_out_total.
3. Read about `clock_gettime(CLOCK_MONOTONIC)` — why use monotonic time instead of wall-clock time?

### Work

#### Task 1 — Tag every log line with connection context

**Do:** Modify your log macro (or wrapper function) to accept a connection slot number. Every log line should include: `[timestamp] [conn=N] [fd=M] message`. Use ISO 8601 timestamps.

**Test:**
```bash
./server &
nc localhost 7000
# type "hello" + Enter
```

**Expected:** Server prints lines like:
```
2026-02-10T14:30:00.123Z [conn=0] [fd=4] ACCEPT from 127.0.0.1:54321
2026-02-10T14:30:01.456Z [conn=0] [fd=4] FRAME len=5 payload="hello"
```

#### Task 2 — Track per-connection metrics

**Do:** Add `time_t connected_at`, `size_t frames_in`, `size_t frames_out` to `struct connection`. Increment on every frame received and sent. On disconnect, log a summary line.

**Test:**
```bash
./server &
nc localhost 7000
# send 3 messages, then disconnect (Ctrl+C)
```

**Expected:** Server logs:
```
[conn=0] [fd=4] DISCONNECT duration=5s frames_in=3 frames_out=3 bytes_in=120 bytes_out=120
```

#### Task 3 — Implement the STATS command on stdin

**Do:** When the admin types `STATS` on stdin, print a summary table: total connections ever, current active, total bytes in/out, uptime, per-connection breakdown for active clients.

**Test:**
```bash
./server
# connect 2 clients via nc in other terminals
# type "STATS" in server terminal
```

**Expected:**
```
=== SERVER STATS ===
uptime:        120s
total_accept:  2
active:        2
bytes_in:      256
bytes_out:     512
--- active connections ---
  conn=0  fd=4  state=CONNECTED  in=128  out=256  age=90s
  conn=1  fd=5  state=CONNECTED  in=128  out=256  age=60s
========================
```

#### Task 4 — Log slow-client events with context

**Do:** When a slow client is detected (from Lesson 4), the log line should include: connection age, total bytes sent, send buffer size, and the threshold that was exceeded.

**Test:**
Trigger a slow-client disconnect while observing logs.

**Expected:**
```
[conn=2] [fd=6] SLOW_CLIENT send_buf=4200 threshold=4096 age=30s bytes_out=8000, disconnecting
```

### Prove

- [ ] Every log line includes timestamp, connection id, and fd.
- [ ] `STATS` command prints accurate totals matching actual traffic.
- [ ] Disconnect summary shows correct frame counts and duration.
- [ ] Slow-client log includes all required context fields.

### Ship

```bash
git add -A && git commit -m "w03-l05: structured logging, per-conn metrics, STATS command"
```

---

## Done When

- You can type `STATS` at any time and see a complete picture of the server.
- Every event is traceable to a specific connection.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `printf` everywhere instead of a log function | Centralize logging. One function, consistent format. |
| Wall-clock time for duration calculations | Use `CLOCK_MONOTONIC`. Wall-clock jumps with NTP adjustments. |
| Not flushing log output | Use `fflush(stdout)` or line-buffered mode. Logs may appear out of order otherwise. |
| Counters that overflow on 32-bit | Use `size_t` or `uint64_t` for byte counters. |

## Proof

```
Screenshot: STATS output showing 3 active connections with correct metrics.
Server log showing a disconnect summary with frame counts.
Git log showing commit w03-l05.
```

## Hero Visual

```
  stdin ──► "STATS" ──► server loop
                           │
                           ▼
  ┌──────────────────────────────────┐
  │         === SERVER STATS ===     │
  │  uptime: 120s                    │
  │  active: 3                       │
  │  bytes_in:  1024                 │
  │  bytes_out: 3072 (broadcast 3x)  │
  │  conn=0  fd=4  age=90s  in=512  │
  │  conn=1  fd=5  age=60s  in=256  │
  │  conn=2  fd=6  age=30s  in=256  │
  └──────────────────────────────────┘
```

## Future Lock

In **W04** you will add epoll-specific metrics: events per `epoll_wait()` call, average dispatch latency.
In **W05** the thread pool adds queue depth and worker utilization metrics to the STATS output.
In **W09** the KV store adds command-type histograms (GET/SET/DEL counts) and key-space size.
Your logging and stats framework grows — it never gets rewritten.
