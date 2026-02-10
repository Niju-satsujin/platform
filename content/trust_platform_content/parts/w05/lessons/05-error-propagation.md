---
id: w05-l05
title: "Error Propagation"
order: 5
type: lesson
duration_min: 120
---

# Error Propagation

## Goal

Propagate errors from [worker threads](02-worker-lifecycle.md) back to the [event loop](../../../parts/w03/part.md) so the correct client gets an error response instead of silence.

## What you build

You extend the result struct from [L04](04-io-cpu-handoff.md) with an `int error_code` and a `char error_msg[]` field. When a task fails on a worker (bad input, overflow, allocation failure), the worker sets these fields instead of the normal result. The [event loop](../../../parts/w03/part.md) checks `error_code` when draining the results queue. If non-zero, it sends an error response to the client. No task failure is silent.

## Why it matters

In a single-threaded server, errors are simple — you catch them and respond immediately. Once work moves to a [thread pool](https://en.wikipedia.org/wiki/Thread_pool), the thread that detects the error is not the thread that owns the [socket](https://man7.org/linux/man-pages/man2/socket.2.html). If you ignore the error, the client hangs forever waiting for a response. If you [send()](https://man7.org/linux/man-pages/man2/send.2.html) from the worker thread, you create a [data race](https://en.wikipedia.org/wiki/Race_condition). The only safe path is: worker writes the error to the results queue, wakes the [event loop](../../../parts/w03/part.md) via [eventfd](https://man7.org/linux/man-pages/man2/eventfd.2.html), and the loop sends the error response.

---

## Training Session

### Warmup

Think about what can go wrong inside a task:

1. The input is malformed (e.g., not a valid number).
2. A computation overflows (e.g., factorial of a large number).
3. [malloc()](https://man7.org/linux/man-pages/man3/malloc.3.html) returns `NULL`.
4. A file the task needs does not exist.

For each, write down: who detects the error (worker), and who [MUST](https://datatracker.ietf.org/doc/html/rfc2119) respond to the client (event loop).

### Work

#### Do

1. Extend `struct task_result` (or create one) in `w05/task_queue.h`:
   - `int client_fd` — which client gets the response.
   - `char data[256]` — the success payload.
   - `int error_code` — `0` means success, non-zero means failure.
   - `char error_msg[128]` — human-readable error string.
2. Modify the worker function in `w05/thread_pool.c`:
   - Wrap the task execution in logic that catches failures.
   - On success, set `error_code = 0` and fill `data`.
   - On failure, set `error_code` to a non-zero value and fill `error_msg` with a description.
   - Push the result to the results queue either way.
   - Write `1` to the [eventfd](https://man7.org/linux/man-pages/man2/eventfd.2.html) either way.
3. Modify the event loop in `w05/handoff_server.c`:
   - When draining results, check `error_code`.
   - If `error_code == 0`, [send()](https://man7.org/linux/man-pages/man2/send.2.html) the success response.
   - If `error_code != 0`, [send()](https://man7.org/linux/man-pages/man2/send.2.html) an error response like `ERROR: <error_msg>\n`.
4. Write a test task that deliberately fails (e.g., receives "bad" as input and returns error code `1` with message "invalid input").
5. Push a mix of good and bad tasks and verify both success and error responses.

#### Test

```bash
gcc -Wall -Wextra -pthread -o error_test w05/handoff_server.c w05/task_queue.c w05/thread_pool.c
./error_test 9090
```

In another terminal:

```bash
echo "good data" | nc -q1 localhost 9090
echo "bad" | nc -q1 localhost 9090
```

#### Expected

The first client gets a success response. The second client gets `ERROR: invalid input`. Neither client hangs.

#### Prove

```bash
echo "bad" | nc -q1 localhost 9090 | grep -q "ERROR" && echo "Error propagated"
```

#### Ship

```bash
git add w05/task_queue.h w05/thread_pool.c w05/handoff_server.c
git commit -m "w05-l05: error propagation from workers to event loop"
```

---

## Done when

- A failing task on a worker results in an error response to the correct client.
- No client hangs on a failed task.
- Workers never call [send()](https://man7.org/linux/man-pages/man2/send.2.html) — all IO stays on the [event loop](../../../parts/w03/part.md).
- [Helgrind](https://valgrind.org/docs/manual/hg-manual.html) reports zero data races.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Worker calls [send()](https://man7.org/linux/man-pages/man2/send.2.html) to report the error | This is a [data race](https://en.wikipedia.org/wiki/Race_condition). Only the [event loop](../../../parts/w03/part.md) does IO. Push the error to the results queue. |
| Forgetting to wake the [event loop](../../../parts/w03/part.md) on error | The client waits forever. Write to [eventfd](https://man7.org/linux/man-pages/man2/eventfd.2.html) on both success and failure. |
| Silently dropping the error | The client hangs. Every task [MUST](https://datatracker.ietf.org/doc/html/rfc2119) produce a result — success or error. |
| Error message without the client fd | The event loop cannot send the error to the right client. The result struct [MUST](https://datatracker.ietf.org/doc/html/rfc2119) carry the client fd. |

## Proof

```bash
# Terminal 1
./error_test 9090

# Terminal 2
echo "good data" | nc -q1 localhost 9090
# → result: <computed value>

echo "bad" | nc -q1 localhost 9090
# → ERROR: invalid input
```

## Hero visual

```
  client A ──▶ event loop ──▶ task queue ──▶ worker ──▶ success
                    │                            │
                    │         results queue       │
                    │◀───── {fd=A, data="ok"} ◀──┘
                    │──▶ send("ok") to A

  client B ──▶ event loop ──▶ task queue ──▶ worker ──▶ FAIL
                    │                            │
                    │         results queue       │
                    │◀── {fd=B, err="bad input"}◀┘
                    │──▶ send("ERROR: bad input") to B
```

## Future Lock

- In [W05 L06](06-regression-harness.md) you will test error propagation under load — many good and bad tasks mixed together.
- In [W06](../../../parts/w06/part.md) you will add [backpressure](../../../parts/w06/part.md) — when the queue is full, the event loop rejects new tasks with an immediate error instead of blocking.
- In [W09](../../../parts/w09/part.md) the [KV store](../../../parts/w09/part.md) will return errors for malformed commands (e.g., `SET` with no value) using this same propagation path.
- In [W10](../../../parts/w10/part.md) a failed [WAL write](../../../parts/w10/part.md) will propagate back to the event loop so the client learns the write was not durable.
