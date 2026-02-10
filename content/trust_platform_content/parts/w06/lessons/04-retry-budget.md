---
id: w06-l04
title: "Retry Budget"
order: 4
type: lesson
duration_min: 40
---

# Retry Budget

## Goal

Implement a [retry budget](https://sre.google/sre-book/handling-overload/) that limits the percentage of requests that may be retries, preventing a [retry storm](https://en.wikipedia.org/wiki/Thundering_herd_problem) from turning a small overload into a total collapse.

## What you build

A token-bucket–style [rate limiter](https://en.wikipedia.org/wiki/Rate_limiting) that tracks the ratio of retries to fresh requests. When retries exceed a configured percentage (for example 10%), the server rejects them immediately with [HTTP 503](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503) and a `Retry-After` header.

## Why it matters

When a server returns an error, well-behaved clients [retry](https://en.wikipedia.org/wiki/Exponential_backoff). But if many clients retry at the same time, the retries themselves become the load. The server recovers for a moment, gets slammed by retries, fails again, and the cycle repeats. This is a [retry storm](https://en.wikipedia.org/wiki/Thundering_herd_problem). A retry budget breaks the cycle by saying: "only 10% of my traffic may be retries; the rest get an immediate no."

## Training Session

### Warmup — understanding retry amplification

1. Imagine 100 clients each send 1 request. The server fails 50. Each of the 50 retries once. Now there are 150 requests hitting an already overloaded server. Write the formula for total load with `n` retries per failure.
2. Read about [exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff). Explain why backoff alone is not enough without a budget.
3. Read the Google SRE chapter on [handling overload](https://sre.google/sre-book/handling-overload/). Note the "retry budget" concept.

### Work — building the retry budget

#### Do

1. Define a way for clients to mark a request as a retry. The simplest approach: the client sends a header `X-Retry: true`.
2. Add two [atomic counters](https://en.cppreference.com/w/c/atomic) to your server state: `total_requests` and `retry_requests`.
3. On every incoming request, increment `total_requests`. If the retry header is present, also increment `retry_requests`.
4. Before processing, compute the retry ratio: `retry_requests / total_requests`.
5. If the ratio exceeds `max_retry_ratio` (default 0.10), reject the retry request with [HTTP 503](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503) and the body "retry budget exhausted".
6. Every `budget_window_seconds` (default 10), reset both counters to zero using [clock_gettime](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) with `CLOCK_MONOTONIC` to track the window boundary.
7. Log every budget rejection with the current ratio and window time remaining.

#### Test

1. Start the server with `max_retry_ratio 0.10` and `budget_window_seconds 10`.
2. Send 20 fresh requests (no retry header).
3. Then send 5 requests with `X-Retry: true`.
4. The first 2 retries should succeed (2/22 ≈ 9%, under 10%).
5. The 3rd retry should be rejected (3/23 ≈ 13%, over 10%).

#### Expected

- First 2 retries: HTTP 200.
- 3rd, 4th, 5th retries: HTTP 503 with body "retry budget exhausted".
- Log lines showing the ratio at each rejection.
- After 10 seconds, counters reset and retries are accepted again.

### Prove — deeper understanding

1. Why does the budget use a [sliding window](https://en.wikipedia.org/wiki/Sliding_window_protocol) or fixed window instead of a lifetime counter? What goes wrong with a lifetime counter?
2. What if a malicious client never sets `X-Retry: true`? Discuss whether server-side retry detection (e.g., a request [fingerprint](https://en.wikipedia.org/wiki/Fingerprint_(computing))) is worth the cost.
3. Read [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119). Should a client "MUST" respect the retry budget, or "SHOULD"? Why?

### Ship — what to commit

- Retry budget tracking code with atomic counters and window reset.
- Updated request path that checks the budget before processing.
- Test script that demonstrates the budget kicking in.

## Done when

- Retry ratio above `max_retry_ratio` triggers immediate 503.
- Counters reset on the configured window boundary.
- Normal (non-retry) requests are never rejected by the retry budget, even during overload.

## Common mistakes

| Mistake | Why it hurts |
|---------|-------------|
| Counting retries globally without a time window | A burst of retries 1 hour ago blocks retries now |
| Rejecting fresh requests when the retry budget is exceeded | Punishes new users for the sins of retries |
| Using [floating point](https://en.wikipedia.org/wiki/Floating-point_arithmetic) division in the hot path | Possible precision issues; integer math with scaling is safer |
| Not resetting counters atomically | [Race condition](https://en.wikipedia.org/wiki/Race_condition): one counter resets while the other doesn't, giving a wrong ratio |

## Proof

- `curl` output showing first retries accepted, later retries rejected with 503.
- Log output showing the computed ratio at each decision point.

## 🖼️ Hero Visual

A highway toll booth with two lanes: "New Trips" (always open) and "Return Trips" (has a meter). The meter shows "2 of 20 allowed returns used." When it hits the limit, a barrier drops on the Return lane but the New lane stays open. The meter is the [retry budget](https://sre.google/sre-book/handling-overload/).

## 🔮 Future Lock

In [Week 09](../../w09/part.md) your [key-value client](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) library will embed the retry budget on the client side, so the server never even sees excess retries. In [Week 20](../../w20/part.md) you will simulate a [retry storm](https://en.wikipedia.org/wiki/Thundering_herd_problem) and verify the budget caps total load at 110% of baseline.
