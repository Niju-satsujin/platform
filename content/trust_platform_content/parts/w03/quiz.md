---
id: w03-quiz
title: "Week 03 Quiz — Multi-Client Event Loop"
order: 8
duration_min: 30
type: quiz
---

# Week 03 Quiz — Multi-Client Event Loop

---

## Multiple Choice (8 questions)

### Q1 — Busy-wait diagnosis

Your server's CPU usage is 100% even with zero clients connected. The `poll()` call is inside the main loop. What is the most likely cause?

- A) The listening socket is not bound correctly.
- B) `poll()` is called with a timeout of 0 (returns immediately).
- C) `poll()` is called with a timeout of -1 (blocks forever).
- D) The `pollfd` array is empty.

### Q2 — Non-blocking accept

You set the listening socket to non-blocking. A client connects, but `accept()` returns -1. `errno` is `EAGAIN`. What should your code do?

- A) Print an error and exit the server.
- B) Retry `accept()` in a tight loop until it succeeds.
- C) Ignore it and continue the `poll()` loop — the connection will appear on the next `poll()`.
- D) Close the listening socket and re-bind.

### Q3 — Partial write

You call `write(fd, buf, 1000)` on a non-blocking socket. It returns 400. What does this mean and what should you do?

- A) An error occurred. Close the connection.
- B) 400 bytes were sent. Discard the rest — the client will request retransmission via TCP.
- C) 400 bytes were sent. Keep the remaining 600 bytes in the send buffer and try again when `POLLOUT` fires.
- D) 400 bytes were sent. Call `write()` again immediately with the remaining 600 bytes.

### Q4 — Concatenated frames

A `read()` call returns 24 bytes. Your frame protocol uses a 4-byte header. The first header says payload is 8 bytes (total frame = 12 bytes). What should you do with the remaining 12 bytes?

- A) Discard them — they belong to the next `read()`.
- B) Parse them as another frame starting from the next 4-byte header.
- C) Append them to the current frame's payload.
- D) Close the connection — the client is misbehaving.

### Q5 — Slow client detection

Client C's `send_buf` has 6000 bytes pending and growing. The threshold is 4096. What is the correct action per the design from Lesson 4?

- A) Stop broadcasting to client C but keep the connection open.
- B) Disconnect client C, close the fd, free the slot.
- C) Increase the buffer size to accommodate client C.
- D) Pause the entire event loop until client C catches up.

### Q6 — FD leak

After 1000 connections, `accept()` fails with `EMFILE` (too many open files). No clients show as active in the connection table. What is the most likely bug?

- A) The kernel file descriptor limit is too low.
- B) Connections are removed from the table but `close(fd)` is never called.
- C) The server is not calling `accept()` fast enough.
- D) The `pollfd` array is full.

### Q7 — POLLOUT timing

You always set `events = POLLIN | POLLOUT` for every client fd. What problem does this cause?

- A) `poll()` returns an error.
- B) `poll()` returns immediately for every fd with an empty send buffer, causing a busy loop.
- C) Clients cannot send data.
- D) The server crashes.

### Q8 — Connection state after EOF

Client A sends a message, then closes the connection. Your `read()` returns the message data, and the next `read()` returns 0. What is the correct sequence of actions?

- A) Process the message, then immediately free the slot and close the fd.
- B) Process the message, flush any pending data in `send_buf`, then close the fd and free the slot.
- C) Close the fd immediately without processing the message.
- D) Keep the connection open in case the client reconnects.

---

## Short Answer (4 questions)

### Q9

Explain in 2–3 sentences why `select()` has a file descriptor limit but `poll()` does not. Reference the data structure each uses.

### Q10

A client sends a 100-byte frame, but the kernel delivers it in two `read()` calls: first 20 bytes, then 84 bytes (4-byte header + 100-byte payload = 104 total). Describe the exact steps your buffer and parser take to reassemble this frame.

### Q11

Your server is broadcasting a 500-byte message to 200 clients. For each client, appending to `send_buf` takes O(1). What is the total time complexity of one broadcast call? Why does this matter for event loop latency?

### Q12

Explain the purpose of the `trap` command in the regression harness. What happens if you do not use it and a test fails midway?

---

## Read-the-Output (2 questions)

### Q13

Your server prints this log. Identify the problem.

```
2026-02-10T14:30:00.000Z [conn=0] [fd=4] ACCEPT from 127.0.0.1:50001
2026-02-10T14:30:00.100Z [conn=1] [fd=5] ACCEPT from 127.0.0.1:50002
2026-02-10T14:30:01.000Z [conn=0] [fd=4] FRAME len=10 payload="broadcast1"
2026-02-10T14:30:01.001Z [conn=0] [fd=4] ENQUEUE queued=14 total_pending=14
2026-02-10T14:30:01.002Z [conn=1] [fd=5] ENQUEUE queued=14 total_pending=14
2026-02-10T14:30:02.000Z [conn=0] [fd=4] FLUSH wrote=14 remaining=0
2026-02-10T14:30:15.000Z [conn=1] [fd=5] FLUSH wrote=0 remaining=14
2026-02-10T14:30:16.000Z [conn=0] [fd=4] FRAME len=10 payload="broadcast2"
2026-02-10T14:30:16.001Z [conn=0] [fd=4] ENQUEUE queued=14 total_pending=14
2026-02-10T14:30:16.002Z [conn=1] [fd=5] ENQUEUE queued=14 total_pending=28
```

What is happening with conn=1? What will eventually happen if this pattern continues?

### Q14

The regression harness prints this output. Identify what went wrong and which lesson's feature is broken.

```
[HARNESS] server started pid=4521
[TEST] basic_echo .............. PASS
[TEST] broadcast_two_clients ... PASS
[TEST] slow_client_disconnect .. PASS
[TEST] partial_frame_reassembly  FAIL
  expected: "AAAAAAAAAA" (10 bytes)
  got:      "AAAAA" (5 bytes)
[TEST] oversized_frame_rejected  PASS
[TEST] stats_command ........... PASS
════════════════════════════════════
 5 passed, 1 failed
[HARNESS] server stopped
```

Which lesson's feature is broken? What is the most likely bug in the server code?
