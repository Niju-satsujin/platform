---
id: w05-l01
title: "Task Queue Contract"
order: 1
type: lesson
duration_min: 120
---

# Task Queue Contract

## Goal

Design a bounded [task queue](https://en.wikipedia.org/wiki/Queue_(abstract_data_type)) protected by a [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html). Define the rules every producer and consumer [MUST](https://datatracker.ietf.org/doc/html/rfc2119) follow.

## What you build

A `struct task_queue` backed by a fixed-size [circular buffer](https://en.wikipedia.org/wiki/Circular_buffer). One [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) guards all reads and writes. A [condition variable](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html) wakes sleeping consumers when a task arrives. A second [condition variable](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html) wakes sleeping producers when space opens. The queue enforces a capacity limit — producers block when the queue is full.

## Why it matters

Your [event loop from W03](../../../parts/w03/part.md) runs on one thread. If it calls a slow hash or a big sort, every client stalls. A [thread pool](https://en.wikipedia.org/wiki/Thread_pool) solves this — but only if the queue between the [event loop](../../../parts/w03/part.md) and the workers is safe. A single data race here can corrupt every task. The [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) and [condition variable](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html) pattern you learn today is the same one used inside [libuv](https://docs.libuv.org/en/v1.x/), [Java's ThreadPoolExecutor](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html), and [Go's runtime scheduler](https://go.dev/src/runtime/proc.go).

---

## Training Session

### Warmup

Read the DESCRIPTION section of [pthread_mutex_lock()](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html). Write down:

1. What happens when a thread calls [pthread_mutex_lock()](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) while another thread holds the [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html).
2. What [pthread_cond_wait()](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html) does with the [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) — it releases it, sleeps, then re-acquires it on wakeup.

### Work

#### Do

1. Create `w05/task_queue.h`.
2. Define `struct task` with a [function pointer](https://en.cppreference.com/w/c/language/pointer#Pointers_to_functions) `void (*fn)(void *arg)` and a `void *arg`.
3. Define `struct task_queue` with:
   - A fixed-size array of `struct task` (the [circular buffer](https://en.wikipedia.org/wiki/Circular_buffer)).
   - `head`, `tail`, `count`, `capacity` integers.
   - One [pthread_mutex_t](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html).
   - Two [pthread_cond_t](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html) — `not_empty` and `not_full`.
4. Create `w05/task_queue.c`.
5. Write `task_queue_init()` — set capacity, zero the counters, call [pthread_mutex_init()](https://man7.org/linux/man-pages/man3/pthread_mutex_init.3p.html) and [pthread_cond_init()](https://man7.org/linux/man-pages/man3/pthread_cond_init.3p.html).
6. Write `task_queue_push()`:
   - [Lock](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) the [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html).
   - While `count == capacity`, call [pthread_cond_wait()](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html) on `not_full`.
   - Insert the task at `tail`. Advance `tail` with modulo. Increment `count`.
   - [Signal](https://man7.org/linux/man-pages/man3/pthread_cond_signal.3p.html) `not_empty`.
   - [Unlock](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) the [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html).
7. Write `task_queue_pop()`:
   - [Lock](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) the [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html).
   - While `count == 0`, call [pthread_cond_wait()](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html) on `not_empty`.
   - Remove the task at `head`. Advance `head` with modulo. Decrement `count`.
   - [Signal](https://man7.org/linux/man-pages/man3/pthread_cond_signal.3p.html) `not_full`.
   - [Unlock](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) the [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html).
   - Return the task.
8. Write a `main()` test: push 5 tasks from the main thread, pop and run them on the main thread. Print what each task does.

#### Test

```bash
gcc -Wall -Wextra -pthread -o task_queue_test w05/task_queue.c
./task_queue_test
```

#### Expected

Five lines of output, one per task, in FIFO order. No crashes, no hangs.

#### Prove

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html) to confirm no memory errors:

```bash
valgrind --tool=helgrind ./task_queue_test
```

Zero errors reported.

#### Ship

```bash
git add w05/task_queue.h w05/task_queue.c
git commit -m "w05-l01: bounded task queue with mutex and condvar"
```

---

## Done when

- `task_queue_push()` blocks when the queue is full.
- `task_queue_pop()` blocks when the queue is empty.
- Both use [pthread_cond_wait()](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html) inside a `while` loop — never an `if`.
- [Helgrind](https://valgrind.org/docs/manual/hg-manual.html) reports zero data races.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Using `if` instead of `while` before [pthread_cond_wait()](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html) | [Spurious wakeups](https://en.wikipedia.org/wiki/Spurious_wakeup) happen. Always re-check the predicate in a `while` loop. |
| Forgetting to [unlock](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) on an error path | Every [lock](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a matching [unlock](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html). |
| Signalling before inserting the task | The woken thread sees an empty queue and sleeps again. Insert first, then [signal](https://man7.org/linux/man-pages/man3/pthread_cond_signal.3p.html). |
| Unbounded queue | Without a capacity limit, a fast producer can exhaust memory. Bounded queues give [backpressure (W06)](../../../parts/w06/part.md). |

## Proof

```bash
./task_queue_test
# → task 0 done
# → task 1 done
# → task 2 done
# → task 3 done
# → task 4 done
```

## Hero visual

```
  producer (event loop)         task queue (bounded)          consumer (worker)
  ┌────────────────┐          ┌───┬───┬───┬───┬───┐         ┌────────────────┐
  │ push(task)     │────────▶ │ T │ T │ T │   │   │ ──────▶ │ pop() → run()  │
  │                │  mutex   │ 0 │ 1 │ 2 │   │   │  mutex  │                │
  └────────────────┘  + cond  └───┴───┴───┴───┴───┘  + cond └────────────────┘
                               head          tail
                               count=3   capacity=5
```

## Future Lock

- In [W05 L02](02-worker-lifecycle.md) you will spawn real [worker threads](https://man7.org/linux/man-pages/man3/pthread_create.3.html) that call `task_queue_pop()` in a loop.
- In [W05 L03](03-cancellation-shutdown.md) you will add a `shutdown` flag so workers exit cleanly when there is no more work.
- In [W06](../../../parts/w06/part.md) you will use the bounded queue to implement [backpressure](../../../parts/w06/part.md) — when the pool is full, the [event loop](../../../parts/w03/part.md) stops accepting new requests.
- In [W09](../../../parts/w09/part.md) the [KV store](../../../parts/w09/part.md) will push GET/SET/DEL tasks onto this same queue.
