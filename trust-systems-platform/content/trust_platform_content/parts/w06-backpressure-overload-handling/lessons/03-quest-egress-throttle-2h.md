---
id: w06-backpressure-overload-handling-d03-quest-egress-throttle-2h
part: w06-backpressure-overload-handling
title: "Quest: Egress Throttle  2h"
order: 3
duration_minutes: 120
prereqs: ["w06-backpressure-overload-handling-d02-quest-slow-client-defense-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Egress Throttle  2h

## Goal

Yesterday you defended against slow *readers* (ingress). Today you tackle the opposite: slow *writers*. When a client cannot consume data fast enough, the kernel's socket send buffer fills, `write()` blocks or returns `EAGAIN`, and your server thread stalls. Without explicit egress throttling, one slow consumer can back-pressure your entire worker pool. Today you implement per-client **egress rate limiting** with a burst cap on Linux.

By end of this session you will have:

- ✅ Measured socket send buffer behaviour with `SO_SNDBUF` and `EPOLLOUT`
- ✅ Implemented an application-level per-client output buffer with a size cap
- ✅ Built a token-bucket rate limiter for per-client egress bytes
- ✅ Defined a drop/close policy when the output buffer exceeds the cap
- ✅ Tested with a slow-reader client that drains at 1 KB/s

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Per-client output buffer with configurable cap (e.g. 64 KB) | Inspect `EgressState` struct |
| 2 | Token-bucket refills at configured rate (e.g. 32 KB/s) | Unit test with mock clock |
| 3 | Buffer overflow triggers close with structured log | Slow-reader test shows close event |
| 4 | Fast clients see no throttling impact | Benchmark p50 latency unchanged |
| 5 | `EPOLLOUT` used to resume writes only when socket is writable | No busy-wait in loop |

## What You're Building Today

You are building an **EgressThrottle** layer that sits between your application's response path and the kernel socket. Each client gets an output ring buffer, a token bucket, and overflow policy. When the bucket is empty or the buffer is full, data is dropped and the connection is closed.

- ✅ An `EgressState` struct per connection with ring buffer and token bucket
- ✅ Integration with `EPOLLOUT` for non-blocking write resumption
- ✅ A drop-and-close policy when buffer exceeds cap
- ✅ Telemetry counters for bytes written, bytes dropped, connections closed

```cpp
struct TokenBucket {
    uint64_t tokens;       // current available bytes
    uint64_t max_burst;    // cap (e.g. 64 * 1024)
    uint64_t rate;         // bytes per second refill
    int64_t  last_refill_ns;

    void refill(int64_t now_ns) {
        int64_t elapsed = now_ns - last_refill_ns;
        uint64_t add = (rate * elapsed) / 1'000'000'000ULL;
        tokens = std::min(tokens + add, max_burst);
        last_refill_ns = now_ns;
    }

    uint64_t consume(uint64_t requested) {
        uint64_t allowed = std::min(requested, tokens);
        tokens -= allowed;
        return allowed;
    }
};
```

You **can**: choose ring buffer vs `std::deque<char>`, tune rate and burst values.

You **cannot yet**: propagate deadline information to decide *which* client to throttle first (Day 4).

## Why This Matters

🔴 **Without this, you will:**
- Block worker threads on `write()` when any single client's receive window closes
- Accumulate unbounded output buffers in application memory, leading to OOM
- Treat all clients equally — a 1 KB/s consumer gets the same resources as a 100 MB/s one
- Have no visibility into which clients are draining server resources via slow reads

🟢 **With this, you will:**
- Keep worker threads non-blocking by buffering writes and using `EPOLLOUT`
- Bound per-client memory to `max_burst` bytes — predictable RSS under any client mix
- Shed slow consumers before they degrade service for fast ones
- Log per-client egress metrics for capacity planning and abuse detection

🔗 **How this connects:**
- **Week 6 Day 2** (slow-client defense) — ingress watchdog; today is the egress counterpart
- **Week 6 Day 1** (overload policy ladder) — egress overflow feeds the shed/reject decision
- **Week 4 Day 3** (epoll reactor) — `EPOLLOUT` registration for write-readiness
- **Week 6 Day 4** (deadline budget) — deadline-aware prioritisation of egress buffers
- **Week 11 Day 3** (flow control) — TCP-level flow control builds on this app-level throttle

🧠 **Mental model: "Water Tank with a Faucet"** — each client has a water tank (output buffer) with a faucet (token bucket). The server pours water (response data) into the tank. The faucet drains at a fixed rate. If the tank is full and the faucet can't keep up, you stop pouring and cap the tank.

## Visual Model

```
  Server Response Path
        │
        ▼
  ┌─────────────────────────────────────────────┐
  │            Per-Client Egress Layer           │
  │                                             │
  │  ┌──────────────┐    ┌──────────────────┐   │
  │  │ Token Bucket  │    │  Output Buffer   │   │
  │  │ rate: 32KB/s  │    │  cap: 64 KB      │   │
  │  │ burst: 64KB   │    │  [████████░░░░]  │   │
  │  │ tokens: 12KB  │    │  used: 52 KB     │   │
  │  └──────┬───────┘    └────────┬─────────┘   │
  │         │    consume(n)       │              │
  │         ▼                     ▼              │
  │  ┌──────────────────────────────────────┐    │
  │  │ if tokens > 0 && buf < cap:          │    │
  │  │   write(fd, buf, min(avail, tokens)) │    │
  │  │ elif buf >= cap:                     │    │
  │  │   LOG + close(fd)      ◀── overflow  │    │
  │  │ else:                                │    │
  │  │   register EPOLLOUT, wait            │    │
  │  └──────────────────────────────────────┘    │
  │         │                                    │
  │         ▼                                    │
  │    Socket send buffer (kernel)               │
  └─────────────────────────────────────────────┘
```

## Build

File: `week-6/day3-egress-throttle.cpp`

## Do

### 1. **Define `EgressState` with ring buffer and token bucket**

> 💡 *WHY: Separating per-client state lets you make independent throttling decisions without global locks.*

Create a struct combining `TokenBucket` with a `std::vector<char>` output buffer (or a ring buffer). Track `write_pos`, `read_pos`, and `used_bytes`. Set `max_burst = 64 * 1024` and `rate = 32 * 1024`.

```cpp
struct EgressState {
    TokenBucket bucket{64*1024, 64*1024, 32*1024, 0};
    std::vector<char> buf;
    size_t write_pos = 0;
    size_t read_pos  = 0;
    size_t used      = 0;
    static constexpr size_t CAP = 64 * 1024;
};
```

### 2. **Buffer outgoing data instead of calling write() directly**

> 💡 *WHY: Direct `write()` can block or return partial writes. Buffering decouples the producer (handler) from the consumer (socket).*

Replace all direct `write(fd, ...)` calls with `egress_enqueue(fd, data, len)`. This copies data into the client's output buffer. If `used + len > CAP`, trigger the overflow policy: log the event and close the connection.

### 3. **Drain the buffer using EPOLLOUT and the token bucket**

> 💡 *WHY: `EPOLLOUT` fires only when the kernel's send buffer has space — polling would waste CPU.*

When the output buffer has data, register `EPOLLOUT` for the fd. In the `EPOLLOUT` handler: call `bucket.refill(now)`, then `bucket.consume(available)` to get the allowed byte count. Call `write(fd, buf + read_pos, allowed)`. Update `read_pos` and `used`. If the buffer drains to 0, deregister `EPOLLOUT`.

### 4. **Add telemetry counters**

> 💡 *WHY: You cannot tune rate and burst parameters without data on actual egress patterns.*

Track per-client: `total_bytes_written`, `total_bytes_dropped`, `overflow_close_count`. On each sweep (reuse the timerfd from Day 2), emit a summary log line for any client with `bytes_dropped > 0`.

### 5. **Test with a slow-reader client**

> 💡 *WHY: Proving the throttle works requires a client that deliberately drains slowly.*

Write a client that connects, sends a request, then `sleep(1)` between each `recv(fd, buf, 1024, 0)`. The server should be sending a large response (e.g. 256 KB). Verify:

| Check | Expected |
|-------|----------|
| Slow reader closed when buffer hits 64 KB | ✅ |
| Fast reader receives full 256 KB response | ✅ |
| Server RSS stays bounded (check `/proc/self/status`) | ✅ |
| Overflow log line emitted with fd and bytes_dropped | ✅ |

## Done when

- [ ] `TokenBucket::refill` and `consume` pass unit test with mock clock — *reused in W09D1 rate limiter*
- [ ] Output buffer overflow triggers connection close and log — *prevents OOM from slow readers*
- [ ] `EPOLLOUT` used for non-blocking write drain — *no busy-wait, no thread stall*
- [ ] Fast clients see ≤ 5% p50 latency increase under mixed slow/fast load — *proves selectivity*
- [ ] Telemetry counters emitted for bytes_written and bytes_dropped — *feeds capacity dashboard*

## Proof

Paste the slow-reader test output showing the overflow close **and** the output of `cat /proc/<pid>/status | grep VmRSS` before and after the test.

**Quick self-test**

1. **Q:** Why a token bucket instead of a simple byte-per-second counter?
   **A:** A token bucket allows controlled bursts. A strict byte/sec counter would fragment large writes into tiny pieces, increasing syscall overhead. The burst cap lets you write in efficient chunks while still enforcing a long-term rate.

2. **Q:** What happens if `write()` returns fewer bytes than requested?
   **A:** This is a partial write — the kernel's send buffer is full. You keep the remaining data in the app buffer, deregister nothing, and wait for the next `EPOLLOUT` event. The tokens for the unwritten bytes are already consumed; they are effectively "in the pipe."

3. **Q:** Why close the connection on buffer overflow instead of just dropping new data?
   **A:** Silently dropping response data corrupts the application protocol. The client would see truncated or out-of-order data. A clean close with a log entry is honest and diagnosable. The client can reconnect and retry.
