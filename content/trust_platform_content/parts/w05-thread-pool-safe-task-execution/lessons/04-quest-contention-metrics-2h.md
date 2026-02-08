---
id: w05-thread-pool-safe-task-execution-d04-quest-contention-metrics-2h
part: w05-thread-pool-safe-task-execution
title: "Quest: Contention Metrics  2h"
order: 4
duration_minutes: 120
prereqs: [w05-thread-pool-safe-task-execution-d03-quest-scheduling-policy-2h]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Contention Metrics  2h

## Goal

Instrument your thread pool to **measure contention** — lock wait time, queue wait time, and task execution time — so you can identify bottlenecks, compute p95 latencies, and make data-driven capacity decisions.

By end of this session you will have:

- ✅ A **lock wait time metric** measuring how long threads block on the queue mutex
- ✅ A **queue wait time metric** measuring how long tasks sit in the queue before a worker picks them up
- ✅ A **task execution time metric** measuring how long each task takes to process
- ✅ A **p95 computation** for queue wait time, broken down by task type
- ✅ A **throughput-latency tradeoff analysis** showing how adding workers affects both metrics

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Lock wait time measured with `steady_clock` around mutex acquisition | Review instrumented lock code |
| 2 | Queue wait time = dequeue_time - enqueue_time for every task | Check task timestamps |
| 3 | p95 queue wait computed per task type | Verify sorted-percentile or histogram |
| 4 | Throughput measured as tasks/second over 10s window | Check metric collection |
| 5 | Tradeoff analysis shows latency vs throughput at 2, 4, 8 workers | Run benchmark, plot |

## What You're Building Today

A metrics instrumentation layer for your thread pool that captures the three critical measurements of concurrent system health: how long you wait for locks, how long work waits in the queue, and how long work takes to execute.

By end of this session, you will have:

- ✅ File: `week-5/day4-contention-metrics.md`
- ✅ Instrumented `push()` and `pop()` with timing wrappers
- ✅ `MetricsCollector` class accumulating per-task timing data
- ✅ p95 computation and throughput calculation code

What "done" looks like:

```cpp
struct TaskMetrics {
    std::string task_type;
    std::string request_id;
    int64_t enqueue_time_us;     // when pushed into queue
    int64_t dequeue_time_us;     // when worker picked it up
    int64_t complete_time_us;    // when execution finished
    int64_t lock_wait_us;        // time spent waiting for mutex

    int64_t queue_wait() const { return dequeue_time_us - enqueue_time_us; }
    int64_t exec_time() const  { return complete_time_us - dequeue_time_us; }
};
```

You **can**: Measure exactly where time is spent in your thread pool and identify the bottleneck.
You **cannot yet**: Use these metrics to trigger graceful shutdown (Day 5) or dynamic load shedding (Week 6).

## Why This Matters

🔴 **Without this, you will:**
- Guess that "the server is slow" without knowing if the bottleneck is lock contention, queue depth, or task execution
- Add more worker threads and accidentally make performance worse (more contention, same throughput)
- Have no p95 metric — your average looks fine but 5% of users wait 10x longer
- Make capacity decisions based on intuition instead of data

🟢 **With this, you will:**
- Pinpoint the bottleneck: "p95 queue wait is 200ms but p95 execution is 5ms — the queue is the problem"
- Know exactly when adding workers helps (CPU-bound tasks) vs hurts (contention-bound tasks)
- Set SLO targets: "p95 queue wait < 50ms" and alert when violated
- Build the monitoring foundation used through Week 21 reliability hardening

🔗 **How this connects:**
- **To Day 2:** Queue wait time reveals if the bounded queue's capacity is correct
- **To Day 3:** Execution time validates the 5-second task budget is realistic
- **To Day 5:** Shutdown waits for in-flight tasks — execution time bounds the drain duration
- **To Week 6:** Backpressure triggers when queue wait exceeds a threshold
- **To Week 21:** SLO story uses these metrics to define reliability targets

🧠 **Mental model: "The Three Clocks"**

Every task passes through three time zones. Clock 1: **Lock wait** — how long the producer or consumer waits to acquire the mutex (contention). Clock 2: **Queue wait** — how long the task sits in the queue after being pushed until a worker picks it up (capacity). Clock 3: **Execution** — how long the worker spends processing the task (workload). The sum of all three is the end-to-end latency the client experiences. Each clock has a different fix: reduce lock scope for Clock 1, add workers for Clock 2, optimize code for Clock 3.

## Visual Model

```
┌──────────────────────────────────────────────────────────────┐
│              THE THREE CLOCKS OF TASK LATENCY                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  push()                pop()                    complete()   │
│    │                     │                          │        │
│    ▼                     ▼                          ▼        │
│  ──┬──────────┬──────────┬──────────────────────────┬──      │
│    │          │          │                          │        │
│    │ LOCK     │  QUEUE   │      EXECUTION           │        │
│    │ WAIT     │  WAIT    │      TIME                │        │
│    │ (μs)     │  (ms)    │      (ms)                │        │
│    │          │          │                          │        │
│  ──┴──────────┴──────────┴──────────────────────────┴──      │
│    t₀         t₁         t₂                         t₃      │
│                                                              │
│  Metrics captured:                                           │
│  ┌────────────────────────────────────────────────────┐      │
│  │ lock_wait   = t₁ - t₀   (mutex contention)        │      │
│  │ queue_wait  = t₂ - t₁   (capacity bottleneck)     │      │
│  │ exec_time   = t₃ - t₂   (workload intensity)      │      │
│  │ total       = t₃ - t₀   (client-visible latency)  │      │
│  └────────────────────────────────────────────────────┘      │
│                                                              │
│  Percentile computation:                                     │
│  sort all queue_wait values → p95 = sorted[N * 0.95]        │
│                                                              │
│  Throughput:                                                 │
│  tasks_completed / wall_clock_seconds                        │
└──────────────────────────────────────────────────────────────┘
```

## Build

File: `week-5/day4-contention-metrics.md`

## Do

1. **Instrument lock wait time**
   > 💡 *WHY: If your mutex is contended, threads spend more time waiting than working. Lock wait time reveals whether your critical section is too large or too many threads are competing for the same lock.*

   ```cpp
   // Wrapper that measures lock acquisition time
   class InstrumentedLock {
       std::mutex& mtx_;
       int64_t wait_us_ = 0;
   public:
       explicit InstrumentedLock(std::mutex& mtx) : mtx_(mtx) {
           auto start = std::chrono::steady_clock::now();
           mtx_.lock();
           auto end = std::chrono::steady_clock::now();
           wait_us_ = std::chrono::duration_cast<
               std::chrono::microseconds>(end - start).count();
       }
       ~InstrumentedLock() { mtx_.unlock(); }
       int64_t wait_us() const { return wait_us_; }

       InstrumentedLock(const InstrumentedLock&) = delete;
       InstrumentedLock& operator=(const InstrumentedLock&) = delete;
   };

   // Usage in pop():
   InstrumentedLock lock(mtx_);
   metrics.record_lock_wait(lock.wait_us());
   ```

2. **Instrument queue wait time with timestamps on every task**
   > 💡 *WHY: Queue wait time is the gap between "event loop enqueued this task" and "worker started processing it." If this grows, your workers can't keep up — you need more workers or less incoming work.*

   ```cpp
   std::optional<T> pop() {
       std::unique_lock<std::mutex> lock(mtx_);
       cv_.wait(lock, [this] { return !queue_.empty() || shutdown_; });
       if (queue_.empty()) return std::nullopt;

       T item = std::move(queue_.front());
       queue_.pop_front();
       lock.unlock();

       // Stamp dequeue time
       item.metrics.dequeue_time_us = microseconds_since_epoch();
       item.metrics.queue_wait_us =
           item.metrics.dequeue_time_us - item.metrics.enqueue_time_us;
       return item;
   }

   // In push():
   PushResult push(T item) {
       item.metrics.enqueue_time_us = microseconds_since_epoch();
       std::lock_guard<std::mutex> lock(mtx_);
       // ... capacity check, push, notify ...
   }
   ```

3. **Compute p95 queue wait per task type**
   > 💡 *WHY: Average hides outliers. If your average queue wait is 10ms but p95 is 500ms, 5% of users have a terrible experience. p95 is the standard SLO metric for latency-sensitive systems.*

   ```cpp
   class MetricsCollector {
       std::mutex mtx_;
       std::unordered_map<std::string, std::vector<int64_t>> queue_waits_;
   public:
       void record(const std::string& task_type, int64_t queue_wait_us) {
           std::lock_guard<std::mutex> lock(mtx_);
           queue_waits_[task_type].push_back(queue_wait_us);
       }

       int64_t p95_queue_wait(const std::string& task_type) {
           std::lock_guard<std::mutex> lock(mtx_);
           auto& waits = queue_waits_[task_type];
           if (waits.empty()) return 0;
           std::sort(waits.begin(), waits.end());
           size_t idx = static_cast<size_t>(waits.size() * 0.95);
           return waits[std::min(idx, waits.size() - 1)];
       }

       void dump_report() {
           std::lock_guard<std::mutex> lock(mtx_);
           for (const auto& [type, waits] : queue_waits_) {
               auto sorted = waits;
               std::sort(sorted.begin(), sorted.end());
               fprintf(stderr,
                   "type=%-10s count=%zu p50=%ldus p95=%ldus p99=%ldus\n",
                   type.c_str(), sorted.size(),
                   sorted[sorted.size() / 2],
                   sorted[(size_t)(sorted.size() * 0.95)],
                   sorted[(size_t)(sorted.size() * 0.99)]);
           }
       }
   };
   ```

4. **Measure throughput as tasks per second**
   > 💡 *WHY: Throughput and latency are often inversely correlated. Batching improves throughput but hurts latency. You need both measurements to find the optimal operating point.*

   ```cpp
   class ThroughputCounter {
       std::atomic<uint64_t> completed_{0};
       std::chrono::steady_clock::time_point window_start_;
       static constexpr auto WINDOW = std::chrono::seconds(10);
   public:
       ThroughputCounter()
           : window_start_(std::chrono::steady_clock::now()) {}

       void record_completion() { completed_++; }

       double tasks_per_second() {
           auto now = std::chrono::steady_clock::now();
           auto elapsed = std::chrono::duration_cast<
               std::chrono::milliseconds>(now - window_start_).count();
           if (elapsed == 0) return 0;
           return (completed_.load() * 1000.0) / elapsed;
       }
   };
   ```

5. **Run the throughput-latency tradeoff benchmark**
   > 💡 *WHY: More workers doesn't always mean better performance. Beyond a point, lock contention grows faster than throughput. This benchmark shows you where the diminishing returns start — so you pick the right worker count.*

   Run with 2, 4, 8 workers and fixed load:

   | Workers | Throughput (tasks/s) | p50 queue wait | p95 queue wait | Lock wait |
   |---------|---------------------|----------------|----------------|-----------|
   | 2 | ~500 | 20ms | 80ms | 5μs |
   | 4 | ~950 | 8ms | 30ms | 12μs |
   | 8 | ~1100 | 5ms | 25ms | 40μs |
   | 16 | ~1050 | 6ms | 35ms | 120μs |

   The table shows: throughput peaks at 8 workers. At 16, lock contention (120μs) causes throughput to drop. Your optimal worker count is approximately your CPU core count.

## Done when

- [ ] Lock wait time measured with `steady_clock` around every mutex acquisition — *reveals contention hotspots*
- [ ] Queue wait time = dequeue_time - enqueue_time on every task — *the key metric for capacity planning*
- [ ] p95 queue wait computed per task type with sorted-percentile — *SLO-ready metric, not just averages*
- [ ] Throughput measured as tasks/second over rolling window — *the complement to latency for capacity decisions*
- [ ] Tradeoff analysis at 2/4/8 workers shows where diminishing returns start — *data-driven worker count selection*

## Proof

Paste your `MetricsCollector` code, p95 computation output, and throughput-latency table, or upload `week-5/day4-contention-metrics.md`.

**Quick self-test** (answer without looking at your notes):

1. What does high lock wait time mean? → **Threads are spending more time waiting for the mutex than doing work. The fix is to reduce critical section size, shard the lock, or reduce the number of threads competing for it.**
2. Why measure p95 instead of average? → **Average hides tail latency. If 95% of tasks take 5ms and 5% take 500ms, the average is ~30ms — which looks fine but hides a terrible experience for 1 in 20 users.**
3. Why does adding workers sometimes decrease throughput? → **Each additional worker competes for the same mutex. Beyond the CPU core count, context-switching overhead and lock contention consume more CPU than the workers produce — throughput drops.**
