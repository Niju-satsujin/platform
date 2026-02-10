---
id: w03-l04
title: "Broadcast & Slow-Client Handling"
order: 4
duration_min: 120
type: lesson
---

# Lesson 4 (4/7): Broadcast & Slow-Client Handling

**Goal:** Send each received message to all connected clients and handle clients that are too slow to receive.

**What you build:** A broadcast function that writes to all clients, a per-connection write buffer, and a slow-client detector that disconnects clients whose write buffer exceeds a threshold.

**Why it matters:**
Chat servers, pub/sub systems, and real-time feeds all broadcast to many receivers.
Some clients have slow networks or stop reading.
If you keep buffering data for them, your server runs out of memory.
You [MUST](https://datatracker.ietf.org/doc/html/rfc2119) detect and disconnect slow consumers.
This is the same problem Kafka, Redis Pub/Sub, and WebSocket servers solve.

---

## TRAINING SESSION

### Warmup (15 min)

1. What happens when you `write()` to a non-blocking socket and the kernel send buffer is full? What errno do you get?
2. Read about `POLLOUT` in [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html). When should you add `POLLOUT` to a client's events?
3. Define "slow client" in one sentence.

### Work

#### Task 1 — Add a write buffer to each connection

**Do:** Add `char send_buf[8192]` and `size_t send_len` to `struct connection`. When you want to send data, append it to `send_buf` instead of calling `write()` directly.

**Test:**
```bash
./server &
nc localhost 7000
# type "ping" + Enter
```

**Expected:** Server appends the echo frame to `send_buf` and logs `[ENQUEUE] fd=4 queued=8 total_pending=8`.

#### Task 2 — Flush the write buffer on POLLOUT

**Do:** When `send_len > 0`, set `events |= POLLOUT` for that client in the `pollfd` array. When `poll()` signals `POLLOUT`, call `write(fd, send_buf, send_len)`. Handle partial writes: shift remaining bytes with `memmove()`. When `send_len` reaches 0, clear `POLLOUT`.

**Test:**
```bash
./server &
nc localhost 7000
# type "hello" + Enter
```

**Expected:** Client receives the echoed frame. Server logs `[FLUSH] fd=4 wrote=8 remaining=0`.

#### Task 3 — Broadcast to all clients

**Do:** When a complete frame arrives from client A, iterate over `connections[]`. For every client with `state != CLOSED` (including A, for echo), append the frame to that client's `send_buf`.

**Test:**
```bash
./server &
nc localhost 7000 &  # client A
nc localhost 7000 &  # client B
# In client A, type "broadcast test"
```

**Expected:** Both client A and client B receive the message. Server logs `[BROADCAST] msg_len=14 recipients=2`.

#### Task 4 — Detect and disconnect slow clients

**Do:** After appending to `send_buf`, check if `send_len > SLOW_CLIENT_THRESHOLD` (e.g., 4096). If yes, log a warning, close the fd, and free the slot.

**Test:**
Use a client that connects but never reads (e.g., `nc -l` trick or a custom script that only writes). Send many broadcast messages from another client.

**Expected:** Server logs `[SLOW] fd=5 send_buf=4200 > threshold=4096, disconnecting`. The slow client is removed. Other clients are unaffected.

### Prove

- [ ] A message from one client is received by all other connected clients.
- [ ] Write buffer handles partial writes correctly.
- [ ] Slow client is detected and disconnected when buffer exceeds threshold.
- [ ] Server memory usage stays bounded (check with `ps -o rss -p <pid>`).

### Ship

```bash
git add -A && git commit -m "w03-l04: broadcast with write buffer and slow-client detection"
```

---

## Done When

- Every received message is broadcast to all connected clients.
- A client that stops reading is disconnected before the buffer grows unbounded.
- Partial `write()` results are handled without data loss.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Calling `write()` directly in the broadcast loop | Use a write buffer. `write()` may block or partially complete. |
| Always setting `POLLOUT` | Only set it when `send_len > 0`. Otherwise `poll()` returns immediately every time (busy loop). |
| Not handling partial `write()` return | `write()` can return fewer bytes than requested. Always check the return value and shift. |
| Buffering unlimited data for slow clients | Set a threshold. Disconnect clients whose buffer exceeds it. |

## Proof

```
Screenshot: two nc terminals showing broadcast messages from each other.
Server log showing one slow-client disconnection.
Git log showing commit w03-l04.
```

## Hero Visual

```
  Client A sends "hello"
       │
       ▼
  ┌─────────────┐
  │  Event Loop  │
  │  parse frame │
  │  broadcast() │
  └──┬──┬──┬─────┘
     │  │  │
     ▼  ▼  ▼
   ┌──┐┌──┐┌──┐
   │A ││B ││C │  ← send_buf per client
   │8B││8B││8B│
   └──┘└──┘└──┘

  Client C stops reading...
   ┌──┐┌──┐┌────────┐
   │0B││0B││ 4200B  │ ← SLOW! disconnect C
   └──┘└──┘└────────┘
```

## Future Lock

In **W04** with [epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html), you will use `EPOLLOUT` instead of `POLLOUT` — same logic, different syscall.
In **W05** the thread pool can compress broadcast payloads before enqueueing, reducing write buffer pressure.
In **W09** broadcast becomes the pub/sub mechanism for the KV store's `SUBSCRIBE` command.
