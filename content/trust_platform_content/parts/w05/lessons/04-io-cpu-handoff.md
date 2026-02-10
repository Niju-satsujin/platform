---
id: w05-l04
title: "IO-to-CPU Handoff"
order: 4
type: lesson
duration_min: 120
---

# IO-to-CPU Handoff

## Goal

Connect the [epoll event loop (W04)](../../../parts/w04/part.md) to the [thread pool (L02)](02-worker-lifecycle.md). The loop reads a request from a client, wraps the CPU work as a task, and pushes it to the [task queue (L01)](01-task-queue-contract.md). A worker executes the task and writes the result back.

## What you build

A server where the [event loop](../../../parts/w03/part.md) runs on the main thread and handles all [socket IO](https://man7.org/linux/man-pages/man2/recv.2.html). When a client sends a message that requires CPU work (e.g., hashing a string), the loop packages the work as a `struct task` and pushes it to the pool. A [worker thread](02-worker-lifecycle.md) picks it up, computes the result, and uses a [pipe](https://man7.org/linux/man-pages/man2/pipe.2.html) or [eventfd](https://man7.org/linux/man-pages/man2/eventfd.2.html) to notify the event loop that the result is ready.

## Why it matters

This is the core architecture of [libuv](https://docs.libuv.org/en/v1.x/threadpool.html) (Node.js), [Tokio](https://docs.rs/tokio/latest/tokio/) (Rust), and most modern async runtimes. The rule is simple: IO stays on the [event loop](../../../parts/w03/part.md), CPU work goes to the [thread pool](https://en.wikipedia.org/wiki/Thread_pool). If you put CPU work on the event loop, every client waits. If you put IO on the pool, you waste threads on blocking [recv()](https://man7.org/linux/man-pages/man2/recv.2.html) calls. The handoff boundary is the most important design decision in a concurrent server.

---

## Training Session

### Warmup

Read the DESCRIPTION section of [eventfd()](https://man7.org/linux/man-pages/man2/eventfd.2.html). Write down:

1. How [eventfd](https://man7.org/linux/man-pages/man2/eventfd.2.html) works — a thread writes a `uint64_t` to it, and another thread (or the [epoll loop](../../../parts/w04/part.md)) sees it as readable.
2. Why this is better than a [pipe](https://man7.org/linux/man-pages/man2/pipe.2.html) for wakeup: one fd instead of two, no buffer management.

### Work

#### Do

1. Create `w05/handoff_server.c`.
2. Set up an [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) loop on the main thread. Listen on a [TCP socket](https://man7.org/linux/man-pages/man2/socket.2.html).
3. Create an [eventfd](https://man7.org/linux/man-pages/man2/eventfd.2.html). Add it to the [epoll instance](https://man7.org/linux/man-pages/man7/epoll.7.html) with `EPOLLIN`.
4. Create a [task queue](01-task-queue-contract.md) and a [thread pool](02-worker-lifecycle.md) with 4 workers.
5. Create a results queue (another [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html)-protected list) for completed tasks.
6. When the [epoll loop](../../../parts/w04/part.md) reads a message from a client:
   - Build a `struct task` that holds the client fd, the input data, and a pointer to the results queue.
   - Push the task onto the [task queue](01-task-queue-contract.md).
7. In the worker function:
   - Pop a task. Do the CPU work (e.g., count characters, compute a hash).
   - Push the result onto the results queue.
   - Write `1` to the [eventfd](https://man7.org/linux/man-pages/man2/eventfd.2.html) to wake the [event loop](../../../parts/w03/part.md).
8. When the [epoll loop](../../../parts/w04/part.md) sees the [eventfd](https://man7.org/linux/man-pages/man2/eventfd.2.html) is readable:
   - Read the [eventfd](https://man7.org/linux/man-pages/man2/eventfd.2.html) value (clears it).
   - Drain the results queue. For each result, [send()](https://man7.org/linux/man-pages/man2/send.2.html) the response to the client fd.

#### Test

Start the server in one terminal:

```bash
gcc -Wall -Wextra -pthread -o handoff_server w05/handoff_server.c w05/task_queue.c w05/thread_pool.c
./handoff_server 9090
```

In another terminal, send requests:

```bash
for i in $(seq 1 10); do echo "compute $i" | nc -q1 localhost 9090 & done
wait
```

#### Expected

All 10 clients get a response. The [event loop](../../../parts/w03/part.md) never blocks on CPU work. Workers handle the computation.

#### Prove

Add a log line in the worker that prints [pthread_self()](https://man7.org/linux/man-pages/man3/pthread_self.3.html) and the task ID. Confirm tasks run on pool threads, not the main thread:

```bash
./handoff_server 9090 2>&1 | grep "worker"
```

You see thread IDs different from the main thread.

#### Ship

```bash
git add w05/handoff_server.c
git commit -m "w05-l04: event loop to thread pool handoff via eventfd"
```

---

## Done when

- The [event loop](../../../parts/w03/part.md) never executes CPU work directly.
- Workers never call [send()](https://man7.org/linux/man-pages/man2/send.2.html) or [recv()](https://man7.org/linux/man-pages/man2/recv.2.html) on client sockets (only the event loop does IO).
- The [eventfd](https://man7.org/linux/man-pages/man2/eventfd.2.html) wakes the loop when results are ready.
- 10 concurrent clients all get correct responses.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Worker calls [send()](https://man7.org/linux/man-pages/man2/send.2.html) directly on the client socket | Two threads writing to the same fd is a [data race](https://en.wikipedia.org/wiki/Race_condition). Only the [event loop](../../../parts/w03/part.md) does IO. Workers push results to a queue. |
| Forgetting to read the [eventfd](https://man7.org/linux/man-pages/man2/eventfd.2.html) | The fd stays readable and [epoll_wait()](https://man7.org/linux/man-pages/man2/epoll_wait.2.html) spins. Always read the 8-byte value to clear it. |
| Not protecting the results queue with a [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) | Multiple workers push results at the same time. The results queue needs its own [lock](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html). |
| Blocking [send()](https://man7.org/linux/man-pages/man2/send.2.html) on the event loop | If the client's receive buffer is full, [send()](https://man7.org/linux/man-pages/man2/send.2.html) blocks the loop. Use non-blocking sockets and handle [EAGAIN](https://man7.org/linux/man-pages/man3/errno.3.html). |

## Proof

```bash
# Terminal 1
./handoff_server 9090

# Terminal 2
echo "compute test" | nc -q1 localhost 9090
# → result: <computed value>
```

## Hero visual

```
  ┌─────────────────────────────────────────────────────────────┐
  │                    main thread (event loop)                 │
  │                                                             │
  │  epoll_wait() ──▶ client readable ──▶ push task to queue   │
  │       │                                                     │
  │       ▼                                                     │
  │  eventfd readable ──▶ drain results ──▶ send() to client   │
  └────────────────────────────┬────────────────────────────────┘
                               │ eventfd
                               │ write(1)
  ┌────────────────────────────┴────────────────────────────────┐
  │                    worker threads (pool)                    │
  │                                                             │
  │  pop task ──▶ CPU work ──▶ push result ──▶ wake event loop │
  └─────────────────────────────────────────────────────────────┘
```

## Future Lock

- In [W05 L05](05-error-propagation.md) you will handle the case where a task fails on the worker — the error [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reach the event loop so it can send an error response to the client.
- In [W05 L06](06-regression-harness.md) you will run the [W04 regression harness](../../../parts/w04/lessons/06-regression-harness.md) against this server to prove the handoff did not break client-visible behavior.
- In [W06](../../../parts/w06/part.md) you will add [backpressure](../../../parts/w06/part.md) — when the task queue is full, the event loop stops reading from clients.
- In [W09](../../../parts/w09/part.md) the [KV store](../../../parts/w09/part.md) will use this exact handoff pattern for every GET/SET/DEL command.
