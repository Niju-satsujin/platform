---
id: w05-l02
title: "Worker Lifecycle"
order: 2
type: lesson
duration_min: 120
---

# Worker Lifecycle

## Goal

Spawn a fixed number of [worker threads](https://man7.org/linux/man-pages/man3/pthread_create.3.html) that pull tasks from the [task queue (L01)](01-task-queue-contract.md) and execute them.

## What you build

A `struct thread_pool` that owns an array of [pthread_t](https://man7.org/linux/man-pages/man3/pthread_create.3.html) handles and a pointer to the shared [task queue](01-task-queue-contract.md). On init, it calls [pthread_create()](https://man7.org/linux/man-pages/man3/pthread_create.3.html) for each worker. Each worker runs a loop: call `task_queue_pop()`, execute the task's [function pointer](https://en.cppreference.com/w/c/language/pointer#Pointers_to_functions), repeat.

## Why it matters

Creating a thread per request is expensive — [pthread_create()](https://man7.org/linux/man-pages/man3/pthread_create.3.html) allocates a stack (default 8 MB on Linux). A pool pre-creates a small, fixed number of threads and reuses them. This is how [nginx worker processes](https://nginx.org/en/docs/), [Java's cached thread pool](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/Executors.html#newFixedThreadPool(int)), and [libuv's thread pool](https://docs.libuv.org/en/v1.x/threadpool.html) work. You control the parallelism level and keep memory bounded.

---

## Training Session

### Warmup

Read the DESCRIPTION section of [pthread_create()](https://man7.org/linux/man-pages/man3/pthread_create.3.html). Write down:

1. The signature of the start routine: `void *(*start_routine)(void *)`.
2. What the fourth argument (`arg`) is for — it passes data to the new thread.
3. What [pthread_join()](https://man7.org/linux/man-pages/man3/pthread_join.3.html) does — the calling thread blocks until the target thread exits.

### Work

#### Do

1. Create `w05/thread_pool.h`.
2. Define `struct thread_pool` with:
   - An array of [pthread_t](https://man7.org/linux/man-pages/man3/pthread_create.3.html) (fixed size, e.g. 4).
   - `num_threads` — how many workers.
   - A pointer to the `struct task_queue` from [L01](01-task-queue-contract.md).
3. Create `w05/thread_pool.c`.
4. Write `thread_pool_init()`:
   - Store `num_threads` and the queue pointer.
   - Call [pthread_create()](https://man7.org/linux/man-pages/man3/pthread_create.3.html) in a loop to spawn each worker. Pass the queue pointer as `arg`.
5. Write the worker function `worker_loop()`:
   - Cast the `arg` back to `struct task_queue *`.
   - Loop forever: call `task_queue_pop()`, then call `task.fn(task.arg)`.
6. Write a `main()` test:
   - Create a queue with capacity 8.
   - Create a pool with 4 workers.
   - Push 20 tasks. Each task prints its ID and the [pthread_self()](https://man7.org/linux/man-pages/man3/pthread_self.3.html) thread ID.
   - After pushing all tasks, sleep briefly and observe the output.

#### Test

```bash
gcc -Wall -Wextra -pthread -o pool_test w05/thread_pool.c w05/task_queue.c
./pool_test
```

#### Expected

Twenty lines of output. Different tasks show different thread IDs. No two tasks with the same thread ID run at the same instant. No crashes.

#### Prove

```bash
./pool_test 2>&1 | awk '{print $NF}' | sort -u | wc -l
```

The output shows at most 4 unique thread IDs — one per worker.

#### Ship

```bash
git add w05/thread_pool.h w05/thread_pool.c
git commit -m "w05-l02: thread pool with fixed workers"
```

---

## Done when

- [pthread_create()](https://man7.org/linux/man-pages/man3/pthread_create.3.html) is called exactly `num_threads` times.
- Each worker loops on `task_queue_pop()` and executes the returned task.
- 20 tasks run across 4 workers without data races.
- [Helgrind](https://valgrind.org/docs/manual/hg-manual.html) reports zero errors.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Passing a stack-local variable as `arg` to [pthread_create()](https://man7.org/linux/man-pages/man3/pthread_create.3.html) | The local may go out of scope before the thread reads it. Pass a [heap-allocated](https://man7.org/linux/man-pages/man3/malloc.3.html) pointer or a long-lived struct. |
| Forgetting `-pthread` flag | Without it, [pthread functions](https://man7.org/linux/man-pages/man3/pthread_create.3.html) may silently fail or not link. Always compile with `-pthread`. |
| Thread-per-request instead of pool | Spawning a thread per task wastes memory and time. The whole point is to reuse threads. |
| No way to stop workers | Workers loop forever. You will fix this in [L03](03-cancellation-shutdown.md) with a shutdown flag. |

## Proof

```bash
./pool_test
# → task  0 ran on thread 140234567890
# → task  1 ran on thread 140234567891
# → ...
# → task 19 ran on thread 140234567890
```

## Hero visual

```
  main thread                          workers
  ┌──────────────┐                   ┌──────────┐
  │ push task 0  │──┐               │ worker 0  │──▶ pop → run
  │ push task 1  │  │  task queue   │ worker 1  │──▶ pop → run
  │ push task 2  │  ├──▶ [T][T][T]  │ worker 2  │──▶ pop → run
  │ ...          │  │               │ worker 3  │──▶ pop → run
  │ push task 19 │──┘               └──────────┘
  └──────────────┘
       event loop                    thread pool
```

## Future Lock

- In [W05 L03](03-cancellation-shutdown.md) you will add a `shutdown` flag and [broadcast](https://man7.org/linux/man-pages/man3/pthread_cond_broadcast.3p.html) to wake all sleeping workers so they exit cleanly.
- In [W05 L04](04-io-cpu-handoff.md) you will connect the [event loop (W03)](../../../parts/w03/part.md) to this pool — the loop pushes tasks, workers execute them.
- In [W09](../../../parts/w09/part.md) each [KV store](../../../parts/w09/part.md) command will become a task that runs on a pool worker.
- In [W10](../../../parts/w10/part.md) the [WAL write](../../../parts/w10/part.md) path will submit durable-write tasks to the pool so the [event loop](../../../parts/w03/part.md) never blocks on disk IO.
