---
id: w01-l18
title: "Benchmark — measure append performance"
order: 18
duration_minutes: 25
xp: 75
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste benchmark output showing ops/sec for both no-fsync and fsync modes."
  regex_patterns:
    - "ops/sec"
    - "fsync"
---
# Benchmark — measure append performance

## Concept

You do not know if your code is fast or slow until you measure it. "It feels fast" is not data. You need a number: how many log entries per second can the trustlog write?

A simple benchmark:

1. Start a timer
2. Write N entries (e.g., 10,000)
3. Stop the timer
4. Calculate: N / elapsed_seconds = ops/sec

You run this twice:

- **Without fsync** — measures pure write speed (OS buffers everything)
- **With fsync after every write** — measures the disk bottleneck

The difference is dramatic. Without fsync, you might get 500,000 ops/sec. With fsync, you might get 500 ops/sec. That is a 1000x difference. This is why the FsyncPolicy exists — you choose the tradeoff per use case.

This benchmark becomes your **baseline**. Every future change must not make these numbers worse. If you refactor the trustlog in week 3 and ops/sec drops by 50%, you know you broke something.

## Task

1. Create `benchmark.cpp` that:
   - Creates a TrustLog with `FsyncPolicy::NONE`
   - Writes 10,000 entries with a fake clock (for consistency)
   - Measures elapsed time with `std::chrono::high_resolution_clock`
   - Prints: `"no-fsync: <N> ops/sec"`
   - Deletes the log file
   - Creates a TrustLog with `FsyncPolicy::EVERY_WRITE`
   - Writes 1,000 entries (fewer because fsync is slow)
   - Prints: `"fsync: <N> ops/sec"`
2. Add it to CMakeLists.txt as `add_executable(trustlog_benchmark benchmark.cpp)`
3. Record the numbers — write them in a comment at the top of benchmark.cpp

## Hints

- `auto start = std::chrono::high_resolution_clock::now();`
- `auto end = std::chrono::high_resolution_clock::now();`
- `double elapsed = std::chrono::duration<double>(end - start).count();`
- `double ops_per_sec = count / elapsed;`
- Use `std::fixed` and `std::setprecision(0)` for clean output
- Delete the log file between runs: `std::remove("bench.log");`
- Use a fake clock to avoid clock overhead polluting the measurement

## Verify

```bash
cmake --build build
./build/trustlog_benchmark
```

Expected output (your numbers will vary):

```text
no-fsync: 487231 ops/sec (10000 entries)
fsync: 423 ops/sec (1000 entries)
```

## Done When

Benchmark runs, prints ops/sec for both modes, and the numbers are recorded as your baseline.
