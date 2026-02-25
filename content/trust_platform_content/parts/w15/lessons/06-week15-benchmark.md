---
id: w15-l06
title: "Week 15 Benchmark"
order: 6
duration_minutes: 20
xp: 25
kind: lesson
part: w15
proof:
  type: paste
  instructions: "Paste your benchmark output showing append throughput, checkpoint time, and proof verification time."
  regex_patterns:
    - "entries/sec|ops/sec|throughput"
---

## Concept

Time to measure how your transparency log performs. You need to know three numbers: how fast can you append entries, how long does it take to generate a signed checkpoint, and how fast can you verify an inclusion proof. These numbers tell you whether your system can handle real workloads.

Appending entries involves hashing and adding to the Merkle tree. Checkpoint generation involves computing the root hash and signing it. Proof verification involves re-hashing up the tree. All of these should be fast — a well-implemented transparency log can handle thousands of entries per second.

## Task

Write a benchmark that measures:
1. **Append throughput**: append 10,000 entries to the log, measure total time, compute entries/sec
2. **Checkpoint generation time**: generate a signed checkpoint for a log with 10,000 entries, measure time in microseconds
3. **Inclusion proof generation + verification time**: for a log with 10,000 entries, generate and verify inclusion proofs for 100 random entries, compute average time per proof

Print results in a clear format with labels and units.

## Hints

- Use `std::chrono::high_resolution_clock` for timing
- Each entry can be a simple 64-byte random payload
- Warm up by running the operation once before measuring (avoids cold-start effects)
- For proof verification, measure generation and verification separately

## Verify

```bash
cd build && ./transparency_benchmark
```

You should see three measurements printed with units (entries/sec, microseconds, etc.).

## Done When

You have benchmark numbers for append throughput, checkpoint time, and proof verification time for a 10,000-entry log.
