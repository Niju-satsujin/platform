---
id: w03-quest
title: "Multi-Client Event Loop Quest"
order: 7
duration_min: 240
type: quest
---

# Week 03 Quest: Multi-Client Echo Server with Broadcast

## Mission

Integrate everything from Lessons 1–6 into a single, polished multi-client echo server.
The server uses [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html) to multiplex connections, frames messages with length-prefix protocol, broadcasts to all clients, detects slow consumers, exposes stats, and passes an automated regression harness.

---

## Requirements

Your server [MUST](https://datatracker.ietf.org/doc/html/rfc2119):

1. **Listen** on a configurable port (default 7000).
2. **Accept** multiple simultaneous clients (minimum 64).
3. **Set non-blocking** mode on every socket using [fcntl(2)](https://man7.org/linux/man-pages/man2/fcntl.2.html).
4. **Use poll()** to multiplex the listener, all client fds, and stdin.
5. **Frame messages** with 4-byte big-endian length prefix (Week 02 protocol).
6. **Handle partial reads** — accumulate in per-connection buffer.
7. **Handle concatenated frames** — parse multiple frames from one `read()`.
8. **Reject oversized frames** — close connection if frame > `MAX_FRAME_SIZE`.
9. **Broadcast** every received message to all connected clients.
10. **Buffer writes** in per-connection `send_buf`. Flush on `POLLOUT`.
11. **Detect slow clients** — disconnect if `send_buf` exceeds threshold.
12. **Log** every event with timestamp, connection id, and fd.
13. **STATS command** on stdin prints server summary and per-connection breakdown.
14. **Reject** new connections when at capacity (accept + immediate close).
15. **Clean shutdown** — close all fds, free resources, log summary.

---

## Build & Run

```bash
# Compile
gcc -Wall -Wextra -Werror -O2 -o server server.c

# Run
./server 7000
```

---

## Verification Steps

### Step 1 — Basic connectivity

```bash
./server 7000 &
SERVER_PID=$!
nc localhost 7000 <<< "hello"
kill $SERVER_PID
```

**Expected:** Client receives a framed echo of "hello". Server log shows ACCEPT and DISCONNECT.

### Step 2 — Multiple simultaneous clients

```bash
./server 7000 &
SERVER_PID=$!
for i in $(seq 1 10); do
  nc localhost 7000 &
done
sleep 1
jobs -l
kill $SERVER_PID
```

**Expected:** Server log shows 10 ACCEPT lines. `jobs` shows 10 nc processes connected.

### Step 3 — Broadcast

Open three terminals:

- Terminal 1: `./server 7000`
- Terminal 2: `nc localhost 7000` (type messages here)
- Terminal 3: `nc localhost 7000` (observe messages here)

**Expected:** Messages typed in Terminal 2 appear in Terminal 3.

### Step 4 — Slow client detection

```bash
./server 7000 &
SERVER_PID=$!
# Slow client: connect but never read
nc -l -p 9999 | nc localhost 7000 &
SLOW_PID=$!
# Fast client: send many messages
for i in $(seq 1 100); do
  echo "flood message $i" | nc -q 0 localhost 7000
done
sleep 2
kill $SERVER_PID $SLOW_PID 2>/dev/null
```

**Expected:** Server log shows `SLOW_CLIENT` line for the non-reading client. The slow client is disconnected. Fast clients are unaffected.

### Step 5 — STATS command

```bash
./server 7000
# In another terminal, connect 3 clients and send some data
# Back in server terminal, type: STATS
```

**Expected:**
```
=== SERVER STATS ===
uptime:        Xs
total_accept:  3
active:        3
bytes_in:      NNN
bytes_out:     NNN
--- active connections ---
  conn=0  fd=4  state=CONNECTED  in=NNN  out=NNN  age=Xs
  conn=1  fd=5  state=CONNECTED  in=NNN  out=NNN  age=Xs
  conn=2  fd=6  state=CONNECTED  in=NNN  out=NNN  age=Xs
========================
```

### Step 6 — Regression harness

```bash
bash tests/w03_regression.sh
```

**Expected:**
```
[HARNESS] server started pid=XXXX
[TEST] basic_echo .............. PASS
[TEST] broadcast_two_clients ... PASS
[TEST] slow_client_disconnect .. PASS
[TEST] partial_frame_reassembly  PASS
[TEST] oversized_frame_rejected  PASS
[TEST] stats_command ........... PASS
════════════════════════════════════
 6 passed, 0 failed
[HARNESS] server stopped
```

---

## Proof of Completion

Submit the following:

1. **Source code:** `server.c` (single file or multi-file, your choice).
2. **Regression harness:** `tests/w03_regression.sh` — all tests pass.
3. **Server log** from a session with 5+ clients, at least one slow-client disconnect, and a STATS printout.
4. **Git log:**
```bash
git log --oneline | head -8
```
Should show commits for each lesson (w03-l01 through w03-l06) and the quest.

5. **Screenshot:** Three terminals — server, client A sending, client B receiving broadcast.

---

## Grading Criteria

| Criterion | Weight |
|-----------|--------|
| poll() loop with no busy-waiting | 15% |
| Connection table with accept/remove/reject | 15% |
| Length-prefix framing with partial read handling | 15% |
| Broadcast to all clients | 15% |
| Slow-client detection and disconnect | 10% |
| Structured logging with per-connection context | 10% |
| STATS command with accurate metrics | 10% |
| Regression harness — all tests pass | 10% |

---

## Hero Visual

```
  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
  │Client A │  │Client B │  │Client C │  │  stdin  │
  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
       │            │            │             │
       ▼            ▼            ▼             ▼
  ┌──────────────────────────────────────────────────┐
  │                   poll() loop                     │
  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
  │  │  accept  │  │  parse   │  │   broadcast    │ │
  │  │  & track │→ │  frames  │→ │   & flush      │ │
  │  └──────────┘  └──────────┘  └────────────────┘ │
  │                                                   │
  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
  │  │  slow    │  │  STATS   │  │   structured   │ │
  │  │  detect  │  │  command │  │   logging      │ │
  │  └──────────┘  └──────────┘  └────────────────┘ │
  └──────────────────────────────────────────────────┘
```
