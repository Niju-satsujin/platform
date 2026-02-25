---
id: w21-l02
title: "Metrics Counters"
order: 2
duration_minutes: 25
xp: 50
kind: lesson
part: w21
proof:
  type: paste
  instructions: "Paste the metrics output after running a workload showing request counts, error counts, and latency percentiles."
  regex_patterns:
    - "p50|p95|p99|percentile"
    - "count|total"
---

## Concept

Now wire the Metrics class into your actual code. Every time `issue()` is called, record the latency and whether it succeeded or failed. Same for `verify()`, `revoke()`, and `generate_receipt()`. After running a workload, you should be able to print a summary: total requests, error count, error rate, and latency at p50/p95/p99.

In C terms, this is like adding `gettimeofday()` calls before and after each function. The difference in C++ is that you can use RAII to do this automatically: create a `Timer` object at the start of the function, and its destructor records the elapsed time when the function returns (or throws).

This pattern is called "instrumentation" — you are adding measurement points to your code without changing its behavior. The code still does the same thing, but now it also reports how it is doing.

## Task

1. Create a `ScopedTimer` class that takes a reference to the Metrics object and an operation name. The constructor records the start time, the destructor computes the duration and calls `metrics.record_latency(op, duration)`
2. Add `ScopedTimer` to `issue()`, `verify()`, `revoke()`, and `generate_receipt()`
3. Add `metrics.record_success(op)` / `metrics.record_error(op)` at success/failure points
4. Implement `metrics.print_summary()` that prints: total requests, errors, error rate, p50/p95/p99 latency for each operation
5. Run a workload: issue 100 documents, verify 50, revoke 5, generate 50 receipts. Print the summary.

## Hints

- `ScopedTimer` constructor: `start_ = std::chrono::high_resolution_clock::now();`
- `ScopedTimer` destructor: `auto end = now(); metrics_.record_latency(op_, duration(end - start_));`
- Use `try/catch` around operations — catch records an error, no catch records a success
- For p50/p95/p99: sort the latency vector, p50 = value at index N/2, p95 = value at index N*0.95, etc.
- Print like: `issue: 100 total, 0 errors (0.0%), p50=2.1ms p95=4.3ms p99=8.7ms`

## Verify

```bash
cd build && ./civictrust_metrics_demo
```

Summary printed with counts and latency percentiles for each operation.

## Done When

Your code is instrumented with automatic latency recording and you can print a metrics summary after any workload.
