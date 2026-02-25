---
id: w04-l02
title: "Mutex and condition variable"
order: 2
duration_minutes: 30
xp: 75
kind: lesson
part: w04
proof:
  type: paste
  instructions: "Paste output of a producer-consumer test: 1 producer pushing 100 items, 4 consumers each pulling items, total consumed = 100."
  regex_patterns:
    - "produced|consumed"
    - "100|total"
---
# Mutex and condition variable

## Concept

When multiple threads access shared data, you get **data races** — two threads read and write the same variable at the same time, and the result is unpredictable.

In C, you fix this with `pthread_mutex_lock()` / `pthread_mutex_unlock()`. C++ wraps this in `std::mutex`:

```cpp
std::mutex mtx;
mtx.lock();
// ... access shared data ...
mtx.unlock();
```

But calling lock/unlock manually is error-prone (what if you forget to unlock?). C++ has `std::lock_guard` — a RAII wrapper that locks in the constructor and unlocks in the destructor:

```cpp
{
    std::lock_guard<std::mutex> lock(mtx);
    // ... access shared data ...
}  // automatically unlocked here
```

A **condition variable** lets a thread wait until something happens. Instead of spinning in a loop ("is there work yet? is there work yet?"), the thread sleeps and is woken up when work arrives:

```cpp
std::condition_variable cv;
std::unique_lock<std::mutex> lock(mtx);
cv.wait(lock, [&]{ return !queue.empty(); });  // sleep until queue is not empty
```

`cv.notify_one()` wakes one waiting thread. `cv.notify_all()` wakes all of them.

## Task

1. Write a producer-consumer program:
   - Shared data: `std::queue<int>` protected by a mutex
   - 1 producer thread pushes numbers 1-100 into the queue
   - 4 consumer threads pop from the queue and count how many items they consumed
   - Consumers use a condition variable to wait when the queue is empty
   - Producer calls `cv.notify_one()` after each push
2. When the producer is done, it signals "no more work" (e.g., pushes a sentinel value -1)
3. Print each consumer's count. The total must be exactly 100.

## Hints

- `#include <mutex>` for `std::mutex`, `std::lock_guard`, `std::unique_lock`
- `#include <condition_variable>` for `std::condition_variable`
- `#include <queue>` for `std::queue`
- `cv.wait(lock, predicate)` — the lock must be a `std::unique_lock` (not lock_guard)
- After the producer finishes, push 4 sentinel values (-1) so all 4 consumers can exit
- Or use a shared `bool done` flag and `cv.notify_all()` when done

## Verify

```bash
g++ -std=c++17 -lpthread -o prodcon prodcon.cpp
./prodcon
```

Expected: 4 consumers print their counts, total = 100. No items lost, no items duplicated.

## Done When

Producer-consumer works with zero lost items and zero duplicates across 4 consumer threads.
