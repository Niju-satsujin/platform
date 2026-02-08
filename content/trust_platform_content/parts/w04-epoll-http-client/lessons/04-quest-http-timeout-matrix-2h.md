---
id: w04-epoll-http-client-d04-quest-http-timeout-matrix-2h
part: w04-epoll-http-client
title: "Quest: HTTP Timeout Matrix  2h"
order: 4
duration_minutes: 120
prereqs: [w04-epoll-http-client-d03-quest-http-parser-spec-2h]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: HTTP Timeout Matrix  2h

## Goal

Design a **per-phase timeout matrix** for your HTTP client so that every connection phase — DNS, connect, request send, response headers, response body — has an independent deadline, and transient failures are distinguished from permanent ones.

By end of this session you will have:

- ✅ A **timeout matrix** assigning a specific deadline to each connection phase
- ✅ A **phase transition model** that starts and stops timers as the connection advances
- ✅ A **failure classification** distinguishing transient (retryable) from permanent (fatal) timeouts
- ✅ A **connect-vs-read timeout separation** proving each has independent enforcement
- ✅ A **total request budget** capping the cumulative time across all phases

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Timeout matrix has ≥ 5 phases with distinct values | Review matrix table |
| 2 | Connect timeout is independent from read timeout | Verify separate timer entries |
| 3 | Transient vs permanent classification for each timeout | Check failure table |
| 4 | Total request budget enforced across all phases | Verify cumulative deadline |
| 5 | Timer cancellation on phase advancement | Walk happy-path through code |

## What You're Building Today

A comprehensive timeout policy for your HTTP client that maps every connection phase to a specific timeout value, retry strategy, and failure classification — integrated with the Day 2 timer infrastructure.

By end of this session, you will have:

- ✅ File: `week-4/day4-http-timeout-matrix.md`
- ✅ Per-phase timeout matrix (5+ phases, each with value, retry policy, error class)
- ✅ Phase-transition timer management code
- ✅ Total request budget enforcement

What "done" looks like:

```cpp
struct TimeoutConfig {
    std::chrono::milliseconds dns_resolve   = std::chrono::seconds(5);
    std::chrono::milliseconds connect       = std::chrono::seconds(10);
    std::chrono::milliseconds tls_handshake = std::chrono::seconds(10);
    std::chrono::milliseconds request_send  = std::chrono::seconds(30);
    std::chrono::milliseconds response_head = std::chrono::seconds(30);
    std::chrono::milliseconds response_body = std::chrono::seconds(60);
    std::chrono::milliseconds total_budget  = std::chrono::seconds(120);
};
```

You **can**: Enforce independent deadlines for every phase and classify failures accurately.
You **cannot yet**: Trace requests end-to-end across client and server (Day 5).

## Why This Matters

🔴 **Without this, you will:**
- Use a single 30s timeout for everything — DNS, connect, and read all share one clock
- Retry permanent failures (connection refused) and waste resources on hopeless requests
- Let a slow response body consume the entire timeout budget, leaving zero time for retries
- Have no way to tell operations "the connect phase is slow" vs "the server is slow to respond"

🟢 **With this, you will:**
- Pinpoint exactly which phase is slow: "DNS took 4.8s of the 5s budget"
- Retry only transient failures: timeout and `ECONNRESET` get retried; `ECONNREFUSED` does not
- Budget total time across all phases so a slow DNS lookup reduces the body timeout proportionally
- Produce diagnostic logs that show exactly where latency is spent per request

🔗 **How this connects:**
- **To Day 2:** Each phase timeout is a `TimerHeap::schedule()` call from your timer system
- **To Day 3:** Parser state transitions trigger phase advancement (headers done → start body timer)
- **To Day 5:** Timeout events appear in the end-to-end trace with phase labels
- **To Week 5 Day 3:** Task scheduling timeout budgets follow the same per-phase pattern
- **To Week 6:** Overload shedding reduces timeout budgets dynamically under pressure

🧠 **Mental model: "Phase Budgets"**

Think of a request as a relay race with 5 legs. Each runner (phase) gets their own time limit. If DNS takes too long, the remaining runners get less time — but each still has a minimum. The total race time is capped. A runner who falls (permanent failure) ends the race. A runner who stumbles (transient failure) gets one more try if the total budget allows.

## Visual Model

```
┌──────────────────────────────────────────────────────────────┐
│               HTTP REQUEST PHASE TIMELINE                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Total budget: 120s                                          │
│  ├─────────────────────────────────────────────────────────┤ │
│  │                                                         │ │
│  │ DNS     Connect   TLS      Send     Resp-Hdr  Resp-Body│ │
│  │ [5s]    [10s]     [10s]    [30s]    [30s]     [60s]    │ │
│  │  ▼        ▼        ▼        ▼        ▼         ▼       │ │
│  │ ┌───┐  ┌─────┐  ┌─────┐  ┌──────┐ ┌──────┐  ┌──────┐ │ │
│  │ │ R │  │  C  │  │  H  │  │  S   │ │  RH  │  │  RB  │ │ │
│  │ └─┬─┘  └──┬──┘  └──┬──┘  └──┬───┘ └──┬───┘  └──┬───┘ │ │
│  │   │       │        │        │        │         │      │ │
│  │   ▼       ▼        ▼        ▼        ▼         ▼      │ │
│  │ start   cancel   cancel   cancel   cancel    cancel   │ │
│  │ timer₁  timer₁   timer₂   timer₃   timer₄   timer₅  │ │
│  │         start    start    start    start     start    │ │
│  │         timer₂   timer₃   timer₄   timer₅   timer₆  │ │
│  │                                                       │ │
│  │ On timeout:                                           │ │
│  │   transient → retry if budget remains                 │ │
│  │   permanent → fail immediately, report phase          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
│  Remaining budget = total - elapsed                          │
│  Phase timeout = min(phase_limit, remaining_budget)          │
└──────────────────────────────────────────────────────────────┘
```

## Build

File: `week-4/day4-http-timeout-matrix.md`

## Do

1. **Define the per-phase timeout matrix**
   > 💡 *WHY: A single global timeout hides where latency is spent. Per-phase timeouts let you say "DNS is fine but the server is slow" — critical for incident diagnosis. This is how production HTTP clients (libcurl, Go's http.Client) work.*

   | Phase | Timeout | Starts when | Ends when | Transient? | Retry? |
   |-------|---------|-------------|-----------|------------|--------|
   | DNS resolve | 5s | Request initiated | IP address obtained | Yes (EAGAIN, temp failure) | 1 retry |
   | TCP connect | 10s | `connect()` called | Socket writable | Yes (ETIMEDOUT) | 1 retry |
   | TLS handshake | 10s | TCP connected | Handshake complete | Yes (timeout) | 0 retries |
   | Request send | 30s | TLS/TCP done | All request bytes written | Yes (EAGAIN) | 0 retries |
   | Response headers | 30s | Request fully sent | `\r\n\r\n` received | No (server choice) | 0 retries |
   | Response body | 60s | Headers parsed | Content-Length bytes received | No | 0 retries |
   | **Total budget** | **120s** | Request initiated | Response complete | — | — |

2. **Implement phase-transition timer management**
   > 💡 *WHY: When the connection advances from "connecting" to "reading headers," the connect timer must be cancelled and the header timer started. Missing a cancellation means a spurious timeout kills a healthy connection.*

   ```cpp
   enum class Phase {
       DNS, CONNECT, TLS, SEND, RESPONSE_HEADERS, RESPONSE_BODY, DONE
   };

   struct RequestContext {
       int fd;
       Phase phase = Phase::DNS;
       TimeoutConfig cfg;
       std::chrono::steady_clock::time_point request_start;

       std::chrono::milliseconds get_phase_timeout(Phase p) {
           switch (p) {
               case Phase::DNS:              return cfg.dns_resolve;
               case Phase::CONNECT:          return cfg.connect;
               case Phase::TLS:              return cfg.tls_handshake;
               case Phase::SEND:             return cfg.request_send;
               case Phase::RESPONSE_HEADERS: return cfg.response_head;
               case Phase::RESPONSE_BODY:    return cfg.response_body;
               default:                      return std::chrono::seconds(0);
           }
       }

       void advance_phase(Phase next, TimerHeap& timers) {
           timers.cancel(fd);  // cancel current phase timer

           auto now = std::chrono::steady_clock::now();
           auto elapsed = now - request_start;
           auto remaining = cfg.total_budget - elapsed;

           auto phase_limit = get_phase_timeout(next);
           auto effective = std::min(phase_limit,
               std::chrono::duration_cast<std::chrono::milliseconds>(remaining));

           if (effective <= std::chrono::milliseconds(0)) {
               handle_budget_exhausted(fd);
               return;
           }
           phase = next;
           timers.schedule(fd, effective);
       }
   };
   ```

3. **Classify failures as transient or permanent**
   > 💡 *WHY: Retrying a permanent failure wastes time and resources. Retrying a transient failure is the correct recovery action. The classification must be per-errno, not per-phase.*

   | errno / condition | Phase | Classification | Action |
   |-------------------|-------|---------------|--------|
   | `ETIMEDOUT` | connect | Transient | Retry once with fresh socket |
   | `ECONNREFUSED` | connect | Permanent | Fail — port not open |
   | `ECONNRESET` | read | Transient | Retry if idempotent (GET), else fail |
   | `EHOSTUNREACH` | connect | Permanent | Fail — no route to host |
   | Read timeout | response | Transient | Retry if budget remains |
   | Content-Length mismatch | body | Permanent | Fail — response corrupted |
   | TLS cert invalid | TLS | Permanent | Fail — security violation |

   ```cpp
   bool is_transient(Phase phase, int err) {
       if (err == ETIMEDOUT)   return true;
       if (err == ECONNRESET)  return true;
       if (err == ECONNREFUSED) return false;  // permanent
       if (err == EHOSTUNREACH) return false;   // permanent
       return false;  // default: assume permanent
   }
   ```

4. **Enforce the total request budget**
   > 💡 *WHY: Without a total budget, a request that retries DNS twice (10s), then connects slowly (10s), then waits for headers (30s) has already used 50s before the body even starts. The total budget caps cumulative wall time.*

   ```cpp
   std::chrono::milliseconds effective_timeout(
       Phase phase, const TimeoutConfig& cfg,
       std::chrono::steady_clock::time_point request_start)
   {
       auto now = std::chrono::steady_clock::now();
       auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
           now - request_start);
       auto remaining = cfg.total_budget - elapsed;

       if (remaining <= std::chrono::milliseconds(0))
           return std::chrono::milliseconds(0);  // budget exhausted

       auto phase_limit = get_phase_timeout(phase, cfg);
       return std::min(phase_limit, remaining);
   }
   ```

5. **Write diagnostic logging for timeout events**
   > 💡 *WHY: When a request fails, you need to know which phase timed out, how much budget was remaining, and whether it was transient or permanent. This log line is what on-call engineers search for at 3 AM.*

   ```cpp
   const char* phase_name(Phase p) {
       switch (p) {
           case Phase::DNS:              return "dns_resolve";
           case Phase::CONNECT:          return "tcp_connect";
           case Phase::TLS:              return "tls_handshake";
           case Phase::SEND:             return "request_send";
           case Phase::RESPONSE_HEADERS: return "response_headers";
           case Phase::RESPONSE_BODY:    return "response_body";
           default:                      return "unknown";
       }
   }

   void log_timeout(int fd, Phase phase, const RequestContext& ctx) {
       auto now = std::chrono::steady_clock::now();
       auto elapsed_ms = std::chrono::duration_cast<
           std::chrono::milliseconds>(now - ctx.request_start).count();

       fprintf(stderr,
           "[TIMEOUT] fd=%d phase=%s elapsed=%ldms budget=%ldms "
           "classification=%s\n",
           fd, phase_name(phase), elapsed_ms,
           ctx.cfg.total_budget.count(),
           is_transient(phase, errno) ? "transient" : "permanent");
   }
   ```

## Done when

- [ ] Timeout matrix with ≥ 5 phases, each with distinct value and retry policy — *your HTTP client's reliability contract*
- [ ] Phase-transition code cancels old timer and starts new with remaining budget — *no spurious timeouts on healthy connections*
- [ ] Failure classification table maps errno to transient/permanent per phase — *retry only what's worth retrying*
- [ ] Total request budget enforced: phase timeout = min(phase_limit, remaining) — *bounded total wall time*
- [ ] Diagnostic log format shows phase, elapsed, budget, classification — *the line you search for during incidents*

## Proof

Paste your timeout matrix table, phase-transition code, and failure classification, or upload `week-4/day4-http-timeout-matrix.md`.

**Quick self-test** (answer without looking at your notes):

1. Why must connect timeout and read timeout be separate? → **A server may accept connections instantly but take 30s to generate a response. A single timeout of 10s would kill the request during the legitimate read wait.**
2. What does "total budget" prevent? → **It prevents a sequence of retries and slow phases from making a request take arbitrarily long. Even if each phase is under its individual limit, the total caps cumulative wall time.**
3. Is `ECONNREFUSED` transient or permanent, and why? → **Permanent — it means no process is listening on that port. Retrying immediately will get the same result. Retry only makes sense after a longer backoff if you expect the service to restart.**
