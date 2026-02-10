---
id: w06-l05
title: "Telemetry for Overload"
order: 5
type: lesson
duration_min: 45
---

# Telemetry for Overload

## Goal

Add [telemetry](https://en.wikipedia.org/wiki/Telemetry) to your server that continuously reports [queue depth](https://en.wikipedia.org/wiki/Queue_(abstract_data_type)), in-flight count, shed count, timeout count, retry-budget rejections, and [latency percentiles](https://en.wikipedia.org/wiki/Percentile) (p50, p95, p99) so you can see overload before users complain.

## What you build

A stats reporter that runs on a background [thread](https://en.wikipedia.org/wiki/Thread_(computing)), samples all counters every `stats_interval_ms`, computes [percentiles](https://en.wikipedia.org/wiki/Percentile) from a latency [histogram](https://en.wikipedia.org/wiki/Histogram), and writes a structured log line (or pushes to a stats file) on each tick.

## Why it matters

You cannot manage what you cannot measure. Without [telemetry](https://en.wikipedia.org/wiki/Telemetry) you only know about overload when users tell you — and by then it is too late. Percentile latencies are especially important because [averages hide outliers](https://en.wikipedia.org/wiki/Percentile#The_normal_distribution_and_percentiles). A p50 of 5 ms looks fine, but a p99 of 2000 ms means 1 in 100 users waits two seconds.

## Training Session

### Warmup — time measurement

1. Read the [clock_gettime](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) man page. Note the resolution of `CLOCK_MONOTONIC` on your system.
2. Write down the difference between [latency](https://en.wikipedia.org/wiki/Latency_(engineering)) and [throughput](https://en.wikipedia.org/wiki/Throughput). Give an example where one is good but the other is bad.
3. Read about [histograms](https://en.wikipedia.org/wiki/Histogram) for latency tracking. Why are histograms better than keeping every sample?

### Work — building the telemetry system

#### Do

1. Create a fixed-size [histogram](https://en.wikipedia.org/wiki/Histogram) with buckets: 1 ms, 5 ms, 10 ms, 25 ms, 50 ms, 100 ms, 250 ms, 500 ms, 1000 ms, and +Inf.
2. At the start of each request, call [clock_gettime](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) with `CLOCK_MONOTONIC` and store the timestamp.
3. At the end of each request (success, timeout, or shed), call [clock_gettime](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) again, compute the [elapsed time](https://en.wikipedia.org/wiki/Elapsed_real_time) in milliseconds, and increment the appropriate histogram bucket using [atomic_fetch_add](https://en.cppreference.com/w/c/atomic/atomic_fetch_add).
4. Create a stats thread that wakes every `stats_interval_ms` (default 1000) using [timerfd_create](https://man7.org/linux/man-pages/man2/timerfd_create.2.html).
5. On each tick the stats thread reads all [atomic counters](https://en.cppreference.com/w/c/atomic): `inflight`, `queue_depth`, `shed_count`, `timeout_count`, `retry_rejects`, plus the histogram buckets.
6. Compute p50, p95, and p99 from the histogram using [linear interpolation](https://en.wikipedia.org/wiki/Linear_interpolation) between bucket boundaries.
7. Print a single structured log line with all values. Format: `STATS ts=<epoch_ms> inflight=<n> queue=<n> shed=<n> timeout=<n> retry_reject=<n> p50=<ms> p95=<ms> p99=<ms>`.
8. After printing, reset the histogram buckets to zero for the next window.

#### Test

1. Start the server and let it idle for 5 seconds. Observe stats lines with all zeros.
2. Send 50 fast requests. Observe p50 near your handler time.
3. Send 5 slow requests (using the sleep handler from [Lesson 03](03-timeout-strategy.md)). Observe p99 jumping.
4. Trigger load-shedding from [Lesson 02](02-load-shedding.md). Observe `shed` count climbing.

#### Expected

- Idle: `inflight=0 queue=0 shed=0 timeout=0 retry_reject=0 p50=0 p95=0 p99=0`.
- After fast burst: `p50` between 1 and 10, `p99` slightly higher.
- After slow requests: `p99` near your configured timeout value.
- After shedding: `shed` matches the number of rejected requests.

### Prove — deeper understanding

1. Why reset the histogram every window instead of keeping a cumulative histogram? Discuss [staleness](https://en.wikipedia.org/wiki/Stale_data).
2. Explain what happens to your p99 calculation if the `+Inf` bucket has entries. Is that value still useful?
3. What is the overhead of calling [clock_gettime](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) twice per request? Read about [vDSO](https://en.wikipedia.org/wiki/VDSO) and explain why it is cheap on Linux.

### Ship — what to commit

- Histogram data structure and bucket logic.
- Stats thread with periodic reporting.
- Updated request path that records start and end times.

## Done when

- Stats line prints every `stats_interval_ms` with correct values.
- p50/p95/p99 reflect real request latencies (verify manually against known sleep durations).
- The stats thread does not block the request path.

## Common mistakes

| Mistake | Why it hurts |
|---------|-------------|
| Using wall-clock time ([CLOCK_REALTIME](https://man7.org/linux/man-pages/man2/clock_gettime.2.html)) for latency | [NTP](https://en.wikipedia.org/wiki/Network_Time_Protocol) jumps make some latencies negative |
| Computing average instead of [percentiles](https://en.wikipedia.org/wiki/Percentile) | Average hides the tail; 1% of users may suffer badly |
| Locking the histogram on every request | Creates [contention](https://en.wikipedia.org/wiki/Lock_(computer_science)#Granularity); use [atomics](https://en.cppreference.com/w/c/atomic) per bucket |
| Never resetting the histogram | Old data drowns recent spikes; you miss current overload |

## Proof

- Three consecutive stats log lines: one idle, one under normal load, one during overload.
- A brief note explaining what each field tells you about server health.

## 🖼️ Hero Visual

A cockpit dashboard with six gauges: In-Flight, Queue Depth, Shed Count, Timeout Count, Retry Rejects, and a [percentile](https://en.wikipedia.org/wiki/Percentile) meter showing p50/p95/p99 needles. The p99 needle is in the red zone. The pilot (operator) adjusts the throttle ([max_inflight](01-define-limits.md)) to bring it back to green.

## 🔮 Future Lock

In [Week 09](../../w09/part.md) you will add storage-layer [telemetry](https://en.wikipedia.org/wiki/Telemetry) (read latency, write latency, [compaction](https://en.wikipedia.org/wiki/Log-structured_merge-tree) stalls) and combine it with these server metrics for a unified health view. In [Week 20](../../w20/part.md) you will build automated alerts that trigger recovery actions when p99 exceeds a threshold.
