---
id: w14-l07
title: "Week 14 benchmark"
order: 7
duration_minutes: 20
xp: 25
kind: lesson
part: w14
proof:
  type: paste
  instructions: "Paste the benchmark output showing tree construction time, proof generation time, and proof verification time for trees with 100, 1000, 10000, and 100000 leaves."
  regex_patterns:
    - "construct|build"
    - "proof|inclusion"
    - "verif"
    - "\\d+.*ms|\\d+.*us|\\d+.*ns"
---
# Week 14 benchmark

## Concept

You built it. Now measure it. Merkle trees are supposed to be fast — construction is O(N), proof generation is O(log N), and verification is O(log N). But big-O tells you the shape, not the actual number. Is construction for 100,000 items 10 milliseconds or 10 seconds? You need to measure.

Benchmarking tells you if your implementation is practical. It also tells you where the time goes. If construction for 100,000 items takes 5 seconds, something is wrong — maybe you are copying vectors instead of moving them, or hashing hex strings instead of raw bytes. The benchmark points you to the problem.

Measure three operations: tree construction (building the full tree from a list of items), inclusion proof generation (producing the proof for one leaf), and inclusion proof verification (checking the proof against the root). Measure each at four scales: 100, 1000, 10000, and 100000 leaves. This gives you 12 data points that show how each operation scales.

## Task

1. Write a benchmark program called `merkle_bench`
2. For each tree size (100, 1000, 10000, 100000):
   - Generate that many random data items
   - Measure tree construction time: build the `MerkleTree` and record how long it takes
   - Measure proof generation time: generate an inclusion proof for a random leaf and record the time
   - Measure verification time: verify the proof and record the time
3. Run each measurement 3 times and report the median
4. Print a formatted table with columns: tree size, construction time, proof time, verification time
5. Include the proof size (number of hashes) for each tree size

## Hints

- Use `std::chrono::high_resolution_clock` for timing — same as your previous benchmarks
- For tree construction, the timer should cover only the `MerkleTree` constructor, not the data generation
- For proof generation and verification, the times will be very small (microseconds). You might need to run each operation 1000 times in a loop and divide by 1000 to get a stable measurement
- Expected ballpark numbers: construction ~1ms for 1000 items, ~10ms for 10000, ~100ms for 100000. Proof and verification should be under 100 microseconds regardless of tree size
- If construction is slower than expected, check for unnecessary copies. `std::move` your vectors
- If proof generation scales linearly instead of logarithmically, you might be searching for the leaf linearly instead of using the index directly
- The proof size should be: 7 hashes for 100 leaves, 10 for 1000, 14 for 10000, 17 for 100000 (approximately ceil(log2(N)))

## Verify

```bash
cd build && cmake .. && make merkle_bench && ./merkle_bench
```

Expected output (your times will differ):
```
Merkle Tree Benchmark
=====================
Leaves  | Construction | Proof Gen  | Verification | Proof Size
--------|-------------|------------|--------------|----------
100     | 0.2 ms      | 1.5 us     | 1.2 us       | 7 hashes
1000    | 1.8 ms      | 2.1 us     | 1.8 us       | 10 hashes
10000   | 18.5 ms     | 2.8 us     | 2.3 us       | 14 hashes
100000  | 195.0 ms    | 3.5 us     | 3.0 us       | 17 hashes
```

## Done When

You have a benchmark table with construction, proof generation, and verification times for all four tree sizes, and the numbers confirm that proof operations scale logarithmically.
