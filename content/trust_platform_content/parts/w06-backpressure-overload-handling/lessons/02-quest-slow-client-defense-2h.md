---
id: w06-backpressure-overload-handling-d02-quest-slow-client-defense-2h
part: w06-backpressure-overload-handling
title: "Quest: Slow-Client Defense  2h"
order: 2
duration_minutes: 120
prereqs: ["w06-backpressure-overload-handling-d01-quest-overload-policy-ladder-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Slow-Client Defense  2h

## Goal

A single slow client — intentional (Slowloris attack) or accidental (mobile on 2G) — can pin a file descriptor, a worker thread, and a chunk of buffer memory indefinitely. If your server has 1024 fd slots and 100 slow clients squat on them, legitimate traffic starves. Today you implement **read deadlines** and a **minimum-progress rule** that detect and evict stalled connections on Linux.

By end of this session you will have:

- ✅ Configured per-connection read deadlines using `timerfd_create` or `CLOCK_MONOTONIC` checks
- ✅ Implemented a minimum-progress rule: N bytes within T seconds or disconnect
- ✅ Added per-connection byte-accounting to track ingress rate
- ✅ Wired eviction into the epoll loop so stalled fds are closed and resources freed
- ✅ Tested with a synthetic slow client that sends 1 byte/sec

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Each connection has a read-deadline timestamp | Inspect `ConnectionState` struct |
| 2 | Progress check runs at least every 5 seconds | Timer fires in epoll loop |
| 3 | Connection sending < 64 bytes/5s is evicted | Slow-client test disconnected within 10s |
| 4 | Eviction logs include fd, bytes received, elapsed time | Grep structured log output |
| 5 | Legitimate fast clients are never evicted | Run concurrent fast + slow test |

## What You're Building Today

You are building a **connection watchdog** layer inside the epoll event loop. Every active connection gets a `ConnectionState` that tracks first-byte time, total bytes received, and a deadline. A periodic timer sweeps all connections and evicts any that fail the minimum-progress rule.

- ✅ A `ConnectionState` struct with deadline and byte counter
- ✅ A timer-driven sweep function registered with epoll
- ✅ An eviction path that sends a `408 Request Timeout` and closes the fd
- ✅ A slow-client simulator for testing

```cpp
struct ConnectionState {
    int fd;
    uint64_t bytes_received    = 0;
    uint64_t last_check_bytes  = 0;
    int64_t  deadline_ns;           // CLOCK_MONOTONIC absolute
    int64_t  last_sweep_ns;

    bool meets_progress(int64_t now_ns, uint64_t min_bytes, int64_t window_ns) const {
        if (now_ns - last_sweep_ns < window_ns) return true; // not yet due
        return (bytes_received - last_check_bytes) >= min_bytes;
    }
};
```

You **can**: adjust the progress threshold, add grace periods for TLS handshake time, or use a stricter per-phase deadline (connection phase vs request phase).

You **cannot yet**: throttle *outbound* data to slow readers — that is Day 3 (Egress Throttle). You also cannot propagate deadline information across these connections yet — that is Day 4 (Deadline Budget).

## Why This Matters

🔴 **Without this, you will:**
- Lose all available file descriptors to connections that never complete a request
- Be trivially vulnerable to Slowloris-class denial-of-service attacks
- See memory grow unboundedly as read buffers accumulate partial data
- Have no telemetry to distinguish slow clients from network partitions

🟢 **With this, you will:**
- Guarantee an upper bound on per-connection resource hold time
- Free fds for legitimate traffic within seconds of detecting stalls
- Log slow-client evictions with enough context for abuse-detection pipelines
- Establish the foundation for per-connection quotas in Week 9

🔗 **How this connects:**
- **Week 6 Day 1** (overload policy ladder) — slow-client eviction reduces queue depth before the reject rung fires
- **Week 6 Day 3** (egress throttle) — tomorrow adds the outbound counterpart
- **Week 4 Day 3** (epoll reactor) — you are extending the same event loop with timer fds
- **Week 5 Day 2** (structured logging) — eviction events feed the same log pipeline
- **Week 10 Day 2** (connection lifecycle) — formal state machine absorbs this watchdog

🧠 **Mental model: "Parking Meter"** — every connection feeds a parking meter on arrival. The meter ticks down. If the client doesn't feed it more bytes (coins), the meter expires and the city (server) tows the car (closes the fd). Fast clients keep feeding; slow clients get towed.

## Visual Model

```
  ┌────────────────────────────────────────────────┐
  │                 epoll_wait loop                 │
  │                                                │
  │  ┌──────────┐   ┌──────────┐   ┌──────────┐   │
  │  │ Client A │   │ Client B │   │ Client C │   │
  │  │ 12 KB/s  │   │  1 B/s   │   │  8 KB/s  │   │
  │  └────┬─────┘   └────┬─────┘   └────┬─────┘   │
  │       │              │              │          │
  │       ▼              ▼              ▼          │
  │  ┌──────────────────────────────────────────┐  │
  │  │         ConnectionState table            │  │
  │  │  fd │ bytes │ last_check │ deadline      │  │
  │  │   4 │ 60000 │   48000    │ t+30s    ✅   │  │
  │  │   5 │    5  │       0    │ t+30s    ❌   │  │
  │  │   6 │ 40000 │   32000    │ t+30s    ✅   │  │
  │  └──────────────────────────────────────────┘  │
  │       │                                        │
  │       ▼  timerfd fires every 5s                │
  │  ┌──────────────┐                              │
  │  │ Sweep: check │──▶ fd 5 fails progress       │
  │  │ min progress │──▶ send 408 + close(5)       │
  │  └──────────────┘──▶ log eviction event        │
  └────────────────────────────────────────────────┘
```

## Build

File: `week-6/day2-slow-client-defense.cpp`

## Do

### 1. **Create `ConnectionState` and a connection table**

> 💡 *WHY: Centralising per-connection metadata lets the sweep function iterate without touching the kernel for each check.*

Define `ConnectionState` as shown above. Store active connections in an `std::unordered_map<int, ConnectionState>` keyed by fd. On `accept()`, insert a new entry with `deadline_ns = now + 30s` and `bytes_received = 0`.

```cpp
std::unordered_map<int, ConnectionState> conn_table;

void on_accept(int fd) {
    int64_t now = clock_monotonic_ns();
    conn_table[fd] = {fd, 0, 0, now + 30'000'000'000LL, now};
}
```

### 2. **Register a timerfd with epoll for periodic sweeps**

> 💡 *WHY: `timerfd_create` integrates cleanly with epoll — no signal handlers, no busy-wait loops.*

Call `timerfd_create(CLOCK_MONOTONIC, TFD_NONBLOCK | TFD_CLOEXEC)`. Set it to fire every 5 seconds with `timerfd_settime`. Add the timer fd to your epoll interest set with `EPOLLIN`. When it fires, read the expiration count and run the sweep.

```cpp
int tfd = timerfd_create(CLOCK_MONOTONIC, TFD_NONBLOCK | TFD_CLOEXEC);
struct itimerspec spec = {};
spec.it_interval.tv_sec = 5;
spec.it_value.tv_sec    = 5;
timerfd_settime(tfd, 0, &spec, nullptr);
```

### 3. **Implement the sweep function**

> 💡 *WHY: Batching eviction checks into a periodic sweep amortises cost — O(n) every 5s is cheaper than per-read checks.*

Iterate `conn_table`. For each connection, call `meets_progress(now, 64, 5'000'000'000LL)`. If it fails, push the fd onto an eviction list. After iteration, evict all: write `"HTTP/1.1 408 Request Timeout\r\n\r\n"`, `shutdown(fd, SHUT_WR)`, `close(fd)`, remove from table. Update `last_check_bytes` and `last_sweep_ns` for survivors.

### 4. **Update byte counters on every read event**

> 💡 *WHY: If you only check progress at sweep time you need accurate running totals — never rely on kernel buffer state alone.*

In your `EPOLLIN` handler for client fds, after a successful `read()`, add the return value to `conn_table[fd].bytes_received`. If `read()` returns 0 (clean close) or -1 with `errno != EAGAIN`, remove the entry and close the fd.

### 5. **Test with a synthetic slow client**

> 💡 *WHY: You need a deterministic slow sender to prove the minimum-progress rule triggers correctly.*

Write a small Python or C++ client that connects and sends 1 byte every 2 seconds. Run it alongside 10 fast clients sending 4 KB requests. Verify:

| Check | Expected |
|-------|----------|
| Slow client disconnected within 10s | ✅ |
| Fast clients complete all requests | ✅ |
| Eviction log shows fd, bytes, elapsed | ✅ |
| No file descriptor leak (`ls /proc/<pid>/fd \| wc -l`) | ✅ |

## Done when

- [ ] `ConnectionState` tracks bytes and deadline per fd — *reused in W06D3 egress throttle*
- [ ] Timer-driven sweep fires every 5 seconds inside epoll loop — *pattern reused in W10D2 lifecycle*
- [ ] Slow client (< 64 bytes / 5s) is evicted with 408 response — *defends against Slowloris*
- [ ] Fast clients unaffected during concurrent slow-client test — *proves selectivity*
- [ ] Eviction log line includes fd, bytes_received, and elapsed_ns — *feeds abuse-detection in W14*

## Proof

Paste the output of your slow-client test showing the 408 disconnect **and** `ls /proc/<pid>/fd | wc -l` before and after eviction to prove no fd leak.

**Quick self-test**

1. **Q:** Why use `timerfd` instead of `alarm()` or `signal(SIGALRM)`?
   **A:** `timerfd` delivers timer expiry as a file-descriptor event, integrating directly with epoll. Signals interrupt `epoll_wait` with `EINTR`, require global handlers, and are not composable across threads.

2. **Q:** A client sends 63 bytes in 4.9 seconds — should it be evicted?
   **A:** Not yet. The sweep fires at 5s intervals. At the next sweep (≤5s later) the progress window resets. If the client still hasn't sent 64 bytes in the *next* window, it is evicted. This gives a maximum grace of nearly 10s, which is acceptable.

3. **Q:** Why `shutdown(fd, SHUT_WR)` before `close()`?
   **A:** `shutdown` sends a FIN immediately, signaling the client that the server is done. `close` alone may linger depending on `SO_LINGER` settings, and the client might not see the 408 response before the RST.

4. **Q:** Could a legitimate client on a slow network be false-positive evicted?
   **A:** Yes, if the progress threshold is too aggressive. The threshold (64 bytes / 5 seconds) should be tuned to your slowest legitimate client profile. Monitor eviction logs for false positives and adjust. Consider a longer grace period for the initial connection phase when TLS handshake adds latency.
