---
id: w04-epoll-http-client-d01-quest-epoll-strategy-2h
part: w04-epoll-http-client
title: "Quest: Epoll Strategy  2h"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Epoll Strategy  2h

## Goal

Design the **complete epoll notification strategy** for your server so every file descriptor is monitored with a deliberate trigger mode, starvation is prevented by policy, and no events are silently lost.

By end of this session you will have:

- ✅ A **trigger-mode decision document** comparing edge-triggered (ET) vs level-triggered (LT) with your chosen mode and rationale
- ✅ An **fd registration lifecycle** defining when descriptors are added, modified, and removed from the epoll instance
- ✅ A **starvation prevention policy** ensuring one busy connection cannot starve all others
- ✅ An **event-handling checklist** guaranteeing no readiness notifications are missed
- ✅ A **wakeup efficiency analysis** proving your design avoids thundering-herd on the listen socket

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Trigger mode chosen with 3+ tradeoff reasons | Review decision document |
| 2 | Registration lifecycle covers add/mod/del for every fd type | Walk through accept, client read, client write, close |
| 3 | Starvation policy limits per-fd work per loop iteration | Check max-events-per-fd rule exists |
| 4 | EPOLLET paths drain fully before re-entering wait | Verify read-until-EAGAIN loop in ET path |
| 5 | Listen socket uses EPOLLEXCLUSIVE or single-acceptor | Check accept strategy |

## What You're Building Today

A design document specifying how your server uses Linux `epoll` — the kernel's scalable I/O notification mechanism that replaces `select()`/`poll()` for high-concurrency workloads.

By end of this session, you will have:

- ✅ File: `week-4/day1-epoll-strategy.md`
- ✅ Trigger mode selection: edge-triggered or level-triggered with justification
- ✅ Registration lifecycle diagram for every fd type (listen, client-read, client-write)
- ✅ Starvation prevention rule: max N bytes or M events per fd per loop pass

What "done" looks like:

```cpp
// epoll instance creation
int epfd = epoll_create1(EPOLL_CLOEXEC);

// Register listen socket — level-triggered, read only
struct epoll_event ev;
ev.events = EPOLLIN;              // LT: kernel re-notifies if not drained
ev.data.fd = listen_fd;
epoll_ctl(epfd, EPOLL_CTL_ADD, listen_fd, &ev);

// Register client socket — edge-triggered, read + write
ev.events = EPOLLIN | EPOLLOUT | EPOLLET | EPOLLRDHUP;
ev.data.fd = client_fd;
epoll_ctl(epfd, EPOLL_CTL_ADD, client_fd, &ev);
```

You **can**: Specify exactly when and how every fd enters, changes, and leaves the epoll set.
You **cannot yet**: Integrate timers (Day 2) or parse HTTP (Day 3) — today is purely the event notification layer.

## Why This Matters

🔴 **Without this, you will:**
- Default to level-triggered and wonder why the server burns CPU re-notifying fds you already know about
- Miss events in edge-triggered mode because you forgot to drain the fd fully before re-entering `epoll_wait`
- Let one client sending a flood of data starve all other connections indefinitely
- Leak epoll registrations by forgetting `EPOLL_CTL_DEL` before `close()`, causing ghost events

🟢 **With this, you will:**
- Make a deliberate trigger-mode choice backed by measurable tradeoffs
- Handle every `epoll_wait` return value correctly — including `EINTR` and zero-events
- Guarantee fairness: no single fd monopolizes the event loop iteration
- Maintain a clean epoll set with zero leaked registrations

🔗 **How this connects:**
- **To Day 2:** Timer fds (`timerfd_create`) are registered in this same epoll instance
- **To Day 3:** HTTP parser consumes bytes drained by your read loop designed here
- **To Week 3 Day 4:** This replaces your `poll()` implementation with the same state machine
- **To Week 5:** Thread pool workers will receive tasks dispatched from this epoll loop
- **To Week 6:** Backpressure triggers when epoll shows a fd's write buffer is full

🧠 **Mental model: "Notification Contract"**

`epoll` is a contract between your code and the kernel. In level-triggered mode the kernel says "this fd IS ready" every time you ask. In edge-triggered mode the kernel says "this fd BECAME ready" exactly once. If you miss the edge notification, no one reminds you. ET is faster but unforgiving. LT is safer but noisier. Your design document is the contract specification — it defines which promise you rely on for each fd type.

## Visual Model

```
┌─────────────────────────────────────────────────────────────┐
│                    EPOLL EVENT FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐  EPOLL_CTL_ADD   ┌──────────────────────┐     │
│  │ listen  │─────────────────▶│                      │     │
│  │ socket  │  (EPOLLIN, LT)   │                      │     │
│  └─────────┘                   │    epoll instance    │     │
│                                │    (kernel space)    │     │
│  ┌─────────┐  EPOLL_CTL_ADD   │                      │     │
│  │ client  │─────────────────▶│    ready list ──┐    │     │
│  │ fd = 7  │  (EPOLLIN|ET)    │                 │    │     │
│  └─────────┘                   └─────────────────┼────┘     │
│                                                  │          │
│                                                  ▼          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            epoll_wait(epfd, events, MAX, timeout)     │   │
│  │  returns: [{fd=4, EPOLLIN}, {fd=7, EPOLLIN|EPOLLOUT}]│   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌────────────────────────────────────────┐                 │
│  │  for each event:                       │                 │
│  │    if listen_fd → accept() loop        │                 │
│  │    if EPOLLIN   → read until EAGAIN    │                 │
│  │    if EPOLLOUT  → write until EAGAIN   │                 │
│  │    if EPOLLRDHUP → begin close         │                 │
│  │    max N bytes per fd (fairness cap)   │                 │
│  └────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## Build

File: `week-4/day1-epoll-strategy.md`

## Do

1. **Choose your trigger mode and justify it**
   > 💡 *WHY: This is the single most impactful design decision for your event loop. Getting it wrong means either wasted syscalls (LT) or lost events (ET). You need to commit and document why.*

   Compare edge-triggered vs level-triggered across these dimensions:

   | Dimension | Level-Triggered (LT) | Edge-Triggered (ET) |
   |-----------|----------------------|---------------------|
   | Notification | Every `epoll_wait` if fd ready | Once when fd *becomes* ready |
   | Miss risk | None — kernel re-notifies | High — must drain fully |
   | CPU cost | Higher — redundant wakeups | Lower — one wakeup per event |
   | Code complexity | Simpler — partial reads OK | Harder — need read-until-EAGAIN |
   | Best for | Listen socket (infrequent) | Client data sockets (high throughput) |

   Write your decision: "I choose \_\_\_ for listen socket because \_\_\_ and \_\_\_ for client sockets because \_\_\_."

2. **Define the fd registration lifecycle**
   > 💡 *WHY: Every fd must be added to epoll before it can be monitored and removed before it is closed. A leaked registration causes the kernel to report events on a stale fd — an extremely hard-to-debug failure.*

   Document each transition:

   ```cpp
   // After accept() — register new client
   void register_client(int epfd, int client_fd) {
       set_nonblocking(client_fd);  // MUST be first
       struct epoll_event ev;
       ev.events = EPOLLIN | EPOLLET | EPOLLRDHUP;
       ev.data.fd = client_fd;
       if (epoll_ctl(epfd, EPOLL_CTL_ADD, client_fd, &ev) == -1)
           perror("epoll_ctl ADD");
   }

   // When response ready — add write interest
   void enable_write(int epfd, int client_fd) {
       struct epoll_event ev;
       ev.events = EPOLLIN | EPOLLOUT | EPOLLET | EPOLLRDHUP;
       ev.data.fd = client_fd;
       epoll_ctl(epfd, EPOLL_CTL_MOD, client_fd, &ev);
   }

   // Before close() — always deregister first
   void deregister_client(int epfd, int client_fd) {
       epoll_ctl(epfd, EPOLL_CTL_DEL, client_fd, nullptr);
       close(client_fd);
   }
   ```

3. **Design the starvation prevention policy**
   > 💡 *WHY: Without a per-fd budget, one client streaming 10 GB of data monopolizes the event loop. All other clients time out and disconnect. This is a production-grade fairness issue.*

   Define your fairness rule:

   ```cpp
   constexpr size_t MAX_READ_PER_FD_PER_PASS = 16384;  // 16 KB

   // Inside event handler:
   size_t total_read = 0;
   while (total_read < MAX_READ_PER_FD_PER_PASS) {
       ssize_t n = recv(fd, buf, sizeof(buf), 0);
       if (n == -1 && errno == EAGAIN) break;  // drained
       if (n <= 0) { handle_close(fd); break; }
       total_read += n;
       process_bytes(fd, buf, n);
   }
   // If total_read == MAX_READ_PER_FD_PER_PASS, fd still has data
   // → it stays ready and gets served next iteration (fairness)
   ```

4. **Handle every `epoll_wait` return case**
   > 💡 *WHY: `epoll_wait` can return -1 (error), 0 (timeout), or N (events). Ignoring any case creates a latent bug. `EINTR` from signals is the most commonly missed case.*

   Document your handling for each return value:

   | Return | Meaning | Your action |
   |--------|---------|-------------|
   | `-1`, `errno==EINTR` | Signal interrupted wait | Retry `epoll_wait` immediately |
   | `-1`, other errno | Fatal error | Log errno, exit gracefully |
   | `0` | Timeout, no events | Run timer checks, continue loop |
   | `N > 0` | N fds have events | Process each event with fairness cap |

5. **Verify listen socket accept strategy**
   > 💡 *WHY: If the listen socket is edge-triggered, you must call `accept()` in a loop until EAGAIN — otherwise you miss queued connections. If level-triggered, one `accept()` per wake is fine but less efficient under burst.*

   Write your accept loop:

   ```cpp
   // ET listen socket: drain all pending connections
   void handle_accept(int epfd, int listen_fd) {
       while (true) {
           struct sockaddr_in addr;
           socklen_t len = sizeof(addr);
           int client_fd = accept4(listen_fd, (struct sockaddr*)&addr,
                                   &len, SOCK_NONBLOCK | SOCK_CLOEXEC);
           if (client_fd == -1) {
               if (errno == EAGAIN || errno == EWOULDBLOCK)
                   break;  // no more pending connections
               perror("accept4");
               break;
           }
           register_client(epfd, client_fd);
       }
   }
   ```

## Done when

- [ ] Trigger mode chosen for listen and client sockets with 3+ tradeoff reasons — *this decision carries through every future week*
- [ ] Registration lifecycle covers add, modify, delete for all fd types — *prevents ghost events from leaked registrations*
- [ ] Starvation policy caps per-fd work with a concrete byte or iteration limit — *required for Week 6 backpressure*
- [ ] All `epoll_wait` return values handled including EINTR — *prevents silent loop exits under signal pressure*
- [ ] Accept loop drains fully under ET or single-accepts under LT — *no connection left pending in the kernel queue*

## Proof

Paste your trigger-mode decision table, registration lifecycle functions, and starvation prevention rule, or upload `week-4/day1-epoll-strategy.md`.

**Quick self-test** (answer without looking at your notes):

1. What happens if you use edge-triggered mode but only call `recv()` once per notification? → **You miss all remaining data on that fd until the next edge transition — which may never come if the sender is waiting for your response.**
2. Why must you call `EPOLL_CTL_DEL` before `close()`? → **If the fd number is reused by a new `accept()` before the old registration is cleaned up, epoll delivers stale events to the wrong connection.**
3. How does your starvation policy work? → **Cap reads at N bytes per fd per loop iteration. If the fd still has data, it remains ready and gets served in the next pass — giving other fds a turn.**
