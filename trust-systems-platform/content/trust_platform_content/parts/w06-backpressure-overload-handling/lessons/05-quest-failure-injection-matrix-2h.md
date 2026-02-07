---
id: w06-backpressure-overload-handling-d05-quest-failure-injection-matrix-2h
part: w06-backpressure-overload-handling
title: "Quest: Failure Injection Matrix  2h"
order: 5
duration_minutes: 120
prereqs: ["w06-backpressure-overload-handling-d04-quest-deadline-budget-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Failure Injection Matrix  2h

## Goal

You have built overload policies, slow-client defense, egress throttles, and deadline budgets this week. But how do you know they *actually work* under real failure conditions? Guessing is not engineering. Today you design and execute a **failure injection matrix** — a structured set of experiments where you deliberately inject faults, form hypotheses, and measure observable outcomes against your quality gates.

By end of this session you will have:

- ✅ Designed a matrix of 5 failure scenarios with hypotheses and expected metrics
- ✅ Built injection hooks in your server code (artificial latency, queue stuffing, fd exhaustion)
- ✅ Executed each drill and recorded actual outcomes
- ✅ Mapped every drill to a specific quality gate metric (p99, error rate, RSS, fd count)
- ✅ Written a summary report comparing hypotheses to actual results

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Matrix has ≥ 5 rows with hypothesis, injection method, metric | Review matrix document |
| 2 | Each injection has a code hook or script (not manual) | Grep for `INJECT_` flags or injection functions |
| 3 | Actual results recorded for every drill | Matrix cells filled |
| 4 | Every drill maps to one quality gate metric | Column present in matrix |
| 5 | Summary report identifies ≥ 1 surprise or gap | Read conclusion section |

## What You're Building Today

You are building a **failure injection framework** and executing it against the server you built this week. The framework uses compile-time or runtime flags to inject specific faults. The matrix documents each experiment.

- ✅ A `FailureInjector` class with pluggable fault types
- ✅ At least 5 injection scenarios covering Days 1-4 mechanisms
- ✅ A test driver that runs each scenario and collects metrics
- ✅ A filled-in matrix document with results

```cpp
enum class FaultType : uint8_t {
    None,
    LatencySpike,     // add N ms to stage_process
    QueueFlood,       // enqueue N dummy requests
    FdExhaustion,     // pre-open N fds to exhaust limit
    SlowClient,       // inject 1-byte/s readers
    DeadlineZero      // set deadline to 0ms for all requests
};

class FailureInjector {
public:
    void activate(FaultType type, uint64_t param);
    void deactivate();
    bool should_inject_latency(uint64_t* added_us) const;
    bool should_flood_queue(uint64_t* count) const;
private:
    std::atomic<FaultType> active_{FaultType::None};
    std::atomic<uint64_t>  param_{0};
};
```

You **can**: add more fault types, automate the entire matrix with a shell script, or build a CI job that runs the matrix on every merge.

You **cannot yet**: inject network-level faults like packet loss or partition — that requires `tc` and `iptables` (Week 11). You also cannot automate hypothesis validation with statistical significance tests yet — that comes with chaos engineering maturity (Week 13).

## Why This Matters

🔴 **Without this, you will:**
- Ship code that has never been tested under the conditions it is designed to handle
- Discover bugs in production during an outage, when diagnosis time is most expensive
- Have no evidence that your overload protections actually engage under real failure
- Miss interactions between protection mechanisms (e.g. throttle + deadline conflict)

🟢 **With this, you will:**
- Have documented proof that every protection mechanism triggers correctly
- Discover edge cases and interaction bugs in a controlled environment
- Build confidence to deploy under load because failure modes are characterised
- Establish a repeatable drill library that runs before every release

🔗 **How this connects:**
- **Week 6 Day 1** (overload policy) — drill verifies ladder rungs fire at correct thresholds
- **Week 6 Day 2** (slow-client) — drill verifies eviction under Slowloris-style injection
- **Week 6 Day 3** (egress throttle) — drill verifies buffer overflow close under slow readers
- **Week 6 Day 4** (deadline budget) — drill verifies zero-budget requests are dropped at stage 1
- **Week 13 Day 5** (chaos engineering) — this matrix is the precursor to full chaos drills

🧠 **Mental model: "Fire Drill"** — you don't wait for a real fire to test whether the alarms work, the exits are clear, and people know where to go. A failure injection matrix is a fire drill for your software. Each scenario is a controlled ignition in a specific room, and you observe whether the alarm, sprinklers, and evacuation routes all function.

## Visual Model

```
  ┌──────────────────────────────────────────────────────┐
  │              Failure Injection Matrix                 │
  │                                                      │
  │  Drill #  │ Fault Type     │ Gate Metric │ Result    │
  │ ──────────┼────────────────┼─────────────┼────────── │
  │  1        │ LatencySpike   │ p99 lat.    │ ☐ PASS    │
  │  2        │ QueueFlood     │ reject rate │ ☐ PASS    │
  │  3        │ FdExhaustion   │ accept err  │ ☐ PASS    │
  │  4        │ SlowClient     │ evict count │ ☐ PASS    │
  │  5        │ DeadlineZero   │ 504 rate    │ ☐ PASS    │
  │                                                      │
  │  ┌────────────┐    ┌────────────┐    ┌────────────┐  │
  │  │  Injector  │──▶ │   Server   │──▶ │  Metrics   │  │
  │  │ activate() │    │  (epoll)   │    │ collector  │  │
  │  └────────────┘    └────────────┘    └────────────┘  │
  │                          │                           │
  │                          ▼                           │
  │                   ┌────────────┐                     │
  │                   │ Hypothesis │                     │
  │                   │   vs       │                     │
  │                   │  Actual    │                     │
  │                   └────────────┘                     │
  └──────────────────────────────────────────────────────┘
```

## Build

File: `week-6/day5-failure-injection.cpp`

## Do

### 1. **Design the failure injection matrix**

> 💡 *WHY: A written hypothesis before the test prevents confirmation bias — you must predict the outcome before observing it.*

Create a markdown table with these columns: `Drill #`, `Fault Type`, `Injection Method`, `Hypothesis`, `Quality Gate Metric`, `Expected Value`, `Actual Value`, `PASS/FAIL`. Fill in 5 rows:

| Drill | Fault | Method | Hypothesis | Metric | Expected |
|-------|-------|--------|-----------|--------|----------|
| 1 | LatencySpike 200ms | `usleep(200000)` in stage_process | p99 > 200ms, 504 rate > 50% | p99 latency | > 200ms |
| 2 | QueueFlood 1000 | Enqueue 1000 dummy items at startup | Reject rung fires, 503 count > 0 | 503 rate | > 80% |
| 3 | FdExhaustion | Pre-open 900 fds (limit 1024) | accept() returns EMFILE | accept errors | > 0 |
| 4 | SlowClient ×50 | Spawn 50 clients sending 1 byte/s | 50 evictions within 30s | eviction count | 50 |
| 5 | DeadlineZero | Set all deadlines to 0ms | 100% 504, zero stage_process calls | 504 rate | 100% |

### 2. **Implement the `FailureInjector` class**

> 💡 *WHY: A runtime-togglable injector lets you run drills without recompilation — critical for CI/CD integration.*

Implement `activate(type, param)` setting the atomic fields. Add `should_inject_latency()` called at the top of `stage_process`. Add `should_flood_queue()` called in the accept path. Gate all injection behind `if (active_ != FaultType::None)`.

```cpp
bool FailureInjector::should_inject_latency(uint64_t* added_us) const {
    if (active_.load(std::memory_order_relaxed) != FaultType::LatencySpike) return false;
    *added_us = param_.load(std::memory_order_relaxed);
    return true;
}
```

### 3. **Wire injection hooks into the server**

> 💡 *WHY: Hooks at stage boundaries (not random locations) make results reproducible and failures diagnosable.*

Add injection calls at three points: (a) after `accept()` — for fd exhaustion, (b) at the start of `stage_process` — for latency spike, (c) in the enqueue path — for queue flood. Enable them via a command-line flag `--inject=LatencySpike:200000`.

### 4. **Execute each drill and record results**

> 💡 *WHY: The gap between hypothesis and actual reveals the real behaviour of your system — this is where learning happens.*

For each drill: (a) start the server with the injection flag, (b) run the load driver, (c) collect metrics from logs and `/proc`, (d) fill in the "Actual Value" column. Record whether each drill PASSed (actual matches hypothesis within 20%).

### 5. **Write the summary report**

> 💡 *WHY: A report forces you to synthesise findings — "everything passed" is rarely true and the exceptions are the most valuable.*

Write a 10-line summary covering: (a) which drills passed, (b) which surprised you and why, (c) any gap discovered (e.g. "fd exhaustion caused accept loop to spin without backoff"), (d) one improvement to implement next week.

## Done when

- [ ] Matrix document has 5 rows with all columns filled — *becomes your regression drill library*
- [ ] `FailureInjector` class compiles and toggles at runtime — *reusable in W13D5 chaos engineering*
- [ ] Every drill executed with actual results recorded — *evidence-based confidence*
- [ ] At least one drill reveals a surprise or gap — *proves the exercise has value*
- [ ] Summary report written with improvement action item — *feeds next iteration*

## Proof

Paste your completed failure injection matrix table (all 5 drills with actual results) **and** your summary report (≥ 5 lines).

**Quick self-test**

1. **Q:** Why must the injector use atomic operations instead of a plain bool?
   **A:** The injector is toggled from a control thread (or signal handler) while the server threads read it. Without atomics, the read could see a torn write — partially updated type with stale param — leading to undefined behaviour.

2. **Q:** Drill 3 (fd exhaustion) might crash the server. Is that acceptable?
   **A:** No. The hypothesis should be that `accept()` returns -1 with `errno = EMFILE` and the server logs the error and continues. If it crashes, that is a bug — the accept loop lacks error handling, and the drill just found it.

3. **Q:** Why require a hypothesis *before* running each drill?
   **A:** Without a prediction, you cannot distinguish expected behaviour from surprising behaviour. If you observe 50% 504s and you predicted 80%, the 30% gap is where the real engineering insight lives. Without the prediction, you'd just say "looks fine."

4. **Q:** Should you run failure injection in production or only in staging?
   **A:** Start in staging until every drill passes consistently. Graduate to production only with safeguards: feature flags to disable injection, blast-radius limits (inject into ≤5% of traffic), and automatic rollback if error rate exceeds a threshold. Week 13 Day 5 covers production chaos engineering practices.
