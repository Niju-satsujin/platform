---
id: w03-multi-client-event-loop-d05-quest-connection-lifecycle-tests-2h
part: w03-multi-client-event-loop
title: "Quest: Connection Lifecycle Tests  2h"
order: 5
duration_minutes: 120
prereqs:
  - "w03-multi-client-event-loop-d04-quest-poll-migration-2h"
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Connection Lifecycle Tests  2h

## Goal

Design the **complete connection lifecycle test suite** that proves your event loop correctly handles every phase from accept to close, including churn, half-close, and fd leak detection.

By end of this session you will have:

- ✅ A **lifecycle test matrix** covering open/read/write/error/close for every state
- ✅ A **churn test plan** with rapid connect/disconnect cycles and leak counters
- ✅ A **half-close test scenario** proving server handles `shutdown()` correctly
- ✅ An **fd leak detection strategy** that catches descriptor leaks over time

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Lifecycle matrix covers all 5 connection states from Day 1 | Map test to each enum value |
| 2 | Churn test has specific cycle count and leak counter | Verify numbers (e.g., 1000 cycles, 0 leaks) |
| 3 | Half-close test shows expected server behavior | Verify shutdown(SHUT_WR) handling |
| 4 | Fd leak detection has measurement method | Check for /proc/self/fd or lsof approach |
| 5 | Test plan covers ≥ 15 scenarios | Count numbered test rows |

## What You're Building Today

A comprehensive test plan document covering every connection lifecycle scenario — your quality gate before moving to Week 4.

By end of this session, you will have:

- ✅ File: `week-3/day5-connection-lifecycle-tests.md`
- ✅ 15+ test scenarios covering all lifecycle phases
- ✅ Churn test: 1000 rapid connect/disconnect cycles with zero fd leaks
- ✅ Half-close test: client sends shutdown(SHUT_WR), server handles gracefully

What "done" looks like:

```markdown
## Test #1: Normal Connection Lifecycle
Input:  Client connects, sends "hello", receives echo, disconnects
States: CONNECTING → READING → WRITING → CLOSING → removed
Assert: Response matches, fd removed from registry, no leak

## Test #7: Half-Close
Input:  Client calls shutdown(SHUT_WR) after sending data
States: Server sees recv()=0, transitions to CLOSING
Assert: Server sends any remaining response, then closes cleanly

## Fd Leak Detection
Method: Count /proc/self/fd entries before and after 1000 cycles
Assert: fd_count_after == fd_count_before (zero leaks)
```

You **can**: Verify every connection lifecycle scenario including edge cases that crash production servers.
You **cannot yet**: Run a 30-minute soak test — that's tomorrow's Boss Fight.

## Why This Matters

🔴 **Without this, you will:**
- Ship an event loop that slowly leaks file descriptors until the process hits ulimit and dies
- Discover half-close handling bugs only when a real client library sends `shutdown()`
- Have no evidence that your loop survives connection churn — the most common real traffic pattern
- Spend hours debugging "why did the server stop accepting connections after 3 hours?"

🟢 **With this, you will:**
- Have concrete evidence that every lifecycle phase works correctly
- Catch fd leaks before they become production incidents
- Know your server handles half-close, error, and timeout paths — not just happy paths
- Have a reusable test suite that also validates the Week 4 epoll migration

🔗 **How this connects:**
- **To Days 1-4:** These tests verify every design decision from this week
- **To Day 6 (Boss Fight):** The soak test runs THESE scenarios for 30 minutes
- **To Week 4:** These same tests verify the epoll migration
- **To Week 5:** Thread pool tests add concurrency scenarios to this base
- **To Week 6:** Backpressure tests extend the slow-reader scenarios here

🧠 **Mental model: "Test at the Boundaries"**

Happy paths rarely reveal bugs. Systems break at boundaries:
- **State transitions:** What happens between READING and WRITING?
- **Resource lifecycle:** Is the fd always closed? Is the buffer always freed?
- **Churn:** What happens when connections come and go rapidly?
- **Half-states:** What happens when one side closes before the other?

By Week 12 when building leader election, you'll test boundary conditions automatically:
"What if the leader dies mid-write? What if two nodes think they're leader?"
The habit of boundary testing starts here.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│              CONNECTION LIFECYCLE TEST MATRIX              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Test Category          Coverage Target                  │
│  ─────────────          ──────────────                   │
│  Happy path (3)         Normal open → use → close        │
│  Error paths (4)        Network errors at each state     │
│  Half-close (2)         Client/server shutdown variants  │
│  Churn tests (3)        Rapid connect/disconnect cycles  │
│  Leak detection (2)     fd and memory leak verification  │
│  Timeout tests (2)      Idle connection expiry           │
│                                                          │
│  FD LEAK DETECTION:                                      │
│  ┌────────────┐    1000 cycles    ┌────────────┐        │
│  │ Count fds  │──────────────────▶│ Count fds  │        │
│  │ BEFORE     │                   │ AFTER      │        │
│  │ = N        │                   │ must = N   │        │
│  └────────────┘                   └────────────┘        │
│                                                          │
│  Method: ls /proc/self/fd | wc -l                        │
│  Alternative: lsof -p $PID | grep SOCK | wc -l          │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-3/day5-connection-lifecycle-tests.md`

## Do

1. **Build the lifecycle test matrix**
   > 💡 *WHY: A numbered matrix ensures complete coverage. Every state from Day 1's enum must have at least one test entry and one test exit.*

   Create numbered test cases for each lifecycle phase:

   | # | Category | Scenario | Expected State Transitions | Assert |
   |---|---------|----------|--------------------------|--------|
   | 1 | Happy | Connect, send, receive, close | CONN→READ→WRITE→CLOSE | Echo correct |
   | 2 | Happy | Connect, send large message | CONN→READ_HDR→READ_BODY→WRITE | Full message received |
   | 3 | Happy | Multiple messages on one connection | READ↔WRITE cycles | All echoed |
   | 4 | Error | Client disappears (no close) | READ → CLOSE (on error) | fd cleaned up |
   | 5 | Error | Client sends invalid frame | READ → CLOSE (protocol error) | Error logged |
   | 6 | Error | Network error during write | WRITE → CLOSE | Partial write handled |
   | 7 | Error | Connection reset by peer | ANY → CLOSE | ECONNRESET handled |

2. **Design half-close test scenarios**
   > 💡 *WHY: Half-close (`shutdown(SHUT_WR)`) is the most subtle TCP edge case. The client says "I'm done sending" but can still receive. Your server must handle this correctly.*

   ```
   TEST: Client Half-Close
   1. Client connects and sends "hello"
   2. Client calls shutdown(fd, SHUT_WR)  ← stops sending
   3. Server sees recv() return 0          ← EOF on read
   4. Server sends echo response           ← client can still receive!
   5. Server calls close(fd)

   ASSERT: Client receives echo AFTER half-close
   ASSERT: Server transitions to CLOSING, not crash

   TEST: Server Half-Close
   1. Server sends response
   2. Server calls shutdown(client_fd, SHUT_WR)
   3. Client sees recv() return 0
   4. Client can still send (but server won't read)
   ASSERT: Graceful shutdown without errors
   ```

3. **Design the churn test**
   > 💡 *WHY: Real servers face thousands of connections opening and closing per second. Churn exposes cleanup bugs, fd leaks, and registry corruption.*

   ```
   TEST: Connection Churn (1000 cycles)
   Setup: Start server
   Loop 1000 times:
     1. Open 10 connections simultaneously
     2. Each sends one message
     3. Verify echo response
     4. Close all 10
   After loop:
     ASSERT: registry.size() == 0
     ASSERT: fd_count == baseline_fd_count  (ZERO leaks)
     ASSERT: server still accepts new connections
     ASSERT: no error logs during churn
   ```

4. **Define fd leak detection method**
   > 💡 *WHY: Fd leaks are silent killers — the server works fine for hours, then suddenly can't accept connections because it hit the fd limit.*

   Choose a detection method:

   **Method 1: /proc/self/fd counting**
   ```bash
   # Before test
   BEFORE=$(ls /proc/$SERVER_PID/fd | wc -l)
   # Run test
   ./run_churn_test
   # After test
   AFTER=$(ls /proc/$SERVER_PID/fd | wc -l)
   # Assert
   [ "$BEFORE" -eq "$AFTER" ] || echo "LEAK: $((AFTER-BEFORE)) fds leaked"
   ```

   **Method 2: Socket-specific counting**
   ```bash
   lsof -p $PID | grep -c "SOCK"
   ```

   Include this in your test suite as a post-test assertion.

5. **Add timeout test scenarios**
   > 💡 *WHY: Timeout handling is where cleanup meets time. A connection that times out must be closed AND removed — partial cleanup causes fd leaks.*

   ```
   TEST: Idle Timeout
   1. Client connects but sends nothing
   2. Wait for server timeout period (e.g., 10 seconds)
   ASSERT: Server closes connection, logs "idle_timeout"
   ASSERT: fd removed from registry

   TEST: Read Timeout
   1. Client sends partial frame header (3 of 4 bytes)
   2. Client stops sending
   3. Wait for read timeout
   ASSERT: Server closes connection, logs "read_timeout"
   ASSERT: Partial buffer freed, fd removed
   ```

## Done when

- [ ] 15+ numbered test scenarios in lifecycle matrix — *proves complete lifecycle coverage*
- [ ] Half-close tests for client and server shutdown — *catches the subtlest TCP edge case*
- [ ] Churn test: 1000 cycles with zero fd leaks — *proves cleanup correctness under rapid cycling*
- [ ] Fd leak detection using /proc/self/fd — *automated leak checking for CI*
- [ ] Timeout tests for idle and partial-read — *proves time-based cleanup works*

## Proof

Paste your lifecycle test matrix (15+ scenarios) and fd leak detection method, or upload `week-3/day5-connection-lifecycle-tests.md`.

**Quick self-test** (answer without looking at your notes):
> 💡 *WHY these questions: If you can answer all 3 instantly, you've internalized the concept. If not, re-read — these come back in future weeks.*

1. How do you detect fd leaks in a running server? → **Count entries in /proc/$PID/fd before and after tests. If the count increases, fds are leaking.**
2. What happens when `recv()` returns 0? → **The peer closed their send side (half-close or full close). Your server should transition to CLOSING.**
3. Why test 1000 rapid connect/disconnect cycles instead of just 10? → **Leaks are often 1 fd per cycle. 10 cycles might leak 10 fds (unnoticed). 1000 cycles leak 1000 fds (obvious and measurable).**
