---
id: w06-backpressure-overload-handling-d01-quest-overload-policy-ladder-2h
part: w06-backpressure-overload-handling
title: "Quest: Overload Policy Ladder  2h"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Overload Policy Ladder  2h

## Goal

Every production server reaches a point where demand exceeds capacity. Without an explicit overload policy, the server degrades unpredictably — latency spikes, memory bloats, connections stall, and clients retry blindly. A **policy ladder** defines discrete stages of degradation and assigns a deterministic action at each rung. Today you design and implement that ladder in C++ for a Linux TCP server.

By end of this session you will have:

- ✅ Identified four distinct overload stages based on queue depth and resource utilisation
- ✅ Implemented queue-depth threshold checks with atomic counters
- ✅ Wired explicit `503 Reject` responses when the top rung is reached
- ✅ Logged every policy transition with structured telemetry
- ✅ Validated the ladder under synthetic load with `wrk` or a custom driver

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Queue depth tracked with `std::atomic<uint64_t>` | Grep source for atomic counter increment/decrement |
| 2 | At least 3 rungs defined (normal → warn → shed → reject) | Config struct or enum with thresholds |
| 3 | Reject rung returns 503 and closes the connection | Send burst, observe 503 in client logs |
| 4 | Every rung transition emits a structured log line | Pipe server stderr through `jq` or grep |
| 5 | Ladder tested under load ≥ 2× steady-state capacity | wrk output shows controlled reject rate |

## What You're Building Today

You are building a **four-rung overload policy engine** that wraps around your server's accept-and-dispatch loop. The engine checks queue depth on every enqueue and selects a policy action: allow, warn-and-allow, shed-oldest, or reject-immediately.

- ✅ A `OverloadPolicy` enum with `Normal`, `Warn`, `Shed`, `Reject`
- ✅ A `PolicyLadder` class that maps queue-depth thresholds to rungs
- ✅ Integration into a simple epoll-based TCP echo server
- ✅ A structured log emitter for rung transitions

```cpp
enum class OverloadPolicy : uint8_t {
    Normal = 0,  // queue < 64  — process immediately
    Warn   = 1,  // queue < 128 — log warning, still process
    Shed   = 2,  // queue < 256 — drop oldest enqueued item
    Reject = 3   // queue >= 256 — send 503, close socket
};

struct PolicyLadder {
    std::array<uint64_t, 4> thresholds = {64, 128, 256, 512};

    OverloadPolicy evaluate(uint64_t current_depth) const {
        for (int i = 3; i >= 0; --i) {
            if (current_depth >= thresholds[i]) return static_cast<OverloadPolicy>(i + 1);
        }
        return OverloadPolicy::Normal;
    }
};
```

You **can**: tune threshold values, choose your own queue data structure, add custom rungs.

You **cannot yet**: propagate backpressure upstream across service boundaries (that is Week 6 Day 4 — deadline budgets).

## Why This Matters

🔴 **Without this, you will:**
- Watch your server OOM-kill under spike load because nothing bounds the work queue
- See p99 latency climb to seconds as every request waits behind a saturated queue
- Have clients retry into the storm, creating a feedback loop of worsening overload
- Lack any forensic signal about *when* the server transitioned from healthy to failing

🟢 **With this, you will:**
- Bound worst-case memory to `threshold × item_size` — a predictable ceiling
- Give clients an immediate, actionable signal (503) so they can back off or failover
- Preserve service for requests already in-flight by shedding new arrivals first
- Have timestamped rung-transition logs for post-incident analysis

🔗 **How this connects:**
- **Week 4 Day 3** (epoll reactor) — the accept loop you are wrapping with the ladder
- **Week 5 Day 2** (structured logging) — the log format you emit on rung transitions
- **Week 6 Day 2** (slow-client defense) — tomorrow adds per-connection read deadlines on top of this
- **Week 6 Day 4** (deadline budget) — propagates the reject signal across service hops
- **Week 9 Day 1** (rate limiting) — adds token-bucket smoothing before the ladder

🧠 **Mental model: "Circuit Breaker with Rungs"** — think of a building's electrical panel. Each breaker trips at a different amperage. Your policy ladder is a set of breakers: the first one dims the lights (warn), the next shuts down the AC (shed), the last kills all non-essential circuits (reject). Each rung preserves the most critical work.

## Visual Model

```
                ┌──────────────────────────────────────┐
  Incoming      │          Accept Loop (epoll)          │
  Connections ──▶                                      │
                │  ┌─────────────┐                     │
                │  │ Queue Depth │──▶ PolicyLadder      │
                │  │  (atomic)   │     .evaluate()      │
                │  └─────────────┘         │            │
                │         ┌────────────────┼──────────┐ │
                │         ▼                ▼          ▼ │
                │  ┌──────────┐  ┌──────────┐  ┌─────┐ │
                │  │  Normal  │  │   Warn   │  │ Shed│ │
                │  │ enqueue  │  │ log+enq  │  │ drop│ │
                │  └────┬─────┘  └────┬─────┘  │oldest│ │
                │       │             │        └──┬──┘ │
                │       ▼             ▼           ▼    │
                │    ┌─────────────────────────────┐   │
                │    │       Worker Threads         │   │
                │    └─────────────────────────────┘   │
                │                                      │
                │  ┌──────────┐                        │
                │  │  Reject  │──▶ 503 + close fd      │
                │  │ depth≥256│                        │
                │  └──────────┘                        │
                └──────────────────────────────────────┘
```

## Build

File: `week-6/day1-overload-policy.cpp`

## Do

### 1. **Define the OverloadPolicy enum and PolicyLadder struct**

> 💡 *WHY: A strongly-typed enum prevents stringly-typed bugs and lets the compiler enforce exhaustive switches.*

Create `overload_policy.h`. Define `OverloadPolicy` as a `uint8_t`-backed enum class with four values. Write a `PolicyLadder` struct holding a `std::array<uint64_t, 4>` of thresholds and a `evaluate(uint64_t) -> OverloadPolicy` method that returns the highest matching rung.

```cpp
// overload_policy.h
#pragma once
#include <array>
#include <cstdint>

enum class OverloadPolicy : uint8_t { Normal, Warn, Shed, Reject };

struct PolicyLadder {
    std::array<uint64_t, 4> thresholds{64, 128, 256, 512};
    OverloadPolicy evaluate(uint64_t depth) const;
};
```

### 2. **Add an atomic queue-depth counter to your server loop**

> 💡 *WHY: `std::atomic` gives lock-free reads on x86-64 so the accept thread never blocks on a mutex just to check depth.*

In your server's request-enqueue path, increment `queue_depth` with `fetch_add(1, std::memory_order_relaxed)`. In the worker dequeue path, decrement with `fetch_sub`. Log the value every 1000 operations to verify correctness.

```cpp
std::atomic<uint64_t> queue_depth{0};

void enqueue(Request req) {
    uint64_t d = queue_depth.fetch_add(1, std::memory_order_relaxed);
    auto policy = ladder.evaluate(d);
    // ... act on policy
}
```

### 3. **Implement each rung's action**

> 💡 *WHY: Every rung must have a concrete, observable side-effect — otherwise the ladder is just decoration.*

In a `switch` on the evaluated policy: `Normal` → push to queue. `Warn` → log at WARN level, then push. `Shed` → pop the oldest item from the front, push the new one. `Reject` → write a `"HTTP/1.1 503 Service Unavailable\r\n\r\n"` response and `close(fd)`.

### 4. **Emit structured log lines on rung transitions**

> 💡 *WHY: You need to correlate overload events with external signals (CPU, memory, client retry rate) during post-mortems.*

Track `previous_policy` as a thread-local or per-loop variable. When `evaluate()` returns a different rung than last time, emit a JSON line: `{"event":"rung_change","from":"Normal","to":"Warn","depth":65,"ts":...}`. Use `CLOCK_MONOTONIC` for the timestamp.

### 5. **Load-test with wrk and verify reject behaviour**

> 💡 *WHY: A policy that has never been exercised under real load is a policy you don't have.*

Run `wrk -t4 -c500 -d30s http://127.0.0.1:8080/` to push connections well past your top threshold. Capture server logs and count: (a) number of `rung_change` events, (b) number of 503 responses, (c) peak queue depth. Fill in the table below.

| Metric | Expected | Actual |
|--------|----------|--------|
| Peak queue depth | ≤ 512 | |
| 503 responses sent | > 0 | |
| Rung transitions logged | ≥ 3 | |
| Worker-thread panic/crash | 0 | |
| Max RSS (via `/proc/self/status`) | < 100 MB | |

## Done when

- [ ] `OverloadPolicy` enum has four values and `PolicyLadder::evaluate` compiles — *reused in W06D2 slow-client defense*
- [ ] Queue depth never exceeds top threshold + worker batch size — *prevents OOM under burst*
- [ ] 503 responses observed in client output during overload — *validates reject path end-to-end*
- [ ] Structured log contains at least one `rung_change` event — *feeds Week 5 log-analysis pipeline*
- [ ] Load test completed with results table filled in — *baseline for Week 6 Day 5 failure injection*

## Proof

Paste your completed results table from Step 5 **and** the terminal output of `grep rung_change server.log | head -5`.

**Quick self-test**

1. **Q:** Why use `std::memory_order_relaxed` instead of `seq_cst` for the queue counter?
   **A:** The counter is a statistical gauge, not a synchronisation primitive. Relaxed order avoids unnecessary cache-line bouncing while still being atomically correct on x86-64.

2. **Q:** What happens if two threads call `evaluate()` and both see depth = 255 — one below Reject, one above?
   **A:** Both get `Shed`. Only when depth crosses 256 does the next caller get `Reject`. The race is benign because over-shedding by one item is acceptable; under-rejecting is not, and the next check catches it.

3. **Q:** Why shed the *oldest* item rather than the *newest*?
   **A:** The oldest item has already consumed wait time and may be closest to its deadline. Shedding it frees resources for fresher requests that are more likely to complete within their budget (see Day 4).
