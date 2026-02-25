---
id: w04-l06
title: "Integrate thread pool with the server"
order: 6
duration_minutes: 30
xp: 75
kind: lesson
part: w04
proof:
  type: paste
  instructions: "Paste: (1) server startup log showing pool with N workers, (2) stress test passing with the pool enabled."
  regex_patterns:
    - "pool|worker"
    - "pass|success"
---
# Integrate thread pool with the server

## Concept

Your server currently does everything in the poll loop: receive a frame, process it, send the response. If processing takes time (later it will — hashing, signature verification), the poll loop is blocked.

The new architecture:
1. **Poll loop** (main thread) — handles I/O only: accept connections, receive frames
2. **Thread pool** (worker threads) — processes requests: deserialize envelope, do work, serialize response
3. **Response queue** — workers put completed responses back for the poll loop to send

The flow:
```
poll loop receives frame → submits task to pool → worker processes → worker puts response in response queue → poll loop sends response
```

The tricky part: `write()` must happen from the poll loop thread (because the poll loop owns the socket fds). Workers cannot write directly to client sockets without careful synchronization. The simplest approach: workers put the response bytes + client fd into a thread-safe response queue, and the poll loop drains it on each iteration.

## Task

1. Create a response queue: `WorkQueue<Response>` where `Response = {int client_fd, std::vector<uint8_t> data}`
2. In the poll loop: after receiving a frame, submit a task to the pool
3. The task: deserialize, process (for echo: just copy), serialize response, push to response queue
4. In the poll loop: after polling, drain the response queue and send all pending responses
5. Run the stress test to verify everything still works

## Hints

- Use a pipe fd to wake the poll loop when a response is ready: `pipe(wake_fds)`. Add `wake_fds[0]` to the poll set. Workers write 1 byte to `wake_fds[1]` after pushing a response. Poll wakes up on the pipe fd.
- Alternative: use a short poll timeout (10ms) and drain the response queue on each iteration — simpler but adds up to 10ms latency
- Start with 4 worker threads and a queue size of 256
- `--workers N` flag to configure the thread count

## Verify

```bash
# Terminal 1
./server --port 9000 --workers 4

# Terminal 2
./stress_test --port 9000 --clients 50 --frames 100
```

Expected: stress test passes with the same results as before, but now processing happens in parallel.

## Done When

The server uses the thread pool for request processing and the stress test passes.
