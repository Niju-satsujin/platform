---
id: w05-l09
title: "Week 5 benchmark — hashing throughput"
order: 9
duration_minutes: 25
xp: 50
kind: lesson
part: w05
proof:
  type: paste
  instructions: "Paste your benchmark output showing MB/s throughput for single-shot and streaming hash at 1 KB, 1 MB, and 100 MB data sizes."
  regex_patterns:
    - "MB/s|throughput|bytes.*sec"
    - "1.*KB|1.*MB|100.*MB"
---
# Week 5 benchmark — hashing throughput

## Concept

How fast is SHA-256? You need to know, because hashing happens on every message your server processes. If hashing takes longer than network I/O, it becomes the bottleneck.

The metric is **throughput**: megabytes of data hashed per second. Modern hardware can hash at gigabytes per second, so SHA-256 should not be your bottleneck — but you should measure to be sure.

Your benchmark should test two dimensions:

1. **Data size** — hash 1 KB, 1 MB, and 100 MB of data. Smaller data has higher per-call overhead (function call setup, state initialization). Larger data amortizes the overhead and approaches the algorithm's peak throughput.
2. **Method** — compare single-shot (`crypto_hash_sha256()`) vs streaming (`init/update/final` with 4 KB chunks). They should produce the same hash, but the streaming version has more function calls. Is the overhead measurable?

For each test, hash the same data multiple times (at least 10 iterations for small data, at least 3 for 100 MB), measure total time, and compute MB/s.

Use `std::chrono::high_resolution_clock` for timing, the same approach you used in Week 2. Generate test data once with random bytes, then hash it repeatedly.

Record these numbers. They are your Week 5 baseline. When you add encryption in later weeks, you will compare encryption throughput against hashing throughput.

## Task

1. Write a benchmark program that measures SHA-256 throughput
2. Test three data sizes: 1 KB, 1 MB, 100 MB
3. For each size, run both single-shot and streaming hash, measure time, compute MB/s
4. Run enough iterations for stable results (at least 100 iterations for 1 KB, 10 for 1 MB, 3 for 100 MB)
5. Print a results table with data size, method, and throughput in MB/s

## Hints

- Generate random data: `randombytes_buf(data.data(), data.size())` — libsodium's random fill function
- Timing: `auto t0 = std::chrono::high_resolution_clock::now();` ... `auto t1 = ...;`
- MB/s: `(total_bytes / 1e6) / elapsed_seconds`
- Single-shot: `crypto_hash_sha256(hash, data.data(), data.size())`
- Streaming: init, update in 4096-byte chunks, final
- Use `std::vector<unsigned char>` for data buffers
- Print table: `printf("%-10s %-12s %8.1f MB/s\n", size, method, throughput)`

## Verify

```bash
cmake --build build
./build/hash_benchmark
```

Expected output (numbers will vary by hardware):
```
Size       Method       Throughput
1 KB       single-shot     450.2 MB/s
1 KB       streaming       380.5 MB/s
1 MB       single-shot     520.1 MB/s
1 MB       streaming       515.3 MB/s
100 MB     single-shot     530.0 MB/s
100 MB     streaming       528.7 MB/s
```

## Done When

You have throughput numbers in MB/s for all six combinations (3 sizes x 2 methods) and the results are consistent across runs.
