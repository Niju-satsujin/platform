---
id: w04-l08
title: "Backpressure — detect overload"
order: 8
duration_minutes: 25
xp: 75
kind: lesson
part: w04
proof:
  type: paste
  instructions: "Paste server log showing overload detection: queue full, server-busy responses sent to clients."
  regex_patterns:
    - "overload|backpressure|busy"
    - "queue.*full"
---
# Backpressure — detect overload

## Concept

What happens when requests arrive faster than your pool can process them? The work queue fills up. If `push()` blocks, the poll loop stops reading from sockets. Clients time out. Everything stalls.

A better approach: **detect overload and respond immediately**. When the queue is full, do not block. Instead, send the client an error response: "server busy, try again later." The client can retry or give up — that is the client's decision.

This is called **backpressure** — the server pushes back on the client when it cannot keep up. It is better than silently dropping requests or crashing.

Implementation: use `try_push()` instead of `push()`:

```cpp
bool try_push(T item) {
    std::lock_guard<std::mutex> lock(mtx);
    if (queue.size() >= max_size) return false;  // queue full
    queue.push(std::move(item));
    not_empty.notify_one();
    return true;
}
```

If `try_push()` returns false, the poll loop sends a "server busy" error envelope directly (without going through the pool).

## Task

1. Add `bool try_push(T item)` to WorkQueue — non-blocking, returns false when full
2. In the poll loop: use `try_push()` instead of blocking `push()`
3. When `try_push()` returns false:
   - Increment `metrics.overload_rejects`
   - Send an error envelope to the client: msg_type=ERROR, payload="server busy"
   - Log: `"overload: rejected request from client <fd>, queue full (<N>/<MAX>)"`
4. Test: reduce queue size to 4, run 50 clients — some should get "server busy"

## Hints

- The error envelope is sent from the poll loop (not from a worker thread)
- Use a small queue size (4) and a slow processing time (add `usleep(10000)` in the worker) to trigger overload easily
- `try_push` does NOT call `not_full.wait()` — that is what makes it non-blocking
- In production, you would also track the overload rate: if >10% of requests are rejected, you need more workers or faster processing

## Verify

```bash
./server --port 9000 --workers 2 --queue-size 4 &
./stress_test --port 9000 --clients 50 --frames 10
kill -INT $(pgrep server)
```

Expected: some clients receive "server busy" errors. Server metrics show overload_rejects > 0. No crashes.

## Done When

The server detects overload, responds with "server busy" instead of blocking, and continues serving.
