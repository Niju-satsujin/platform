---
id: w04-l01
title: "C++ threads — the basics"
order: 1
duration_minutes: 25
xp: 50
kind: lesson
part: w04
proof:
  type: paste
  instructions: "Paste output showing 4 threads running, each printing its thread ID, then main thread joining all 4."
  regex_patterns:
    - "thread|id"
    - "join|finish"
---
# C++ threads — the basics

## Concept

In C, you create threads with `pthread_create()` — it takes a function pointer and a void* argument. You join with `pthread_join()`. It works but it is clunky: casting void pointers, managing thread IDs manually.

C++ wraps this in `std::thread`:

```cpp
void worker(int id) {
    std::cout << "thread " << id << " running\n";
}

std::thread t(worker, 42);  // creates and starts the thread
t.join();                     // waits for it to finish
```

That is it. No void pointers, no casts. The thread starts immediately when you create the object.

Key rules:
- You MUST call `.join()` or `.detach()` before the `std::thread` object is destroyed. Otherwise the destructor calls `std::terminate()` and your program crashes.
- `.join()` blocks until the thread finishes.
- `.detach()` lets the thread run independently (rarely what you want).
- `std::thread` is move-only — you cannot copy it, only move it.

`std::this_thread::get_id()` returns the current thread's ID. Useful for debugging.

## Task

1. Write a program that creates 4 threads
2. Each thread prints: `"thread <id> started"` then sleeps 1 second then prints `"thread <id> done"`
3. Main thread joins all 4
4. Main thread prints `"all threads finished"`
5. Compile and run — verify all 4 threads run concurrently (total time ~1 second, not 4 seconds)

## Hints

- `#include <thread>` for std::thread
- `#include <chrono>` and `std::this_thread::sleep_for(std::chrono::seconds(1))` for sleep
- Store threads in a vector: `std::vector<std::thread> threads;`
- `threads.emplace_back(worker, i);` — creates and starts a thread in the vector
- Join all: `for (auto& t : threads) t.join();`
- Compile with `-lpthread`: `g++ -std=c++17 -lpthread -o threads threads.cpp`

## Verify

```bash
g++ -std=c++17 -lpthread -o threads threads.cpp
time ./threads
```

Expected: 4 "started" messages appear quickly, then after ~1 second, 4 "done" messages, then "all threads finished." Total time ~1 second.

## Done When

4 threads run concurrently and the total execution time is ~1 second (not 4 seconds).
