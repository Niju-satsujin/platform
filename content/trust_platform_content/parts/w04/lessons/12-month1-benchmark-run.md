---
id: w04-l12
title: "Month 1 benchmark run"
order: 12
duration_minutes: 25
xp: 75
kind: lesson
part: w04
proof:
  type: paste
  instructions: "Paste the complete benchmark results table and a comparison of predictions vs actual numbers."
  regex_patterns:
    - "frames/sec|throughput"
    - "worker|pool"
---
# Month 1 benchmark run

## Concept

Now you run the benchmark matrix from your plan and compare reality against predictions.

For each configuration:
1. Start the server with the specified parameters
2. Run the stress test with 50 clients × 100 frames
3. Record throughput and latency
4. Kill the server, start the next configuration

After all runs, compare:
- Did adding workers improve throughput?
- Was the improvement linear (4x for 4 workers) or sub-linear?
- Where is the bottleneck — poll loop, worker threads, or network?
- How did your predictions compare to reality?

The insights from this benchmark guide your future work. If the poll loop is the bottleneck, you need epoll or io_uring. If workers are the bottleneck, you need faster processing.

## Task

1. Run all 4 configurations from your benchmark plan
2. Record throughput and latency for each
3. Compare predictions vs actual results — write one sentence per configuration explaining the difference
4. Identify the primary bottleneck
5. Save results in `docs/month1-benchmark-results.md`

## Hints

- Run each benchmark 3 times and take the median to reduce noise
- Kill the server between runs: `kill -INT $(pgrep server); sleep 1`
- Tabulate results clearly:

```
| Config    | Workers | Throughput (fps) | Avg Latency (ms) | Prediction | Delta |
|-----------|---------|------------------|-------------------|------------|-------|
| No pool   | 0       | ???              | ???               | ???        | ???   |
| 1 worker  | 1       | ???              | ???               | ???        | ???   |
| 4 workers | 4       | ???              | ???               | ???        | ???   |
| 8 workers | 8       | ???              | ???               | ???        | ???   |
```

## Verify

Does your results table have all 4 configurations with throughput, latency, and a comparison to predictions?

## Done When

All benchmarks are run, results documented, predictions compared, and the bottleneck is identified.
