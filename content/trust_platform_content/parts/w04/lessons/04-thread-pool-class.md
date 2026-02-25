---
id: w04-l04
title: "Build the thread pool"
order: 4
duration_minutes: 30
xp: 75
kind: lesson
part: w04
proof:
  type: paste
  instructions: "Paste your ThreadPool class definition and a test showing it executes 100 tasks across 4 worker threads."
  regex_patterns:
    - "ThreadPool"
    - "worker|thread"
---
# Build the thread pool

## Concept

A thread pool is a fixed set of worker threads and a work queue. You create N threads at startup — they loop forever, pulling tasks from the queue and executing them. When you submit work, it goes into the queue. When a worker finishes a task, it pulls the next one.

The pool has three operations:
- **Constructor** — creates N worker threads
- **submit(task)** — adds a task to the queue
- **shutdown()** — stops the queue and joins all threads

A task is a `std::function<void()>` — a callable that takes no arguments and returns nothing. The caller wraps their work in a lambda:

```cpp
pool.submit([&]() {
    // process the request
});
```

This is the same pattern used by every production thread pool: Java's `ExecutorService`, Go's goroutine scheduler, Rust's `rayon`.

## Task

1. Implement `class ThreadPool` with:
   - Constructor takes `num_threads` and `queue_size`
   - Creates a `WorkQueue<std::function<void()>>` with the given queue size
   - Spawns `num_threads` worker threads, each looping: pop from queue, execute, repeat
   - `bool submit(std::function<void()> task)` — pushes the task to the queue
   - `void shutdown()` — shuts down the queue and joins all worker threads
2. Test: submit 100 tasks, each incrementing an atomic counter. After all tasks complete, assert counter == 100.

## Hints

- Worker thread function: `while (auto task = queue.pop()) { (*task)(); }`
- `#include <functional>` for `std::function`
- `#include <atomic>` for `std::atomic<int>` — safe to increment from multiple threads without a mutex
- `std::atomic<int> counter{0}; pool.submit([&counter]() { counter++; });`
- After submitting all tasks, call `pool.shutdown()` — this waits for all queued tasks to finish
- Check: `assert(counter.load() == 100);`

## Verify

```bash
g++ -std=c++17 -lpthread -o test_pool test_pool.cpp
./test_pool
echo "exit code: $?"
```

Expected: counter is exactly 100, exit code 0.

## Done When

ThreadPool executes 100 tasks across 4 workers with an atomic counter reaching exactly 100.
