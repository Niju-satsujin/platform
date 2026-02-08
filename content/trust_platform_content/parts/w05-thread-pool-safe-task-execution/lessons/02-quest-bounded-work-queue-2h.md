---
id: w05-thread-pool-safe-task-execution-d02-quest-bounded-work-queue-2h
part: w05-thread-pool-safe-task-execution
title: "Quest: Bounded Work Queue  2h"
order: 2
duration_minutes: 120
prereqs: [w05-thread-pool-safe-task-execution-d01-quest-concurrency-model-2h]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Bounded Work Queue  2h

## Goal

Implement a **bounded, thread-safe work queue** with producer-consumer semantics, condition-variable signaling, spurious wakeup protection, and an explicit rejection policy when the queue is full.

By end of this session you will have:

- ✅ A **BoundedQueue<T>** class with `push()` and `pop()` that are safe for concurrent use
- ✅ A **hard capacity limit** with explicit rejection behavior (not silent drop)
- ✅ A **condition-variable wait loop** that handles spurious wakeups correctly
- ✅ A **shutdown signal** that unblocks all waiting consumers
- ✅ A **test harness** proving correctness with multiple producers and consumers

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Queue enforces max capacity, rejects when full | Push 1001 items into capacity-1000 queue, verify rejection |
| 2 | `pop()` blocks until item available or shutdown | Verify consumer thread blocks, then unblocks on push |
| 3 | Spurious wakeup handled with predicate in wait loop | Check `wait(lock, predicate)` usage |
| 4 | Shutdown unblocks all consumers without data loss | Call shutdown, verify all consumers return |
| 5 | No data race under 4-producer + 4-consumer stress test | Run with ThreadSanitizer clean |

## What You're Building Today

The core shared data structure between your event-loop thread and worker threads: a bounded queue that safely transfers tasks from the single producer (event loop) to multiple consumers (worker threads).

By end of this session, you will have:

- ✅ File: `week-5/day2-bounded-queue-spec.md`
- ✅ `BoundedQueue<T>` with configurable max capacity
- ✅ `push()` returns enum: `OK`, `FULL`, `SHUTDOWN`
- ✅ `pop()` blocks with condition variable, returns `std::optional<T>`

What "done" looks like:

```cpp
enum class PushResult { OK, FULL, SHUTDOWN };

template<typename T>
class BoundedQueue {
    std::deque<T> queue_;
    std::mutex mtx_;
    std::condition_variable cv_;
    size_t max_capacity_;
    bool shutdown_ = false;
public:
    explicit BoundedQueue(size_t capacity) : max_capacity_(capacity) {}

    PushResult push(T item);
    std::optional<T> pop();     // blocks until item or shutdown
    void shutdown();            // unblock all waiters
    size_t size() const;
};
```

You **can**: Safely transfer tasks between threads with bounded memory usage and explicit overflow behavior.
You **cannot yet**: Schedule which task runs next (Day 3) or measure wait times (Day 4).

## Why This Matters

🔴 **Without this, you will:**
- Use an unbounded queue that grows until OOM kills your server during a traffic spike
- Miss the spurious wakeup from `condition_variable::wait()` and dequeue from an empty queue — undefined behavior
- Have no way to signal workers to stop, causing threads that block forever on `pop()` during shutdown
- Silently drop tasks when the queue is full, with no logging or backpressure signal

🟢 **With this, you will:**
- Bound memory usage: the queue holds at most N tasks, and push returns FULL beyond that
- Handle spurious wakeups correctly: the wait loop re-checks the predicate every time it wakes
- Shut down cleanly: `shutdown()` unblocks all consumers, who return `std::nullopt`
- Surface overload: a FULL return from `push()` triggers backpressure in the event loop (Week 6)

🔗 **How this connects:**
- **To Day 1:** This queue is the "narrow bridge" between threads in your ownership model
- **To Day 3:** The scheduling policy determines the order items are dequeued from this queue
- **To Day 4:** Contention metrics measure how long `push()` and `pop()` block on the mutex
- **To Day 5:** Graceful shutdown calls `queue.shutdown()` to drain and stop workers
- **To Week 6:** Backpressure logic checks `push()` return value — FULL triggers load shedding

🧠 **Mental model: "The Bouncer at the Door"**

The bounded queue is a nightclub with a capacity limit. The bouncer (max_capacity) counts people in. When full, new arrivals are rejected at the door — not squeezed in. The condition variable is the announcement system: "A spot opened up!" But sometimes the speaker crackles (spurious wakeup) and nobody actually left — so you check again before entering.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│              BOUNDED QUEUE INTERNALS                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Event Loop (producer)                                   │
│       │                                                  │
│       │ push(task)                                       │
│       ▼                                                  │
│  ┌─────────────────────────────────────────────────┐     │
│  │  mtx_.lock()                                    │     │
│  │  ┌─────────────────────────────────────────┐    │     │
│  │  │  if queue_.size() >= max_capacity_      │    │     │
│  │  │    → return FULL (reject)               │    │     │
│  │  │  else                                   │    │     │
│  │  │    → queue_.push_back(task)             │    │     │
│  │  │    → cv_.notify_one()                   │    │     │
│  │  └─────────────────────────────────────────┘    │     │
│  │  mtx_.unlock()                                  │     │
│  └─────────────────────────────────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────┐          │
│  │  queue_: [T₁] [T₂] [T₃] ... [Tₙ]         │          │
│  │          front ◀─── pop()   push() ──▶ back│          │
│  │  capacity: max_capacity_ = 1024            │          │
│  └────────────────────────────────────────────┘          │
│                                                          │
│  Worker Threads (consumers)                              │
│       │                                                  │
│       │ pop() — blocks on cv_.wait()                     │
│       ▼                                                  │
│  ┌─────────────────────────────────────────────────┐     │
│  │  mtx_.lock()                                    │     │
│  │  cv_.wait(lock, [&]{ return !empty || shutdown})│     │
│  │  if shutdown && empty → return nullopt          │     │
│  │  item = queue_.front(); queue_.pop_front()      │     │
│  │  mtx_.unlock()                                  │     │
│  │  return item                                    │     │
│  └─────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-5/day2-bounded-queue-spec.md`

## Do

1. **Implement the `push()` method with capacity check**
   > 💡 *WHY: An unbounded queue is a memory bomb. During a traffic spike, the event loop enqueues faster than workers dequeue — without a limit, the queue grows until OOM. Returning FULL is the signal for backpressure.*

   ```cpp
   PushResult push(T item) {
       std::lock_guard<std::mutex> lock(mtx_);
       if (shutdown_) return PushResult::SHUTDOWN;
       if (queue_.size() >= max_capacity_) return PushResult::FULL;
       queue_.push_back(std::move(item));
       cv_.notify_one();
       return PushResult::OK;
   }
   ```

   Key design choices:
   - `std::move(item)` avoids copying — tasks may contain large buffers
   - `notify_one()` wakes exactly one consumer (not all of them)
   - FULL is returned, not blocking — the caller decides what to do (reject, retry, shed)

2. **Implement the `pop()` method with spurious wakeup protection**
   > 💡 *WHY: `condition_variable::wait()` can wake up without anyone calling `notify`. The C++ standard explicitly permits this. If you don't re-check the predicate, you'll dequeue from an empty queue — which is undefined behavior on `std::deque`.*

   ```cpp
   std::optional<T> pop() {
       std::unique_lock<std::mutex> lock(mtx_);
       cv_.wait(lock, [this] {
           return !queue_.empty() || shutdown_;
       });
       // Re-check after wakeup: was it data or shutdown?
       if (queue_.empty()) return std::nullopt;  // shutdown with empty queue
       T item = std::move(queue_.front());
       queue_.pop_front();
       return item;
   }
   ```

   Critical details:
   - `unique_lock` (not `lock_guard`) because `wait()` needs to unlock/relock
   - Lambda predicate re-checks condition on every wakeup (spurious or real)
   - Returns `nullopt` on shutdown — caller must check and exit gracefully

3. **Implement the `shutdown()` method**
   > 💡 *WHY: Without a shutdown signal, workers block on `pop()` forever. The main thread calls `join()`, the worker is stuck in `wait()`, and your program hangs on exit. `shutdown()` sets a flag and wakes everyone.*

   ```cpp
   void shutdown() {
       {
           std::lock_guard<std::mutex> lock(mtx_);
           shutdown_ = true;
       }
       cv_.notify_all();  // wake ALL waiting consumers
   }
   ```

   Why `notify_all()` not `notify_one()`: every blocked consumer must wake up, check the shutdown flag, and exit. If you use `notify_one()`, only one wakes — the rest hang forever.

4. **Define the rejection behavior for FULL**
   > 💡 *WHY: When `push()` returns FULL, the event loop must decide: reject the request (503), apply backpressure (stop reading from that client), or drop the oldest task. This decision is policy — the queue just reports the condition.*

   | Strategy | Behavior | Tradeoff |
   |----------|----------|----------|
   | Reject (503) | Respond with 503, close connection | Fast recovery, client retries |
   | Backpressure | Stop reading from overloading clients | Preserves in-flight requests |
   | Drop oldest | Remove front of queue, push new | Prioritizes recent work |
   | Block producer | Event loop blocks until space | **DANGEROUS** — blocks all I/O |

   ```cpp
   // In event loop, after parsing request:
   PushResult result = task_queue.push(std::move(task));
   if (result == PushResult::FULL) {
       // Policy: reject with 503 Service Unavailable
       send_error_response(client_fd, 503, "Server busy");
       // Metric: increment overload_rejects counter
       metrics.overload_rejects++;
   }
   ```

5. **Write a multi-threaded stress test**
   > 💡 *WHY: Concurrency bugs are invisible without stress testing. A queue that works with 1 producer and 1 consumer can fail with 4 of each. Run with ThreadSanitizer (`-fsanitize=thread`) to catch data races the test harness won't.*

   ```cpp
   void stress_test() {
       BoundedQueue<int> q(100);
       std::atomic<int> produced{0}, consumed{0};

       // 4 producers: push 1000 items each
       std::vector<std::thread> producers;
       for (int i = 0; i < 4; i++) {
           producers.emplace_back([&, i] {
               for (int j = 0; j < 1000; j++) {
                   while (q.push(i * 1000 + j) == PushResult::FULL)
                       std::this_thread::yield();  // back off
                   produced++;
               }
           });
       }

       // 4 consumers: pop until shutdown
       std::vector<std::thread> consumers;
       for (int i = 0; i < 4; i++) {
           consumers.emplace_back([&] {
               while (auto item = q.pop()) {
                   consumed++;
               }
           });
       }

       for (auto& t : producers) t.join();
       q.shutdown();  // signal consumers to stop
       for (auto& t : consumers) t.join();

       assert(produced == 4000);
       assert(consumed == 4000);  // zero loss
   }

   // Compile: g++ -fsanitize=thread -g -o test test.cpp -lpthread
   ```

## Done when

- [ ] `BoundedQueue<T>` enforces hard capacity limit with `PushResult::FULL` return — *prevents OOM under traffic spikes*
- [ ] `pop()` uses `cv_.wait(lock, predicate)` protecting against spurious wakeups — *no empty-queue dequeue*
- [ ] `shutdown()` sets flag and calls `notify_all()` to unblock all consumers — *clean exit, no hanging threads*
- [ ] Rejection policy documented: what the event loop does when push returns FULL — *the bridge to Week 6 backpressure*
- [ ] Stress test with 4 producers + 4 consumers passes with zero data loss — *proves correctness under contention*

## Proof

Paste your `BoundedQueue` implementation, stress test results, and ThreadSanitizer output, or upload `week-5/day2-bounded-queue-spec.md`.

**Quick self-test** (answer without looking at your notes):

1. What is a spurious wakeup and how do you handle it? → **A `condition_variable::wait()` can return even though no one called `notify`. You handle it by using the predicate overload: `cv.wait(lock, [&]{ return !empty || shutdown; })` which re-checks the condition on every wakeup.**
2. Why use `notify_all()` in shutdown but `notify_one()` in push? → **Push adds one item for one consumer — waking all would cause N-1 threads to wake, find nothing, and sleep again (thundering herd). Shutdown must wake ALL consumers so they can all observe the flag and exit.**
3. Why is blocking the producer on a full queue dangerous? → **The producer is the event-loop thread. If it blocks, no I/O happens — all clients freeze, timers stop firing, and the server is effectively dead.**
