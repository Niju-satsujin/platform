---
id: w04-l07
title: "Measure lock contention"
order: 7
duration_minutes: 25
xp: 50
kind: lesson
part: w04
proof:
  type: paste
  instructions: "Paste contention metrics showing time spent waiting for locks vs time spent doing work."
  regex_patterns:
    - "contention|wait|lock"
    - "ms|microsec"
---
# Measure lock contention

## Concept

A mutex protects shared data but costs time. When a thread tries to lock a mutex that another thread holds, it has to wait. This waiting time is called **contention**.

High contention means threads spend more time waiting than working — your thread pool is not actually parallel, it is mostly serialized on the lock.

You measure contention by timing how long `lock()` takes:

```cpp
auto start = std::chrono::high_resolution_clock::now();
mtx.lock();
auto end = std::chrono::high_resolution_clock::now();
double wait_ms = std::chrono::duration<double, std::milli>(end - start).count();
```

If `wait_ms` is usually 0 (or close to 0), contention is low — the lock is rarely contested. If `wait_ms` is often > 1ms, you have a problem.

Common causes of high contention:
- Lock held too long (doing work inside the lock that should be outside)
- Too many threads competing for one lock
- Queue too small (producers and consumers constantly competing)

## Task

1. Add timing around every lock acquisition in your WorkQueue
2. Track: total wait time, max wait time, count of acquisitions
3. Print contention stats at shutdown
4. Run the stress test and check contention numbers
5. If contention is high (>10% of total time), optimize: hold the lock for less time, or increase queue size

## Hints

- Use `std::chrono::high_resolution_clock` for timing
- Track stats in atomic variables (so the timing code itself does not add contention)
- `std::atomic<uint64_t> total_wait_ns{0};`
- At shutdown: `double pct = total_wait_ns / (total_work_ns + total_wait_ns) * 100;`
- Low contention: <1% of time waiting. Moderate: 1-10%. High: >10%.

## Verify

```bash
./server --port 9000 --workers 4 &
./stress_test --port 9000 --clients 50 --frames 100
kill -INT $(pgrep server)
```

Expected: server prints contention stats at shutdown. Wait time should be a small percentage of total time.

## Done When

Contention is measured and documented. If it exceeds 10%, you have identified the cause.
