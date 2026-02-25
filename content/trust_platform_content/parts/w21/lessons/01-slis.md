---
id: w21-l01
title: "Service Level Indicators"
order: 1
duration_minutes: 25
xp: 50
kind: lesson
part: w21
proof:
  type: paste
  instructions: "Paste your list of SLIs with their definitions and measurement methods."
  regex_patterns:
    - "SLI|indicator"
    - "latency|error|availability"
---

## Concept

A Service Level Indicator (SLI) is a measurement that tells you how well your system is performing. Think of it like the gauges on a car dashboard: speed, fuel level, engine temperature. Each gauge measures one specific thing. If you only had one gauge, you could not understand the full picture.

For CivicTrust, the important SLIs are: **availability** (what percentage of requests succeed?), **latency** (how long does each operation take?), **error rate** (what percentage of requests fail?), and **throughput** (how many operations per second?). Each SLI needs a precise definition. For example, "latency" could mean the time from request received to response sent, measured at the 50th percentile (median), 95th percentile, and 99th percentile.

Google's SRE book defines SLIs as the building blocks of reliability. You cannot improve what you do not measure. Before setting any targets (SLOs) or alerts, you first define exactly what you are measuring and how.

## Task

1. Define SLIs for CivicTrust. For each operation (issue, verify, revoke, receipt generation, offline verification), define:
   - What is measured (e.g., "time from request to response")
   - How it is measured (e.g., "timer starts when function is called, stops when it returns")
   - Units (e.g., milliseconds, percentage, count)
2. Write these definitions in a `docs/sli-definitions.txt` file
3. Implement a `Metrics` class with methods to record each SLI: `record_latency(operation, duration)`, `record_success(operation)`, `record_error(operation)`

## Hints

- Start with 4 operations: issue, verify, revoke, generate_receipt
- For latency: use `std::chrono::high_resolution_clock` to measure each operation
- For success/error: increment a counter after each operation completes or fails
- Store metrics in `std::unordered_map<std::string, std::vector<double>>` for latencies and `std::unordered_map<std::string, uint64_t>` for counts
- Percentile calculation: sort the latency vector, pick the value at index `floor(N * percentile)`

## Verify

```bash
cd build && ctest --output-on-failure -R sli
```

SLI definitions documented, Metrics class records latencies and counts correctly.

## Done When

You have documented SLI definitions for all operations and a Metrics class that records them.
