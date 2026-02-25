---
id: w04-l15
title: "Week 4 benchmark — thread pool impact"
order: 15
duration_minutes: 20
xp: 50
kind: lesson
part: w04
proof:
  type: paste
  instructions: "Paste comparison table: single-threaded vs pooled throughput, showing the improvement from the thread pool."
  regex_patterns:
    - "throughput|frames/sec"
    - "single|pool|worker"
---
# Week 4 benchmark — thread pool impact

## Concept

You ran the Month 1 benchmark in lesson 12. Now distill it into the key comparison: **single-threaded server vs thread-pool server**.

This single comparison tells you whether the thread pool was worth building. If the pooled server is 2-3x faster than the single-threaded server with 50 clients, the parallel processing paid off. If it is the same speed, the bottleneck is elsewhere (probably the single-threaded poll loop).

Also compare against your Week 2 raw framing numbers. The full chain of overhead:
```
Week 2 raw framing → Week 3 envelope overhead → Week 4 thread pool
```

Each step either adds overhead (serialization) or removes it (parallel processing). The final number tells you the net effect.

## Task

1. Extract the key numbers from your Month 1 benchmark:
   - Single-threaded throughput (no pool)
   - 4-worker pool throughput
   - Week 2 raw throughput (from your notes)
2. Calculate improvement: `(pool - single) / single × 100`
3. Calculate net overhead vs raw framing: `(raw - pool) / raw × 100`
4. Write a one-paragraph summary of what you learned

## Hints

- If pool throughput < raw throughput, the protocol overhead is larger than the parallelism gain
- If pool throughput > raw throughput, parallelism more than compensates for overhead
- The paragraph should answer: "Was the thread pool worth it? Where is the remaining bottleneck?"

## Verify

Review your comparison table. Does it tell a clear story about system performance?

## Done When

You have a single table comparing all 4 weeks of throughput numbers and a paragraph explaining the trends.
