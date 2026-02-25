---
id: w04-l11
title: "Month 1 benchmark plan"
order: 11
duration_minutes: 15
xp: 25
kind: lesson
part: w04
proof:
  type: paste
  instructions: "Paste your benchmark plan listing what you will measure, at what parameters, and what numbers you expect."
  regex_patterns:
    - "measure|benchmark|plan"
---
# Month 1 benchmark plan

## Concept

Before running a benchmark, write down what you are measuring and what you expect. This prevents "fishing for good numbers" — the bias where you keep running benchmarks until you get a result you like.

Your Month 1 benchmark measures the complete system: logger + TCP server + envelope protocol + thread pool. You compare against earlier baselines:
- Week 1: logger ops/sec (no-fsync and fsync)
- Week 2: raw framing throughput (1, 10, 50 clients)
- Week 3: envelope throughput (with protocol overhead)
- Week 4: thread pool throughput (with parallel processing)

The benchmark matrix:

| Configuration | Clients | Frames | Workers | Queue |
|---|---|---|---|---|
| Single-thread (no pool) | 50 | 100 | 0 | - |
| Pool: 1 worker | 50 | 100 | 1 | 64 |
| Pool: 4 workers | 50 | 100 | 4 | 64 |
| Pool: 8 workers | 50 | 100 | 8 | 64 |

For each: record throughput (frames/sec) and average latency (ms).

## Task

1. Write down the benchmark matrix (configurations and parameters)
2. For each configuration, write your prediction (what throughput do you expect?)
3. Explain your reasoning (e.g., "4 workers should be ~4x faster than 1 worker because...")
4. Save this plan in `docs/month1-benchmark-plan.md`

## Hints

- 4 workers is NOT 4x faster if the bottleneck is I/O (the poll loop), not CPU
- If the poll loop is the bottleneck, adding more workers does not help — they just wait for work
- If workers are the bottleneck, adding more workers helps linearly until you hit another bottleneck
- Be honest in your predictions — being wrong is fine, it means you learned something

## Verify

Read your plan. Does it specify: what to measure, how to measure, what you expect, and why?

## Done When

The benchmark plan is written with predictions. You will compare predictions vs reality in the next lesson.
