---
id: w06-quiz
title: "Quiz — Backpressure & Overload Handling"
order: 8
type: quiz
duration_min: 20
---

# Quiz — Backpressure & Overload Handling

---

## Multiple Choice

### Q1 — Admission control counter

What type should you use for the `inflight` counter that is incremented and decremented from multiple [threads](https://en.wikipedia.org/wiki/Thread_(computing))?

- A) A plain `int` protected by a [mutex](https://en.wikipedia.org/wiki/Mutual_exclusion)
- B) An [atomic integer](https://en.cppreference.com/w/c/atomic)
- C) A `volatile int`
- D) A thread-local `int`

**Answer: B**

`volatile` does not guarantee [atomicity](https://en.wikipedia.org/wiki/Linearizability). A [mutex](https://en.wikipedia.org/wiki/Mutual_exclusion) works but adds unnecessary [contention](https://en.wikipedia.org/wiki/Lock_(computer_science)#Granularity) for a single counter. Thread-local variables are per-thread and cannot be shared. An [atomic integer](https://en.cppreference.com/w/c/atomic) provides correct, lock-free updates.

---

### Q2 — Correct HTTP status for overload

When the server's [bounded queue](https://en.wikipedia.org/wiki/Bounded_buffer_problem) is full and it cannot accept more work, which [HTTP status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) should it return?

- A) [400 Bad Request](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400)
- B) [500 Internal Server Error](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500)
- C) [503 Service Unavailable](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503)
- D) [504 Gateway Timeout](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504)

**Answer: C**

[503](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503) means the server is temporarily unable to handle the request due to overload. [500](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500) implies a bug. [504](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504) implies an upstream timeout, not a local queue issue.

---

### Q3 — Purpose of Retry-After

What does the [Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) header tell a client?

- A) The server will retry the request internally
- B) How many seconds the client should wait before retrying
- C) The maximum number of retries allowed
- D) The URL to redirect the retry to

**Answer: B**

[Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) specifies a delay in seconds (or a date) that a well-behaved client should wait before sending the same request again.

---

### Q4 — Timer mechanism

Why is [timerfd_create](https://man7.org/linux/man-pages/man2/timerfd_create.2.html) preferred over [alarm](https://man7.org/linux/man-pages/man2/alarm.2.html) for per-request timeouts in a [multithreaded](https://en.wikipedia.org/wiki/Multithreading_(computer_architecture)) server?

- A) `timerfd_create` is faster
- B) `alarm` uses [signals](https://en.wikipedia.org/wiki/Signal_(IPC)) which are process-wide, not per-thread
- C) `alarm` only works on 32-bit systems
- D) `timerfd_create` does not need a [file descriptor](https://en.wikipedia.org/wiki/File_descriptor)

**Answer: B**

[alarm](https://man7.org/linux/man-pages/man2/alarm.2.html) delivers [SIGALRM](https://en.wikipedia.org/wiki/Signal_(IPC)) to the process, not to a specific thread. [timerfd_create](https://man7.org/linux/man-pages/man2/timerfd_create.2.html) returns a [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) that can be monitored per-request with [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html).

---

### Q5 — Clock choice

Which clock should you use with [clock_gettime](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) for measuring request [latency](https://en.wikipedia.org/wiki/Latency_(engineering))?

- A) `CLOCK_REALTIME`
- B) `CLOCK_MONOTONIC`
- C) `CLOCK_PROCESS_CPUTIME_ID`
- D) `CLOCK_THREAD_CPUTIME_ID`

**Answer: B**

[CLOCK_MONOTONIC](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) is not affected by [NTP](https://en.wikipedia.org/wiki/Network_Time_Protocol) adjustments or wall-clock jumps. `CLOCK_REALTIME` can jump forward or backward. CPU-time clocks measure only CPU usage, not [elapsed wall time](https://en.wikipedia.org/wiki/Elapsed_real_time).

---

### Q6 — Retry storm cause

What is a [retry storm](https://en.wikipedia.org/wiki/Thundering_herd_problem)?

- A) A storm of new requests from new clients
- B) Many clients retrying failed requests simultaneously, amplifying the overload
- C) The server retrying its own internal operations
- D) A network packet storm caused by [TCP retransmission](https://en.wikipedia.org/wiki/Retransmission_(data_networks))

**Answer: B**

A [retry storm](https://en.wikipedia.org/wiki/Thundering_herd_problem) happens when failures cause many clients to retry at the same time. The retries add to the already excessive load, making recovery impossible without a [retry budget](https://sre.google/sre-book/handling-overload/).

---

### Q7 — Histogram vs average

Why should overload [telemetry](https://en.wikipedia.org/wiki/Telemetry) report [percentile](https://en.wikipedia.org/wiki/Percentile) latencies (p50, p95, p99) instead of just the average?

- A) Percentiles are easier to compute
- B) Averages hide tail latency — a few slow requests can ruin user experience while the average looks fine
- C) Percentiles use less memory
- D) Averages are not mathematically valid for latency data

**Answer: B**

An average of 10 ms could hide a [p99](https://en.wikipedia.org/wiki/Percentile) of 2000 ms. [Percentiles](https://en.wikipedia.org/wiki/Percentile) reveal the distribution and show how the worst-affected users experience your service.

---

### Q8 — Regression harness purpose

What does the [regression harness](https://en.wikipedia.org/wiki/Regression_testing) prove?

- A) That the server can handle infinite load
- B) That backpressure controls still work correctly after code changes
- C) That the server compiles without errors
- D) That the server passes unit tests

**Answer: B**

A [regression harness](https://en.wikipedia.org/wiki/Regression_testing) specifically tests that previously working behavior — in this case [backpressure](https://en.wikipedia.org/wiki/Back_pressure) controls — has not been broken by new changes. It is a [load test](https://en.wikipedia.org/wiki/Load_testing) with automated pass/fail checks.

---

## Short Answer

### Q9 — Little's Law

State [Little's Law](https://en.wikipedia.org/wiki/Little%27s_law) and explain each variable. Then explain how you would use it to determine the `max_inflight` value for a server whose average request takes 20 ms and must keep [p99 latency](https://en.wikipedia.org/wiki/Percentile) below 200 ms.

**Expected answer:** [Little's Law](https://en.wikipedia.org/wiki/Little%27s_law): L = λ × W, where L is the average number of items in the system, λ is the arrival rate, and W is the average time each item spends in the system. If W = 20 ms and we want L capped so queuing does not push p99 past 200 ms, we solve for L given our target throughput. For example, with 500 req/s: L = 500 × 0.020 = 10. So `max_inflight` = 10.

---

### Q10 — File descriptor leak

Describe what happens if the server sends a [503 response](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503) but forgets to close the client [socket](https://en.wikipedia.org/wiki/Network_socket). Explain the chain of events that leads to the server being unable to accept any new connections.

**Expected answer:** Each unclosed socket is a leaked [file descriptor](https://en.wikipedia.org/wiki/File_descriptor). Over time the open fd count grows. When it hits the per-process limit (`ulimit -n`), [accept](https://man7.org/linux/man-pages/man2/accept.2.html) returns `EMFILE` and the server cannot open any new connections. It is now fully dead even though the [CPU](https://en.wikipedia.org/wiki/Central_processing_unit) is idle.

---

### Q11 — Retry budget window

Explain why the [retry budget](https://sre.google/sre-book/handling-overload/) uses a time window for its counters instead of tracking retries over the entire lifetime of the server.

**Expected answer:** A lifetime counter means a burst of retries from hours ago still counts against the budget now, when the server is healthy. The budget would be permanently depleted after any spike. A time window (e.g., 10 seconds) ensures the budget reflects only recent traffic, allowing the server to accept retries again once the overload has passed.

---

### Q12 — Load-shedding placement

Explain why the [load-shedding](https://en.wikipedia.org/wiki/Load_shedding) check must happen before the request is placed on the [thread pool](https://en.wikipedia.org/wiki/Thread_pool) queue, not inside the worker thread.

**Expected answer:** If the check happens inside the worker, the request has already consumed a queue slot. The purpose of shedding is to prevent the queue from growing beyond its limit. By the time a worker runs, the damage (queue pressure, memory use, latency for other queued items) has already been done. The check must be at the admission point, before [enqueue](https://en.wikipedia.org/wiki/Queue_(abstract_data_type)).

---

## Read-the-Output

### Q13 — Stats line analysis

You see this [telemetry](https://en.wikipedia.org/wiki/Telemetry) stats line from your server:

```
STATS ts=1700000000 inflight=10 queue=5 shed=47 timeout=3 retry_reject=12 p50=8 p95=95 p99=480
```

Answer the following:

1. Is the server at capacity? How do you know?
2. Is the [timeout strategy](lessons/03-timeout-strategy.md) working? What evidence supports your answer?
3. Are clients respecting the [Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) header? What does `retry_reject=12` suggest?

**Expected answer:**
1. Yes — `inflight=10` matches `max_inflight` and `queue=5` matches `max_queue_depth`. Both limits are hit. `shed=47` confirms many requests are being turned away.
2. Yes — `timeout=3` means three slow requests were killed by the [timerfd](https://man7.org/linux/man-pages/man2/timerfd_create.2.html) deadline. `p99=480` is below the 500 ms timeout, meaning the timeout prevented latencies from running away.
3. Some clients are not backing off properly. `retry_reject=12` means 12 retries exceeded the [retry budget](https://sre.google/sre-book/handling-overload/), indicating clients are retrying too aggressively.

---

### Q14 — Regression harness output

Your [regression harness](lessons/06-regression-harness.md) prints:

```
Phase 1 (normal):   10/10 requests returned 200         [PASS]
Phase 2 (overload): 30 requests sent, 0 returned 503    [FAIL]
  ASSERT FAILED: shed count must be > 0, got 0
Phase 3 (slow):     5 slow requests, timeout_count=5     [PASS]
Phase 4 (retries):  retry_reject=4                       [PASS]
RESULT: FAIL
```

Answer the following:

1. Which [backpressure](https://en.wikipedia.org/wiki/Back_pressure) control is broken?
2. What is the most likely code change that caused this regression?
3. If you had not run the harness, how would this bug manifest in production?

**Expected answer:**
1. [Load-shedding](https://en.wikipedia.org/wiki/Load_shedding) from [Lesson 02](lessons/02-load-shedding.md) is broken — shed count is 0 despite 30 requests exceeding capacity.
2. The most likely cause is that the queue depth check before enqueue was removed or bypassed, so all requests enter the queue regardless of depth. Or `max_queue_depth` was set to an extremely high value.
3. In production, the server would accept all requests into the queue. The queue would grow without bound, consuming memory. Latency for all users would spike because queued requests wait longer. Eventually the server would run out of memory or hit fd limits and crash — a [cascading failure](https://en.wikipedia.org/wiki/Cascading_failure).
