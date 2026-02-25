---
id: w03-l15
title: "Week 3 benchmark — envelope overhead"
order: 15
duration_minutes: 20
xp: 50
kind: lesson
part: w03
proof:
  type: paste
  instructions: "Paste benchmark output comparing raw framing (Week 2) throughput vs envelope framing throughput."
  regex_patterns:
    - "frames/sec|throughput"
    - "raw|envelope|overhead"
---
# Week 3 benchmark — envelope overhead

## Concept

Adding a 22-byte header to every message adds processing overhead: serialize, deserialize, validate. How much did it cost?

Run the same benchmark as Week 2 (50 clients × 100 frames) but now with the envelope protocol. Compare throughput and latency against your Week 2 numbers.

The difference is the **protocol overhead**. It should be small — serializing 22 bytes is fast. If throughput dropped more than 20%, something is wrong (maybe you are allocating memory per-frame or doing unnecessary copies).

This comparison teaches you to measure before and after every change. Intuition about performance is often wrong — measurement is the only truth.

## Task

1. Run your Week 2 stress test (raw framing) and record throughput
2. Run your Week 3 integration test (envelope framing) with the same parameters and record throughput
3. Calculate the overhead percentage: `(raw - envelope) / raw × 100`
4. If overhead > 20%, profile and optimize
5. Record both numbers in your project notes

## Hints

- Use the same client count and frame count for both tests to make the comparison fair
- The payload size should be the same (e.g., 100 bytes of data, plus the 22-byte header in the envelope version)
- Profile with: `g++ -pg ...` then `gprof` — or use `perf record` + `perf report` on Linux
- Common performance killers: allocating `std::vector` per frame (reuse a buffer), copying large payloads (use move semantics or pointers)

## Verify

```bash
# Run both benchmarks and compare
echo "Week 2 (raw):"
./stress_test --port 9000 --clients 50 --frames 100 --benchmark
echo "Week 3 (envelope):"
./integration_test --port 9000 --clients 50 --frames 100 --benchmark
```

Expected: envelope throughput is within 80-100% of raw throughput.

## Done When

You have recorded both numbers and the overhead is measured and documented.
