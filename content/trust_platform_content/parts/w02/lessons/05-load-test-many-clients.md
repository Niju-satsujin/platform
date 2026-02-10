---
id: w02-l05
title: "Lesson 5 — Load Test: Many Sequential Clients"
order: 5
duration_min: 120
type: lesson
---

# Lesson 5 (5/7): Load Test — Many Sequential Clients

**Goal:** Prove the echo server handles N sequential clients without leaking file descriptors, memory, or state. Measure round-trip latency.

**What you build:** A load test script that connects N clients one at a time, each sending M framed messages, verifying every echo, and reporting success/failure counts and latency.

## Why it matters

- A single happy-path test proves nothing about reliability. You need to run 100+ clients to expose resource leaks. A leaked file descriptor means client #1021 fails with [EMFILE](https://man7.org/linux/man-pages/man2/accept.2.html) — too many open files.
- Round-trip latency under load reveals performance bugs. If client #1 takes 1ms and client #100 takes 500ms, something is accumulating.
- This is [stress testing](https://en.wikipedia.org/wiki/Stress_testing_(software)), not benchmarking. The goal is not speed — it is correctness under repetition. Every echo [MUST](https://datatracker.ietf.org/doc/html/rfc2119) match. Every disconnect [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be clean.
- Real production servers run for months. Simulating 100 sequential clients in 30 seconds is the minimum confidence bar.

## TRAINING SESSION

### Warmup (5 min)
- Q: What kernel limit determines the maximum number of open file descriptors per process?
- Q: If client #50 hangs, what is the likely cause? (Hint: resource leak from client #1-49.)
- Recall: From Lesson 3, what [MUST](https://datatracker.ietf.org/doc/html/rfc2119) happen to the client fd after disconnect?

### Work

**Task 1: Write the load test script**

1. Do this: Write a script or program `echo-load-test` that:
   - Accepts `--host`, `--port`, `--clients N`, `--messages M` flags
   - For each of N clients: connect, send M framed messages, verify each echo matches, disconnect
   - Print per-client summary: client ID, messages OK, round-trip min/max/avg (ms)
   - Print final summary: total clients, total messages, pass/fail count
2. How to test it:
   ```
   trustctl echo-server --port 9900 &
   PID=$!
   sleep 1
   ./echo-load-test --host localhost --port 9900 --clients 10 --messages 5
   kill $PID
   ```
3. Expected result: 10 clients × 5 messages = 50 echoes. All pass. Summary printed.

**Task 2: Verify echo correctness under load**

1. Do this: Each message payload [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be unique (e.g., `"client-3-msg-2"`). After receiving the echo, compare byte-for-byte. Any mismatch is a FAIL.
2. How to test it:
   ```
   ./echo-load-test --host localhost --port 9900 --clients 20 --messages 10
   ```
3. Expected result: 200 messages, 200 exact matches, 0 failures.

**Task 3: Check for file descriptor leaks**

1. Do this: Before starting the load test, record the server's open fd count. After the load test, check again. They [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be equal (±1 for the listen socket).
2. How to test it:
   ```
   trustctl echo-server --port 9900 &
   PID=$!
   sleep 1
   ls /proc/$PID/fd | wc -l
   ./echo-load-test --host localhost --port 9900 --clients 50 --messages 5
   ls /proc/$PID/fd | wc -l
   kill $PID
   ```
3. Expected result: fd count before and after is the same. No leaked descriptors.

**Task 4: Measure round-trip latency**

1. Do this: Time each send-receive pair. Record min, max, and average round-trip time in milliseconds per client. Print a summary at the end.
2. How to test it:
   ```
   ./echo-load-test --host localhost --port 9900 --clients 50 --messages 10
   ```
3. Expected result: Output like:
   ```
   client  1: 10/10 ok  rtt min=0.12ms max=0.45ms avg=0.21ms
   client  2: 10/10 ok  rtt min=0.11ms max=0.38ms avg=0.19ms
   ...
   client 50: 10/10 ok  rtt min=0.13ms max=0.42ms avg=0.22ms
   ---
   total: 50 clients, 500 messages, 500 ok, 0 fail
   rtt overall: min=0.11ms max=0.45ms avg=0.20ms
   ```

**Task 5: Run 100 clients — the stress test**

1. Do this: Run the load test with 100 clients and 10 messages each. This is 1000 message round-trips. The server [MUST](https://datatracker.ietf.org/doc/html/rfc2119) handle all of them without crashing, leaking, or corrupting data.
2. How to test it:
   ```
   trustctl echo-server --port 9900 --timeout 5 &
   PID=$!
   sleep 1
   ./echo-load-test --host localhost --port 9900 --clients 100 --messages 10
   echo "server fd count: $(ls /proc/$PID/fd | wc -l)"
   kill $PID
   ```
3. Expected result: 1000/1000 messages ok. fd count unchanged. Server exits cleanly.

### Prove (15 min)
- Run 100 clients. Confirm 0 failures.
- Check fd count before and after. Confirm no leak.
- Explain in 4 lines: Why does a leaked file descriptor eventually crash the server? (Hint: [EMFILE](https://man7.org/linux/man-pages/man2/accept.2.html) — the kernel stops accepting new connections.)

### Ship (5 min)
- Submit: echo-load-test source
- Paste: 100-client load test summary showing 0 failures
- Paste: fd count before and after showing no leak

## Done when
- Load test runs N sequential clients, each sending M framed messages.
- Every echo is verified byte-for-byte.
- 100 clients × 10 messages = 1000 round-trips, 0 failures.
- File descriptor count is stable before and after load.
- Round-trip latency is printed per client and overall.

## Common mistakes
- Not closing client socket in load test → Fix: Close after each client. The test itself can leak fds.
- Reusing the same payload for all messages → Fix: Unique payloads catch off-by-one and buffer reuse bugs.
- Ignoring latency spikes → Fix: Track max latency. A spike means something is blocking.
- Running too few clients → Fix: 10 clients proves nothing. 100 is the minimum.
- Not checking fd count → Fix: `/proc/<PID>/fd` is the definitive answer on Linux.

## Proof
- Submit: load test script source
- Paste: 100-client summary with 0 failures
- Paste: fd count before/after

## Hero Visual

```
┌──────────────────────────────────────────────────────┐
│            Load Test: 100 Sequential Clients          │
│                                                      │
│  Client 1 ──► connect ──► 10 msgs ──► disconnect     │
│  Client 2 ──► connect ──► 10 msgs ──► disconnect     │
│  Client 3 ──► connect ──► 10 msgs ──► disconnect     │
│    ...                                               │
│  Client 100 ──► connect ──► 10 msgs ──► disconnect   │
│                                                      │
│  Server fd count: 4 (before) → 4 (after)  ✓ no leak │
│                                                      │
│  Summary:                                            │
│  ┌──────────────────────────────────────┐            │
│  │ 100 clients, 1000 msgs, 0 fail      │            │
│  │ rtt avg: 0.20ms  max: 0.45ms        │            │
│  └──────────────────────────────────────┘            │
└──────────────────────────────────────────────────────┘
```

### What you should notice
- Sequential means one client at a time. The server handles connect-serve-disconnect in a loop.
- fd count before and after must match. Any increase means a leak.
- Latency should be stable across clients. Increasing latency signals accumulation.

## Future Lock
In **Week 3** (Event Loop), the load test becomes concurrent — all 100 clients connect at once. In **Week 5** (Thread Pool), you measure throughput, not just correctness. In **Week 9** (KV Store), the load test evolves into a get/put/delete benchmark. The test infrastructure you build now scales with the project.
