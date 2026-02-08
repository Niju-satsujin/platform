---
id: w04-epoll-http-client-d02-quest-timer-design-2h
part: w04-epoll-http-client
title: "Quest: Timer Design  2h"
order: 2
duration_minutes: 120
prereqs: [w04-epoll-http-client-d01-quest-epoll-strategy-2h]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Timer Design  2h

## Goal

Integrate **timer-driven cleanup** into your epoll event loop so that idle and stale connections are detected and removed without scanning every connection on every tick.

By end of this session you will have:

- ✅ A **timer data structure** (min-heap or timer wheel) that tracks per-connection deadlines
- ✅ A **timerfd integration** registering kernel timers into the same epoll instance as sockets
- ✅ An **idle-timeout policy** defining how long a silent connection lives before eviction
- ✅ A **timer-drift awareness document** showing how you handle late expirations under load
- ✅ A **cleanup path** that deregisters, closes, and frees connection resources without scanning all clients

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Timer structure chosen with complexity analysis | O(log n) insert/expire for heap, O(1) for wheel |
| 2 | `timerfd_create` registered in epoll | Verify `EPOLL_CTL_ADD` call with timer fd |
| 3 | Idle timeout ≥ 30s with justification | Check timeout constant and rationale |
| 4 | Timer drift bounded to ≤ 1 tick interval | Verify monotonic clock usage |
| 5 | Expired connections cleaned without full scan | Walk the expire path — only processes due entries |

## What You're Building Today

A timer subsystem that integrates with your Day 1 epoll loop to expire idle connections efficiently. No more polling every connection each tick — only connections whose deadlines have passed get touched.

By end of this session, you will have:

- ✅ File: `week-4/day2-timer-design.md`
- ✅ Timer min-heap or wheel implementation sketch with insert/cancel/expire operations
- ✅ `timerfd_create` + epoll integration code
- ✅ Idle timeout constant with justification and connection cleanup sequence

What "done" looks like:

```cpp
#include <sys/timerfd.h>

// Create a timerfd that fires every 1 second
int tfd = timerfd_create(CLOCK_MONOTONIC, TFD_NONBLOCK | TFD_CLOEXEC);
struct itimerspec ts = {};
ts.it_interval.tv_sec = 1;   // repeat every 1s
ts.it_value.tv_sec = 1;      // first fire in 1s
timerfd_settime(tfd, 0, &ts, nullptr);

// Register in the same epoll instance as sockets
struct epoll_event ev;
ev.events = EPOLLIN;
ev.data.fd = tfd;
epoll_ctl(epfd, EPOLL_CTL_ADD, tfd, &ev);
```

You **can**: Detect and remove idle connections within one tick interval of their deadline.
You **cannot yet**: Parse HTTP requests (Day 3) or enforce per-phase timeouts (Day 4).

## Why This Matters

🔴 **Without this, you will:**
- Accumulate zombie connections that consume fd slots until the process hits `ulimit`
- Scan all N connections every loop iteration just to find the 2 that timed out — O(N) waste
- Use wall-clock time and get bitten when NTP adjusts the clock backward
- Have no way to schedule future cleanup events from within the event loop

🟢 **With this, you will:**
- Expire only the connections that are actually due — O(log N) with a heap, O(1) with a wheel
- Use `CLOCK_MONOTONIC` so timers never go backward regardless of NTP or daylight savings
- Integrate timers as first-class epoll events alongside socket I/O — one unified loop
- Bound timer drift: if you tick every 1s, the worst-case late expiration is 1s

🔗 **How this connects:**
- **To Day 1:** Timer fd is registered using the same `EPOLL_CTL_ADD` pattern you designed yesterday
- **To Day 4:** HTTP timeout matrix uses this timer infrastructure to enforce per-phase deadlines
- **To Day 5:** End-to-end traces include timer-fired events in the correlation log
- **To Week 5 Day 5:** Graceful shutdown drains the timer queue before stopping the loop
- **To Week 6:** Overload shedding uses aggressive timeout reduction via this same timer system

🧠 **Mental model: "Passive Expiration"**

Amateur servers check every connection every tick: "Are you dead yet?" Professional servers schedule a future alarm: "Wake me when this one expires." The min-heap is your alarm clock — it always tells you the soonest deadline without looking at anything else. When the alarm fires, you process only what's due. Everything else sleeps undisturbed.

## Visual Model

```
┌────────────────────────────────────────────────────────────┐
│              TIMER-INTEGRATED EVENT LOOP                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  timerfd (1s tick)                                         │
│       │                                                    │
│       ▼                                                    │
│  ┌──────────┐     ┌─────────────────────────────────┐     │
│  │  epoll    │◀───│  socket fds (clients + listen)   │     │
│  │  wait()   │     └─────────────────────────────────┘     │
│  └────┬─────┘                                              │
│       │ event ready                                        │
│       ▼                                                    │
│  ┌──────────────────────────────────┐                      │
│  │  if timerfd readable:            │                      │
│  │    read(tfd, &expirations, 8)    │                      │
│  │    while heap.top() <= now:      │     MIN-HEAP         │
│  │      expire(heap.pop())    ──────┼──▶ ┌───┐             │
│  │                                  │    │ 42│ ← soonest   │
│  │  if socket readable:             │    ├───┤             │
│  │    handle_io(fd)                 │    │ 55│             │
│  │    update_deadline(fd, now+TTL)  │    ├───┤             │
│  │                                  │    │ 78│             │
│  │  if socket closing:              │    └───┘             │
│  │    cancel_timer(fd)              │    deadlines (sec)   │
│  │    deregister(fd)                │                      │
│  └──────────────────────────────────┘                      │
└────────────────────────────────────────────────────────────┘
```

## Build

File: `week-4/day2-timer-design.md`

## Do

1. **Choose your timer data structure**
   > 💡 *WHY: The data structure determines how fast you can insert new deadlines, find the soonest one, and cancel a specific timer. A wrong choice means O(N) scans that defeat the purpose of efficient event notification.*

   Compare the two main options:

   | Operation | Min-Heap | Timer Wheel (hashed) |
   |-----------|----------|---------------------|
   | Insert | O(log N) | O(1) |
   | Find soonest | O(1) — top of heap | O(1) — current slot |
   | Cancel by fd | O(N) search + O(log N) fix | O(1) with backpointer |
   | Memory | Compact array | Fixed slots, may waste space |
   | Best for | Variable timeouts | Uniform timeouts |

   Write your choice and rationale. For most servers, a **min-heap** is simplest and sufficient for < 10K connections.

2. **Implement the timer heap interface**
   > 💡 *WHY: You need exactly three operations: schedule a deadline, cancel a deadline, and expire all past-due entries. Defining the interface now prevents ad-hoc timer code scattered across your event loop.*

   ```cpp
   struct TimerEntry {
       int fd;
       std::chrono::steady_clock::time_point deadline;
       bool operator>(const TimerEntry& o) const {
           return deadline > o.deadline;
       }
   };

   class TimerHeap {
       std::priority_queue<TimerEntry, std::vector<TimerEntry>,
                           std::greater<TimerEntry>> heap_;
       std::unordered_set<int> cancelled_;
   public:
       void schedule(int fd, std::chrono::milliseconds ttl);
       void cancel(int fd);
       std::vector<int> expire_due();  // returns fds whose deadline <= now
   };
   ```

3. **Integrate `timerfd_create` with epoll**
   > 💡 *WHY: A `timerfd` turns time into a file descriptor event. This lets your single `epoll_wait` handle both I/O readiness AND timer expirations — no separate timer thread, no signal-based timers, no polling.*

   Write the integration code:

   ```cpp
   int create_tick_timer(int epfd, int interval_sec) {
       int tfd = timerfd_create(CLOCK_MONOTONIC, TFD_NONBLOCK | TFD_CLOEXEC);
       if (tfd == -1) { perror("timerfd_create"); return -1; }

       struct itimerspec ts = {};
       ts.it_interval.tv_sec = interval_sec;
       ts.it_value.tv_sec = interval_sec;
       timerfd_settime(tfd, 0, &ts, nullptr);

       struct epoll_event ev;
       ev.events = EPOLLIN;
       ev.data.fd = tfd;
       epoll_ctl(epfd, EPOLL_CTL_ADD, tfd, &ev);
       return tfd;
   }

   void handle_timer_tick(int tfd, TimerHeap& timers, int epfd) {
       uint64_t expirations;
       read(tfd, &expirations, sizeof(expirations));  // must read to reset
       for (int fd : timers.expire_due()) {
           epoll_ctl(epfd, EPOLL_CTL_DEL, fd, nullptr);
           close(fd);
       }
   }
   ```

4. **Define idle timeout policy and deadline updates**
   > 💡 *WHY: Every I/O event on a connection proves it's alive. You must update its deadline on every recv/send. Without this, active connections get killed by their own idle timer.*

   ```cpp
   constexpr auto IDLE_TIMEOUT = std::chrono::seconds(60);

   // Called after every successful recv() or send()
   void touch_connection(int fd, TimerHeap& timers) {
       timers.cancel(fd);                    // remove old deadline
       timers.schedule(fd, IDLE_TIMEOUT);    // set new deadline
   }

   // Called on connection close
   void close_connection(int fd, TimerHeap& timers, int epfd) {
       timers.cancel(fd);
       epoll_ctl(epfd, EPOLL_CTL_DEL, fd, nullptr);
       close(fd);
   }
   ```

   Document your timeout value choice: "60 seconds because HTTP keep-alive defaults to 60s, and shorter risks killing slow clients on congested networks."

5. **Analyze timer drift under load**
   > 💡 *WHY: If your timer tick is 1s but the event loop takes 3s to process a batch of events, your timers fire 2s late. This is drift. You must acknowledge it and bound the damage.*

   | Scenario | Tick interval | Loop latency | Effective drift | Impact |
   |----------|--------------|--------------|-----------------|--------|
   | Idle server | 1s | < 1ms | ~0 | None |
   | 100 active clients | 1s | 50ms | ≤ 50ms | Negligible |
   | 1000 clients, burst | 1s | 500ms | ≤ 500ms | Acceptable |
   | Overloaded | 1s | 3s | ≤ 3s | Connections live 3s longer than intended |

   Write your rule: "Timer drift is bounded by one loop iteration. Under overload, connections may live up to `loop_latency` beyond their deadline. This is acceptable because overload shedding (Week 6) reduces the population before drift becomes dangerous."

## Done when

- [ ] Timer data structure chosen with complexity analysis for insert/cancel/expire — *this structure persists through Week 12*
- [ ] Timer heap interface defined with schedule, cancel, and expire_due methods — *clean API prevents scattered timer logic*
- [ ] `timerfd_create` registered in epoll instance with tick handler — *one event loop, zero timer threads*
- [ ] Idle timeout constant defined with deadline updates on every I/O event — *active connections never expire*
- [ ] Timer drift analysis with worst-case bound documented — *you know the failure mode before it bites you*

## Proof

Paste your timer heap interface, timerfd integration code, and drift analysis table, or upload `week-4/day2-timer-design.md`.

**Quick self-test** (answer without looking at your notes):

1. Why use `CLOCK_MONOTONIC` instead of `CLOCK_REALTIME` for connection timers? → **`CLOCK_MONOTONIC` never jumps backward (NTP adjustments, daylight savings). A realtime clock going backward makes timers fire late or never.**
2. What happens if you forget to `read()` the timerfd after it fires? → **The timerfd stays readable and epoll keeps waking you up every iteration (level-triggered) — or you miss all future fires (edge-triggered).**
3. How do you prevent killing active connections with the idle timer? → **Call `timers.cancel(fd)` + `timers.schedule(fd, IDLE_TIMEOUT)` after every successful `recv()` or `send()` to reset the deadline.**
