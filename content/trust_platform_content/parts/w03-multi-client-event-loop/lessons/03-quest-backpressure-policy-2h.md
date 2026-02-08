---
id: w03-multi-client-event-loop-d03-quest-backpressure-policy-2h
part: w03-multi-client-event-loop
title: "Quest: Backpressure Policy  2h"
order: 3
duration_minutes: 120
prereqs:
  - "w03-multi-client-event-loop-d02-quest-first-multi-client-loop-2h"
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Backpressure Policy  2h

## Goal

Define a **per-client backpressure policy** that prevents one slow client from consuming unbounded memory and destabilizing the entire server.

By end of this session you will have:

- ✅ A **per-client buffer limit** defining max queued bytes before intervention
- ✅ A **slow-reader detection rule** with specific threshold and time window
- ✅ An **intervention policy**: what happens when limits are exceeded (throttle vs disconnect)
- ✅ A **slow-reader test scenario** with expected disconnect timing

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Per-client buffer cap defined in bytes | Check for specific number (e.g., 64KB) |
| 2 | Slow-reader detection rule has both size AND time thresholds | Verify two conditions checked |
| 3 | Disconnect policy is explicit (not "maybe") | Look for clear IF/THEN rule |
| 4 | Test scenario shows input, timing, and expected disconnect | Verify test has concrete numbers |
| 5 | Fairness argument: slow client cannot starve fast clients | Check for reasoning about other clients |

## What You're Building Today

A policy document defining how your event loop protects itself from slow clients — the "immune system" of your server.

By end of this session, you will have:

- ✅ File: `week-3/day3-backpressure-policy.md`
- ✅ Per-client write buffer cap: e.g., 64KB max queued per connection
- ✅ Slow-reader rule: disconnect if buffer stays > 80% for > 5 seconds
- ✅ Test scenario: client reads 1 byte/sec while server sends 1KB/sec

What "done" looks like:

```markdown
## Backpressure Policy
Max queued bytes per client: 65536 (64KB)
Warning threshold: 52428 (80%)
Disconnect threshold: 65536 (100%) OR 80% for > 5 seconds

## Slow-Reader Rule
IF write_buf.size() > MAX_QUEUED_BYTES:
    → log warning, close connection immediately
IF write_buf.size() > WARNING_THRESHOLD for > 5 seconds:
    → log slow-reader warning, close connection
ELSE:
    → normal operation, queue data for sending
```

You **can**: Define exactly when and why your server disconnects slow clients.
You **cannot yet**: Implement the enforcement — that integrates with your loop code. The enforcement code comes when you build the server.

## Why This Matters

🔴 **Without this, you will:**
- One slow client causes your server to buffer gigabytes of unsent data until OOM kill
- All 49 other clients suffer latency spikes because the server is swapping memory
- Have no way to distinguish "slow client" from "temporarily delayed network"
- Production deployments fail under mixed-speed client workloads — the most common real-world scenario

🟢 **With this, you will:**
- Your server has explicit memory bounds — maximum memory usage is predictable
- Slow clients are detected and disconnected before they affect others
- You have clear rules that can be tuned in production (thresholds are config, not guesses)
- Week 6's full backpressure system builds directly on this per-client policy

🔗 **How this connects:**
- **To Day 1:** The `bytes_queued` field in your Connection struct is what tracks this
- **To Day 2:** Your select loop checks write buffer size before queuing more data
- **To Day 5:** Connection lifecycle tests include slow-reader disconnect scenarios
- **To Week 5:** Thread pool queue limits follow the same bounded-resource principle
- **To Week 6:** Full backpressure policy ladder starts with this per-client cap

🧠 **Mental model: "Bounded Resources"**

In naive code: buffers grow without limit. "It'll be fine, most clients are fast."
In production code: **every buffer has a maximum size, and exceeding it triggers an explicit policy.**

This principle applies everywhere in distributed systems:
- Per-client write buffers (today)
- Thread pool work queues (Week 5)
- Replication log buffers (Week 11)
- CAS object store quotas (Week 13)

The rule: if you can't name the maximum size and the overflow policy, you have a bug waiting to happen.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│              BACKPRESSURE DECISION FLOW                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Server has data to send to Client X                     │
│       │                                                  │
│       ▼                                                  │
│  ┌─────────────────────────────────┐                     │
│  │ Check: write_buf.size() < MAX?  │                     │
│  └─────────┬──────────┬───────────┘                     │
│       YES  │          │  NO                              │
│            ▼          ▼                                   │
│  ┌──────────────┐  ┌──────────────────────┐             │
│  │ Queue data    │  │ Buffer FULL!          │             │
│  │ in write_buf  │  │ → Log: "slow client"  │             │
│  └──────────────┘  │ → Close connection     │             │
│                     │ → Free buffer          │             │
│                     └──────────────────────┘             │
│                                                          │
│  Also check time-based:                                  │
│  ┌─────────────────────────────────────────┐            │
│  │ IF buf > 80% for > 5 sec continuously:  │            │
│  │    → Disconnect (not temporarily slow — │            │
│  │       chronically slow)                  │            │
│  └─────────────────────────────────────────┘            │
│                                                          │
│  Result: Server memory usage bounded to:                 │
│  MAX_CLIENTS × MAX_BUFFER_PER_CLIENT = predictable       │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-3/day3-backpressure-policy.md`

## Do

1. **Define the per-client buffer cap**
   > 💡 *WHY: Without a number, "bounded" is meaningless. 64KB is a reasonable starting point — large enough for normal messages, small enough that 1000 clients = 64MB total.*

   Choose your limits:

   ```
   MAX_WRITE_BUFFER = 65536   // 64KB per client
   WARNING_THRESHOLD = 52428  // 80% of max
   MAX_CLIENTS = 1000         // server-wide limit
   MAX_SERVER_MEMORY = MAX_CLIENTS × MAX_WRITE_BUFFER = 64MB
   ```

   Justify your numbers: Why 64KB? Because a typical protocol message is < 4KB, so 64KB holds ~16 pending messages — plenty for normal operation.

2. **Define the slow-reader detection rule**
   > 💡 *WHY: Size alone isn't enough. A client at 90% buffer for 0.1 seconds is fine (temporary network blip). A client at 90% for 5 seconds is chronically slow and must be disconnected.*

   ```
   SLOW_READER_RULE:
     Condition 1 (instant): write_buf.size() >= MAX_WRITE_BUFFER
       → Action: disconnect immediately, log "buffer_overflow"

     Condition 2 (sustained): write_buf.size() >= WARNING_THRESHOLD
                               AND time_above_threshold > 5 seconds
       → Action: disconnect, log "slow_reader_sustained"

     Condition 3 (normal): write_buf.size() < WARNING_THRESHOLD
       → Action: continue normal operation
   ```

3. **Design the disconnect procedure**
   > 💡 *WHY: Disconnecting a client requires cleanup: flush what you can, close the fd, remove from registry, log the reason. Skipping any step causes resource leaks.*

   ```
   disconnect(fd, reason):
     1. Log: "{fd} disconnected: {reason}, queued={bytes_queued}"
     2. Attempt to send any final error message (best-effort)
     3. shutdown(fd, SHUT_WR)    // signal no more writes
     4. close(fd)                // release the fd
     5. registry.remove(fd)      // remove from tracking
     6. Update metrics: slow_client_disconnects++
   ```

4. **Write the fairness argument**
   > 💡 *WHY: Backpressure isn't just about one client — it's about protecting ALL clients. If slow Client A consumes all server memory, fast Clients B-Z suffer.*

   Document why this policy is fair:

   ```
   FAIRNESS GUARANTEE:
   - Each client gets equal maximum buffer space (64KB)
   - No client can cause another client's data to be dropped
   - Server total memory is bounded: MAX_CLIENTS × MAX_BUFFER
   - Fast clients are never delayed by slow clients
   - Disconnecting a slow client frees resources for healthy clients
   ```

5. **Design the slow-reader test scenario**
   > 💡 *WHY: You need concrete numbers to verify the policy works. This test becomes part of your Day 5 connection lifecycle tests.*

   ```
   TEST: Slow Reader Disconnect
   Setup:
     - Server sends 1KB messages every 100ms to Client X
     - Client X reads only 1 byte per second
   Expected timeline:
     T=0s:    write_buf = 0 bytes
     T=1s:    write_buf ≈ 10KB (10 messages queued)
     T=5s:    write_buf ≈ 50KB (hits WARNING_THRESHOLD)
     T=5s+5s: write_buf ≈ 100KB (exceeds MAX, or sustained > 5s)
     T≈6.5s:  Server disconnects Client X
   Expected log:
     "fd=7 disconnected: slow_reader_sustained, queued=52430"
   Expected effect:
     - All other clients unaffected
     - Server memory drops by ~50KB
   ```

## Done when

- [ ] Per-client buffer cap with specific byte value — *becomes a constant in your server code*
- [ ] Slow-reader rule with both instant and sustained conditions — *two-tier detection catches both floods and chronic slowness*
- [ ] Disconnect procedure with logging and cleanup — *prevents fd leaks on forced disconnect*
- [ ] Fairness argument explaining why this protects all clients — *the rationale for code review*
- [ ] Slow-reader test with timeline and expected log output — *becomes a Day 5 test case*

## Proof

Paste your backpressure policy with buffer limits and slow-reader rule, or upload `week-3/day3-backpressure-policy.md`.

**Quick self-test** (answer without looking at your notes):
> 💡 *WHY these questions: If you can answer all 3 instantly, you've internalized the concept. If not, re-read — these come back in future weeks.*

1. What is the maximum memory your server can use for write buffers? → **MAX_CLIENTS × MAX_WRITE_BUFFER (e.g., 1000 × 64KB = 64MB)**
2. Why disconnect slow clients instead of just pausing reads? → **Pausing reads still holds buffer memory. Disconnecting frees it immediately for healthy clients.**
3. What is the difference between the instant and sustained disconnect rules? → **Instant: buffer is completely full → disconnect now. Sustained: buffer is > 80% for > 5 seconds → disconnect (chronically slow).**
