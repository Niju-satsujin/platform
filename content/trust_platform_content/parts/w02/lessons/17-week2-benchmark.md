---
id: w02-l17
title: "Week 2 benchmark — throughput and latency"
order: 17
duration_minutes: 20
xp: 50
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste benchmark output showing frames/sec and average latency for 1, 10, and 50 clients."
  regex_patterns:
    - "frames/sec|fps|throughput"
    - "latency|ms"
---
# Week 2 benchmark — throughput and latency

## Concept

Your stress test proves correctness (zero failures). Now you measure performance: how fast is the server?

Two metrics matter:
- **Throughput** — total frames per second across all clients
- **Latency** — average time from sending a frame to receiving the echo (round-trip)

You already have the stress test harness. Add timing to each frame round-trip:

```cpp
auto start = std::chrono::high_resolution_clock::now();
send_frame(...);
recv_frame(...);
auto end = std::chrono::high_resolution_clock::now();
double latency_ms = std::chrono::duration<double, std::milli>(end - start).count();
```

Run the benchmark at different scales: 1 client, 10 clients, 50 clients. You will see throughput increase (more clients = more parallelism) and latency increase (more clients = more contention).

Record these numbers. They are your Week 2 baseline — you will compare against them when you add the thread pool in Week 4.

## Task

1. Add a `--benchmark` flag to your stress test
2. Each client thread times every frame round-trip and collects latencies
3. Main thread computes: total throughput (all frames / elapsed time), average latency
4. Run with 1, 10, and 50 clients (100 frames each)
5. Print a results table

## Hints

- Use `std::chrono::high_resolution_clock` for timing
- Throughput = total_frames / total_elapsed_seconds
- Collect per-frame latencies in a vector, compute avg/min/max
- Print: `"clients: 50, throughput: 12345 fps, avg latency: 2.3ms"`
- Store results in your project notes — you compare these in Week 4

## Verify

```bash
# Terminal 1
./echo_server --port 9000 --max-clients 100

# Terminal 2
./stress_test --port 9000 --clients 1 --frames 100 --benchmark
./stress_test --port 9000 --clients 10 --frames 100 --benchmark
./stress_test --port 9000 --clients 50 --frames 100 --benchmark
```

Expected: three sets of numbers. Throughput increases with more clients. Latency increases slightly.

## Done When

You have recorded throughput and latency numbers for 1, 10, and 50 clients.
