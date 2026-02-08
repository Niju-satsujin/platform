---
id: w03-multi-client-event-loop-d02-quest-first-multi-client-loop-2h
part: w03-multi-client-event-loop
title: "Quest: First Multi-Client Loop  2h"
order: 2
duration_minutes: 120
prereqs:
  - "w03-multi-client-event-loop-d01-quest-event-loop-state-model-2h"
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: First Multi-Client Loop  2h

## Goal

Plan and design your first **multi-client event loop** using `select()` so you can serve 50+ concurrent clients from a single thread without blocking.

By end of this session you will have:

- ✅ A **select() loop pseudocode** showing fd_set setup, timeout, and dispatch
- ✅ A **connection registry** design for tracking all active connections
- ✅ A **connect/disconnect burst test plan** for 50+ clients
- ✅ A **max-fd tracking strategy** to handle `select()` limits correctly

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | select() loop pseudocode handles read, write, and error sets | Verify all 3 fd_sets used |
| 2 | Connection registry supports add/remove/lookup by fd | Check API signatures |
| 3 | Max-fd tracking updates on every add/remove | Trace through add/remove paths |
| 4 | Test plan covers 50+ concurrent idle clients | Count test scenario rows |
| 5 | Timeout value chosen and justified | Look for timeout rationale |

## What You're Building Today

A design document for your first multi-client server using `select()` — the simplest multiplexing API that works everywhere.

By end of this session, you will have:

- ✅ File: `week-3/day2-select-plan.md`
- ✅ select() loop pseudocode with fd_set setup and event dispatch
- ✅ Connection registry API: `add(fd)`, `remove(fd)`, `get(fd)`
- ✅ Test plan for 50+ concurrent connections with connect/disconnect bursts

What "done" looks like:

```cpp
## Select Loop Pseudocode
while (running) {
    fd_set read_fds, write_fds, error_fds;
    FD_ZERO(&read_fds); FD_ZERO(&write_fds); FD_ZERO(&error_fds);

    FD_SET(listen_fd, &read_fds);  // always watch for new connections
    int max_fd = listen_fd;

    for (auto& [fd, conn] : registry) {
        FD_SET(fd, &read_fds);     // always watch for data
        if (!conn.write_buf.empty())
            FD_SET(fd, &write_fds); // watch for writability if data pending
        FD_SET(fd, &error_fds);
        max_fd = std::max(max_fd, fd);
    }

    struct timeval tv = {.tv_sec = 1, .tv_usec = 0};
    int ready = select(max_fd + 1, &read_fds, &write_fds, &error_fds, &tv);
    // dispatch to handlers...
}
```

You **can**: Design a complete multi-client loop that tracks and dispatches events for 50+ connections.
You **cannot yet**: Handle backpressure — that comes on Day 3. You also can't handle `poll()` migration yet (Day 4).

## Why This Matters

🔴 **Without this, you will:**
- Be limited to one client at a time (blocking server) — useless for real workloads
- Misuse `select()` by forgetting to rebuild fd_sets each iteration (they're destructive)
- Forget to track `max_fd` and silently miss events on higher-numbered descriptors
- Have no plan for handling connect/disconnect storms that happen in production

🟢 **With this, you will:**
- Serve 50+ clients from a single thread — the foundation of all high-performance servers
- Understand `select()` mechanics deeply before migrating to better APIs
- Have a clear connection registry that maps fd → state for instant lookups
- Have a test plan that proves your loop survives connection churn

🔗 **How this connects:**
- **To Day 1:** Your state model plugs directly into this loop's dispatch logic
- **To Day 3:** Backpressure policy adds write-buffer limits to this registry
- **To Day 4:** `poll()` replaces `select()` but your dispatch logic stays identical
- **To Week 4:** `epoll` replaces `poll()` — same pattern, better scaling
- **To Week 5:** Thread pool offloads CPU work FROM this loop

🧠 **Mental model: "Event-Driven Dispatch"**

In blocking servers: one thread per client. 1000 clients = 1000 threads = memory explosion.
In event-driven servers: **one thread, one loop, N clients. The loop asks "who's ready?" and dispatches.**

`select()` is the simplest form of this pattern. It's limited (~1024 fds) but teaches the core concept:
**readiness notification → dispatch → handle → back to waiting.**

Every high-performance server (nginx, Redis, Node.js) uses this pattern. You're learning the primitive version first.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│                   SELECT() EVENT LOOP                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────┐                    │
│  │ 1. Build fd_sets from registry   │                    │
│  │    read_fds: all connections     │                    │
│  │    write_fds: those with data    │                    │
│  │    error_fds: all connections    │                    │
│  │    max_fd: track highest fd      │                    │
│  └──────────────┬───────────────────┘                    │
│                 ▼                                         │
│  ┌──────────────────────────────────┐                    │
│  │ 2. select(max_fd+1, r, w, e, t) │ ◀── blocks here    │
│  │    (waits for readiness)          │     until ready    │
│  └──────────────┬───────────────────┘                    │
│                 ▼                                         │
│  ┌──────────────────────────────────┐                    │
│  │ 3. Dispatch ready fds:           │                    │
│  │    listen_fd → accept new conn   │                    │
│  │    readable  → recv into buffer  │                    │
│  │    writable  → send from buffer  │                    │
│  │    error     → close + cleanup   │                    │
│  └──────────────┬───────────────────┘                    │
│                 │                                         │
│                 └──── loop back to step 1 ────────────▶  │
│                                                          │
│  Connection Registry: fd → Connection { state, bufs }    │
│  [fd=4: READING] [fd=7: WRITING] [fd=12: READING] ...   │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-3/day2-select-plan.md`

## Do

1. **Design the connection registry**
   > 💡 *WHY: You need O(1) lookup from fd to connection state. A `std::unordered_map<int, Connection>` gives you this. On Day 3, backpressure decisions use this registry.*

   ```cpp
   class ConnectionRegistry {
       std::unordered_map<int, Connection> conns_;
       int max_fd_ = -1;
   public:
       void add(int fd, Connection conn);  // insert + update max_fd
       void remove(int fd);                 // erase + recalculate max_fd
       Connection* get(int fd);             // lookup, returns nullptr if missing
       int max_fd() const;                  // for select() first argument
       // Iterator for building fd_sets
       auto begin() { return conns_.begin(); }
       auto end() { return conns_.end(); }
   };
   ```

2. **Write the select() loop pseudocode**
   > 💡 *WHY: `select()` DESTROYS the fd_sets on return — you must rebuild them every iteration. Forgetting this causes "server stops responding after first event."*

   Write the full loop structure showing:
   - fd_set initialization (FD_ZERO every iteration!)
   - Adding listen_fd to read_fds
   - Adding all client fds to appropriate sets
   - select() call with timeout
   - Dispatch logic checking FD_ISSET for each fd

   **Critical rule:** FD_ZERO + rebuild EVERY iteration. select() modifies the sets.

3. **Define the accept handler**
   > 💡 *WHY: New connections arrive as readability on the listen socket. You must set the new fd to `O_NONBLOCK` immediately — this is the rule from Day 1.*

   ```
   if FD_ISSET(listen_fd, &read_fds):
       new_fd = accept(listen_fd, ...)
       set_nonblocking(new_fd)           // CRITICAL: O_NONBLOCK immediately
       registry.add(new_fd, Connection{
           .fd = new_fd,
           .state = CONNECTING,
           .last_active = now()
       })
   ```

4. **Define read/write dispatch handlers**
   > 💡 *WHY: Read and write handlers are where partial I/O and EAGAIN happen. Your Day 1 state machine drives these transitions.*

   For readable fds:
   ```
   bytes = recv(fd, buf, sizeof(buf), 0)
   if bytes > 0:  update read_buf, advance state per transition table
   if bytes == 0: peer closed → transition to CLOSING
   if bytes < 0 && errno == EAGAIN: do nothing, try again next loop
   if bytes < 0 && errno != EAGAIN: error → transition to CLOSING
   ```

   For writable fds:
   ```
   bytes = send(fd, write_buf.data(), write_buf.size(), 0)
   if bytes > 0:  remove sent bytes from write_buf
   if bytes < 0 && errno == EAGAIN: do nothing, try again next loop
   if write_buf.empty(): all data sent → advance state
   ```

5. **Plan the 50-client test**
   > 💡 *WHY: You need to prove this works under realistic load. 50 clients exposes fd_set rebuild bugs, max_fd tracking errors, and connection churn issues.*

   Design a test scenario table:

   | # | Scenario | Expected |
   |---|----------|----------|
   | 1 | 50 clients connect simultaneously | All accepted, all in registry |
   | 2 | All 50 send one message | All messages received correctly |
   | 3 | 25 clients disconnect | 25 remain, no fd leaks |
   | 4 | 25 new clients connect while 25 active | Total 50 again, no confusion |
   | 5 | All 50 send messages rapidly | No data loss, no starvation |
   | 6 | Kill server during active connections | Clean shutdown attempted |

## Done when

- [ ] Connection registry with add/remove/lookup in O(1) — *plugs directly into Day 3 backpressure checks*
- [ ] select() loop pseudocode rebuilds fd_sets every iteration — *prevents the #1 select bug*
- [ ] Accept handler sets O_NONBLOCK immediately — *Day 1 rule enforced*
- [ ] Read/write handlers follow EAGAIN protocol — *no data loss on partial I/O*
- [ ] 50-client test plan with 6+ scenarios — *proves loop survives real connection patterns*

## Proof

Paste your select() loop pseudocode and connection registry design, or upload `week-3/day2-select-plan.md`.

**Quick self-test** (answer without looking at your notes):
> 💡 *WHY these questions: If you can answer all 3 instantly, you've internalized the concept. If not, re-read — these come back in future weeks.*

1. Why must you call FD_ZERO before every select() call? → **Because select() modifies the fd_sets — it clears bits for fds that are NOT ready. Reusing without zeroing misses events.**
2. What is the first argument to select()? → **`max_fd + 1` — select needs to know the range of fds to check.**
3. How many threads does your event loop use to handle 50 clients? → **ONE thread. That is the whole point — multiplexing replaces threading for I/O-bound work.**
