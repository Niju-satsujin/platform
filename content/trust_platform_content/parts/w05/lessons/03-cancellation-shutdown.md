---
id: w05-l03
title: "Cancellation & Shutdown"
order: 3
type: lesson
duration_min: 120
---

# Cancellation & Shutdown

## Goal

Add a clean [shutdown](https://man7.org/linux/man-pages/man3/pthread_join.3.html) path to the [thread pool (L02)](02-worker-lifecycle.md). All workers [MUST](https://datatracker.ietf.org/doc/html/rfc2119) finish their current task, then exit. No task is lost. No thread is leaked.

## What you build

A `shutdown` flag inside the [task queue](01-task-queue-contract.md). When the main thread sets this flag, it calls [pthread_cond_broadcast()](https://man7.org/linux/man-pages/man3/pthread_cond_broadcast.3p.html) to wake every sleeping worker. Each worker checks the flag after waking from [pthread_cond_wait()](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html) and exits its loop. The main thread then calls [pthread_join()](https://man7.org/linux/man-pages/man3/pthread_join.3.html) on every worker to wait for them to finish.

## Why it matters

A server that cannot shut down cleanly leaks threads, file descriptors, and memory. [Valgrind](https://valgrind.org/docs/manual/manual.html) reports "still reachable" blocks. The OS reclaims resources on exit, but during a restart (e.g., hot-reload) leaked threads can corrupt shared state. Every production [thread pool](https://en.wikipedia.org/wiki/Thread_pool) — [Java's shutdown()](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/ExecutorService.html#shutdown()), [Python's executor.shutdown()](https://docs.python.org/3/library/concurrent.futures.html#concurrent.futures.ThreadPoolExecutor) — follows this exact pattern.

---

## Training Session

### Warmup

Read the DESCRIPTION section of [pthread_cond_broadcast()](https://man7.org/linux/man-pages/man3/pthread_cond_broadcast.3p.html). Write down:

1. The difference between [pthread_cond_signal()](https://man7.org/linux/man-pages/man3/pthread_cond_signal.3p.html) (wakes one) and [pthread_cond_broadcast()](https://man7.org/linux/man-pages/man3/pthread_cond_broadcast.3p.html) (wakes all).
2. Why shutdown needs [broadcast](https://man7.org/linux/man-pages/man3/pthread_cond_broadcast.3p.html) — all workers must wake up to see the flag, not just one.

### Work

#### Do

1. Add a `int shutdown` field to `struct task_queue` in `w05/task_queue.h`.
2. In `task_queue_init()`, set `shutdown = 0`.
3. Modify `task_queue_pop()`:
   - Change the wait loop: `while (count == 0 && !shutdown)`.
   - After the loop, if `shutdown` is true and `count == 0`, [unlock](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) and return a sentinel (e.g., a task with `fn == NULL`).
4. Write `task_queue_shutdown()`:
   - [Lock](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) the [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html).
   - Set `shutdown = 1`.
   - Call [pthread_cond_broadcast()](https://man7.org/linux/man-pages/man3/pthread_cond_broadcast.3p.html) on `not_empty`.
   - [Unlock](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html).
5. Modify the worker loop in `w05/thread_pool.c`:
   - After `task_queue_pop()` returns, check if `task.fn == NULL`. If so, break out of the loop and return.
6. Write `thread_pool_shutdown()`:
   - Call `task_queue_shutdown()`.
   - Call [pthread_join()](https://man7.org/linux/man-pages/man3/pthread_join.3.html) on every worker thread.
7. Update `main()` test:
   - Push 10 tasks.
   - Call `thread_pool_shutdown()`.
   - Print "all workers joined" after it returns.

#### Test

```bash
gcc -Wall -Wextra -pthread -o shutdown_test w05/thread_pool.c w05/task_queue.c
./shutdown_test
```

#### Expected

Ten tasks run. Then "all workers joined" prints. The process exits cleanly with code `0`. No hang.

#### Prove

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind --tool=helgrind ./shutdown_test
```

Zero errors. Zero "still reachable" blocks from leaked threads.

#### Ship

```bash
git add w05/task_queue.h w05/task_queue.c w05/thread_pool.h w05/thread_pool.c
git commit -m "w05-l03: clean shutdown with broadcast and join"
```

---

## Done when

- `thread_pool_shutdown()` returns only after every worker has exited.
- No tasks are dropped — tasks already in the queue [MUST](https://datatracker.ietf.org/doc/html/rfc2119) finish before workers exit, or the sentinel returns only when the queue is empty.
- [Helgrind](https://valgrind.org/docs/manual/hg-manual.html) reports zero data races.
- The process exits with code `0`.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Using [signal](https://man7.org/linux/man-pages/man3/pthread_cond_signal.3p.html) instead of [broadcast](https://man7.org/linux/man-pages/man3/pthread_cond_broadcast.3p.html) for shutdown | Only one worker wakes up. The rest sleep forever. Shutdown [MUST](https://datatracker.ietf.org/doc/html/rfc2119) use [broadcast](https://man7.org/linux/man-pages/man3/pthread_cond_broadcast.3p.html). |
| Checking `shutdown` outside the [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) | Reading a shared variable without the [lock](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) is a [data race](https://en.wikipedia.org/wiki/Race_condition). Always check inside the locked region. |
| Not calling [pthread_join()](https://man7.org/linux/man-pages/man3/pthread_join.3.html) | Without join, the main thread may exit while workers are still running. This causes undefined behavior. |
| Setting `shutdown` without [locking](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) | The write may not be visible to workers. Lock, set, broadcast, unlock — in that order. |

## Proof

```bash
./shutdown_test
# → task 0 done
# → ...
# → task 9 done
# → all workers joined

echo $?
# → 0
```

## Hero visual

```
  main thread                workers sleeping on cond_wait
  ┌───────────────┐         ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
  │ set shutdown=1│         │  W0  │ │  W1  │ │  W2  │ │  W3  │
  │ broadcast()   │────────▶│ wake │ │ wake │ │ wake │ │ wake │
  │ join(W0)      │         │ exit │ │ exit │ │ exit │ │ exit │
  │ join(W1)      │         └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘
  │ join(W2)      │◀───────────┘────────┘────────┘────────┘
  │ join(W3)      │         all threads return
  │ "all joined"  │
  └───────────────┘
```

## Future Lock

- In [W05 L04](04-io-cpu-handoff.md) you will connect the [event loop (W03)](../../../parts/w03/part.md) to this pool — the loop pushes tasks and the pool runs them safely.
- In [W05 L05](05-error-propagation.md) you will handle the case where a task fails — the error [MUST](https://datatracker.ietf.org/doc/html/rfc2119) travel back to the [event loop](../../../parts/w03/part.md).
- In [W06](../../../parts/w06/part.md) you will build [backpressure](../../../parts/w06/part.md) — when the queue is full and shutdown has not been called, the producer blocks instead of dropping tasks.
- In [W09](../../../parts/w09/part.md) you will shut down the [KV store](../../../parts/w09/part.md) pool during server exit, draining in-flight commands first.
