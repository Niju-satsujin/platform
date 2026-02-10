---
id: w06-part
title: "Week 06 — Backpressure & Overload Handling"
order: 6
theme: "Survivability under load: queues, limits, timeouts, shedding."
---

# Week 06 — Backpressure & Overload Handling

## 🖼️ Hero Visual

Picture a dam with a controlled spillway. Water rises behind the wall. When it reaches a marked line, the spillway opens and excess water flows safely away. The dam does not burst. Your server is the dam. Requests are the water. This week you build the spillway.

## Introduction

A server that accepts every request will eventually drown. The kernel buffers fill, latency climbs, and users see frozen screens. The fix is [backpressure](https://en.wikipedia.org/wiki/Back_pressure) — a set of controls that tell the world "I am full, come back later."

In [Week 04](../w04/part.md) you built an [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) server that accepts connections. In [Week 05](../w05/part.md) you gave it a [thread pool](https://en.wikipedia.org/wiki/Thread_pool) with a [bounded queue](https://en.wikipedia.org/wiki/Bounded_buffer_problem). This week you add the safety valves:

1. **Define limits** — decide how many requests your server can handle before quality drops.
2. **Load-shedding** — return [HTTP 503](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503) when the queue is full instead of queueing forever.
3. **Timeout strategy** — kill requests that take too long using [timerfd_create](https://man7.org/linux/man-pages/man2/timerfd_create.2.html).
4. **Retry budget** — stop [retry storms](https://en.wikipedia.org/wiki/Thundering_herd_problem) from making overload worse.
5. **Telemetry for overload** — measure [queue depth](https://en.wikipedia.org/wiki/Queue_(abstract_data_type)), [latency percentiles](https://en.wikipedia.org/wiki/Percentile), and shed count so you can see trouble before users do.
6. **Regression harness** — a load test that proves your limits hold after every code change.

By the end of this week your server will survive a flood of requests without crashing, without losing data, and without lying to clients.

## Connections

| Week | Link |
|------|------|
| W04 | [epoll server](../w04/part.md) — the base you are hardening |
| W05 | [thread pool / bounded queue](../w05/part.md) — the queue you now guard |
| W09 | [KV ops under load](../w09/part.md) — applies these controls to real storage traffic |
| W20 | [chaos & recovery drills](../w20/part.md) — tests these controls under failure injection |

## Project

Add [backpressure](https://en.wikipedia.org/wiki/Back_pressure) controls to the server: [bounded queue](https://en.wikipedia.org/wiki/Bounded_buffer_problem) admission, [503 load-shedding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503), per-request [timeouts](https://man7.org/linux/man-pages/man2/timerfd_create.2.html), [retry budgets](https://en.wikipedia.org/wiki/Thundering_herd_problem), and overload [telemetry](https://en.wikipedia.org/wiki/Telemetry).
