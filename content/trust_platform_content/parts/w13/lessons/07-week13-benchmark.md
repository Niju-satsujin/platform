---
id: w13-l07
title: "Week 13 benchmark — store and retrieve throughput"
order: 7
duration_minutes: 20
xp: 25
kind: lesson
part: w13
proof:
  type: paste
  instructions: "Paste benchmark output showing ops/sec and MB/sec for 1KB, 64KB, 1MB, and 10MB file sizes."
  regex_patterns:
    - "ops/sec|ops/s"
    - "MB/sec|MB/s"
    - "1KB|64KB|1MB|10MB"
---
# Week 13 benchmark — store and retrieve throughput

## Concept

Your content-addressed store works correctly. Now measure how fast it is. Speed matters because this store will underpin everything you build in the coming weeks — Merkle trees, transparency logs, and more. If the base layer is slow, everything on top will be slow too.

Two metrics matter for a content store. First, operations per second (ops/sec): how many store or retrieve calls can you do in one second? This tells you the overhead of hashing, disk I/O, and your code. Second, megabytes per second (MB/sec): how fast can you push data through? This tells you whether hashing or disk is the bottleneck.

Test at four sizes: 1KB (many small objects, tests per-operation overhead), 64KB (one chunk boundary, the sweet spot), 1MB (medium files), and 10MB (large files, tests sustained throughput). You will likely see that ops/sec drops as size increases, but MB/sec increases — because the per-operation overhead becomes a smaller fraction of the total time.

## Task

1. Write a benchmark program that for each file size (1KB, 64KB, 1MB, 10MB):
   - Generates random data of that size
   - Times 100 store operations (or fewer for 10MB — 10 is fine), records elapsed time
   - Times the same number of retrieve operations, records elapsed time
   - Computes ops/sec and MB/sec for both store and retrieve
2. Print a results table
3. Use `std::chrono::high_resolution_clock` for timing
4. Use a fresh storage directory for each benchmark run

## Hints

- Generate random data: `std::vector<uint8_t> data(size); std::mt19937 rng(42); for (auto& b : data) b = rng();`
- For the 10MB test, 10 iterations is enough — it would take too long otherwise
- Compute ops/sec: `iterations / elapsed_seconds`
- Compute MB/sec: `(iterations * size_bytes / 1048576.0) / elapsed_seconds`
- Print a table like:
  ```
  Size      Store ops/s   Store MB/s   Retrieve ops/s   Retrieve MB/s
  1KB       8500          8.3          12000             11.7
  64KB      2100          131.2        3400              212.5
  1MB       180           180.0        250               250.0
  10MB      18            180.0        25                250.0
  ```
- Store the results in your project notes — you will compare these when you add Merkle trees

## Verify

```bash
g++ -std=c++17 -O2 -o cas_benchmark cas_benchmark.cpp -lssl -lcrypto
./cas_benchmark
```

Expected: a table of numbers. Exact values depend on your hardware, but store should be in the hundreds of MB/sec range for large files (limited by SHA-256 speed and disk I/O).

## Done When

You have recorded ops/sec and MB/sec for store and retrieve at all four file sizes.
