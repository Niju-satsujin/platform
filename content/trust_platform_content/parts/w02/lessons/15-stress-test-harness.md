---
id: w02-l15
title: "Stress test harness — spawn many clients"
order: 15
duration_minutes: 30
xp: 75
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste your stress test code structure showing how it spawns client threads and collects results."
  regex_patterns:
    - "thread|spawn|client"
    - "result|count|pass"
---
# Stress test harness — spawn many clients

## Concept

You need to prove your server works under load, not just with one `nc` session. A stress test is a program that:

1. Spawns N client threads
2. Each thread connects to the server
3. Each thread sends M framed messages and verifies the echoes
4. Each thread reports: pass (all echoes matched) or fail (mismatch or error)
5. The main thread collects all results and prints a summary

In C, you would use `pthread_create()`. In C++, use `std::thread`:

```cpp
std::thread t(function, arg1, arg2);
t.join();  // wait for thread to finish
```

To collect results from multiple threads, each thread writes to its own slot in a results array (no locking needed since each thread writes to a different index).

The stress test is a separate executable — it does not share code with the server. It is a client program that runs many concurrent connections.

## Task

1. Create `stress_test.cpp` with command-line options:
   - `--port` (default 9000)
   - `--clients` (default 50)
   - `--frames` (default 100)
2. Spawn `--clients` threads, each running a client function
3. Each client function:
   - Connects to the server
   - Sends `--frames` framed messages (payload = "client-<id>-frame-<n>")
   - Receives each echo and verifies it matches
   - Returns a result struct: `{client_id, frames_sent, frames_ok, error_message}`
4. Main thread joins all threads and prints summary:
   - `"50 clients, 100 frames each, 5000 total, 0 failures"`

## Hints

- `#include <thread>` and `#include <vector>`
- `std::vector<std::thread> threads;`
- `threads.emplace_back(client_fn, client_id, port, frames);`
- For results: `std::vector<Result> results(num_clients);` — each thread writes to `results[id]`
- Use `std::to_string(id)` to create unique payloads per client
- If connect fails, record it as a failure (do not crash the entire test)

## Verify

```bash
g++ -std=c++17 -o stress_test stress_test.cpp -lpthread
# (no server running yet — just verify it compiles)
```

Expected: compiles without errors. The actual test run is the next lesson.

## Done When

The stress test harness compiles and the thread-spawning logic is ready. Each client thread connects, sends frames, and collects results.
