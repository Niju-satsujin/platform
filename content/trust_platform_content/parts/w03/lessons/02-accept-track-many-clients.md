---
id: w03-l02
title: "Accept & Track Many Clients"
order: 2
duration_min: 120
type: lesson
---

# Lesson 2 (2/7): Accept & Track Many Clients

**Goal:** Accept multiple connections and track each one in a data structure so the event loop knows every active client.

**What you build:** A connection table (array or hash map) that stores per-client state, and a loop that grows the `pollfd` array dynamically.

**Why it matters:**
A real server does not know how many clients will connect.
You need a dynamic structure to map each file descriptor to its state.
This is the foundation of a [connection state machine](https://en.wikipedia.org/wiki/Finite-state_machine) — the pattern used by every production event-loop server.
Getting this wrong causes fd leaks, stale entries, and mysterious crashes.

---

## TRAINING SESSION

### Warmup (15 min)

1. Review [fcntl(2) O_NONBLOCK](https://man7.org/linux/man-pages/man2/fcntl.2.html). What happens when you `read()` a non-blocking socket with no data? What errno is set?
2. Sketch a `struct connection` with fields: `fd`, `state` (enum: CONNECTED, READY, DRAINING, CLOSED), and `bytes_in`.
3. Decide: array (indexed by fd) or linked list? Write down the trade-off for each.

### Work

#### Task 1 — Define the connection struct and table

**Do:** Create a `struct connection` with at least: `int fd`, `enum conn_state state`, `size_t bytes_in`, `size_t bytes_out`. Create a fixed-size array `connections[MAX_CLIENTS]`. Initialize all entries to `state = CLOSED, fd = -1`.

**Test:**
```bash
gcc -Wall -Wextra -o server server.c && ./server
```

**Expected:** Server compiles and starts with zero active connections logged.

#### Task 2 — Accept and register new clients

**Do:** When `poll()` signals `POLLIN` on the listener, call `accept()`. Set the new fd to non-blocking with [fcntl(2)](https://man7.org/linux/man-pages/man2/fcntl.2.html). Find a free slot in `connections[]`. Set `state = CONNECTED`. Add the fd to the `pollfd` array with `events = POLLIN`.

**Test:**
```bash
./server &
for i in $(seq 1 5); do nc localhost 7000 & done
sleep 0.5
kill %1 %2 %3 %4 %5 %6
```

**Expected:** Server logs 5 lines like `[ACCEPT] fd=4 slot=0`, `[ACCEPT] fd=5 slot=1`, etc. No crash.

#### Task 3 — Remove clients on disconnect

**Do:** When `read()` returns 0 (EOF) or -1 with `errno != EAGAIN`, close the fd. Set `connections[slot].state = CLOSED` and `fd = -1`. Remove the entry from the `pollfd` array (swap with last entry, decrement count).

**Test:**
```bash
./server &
nc localhost 7000 <<< "hello"
sleep 0.2
# nc disconnects after sending
```

**Expected:** Server logs `[DISCONNECT] fd=4 slot=0`. The slot is now free. Connecting a new client reuses slot 0.

#### Task 4 — Reject when full

**Do:** If all `MAX_CLIENTS` slots are in use, `accept()` the connection and immediately `close()` it. Log a warning.

**Test:**
Set `MAX_CLIENTS=2`. Connect 3 clients.

**Expected:** Third client is accepted then closed. Server logs `[REJECT] at capacity (2/2)`. First two clients still work.

### Prove

- [ ] 5 simultaneous clients are tracked with correct slot assignments.
- [ ] Disconnecting one client frees the slot for reuse.
- [ ] Capacity limit rejects the extra client gracefully.
- [ ] No fd leaks — check with `ls /proc/$(pgrep server)/fd` before and after test.

### Ship

```bash
git add -A && git commit -m "w03-l02: connection table with accept/remove/reject"
```

---

## Done When

- Your server handles 5+ simultaneous connections without threads.
- The connection table accurately reflects which clients are alive.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Not setting new client fd to non-blocking | One slow client blocks the entire loop. Always `fcntl()` after `accept()`. |
| Forgetting to close fd on removal | Leaks fds. Eventually `accept()` fails with `EMFILE`. |
| Linear scan for free slot every time | Fine for small N. For thousands of connections, keep a free-list. |
| Not handling `EAGAIN` from `accept()` | Non-blocking listener can return `EAGAIN` if the connection vanished. Check errno. |

## Proof

```
Screenshot: server log showing 5 accepts, 2 disconnects, 1 reject.
Output of ls /proc/<pid>/fd showing only expected fds.
Git log showing commit w03-l02.
```

## Hero Visual

```
  connections[]
  ┌─────────────────────────────────┐
  │ [0] fd=4  CONNECTED  in=128    │
  │ [1] fd=5  READY      in=0     │
  │ [2] fd=-1 CLOSED     ---      │ ← free slot
  │ [3] fd=6  CONNECTED  in=64    │
  │ [4] fd=-1 CLOSED     ---      │ ← free slot
  └─────────────────────────────────┘
        ↕ synced with pollfd[]
  ┌─────────────────────────────────┐
  │ pollfd[0] = {fd=3, POLLIN}     │  ← listener
  │ pollfd[1] = {fd=4, POLLIN}     │
  │ pollfd[2] = {fd=5, POLLIN}     │
  │ pollfd[3] = {fd=6, POLLIN}     │
  └─────────────────────────────────┘
```

## Future Lock

In **W04** you replace the `pollfd` array with [epoll_ctl()](https://man7.org/linux/man-pages/man7/epoll.7.html) calls — add/remove becomes O(1) instead of rebuilding the array.
In **W09** the connection struct gains protocol-specific fields for the KV store (command buffer, auth state, transaction ID).
The table design you build now carries forward unchanged.
