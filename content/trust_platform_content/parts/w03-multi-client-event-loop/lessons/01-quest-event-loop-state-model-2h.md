---
id: w03-multi-client-event-loop-d01-quest-event-loop-state-model-2h
part: w03-multi-client-event-loop
title: "Quest: Event Loop State Model  2h"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Event Loop State Model  2h

## Goal

Design the **complete state model** for a non-blocking event loop so every connection has explicit, trackable state transitions before you write any loop code.

By end of this session you will have:

- ✅ A **connection state enum** covering all lifecycle phases (connecting, reading, writing, closing)
- ✅ A **state transition table** showing valid transitions with trigger events
- ✅ A **blocking-call audit** proving no blocking operations exist in the loop path
- ✅ A **per-connection data structure** spec showing what each connection tracks

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | State enum has ≥ 5 states | Count enum values |
| 2 | Transition table covers all state pairs | Verify every state has at least one exit transition |
| 3 | Blocking audit has zero violations | Search for recv/send/accept without O_NONBLOCK |
| 4 | Per-connection struct has ≥ 4 fields | Review struct definition |
| 5 | EAGAIN handling documented for every I/O call | Check each recv/send path |

## What You're Building Today

A design document defining the state machine for your multi-client event loop — the "blueprint" before writing C++ loop code.

By end of this session, you will have:

- ✅ File: `week-3/day1-event-loop-state-model.md`
- ✅ Connection state enum with 5+ states: `CONNECTING`, `READING_HEADER`, `READING_BODY`, `WRITING`, `CLOSING`
- ✅ State transition table with events and guard conditions
- ✅ Per-connection struct: `{ fd, state, read_buf, write_buf, last_active, bytes_queued }`

What "done" looks like:

```cpp
## Connection States
enum ConnState {
    CONNECTING,      // accept() returned, waiting for first data
    READING_HEADER,  // partial header received, need more bytes
    READING_BODY,    // header complete, reading payload
    WRITING,         // response queued, draining write buffer
    CLOSING          // shutdown initiated, draining then close
};

## Per-Connection Data
struct Connection {
    int fd;
    ConnState state;
    std::vector<uint8_t> read_buf;
    std::vector<uint8_t> write_buf;
    time_t last_active;
    size_t bytes_queued;
};
```

You **can**: Describe every state a connection can be in and what triggers each transition.
You **cannot yet**: Run the event loop — that starts on Day 2 when you implement the select loop.

## Why This Matters

🔴 **Without this, you will:**
- Treat connections as stateless and lose track of partial reads mid-message
- Accidentally call blocking `recv()` inside the event loop, freezing all clients
- Have no way to detect or handle `EAGAIN` — the kernel telling you "not ready yet"
- Waste hours debugging "why does the server hang with 2+ clients?"

🟢 **With this, you will:**
- Know exactly what phase each connection is in at all times
- Handle `EAGAIN` as a normal event, not an error — the key insight of non-blocking I/O
- Detect stuck connections by checking state + `last_active` timestamp
- Build a foundation that scales cleanly from 2 clients to 200 clients

🔗 **How this connects:**
- **To Day 2:** You will plug this state model into a `select()` loop
- **To Day 3:** Backpressure policy uses `bytes_queued` from this struct
- **To Day 4:** `poll()` migration preserves these exact states
- **To Week 4:** `epoll` upgrade keeps the same state machine, different notification
- **To Week 6:** Overload detection triggers on state queue depths defined here

🧠 **Mental model: "Explicit State Machines"**

In amateur code: state is scattered across local variables, if/else chains, and implicit assumptions.
In professional systems: **every entity has an explicit state enum with documented transitions.**

Event loops fail when state is implicit. A connection that's "reading" but also has unsent data in its write buffer
is in an ambiguous state. Your state model eliminates ambiguity.

By Week 11 when building replication, each follower node will have an explicit state machine too.
This habit starts TODAY — make state visible, make transitions explicit.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│               CONNECTION STATE MACHINE                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   accept()                                               │
│      │                                                   │
│      ▼                                                   │
│  ┌────────────┐  readable    ┌─────────────────┐        │
│  │ CONNECTING  │────────────▶│ READING_HEADER   │        │
│  └────────────┘              └────────┬────────┘        │
│                                       │ header complete  │
│                                       ▼                  │
│                              ┌─────────────────┐        │
│                              │ READING_BODY     │        │
│                              └────────┬────────┘        │
│                                       │ body complete    │
│                                       ▼                  │
│                              ┌─────────────────┐        │
│       EAGAIN ◀───────────────│ WRITING          │        │
│       (retry later)          └────────┬────────┘        │
│                                       │ write complete   │
│                                       ▼                  │
│                              ┌─────────────────┐        │
│                              │ CLOSING           │        │
│                              └────────┬────────┘        │
│                                       │ fd closed        │
│                                       ▼                  │
│                                   [removed]              │
│                                                          │
│  ANY STATE ──── error/timeout ───▶ CLOSING               │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-3/day1-event-loop-state-model.md`

## Do

1. **Define the connection state enum**
   > 💡 *WHY: Every connection needs a finite set of named states. Without this, you'll use booleans like `is_reading` and `is_writing` that create impossible combinations.*

   Define at least 5 states. For each state, write one sentence explaining what the connection is doing:

   ```cpp
   // State: CONNECTING
   // Connection accepted but no data exchanged yet.
   // Valid next: READING_HEADER (on readable), CLOSING (on timeout)
   ```

2. **Build the state transition table**
   > 💡 *WHY: A transition table prevents illegal state changes. On Day 4 when you migrate to `poll()`, this table is your regression checklist — behavior must be identical.*

   Create a table with columns: Current State → Event → Next State → Action:

   | Current | Event | Next | Action |
   |---------|-------|------|--------|
   | CONNECTING | fd readable | READING_HEADER | Start reading into buffer |
   | READING_HEADER | header complete | READING_BODY | Parse header, continue reading |
   | READING_BODY | body complete | WRITING | Prepare response, queue write |
   | WRITING | write complete | CLOSING | Initiate graceful shutdown |
   | WRITING | EAGAIN | WRITING | Register for writability, retry later |
   | ANY | error | CLOSING | Log error, begin close sequence |
   | ANY | timeout | CLOSING | Log timeout, begin close sequence |

3. **Design the per-connection data structure**
   > 💡 *WHY: Each connection is independent state. The struct IS the connection's memory. In Week 5 when threads access connections, ownership of this struct prevents data races.*

   Define a struct with these minimum fields:

   ```cpp
   struct Connection {
       int fd;                          // socket file descriptor
       ConnState state;                 // current state enum value
       std::vector<uint8_t> read_buf;   // partial read accumulator
       std::vector<uint8_t> write_buf;  // pending write data
       time_t last_active;              // for timeout detection
       size_t bytes_queued;             // for backpressure tracking
   };
   ```

   Add any additional fields you need for your protocol (e.g., `request_id`, `frame_bytes_remaining`).

4. **Audit for blocking calls**
   > 💡 *WHY: ONE blocking call inside the event loop freezes ALL clients. This audit catches the #1 event-loop bug before it happens.*

   Search your planned code paths for these dangerous patterns:

   | Call | Danger | Non-blocking alternative |
   |------|--------|------------------------|
   | `recv(fd, ...)` without `O_NONBLOCK` | Blocks if no data ready | Set `O_NONBLOCK` on fd after `accept()` |
   | `send(fd, ...)` without `O_NONBLOCK` | Blocks if send buffer full | Check writability first, handle `EAGAIN` |
   | `accept()` without `O_NONBLOCK` | Blocks if no pending conn | Set `O_NONBLOCK` on listen socket |
   | `sleep()` / `usleep()` | Freezes entire loop | Use poll/select timeout instead |

   Document your rule: **"Every fd is set `O_NONBLOCK` immediately after creation."**

5. **Define EAGAIN handling for every I/O path**
   > 💡 *WHY: `EAGAIN` is not an error — it means "try again later." Mishandling it causes silent data loss. By Week 6, your backpressure system depends on correct EAGAIN response.*

   For each I/O operation, define what happens on `EAGAIN`:

   ```
   recv() returns EAGAIN:
     → Keep current state
     → Re-register fd for read readiness
     → Do NOT close connection
     → Do NOT discard partial buffer

   send() returns EAGAIN:
     → Keep remaining data in write_buf
     → Register fd for write readiness
     → Transition state to WRITING (if not already)
     → bytes_queued tracks unsent amount
   ```

   **Rule:** EAGAIN means "not ready yet" — NEVER means "failed."

## Done when

- [ ] Connection state enum with 5+ named states — *becomes your Day 2 switch/case structure*
- [ ] State transition table with events and guard conditions — *your Day 4 regression checklist*
- [ ] Per-connection struct with fd, state, buffers, timestamp, queue counter — *the data each connection owns*
- [ ] Blocking call audit with zero violations — *prevents the #1 event-loop bug*
- [ ] EAGAIN handling documented for recv and send — *the foundation of non-blocking I/O*

## Proof

Paste your connection state enum, transition table, and per-connection struct, or upload `week-3/day1-event-loop-state-model.md`.

**Quick self-test** (answer without looking at your notes):
> 💡 *WHY these questions: If you can answer all 3 instantly, you've internalized the concept. If not, re-read — these come back in future weeks.*

1. What does `EAGAIN` mean when `recv()` returns it? → **"Not ready yet — try again later." It is NOT an error.**
2. What happens if you call blocking `recv()` inside an event loop with 50 clients? → **The entire loop freezes until that one recv completes — all 49 other clients wait.**
3. What state must a connection track to implement backpressure? → **`bytes_queued` (or write buffer size) — if it exceeds a threshold, stop reading from that client.**
