---
id: w06-backpressure-overload-handling-d04-quest-deadline-budget-2h
part: w06-backpressure-overload-handling
title: "Quest: Deadline Budget  2h"
order: 4
duration_minutes: 120
prereqs: ["w06-backpressure-overload-handling-d03-quest-egress-throttle-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Deadline Budget  2h

## Goal

Fixed timeouts per hop are the #1 cause of cascading failures in distributed systems. A 30-second timeout at the edge multiplied across 4 internal hops means a single slow backend can pin resources for 120 seconds. **Deadline propagation** attaches an absolute expiry to each request and subtracts elapsed time at each stage. When the remaining budget is zero, the request is dropped immediately — no wasted work. Today you implement deadline budgets in C++ for a multi-stage request pipeline on Linux.

By end of this session you will have:

- ✅ Defined a `Deadline` struct carrying an absolute `CLOCK_MONOTONIC` expiry
- ✅ Propagated the deadline through a simulated 3-stage pipeline
- ✅ Implemented budget checks at each stage boundary with early termination
- ✅ Logged deadline-exceeded events with stage name and remaining budget
- ✅ Proven that expired requests are dropped without reaching downstream stages

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | `Deadline` struct carries absolute expiry in nanoseconds | Inspect header |
| 2 | Each pipeline stage checks `deadline.expired()` before work | Code review |
| 3 | Expired requests return `504 Gateway Timeout` immediately | Inject 1ms deadline, observe 504 |
| 4 | Remaining budget logged at each stage transition | Grep log for `budget_ns` |
| 5 | No downstream stage receives an already-expired request | Add assert in stage 3, run test |

## What You're Building Today

You are building a **deadline-aware request context** that flows through a simulated 3-stage pipeline (parse → process → respond). At each boundary the remaining budget is checked. If expired, the stage short-circuits with a 504 and logs the drop.

- ✅ A `Deadline` class with `remaining_ns()` and `expired()` methods
- ✅ A `RequestContext` carrying the deadline through stages
- ✅ Three pipeline stages with budget checks
- ✅ A test harness injecting tight deadlines to verify early termination

```cpp
class Deadline {
public:
    explicit Deadline(int64_t budget_ns)
        : expiry_ns_(clock_monotonic_ns() + budget_ns) {}

    int64_t remaining_ns() const {
        return expiry_ns_ - clock_monotonic_ns();
    }

    bool expired() const { return remaining_ns() <= 0; }

private:
    int64_t expiry_ns_;
};

struct RequestContext {
    int         client_fd;
    Deadline    deadline;
    std::string trace_id;
};
```

You **can**: add grace margins, carry the deadline in a protocol header, split the budget unevenly.

You **cannot yet**: inject failures to test deadline behaviour under stress — that is Day 5 (Failure Injection Matrix).

## Why This Matters

🔴 **Without this, you will:**
- Waste CPU and memory processing requests that the client has already abandoned
- Cause cascading timeouts where each hop adds its own full timeout duration
- Have p99 latency dominated by requests stuck in the slowest backend queue
- Lack any signal about *where* in the pipeline the budget ran out

🟢 **With this, you will:**
- Drop doomed requests at the earliest possible stage — minimum wasted work
- Cap end-to-end latency to a single budget value regardless of hop count
- Free resources for requests that can still succeed within their budget
- Pinpoint exactly which stage consumes the most budget via structured logs

🔗 **How this connects:**
- **Week 6 Day 1** (overload policy ladder) — the reject rung now has a deadline-aware trigger
- **Week 6 Day 3** (egress throttle) — egress priority can be ordered by remaining budget
- **Week 6 Day 5** (failure injection) — tomorrow you stress-test deadline behaviour
- **Week 10 Day 4** (request tracing) — trace_id in the context enables distributed tracing
- **Week 12 Day 1** (inter-service RPC) — deadlines propagate in RPC headers across services

🧠 **Mental model: "Airline Boarding Clock"** — the flight (request) departs at a fixed time (deadline). Each stage (check-in, security, gate) subtracts time. If you reach security with 2 minutes left and security takes 10, you are dropped (denied boarding). No point running to the gate.

## Visual Model

```
  Client sends request with budget = 500 ms
        │
        ▼
  ┌─────────────────────────────────────────┐
  │ Stage 1: Parse        elapsed: 50 ms    │
  │ budget.remaining() = 450 ms  ✅ proceed │
  └──────────────────┬──────────────────────┘
                     ▼
  ┌─────────────────────────────────────────┐
  │ Stage 2: Process      elapsed: 200 ms   │
  │ budget.remaining() = 250 ms  ✅ proceed │
  └──────────────────┬──────────────────────┘
                     ▼
  ┌─────────────────────────────────────────┐
  │ Stage 3: Respond      elapsed: 300 ms   │
  │ budget.remaining() = -50 ms  ❌ DROP    │
  │                                         │
  │  ──▶ return 504 Gateway Timeout         │
  │  ──▶ log: stage=respond budget=-50ms    │
  │  ──▶ close(fd)                          │
  └─────────────────────────────────────────┘
  
  Total work avoided: respond-stage I/O + write
  Resources freed: output buffer + fd slot
```

## Build

File: `week-6/day4-deadline-budget.cpp`

## Do

### 1. **Implement the `Deadline` class**

> 💡 *WHY: Absolute expiry times are immune to clock skew between stages — `remaining_ns()` is always relative to a single `CLOCK_MONOTONIC` read.*

Write `deadline.h` with the class shown above. Add a helper `clock_monotonic_ns()` using `clock_gettime(CLOCK_MONOTONIC, &ts)`. Ensure the constructor takes a budget in nanoseconds and stores the absolute expiry.

```cpp
inline int64_t clock_monotonic_ns() {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ts.tv_sec * 1'000'000'000LL + ts.tv_nsec;
}
```

### 2. **Build a 3-stage pipeline with budget checks**

> 💡 *WHY: Checking at stage boundaries (not mid-computation) gives deterministic drop points and clean resource cleanup.*

Create three functions: `stage_parse(RequestContext&)`, `stage_process(RequestContext&)`, `stage_respond(RequestContext&)`. Each begins with `if (ctx.deadline.expired()) { log_drop(ctx, "stage_name"); return 504; }`. Simulate work with `usleep()` or a CPU-bound loop.

```cpp
int stage_parse(RequestContext& ctx) {
    if (ctx.deadline.expired()) {
        log_drop(ctx, "parse");
        return 504;
    }
    usleep(50'000); // simulate 50ms parse
    return 0;
}
```

### 3. **Log deadline state at each transition**

> 💡 *WHY: Post-mortem analysis needs to know where the budget was spent — you can't optimise what you can't measure.*

After each stage completes, emit a structured log: `{"trace_id":"abc","stage":"parse","remaining_ms":450,"status":"ok"}`. On deadline drop, include `"status":"deadline_exceeded"`. Use the same JSON log format from Week 5 Day 2.

### 4. **Wire deadline into the server accept path**

> 💡 *WHY: The deadline must be set once at ingress — not per-stage — to enforce a global end-to-end budget.*

In your epoll accept handler, create a `RequestContext` with a deadline of 500ms (configurable). Pass this context through all three stages. If any stage returns 504, write the 504 response and close the fd.

### 5. **Test with tight deadlines**

> 💡 *WHY: Tight deadlines (1ms, 10ms) force the drop path to fire immediately, proving correctness.*

Write a test harness that sends 100 requests with a 10ms deadline to a server where `stage_process` takes 50ms. Verify:

| Metric | Expected |
|--------|----------|
| Requests reaching stage 3 | 0 |
| 504 responses | 100 |
| Log lines with `deadline_exceeded` at `process` stage | 100 |
| Average server CPU per dropped request | < 1ms |

## Done when

- [ ] `Deadline::expired()` correctly returns true when budget is exhausted — *core primitive for all timeout logic*
- [ ] Pipeline drops request at first expired stage boundary — *no wasted downstream work*
- [ ] 504 response sent to client on deadline expiry — *client gets actionable signal*
- [ ] Structured log shows remaining budget at each stage — *enables p99 budget analysis*
- [ ] Tight-deadline test proves zero requests reach stage 3 — *validates early termination*

## Proof

Paste your tight-deadline test results table **and** one sample log line showing a deadline drop with `trace_id`, `stage`, and `remaining_ms`.

**Quick self-test**

1. **Q:** Why store an absolute expiry instead of a countdown timer?
   **A:** A countdown timer requires tracking when it was last read and subtracting elapsed time — error-prone across thread boundaries. An absolute expiry from `CLOCK_MONOTONIC` is a single comparison, immune to scheduling delays between stages.

2. **Q:** Should you add a small grace margin (e.g. 5ms) to avoid dropping requests that are "almost done"?
   **A:** No. Grace margins defeat the purpose. If the budget is 500ms and work takes 505ms, the client has already given up or started a retry. Processing it wastes resources and may cause duplicate responses.

3. **Q:** How would you propagate a deadline across a network hop to another service?
   **A:** Encode the remaining budget (not the absolute time) in a request header, e.g. `X-Deadline-Ms: 250`. The receiving service creates a new `Deadline(250ms)` on its local clock. This avoids cross-machine clock synchronisation issues.
