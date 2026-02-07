---
id: w03-multi-client-event-loop-d04-quest-poll-migration-2h
part: w03-multi-client-event-loop
title: "Quest: Poll Migration  2h"
order: 4
duration_minutes: 120
prereqs:
  - "w03-multi-client-event-loop-d03-quest-backpressure-policy-2h"
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Poll Migration  2h

## Goal

Plan the **migration from `select()` to `poll()`** while preserving every behavior from your existing event loop — a practice run for changing internals without changing contracts.

By end of this session you will have:

- ✅ A **select→poll mapping table** showing how each select concept translates to poll
- ✅ A **migration checklist** with before/after verification steps
- ✅ A **regression test list** proving identical behavior after the switch
- ✅ An **analysis** of what `poll()` improves over `select()` and what stays the same

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Mapping table covers fd_set, FD_ISSET, FD_SET, max_fd, timeout | All 5 select concepts mapped |
| 2 | Migration checklist has ≥ 8 steps | Count checklist items |
| 3 | Regression tests cover connect, disconnect, send, recv, timeout, EAGAIN | Verify 6 behaviors tested |
| 4 | Analysis compares fd limit, performance, and API complexity | Check 3 comparison points |
| 5 | State machine from Day 1 is unchanged | Confirm same states and transitions |

## What You're Building Today

A migration plan document for swapping `select()` with `poll()` — your first practice at changing implementation without changing behavior.

By end of this session, you will have:

- ✅ File: `week-3/day4-poll-migration-checklist.md`
- ✅ select→poll mapping table
- ✅ Migration checklist with 8+ verification steps
- ✅ Regression test list for 6+ behaviors

What "done" looks like:

```markdown
## Select → Poll Mapping
| select concept | poll equivalent |
|---------------|-----------------|
| fd_set read_fds | pollfd.events = POLLIN |
| fd_set write_fds | pollfd.events = POLLOUT |
| FD_SET(fd, &set) | Add pollfd to array |
| FD_ISSET(fd, &set) | Check pollfd.revents |
| max_fd + 1 | nfds = array.size() (no max_fd needed!) |
| struct timeval | timeout_ms (int, milliseconds) |
```

You **can**: Plan a complete internal migration with zero behavior change.
You **cannot yet**: Migrate to `epoll` — that's next week's upgrade. `poll()` is the intermediate step.

## Why This Matters

🔴 **Without this, you will:**
- Be stuck with `select()` and its 1024-fd limit forever
- Fear making internal changes because you can't verify behavior preservation
- Skip the intermediate `poll()` step and try jumping straight to `epoll`, making debugging harder
- Miss the most important engineering skill: changing internals without breaking contracts

🟢 **With this, you will:**
- Practice the "swap internals, keep contracts" pattern you'll use repeatedly
- Remove the fd_set 1024-fd limitation without any behavior change
- Have a regression checklist that proves correctness through the migration
- Be confident for Week 4's `epoll` upgrade — same process, bigger API change

🔗 **How this connects:**
- **To Days 1-3:** Your state machine, registry, and backpressure policy are UNCHANGED
- **To Day 5:** Regression tests from this migration join the lifecycle test suite
- **To Week 4:** `epoll` migration follows this exact same checklist pattern
- **To Week 7:** Protocol version migration uses the same "change internals, keep API" discipline
- **To Week 11:** Replication protocol upgrades follow the same regression pattern

🧠 **Mental model: "Contract-Preserving Migration"**

The most important skill in long-lived systems is NOT building the first version.
It's **changing the implementation while preserving the contract.**

`select()` → `poll()` is a tiny migration. But the PROCESS is identical to:
- Upgrading database engines
- Swapping serialization formats
- Migrating from REST to gRPC

The process: (1) Map old → new concepts. (2) Checklist every change. (3) Regression test EVERY behavior.
If you master this for `select→poll`, you'll do it confidently for any migration.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│              SELECT → POLL MIGRATION                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  BEFORE (select):                AFTER (poll):           │
│  ┌────────────────┐              ┌──────────────────┐    │
│  │ fd_set read_fds │              │ struct pollfd[] { │    │
│  │ fd_set write_fds│              │   .fd = fd,       │    │
│  │ max_fd tracking │              │   .events = POLLIN│    │
│  │ FD_ZERO every   │              │              |     │    │
│  │   iteration     │              │         POLLOUT    │    │
│  └────────────────┘              │ }                  │    │
│                                   └──────────────────┘    │
│  UNCHANGED:                                               │
│  ┌────────────────────────────────────────────────┐      │
│  │ ✅ Connection state machine (Day 1)             │      │
│  │ ✅ Connection registry (Day 2)                  │      │
│  │ ✅ Backpressure policy (Day 3)                  │      │
│  │ ✅ EAGAIN handling                              │      │
│  │ ✅ Accept/read/write dispatch logic             │      │
│  │ ✅ All external behavior                        │      │
│  └────────────────────────────────────────────────┘      │
│                                                          │
│  IMPROVED:                                               │
│  ✅ No 1024-fd limit                                     │
│  ✅ No FD_ZERO rebuild needed                            │
│  ✅ Cleaner event iteration                              │
│  ✅ Dynamic array instead of fixed bitmap                │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-3/day4-poll-migration-checklist.md`

## Do

1. **Build the select→poll mapping table**
   > 💡 *WHY: A side-by-side mapping eliminates guesswork. Every select concept must have a poll equivalent before you change any code.*

   Map every `select()` concept to its `poll()` equivalent:

   ```
   select: FD_SET(fd, &read_fds)     →  poll: pfd.events |= POLLIN
   select: FD_SET(fd, &write_fds)    →  poll: pfd.events |= POLLOUT
   select: FD_ISSET(fd, &read_fds)   →  poll: pfd.revents & POLLIN
   select: FD_ISSET(fd, &write_fds)  →  poll: pfd.revents & POLLOUT
   select: max_fd + 1                →  poll: not needed (array length)
   select: struct timeval {sec, usec} →  poll: int timeout_ms
   select: error_fds                 →  poll: POLLERR | POLLHUP in revents
   ```

2. **Write the migration checklist**
   > 💡 *WHY: A step-by-step checklist prevents partial migration where some code uses select and some uses poll — a common source of bugs.*

   ```
   MIGRATION CHECKLIST:
   □ 1. Replace fd_set declarations with std::vector<pollfd>
   □ 2. Replace FD_ZERO with vector.clear()
   □ 3. Replace FD_SET with vector.push_back({fd, events, 0})
   □ 4. Replace select() call with poll(fds.data(), fds.size(), timeout_ms)
   □ 5. Replace FD_ISSET with revents & POLLIN / POLLOUT checks
   □ 6. Remove max_fd tracking entirely
   □ 7. Add POLLERR/POLLHUP checks for error detection
   □ 8. Update timeout from timeval to milliseconds integer
   □ 9. Run ALL regression tests
   □ 10. Remove all select-related #includes
   ```

3. **Define regression tests**
   > 💡 *WHY: Every behavior that worked with select must work identically with poll. These tests become permanent — they also verify the Week 4 epoll migration.*

   | # | Behavior | Test | Expected |
   |---|---------|------|----------|
   | 1 | Accept new connection | Connect one client | Client added to registry |
   | 2 | Receive data | Send "hello" | Server receives "hello" |
   | 3 | Send response | Server sends "echo" | Client receives "echo" |
   | 4 | Client disconnect | Close client socket | Server removes from registry |
   | 5 | Timeout | No activity for 1s | select/poll returns 0 |
   | 6 | EAGAIN on write | Fill client recv buffer | Server handles without crash |
   | 7 | 50 concurrent clients | Connect 50 clients | All served correctly |
   | 8 | Backpressure | Slow reader | Disconnected per policy |

4. **Analyze poll improvements**
   > 💡 *WHY: Understanding WHY you migrated helps you decide when further migration (to epoll) is warranted versus premature optimization.*

   ```
   WHAT POLL IMPROVES:
   ✅ No fd limit (select capped at FD_SETSIZE, typically 1024)
   ✅ No bitmap rebuild — pollfd array persists (only reset revents)
   ✅ Cleaner API — events and revents are explicit bitmasks
   ✅ Dynamic sizing — just grow the vector

   WHAT POLL DOES NOT IMPROVE:
   ❌ Still O(n) scan of all fds each call (epoll fixes this)
   ❌ Still copies fd array to kernel each call (epoll fixes this)
   ❌ No edge-triggered mode (epoll adds this)
   ```

5. **Document the "unchanged" list**
   > 💡 *WHY: The most important part of a migration is what does NOT change. If your state machine or backpressure policy changed, something went wrong.*

   Explicitly list everything that must be identical:

   ```
   UNCHANGED AFTER MIGRATION:
   ✅ Connection state machine (enum values, transitions)
   ✅ Connection registry (add/remove/get API)
   ✅ Backpressure policy (buffer limits, disconnect rules)
   ✅ Protocol behavior (framing, parsing, responses)
   ✅ Logging format and content
   ✅ Exit codes and error handling
   ✅ All external-facing behavior
   ```

## Done when

- [ ] select→poll mapping table covers all 7 concepts — *your migration reference card*
- [ ] Migration checklist with 10 steps — *follow sequentially, check each off*
- [ ] 8 regression tests covering all observable behaviors — *reusable for Week 4 epoll migration*
- [ ] Analysis of what improves and what doesn't — *prevents over-optimizing or under-migrating*
- [ ] Unchanged list confirming state machine and contracts preserved — *the #1 migration safety check*

## Proof

Paste your select→poll mapping table and regression test list, or upload `week-3/day4-poll-migration-checklist.md`.

**Quick self-test** (answer without looking at your notes):
> 💡 *WHY these questions: If you can answer all 3 instantly, you've internalized the concept. If not, re-read — these come back in future weeks.*

1. What select limitation does poll remove? → **The FD_SETSIZE limit (typically 1024 fds). poll uses a dynamic array with no fixed limit.**
2. What does poll NOT improve over select? → **Still O(n) — polls every fd every call, still copies fd array to kernel. epoll fixes both.**
3. What is the most important thing to verify after migration? → **That ALL external behavior is identical — same responses, same disconnects, same logging. Internals changed, contracts did not.**
