---
id: w03-l06
title: "Slow client defense"
order: 6
duration_minutes: 25
xp: 75
kind: lesson
part: w03
proof:
  type: paste
  instructions: "Paste server log showing a slow client detected and disconnected, while fast clients continue normally."
  regex_patterns:
    - "slow|backpressure|write.*block"
    - "disconnect"
---
# Slow client defense

## Concept

A slow client is one that reads responses too slowly. Your server calls `write()` to send the echo, but the client's receive buffer is full because the client is not reading. Eventually `write()` blocks — and while your server is stuck waiting for one slow client, it cannot serve anyone else.

This is called the **slow consumer problem**. It shows up everywhere in distributed systems: message queues, event streams, database replication.

Two defenses:

1. **Non-blocking writes with send buffer tracking** — use `poll()` with POLLOUT to check if the client's socket is writable before writing. If the send buffer is full, mark the client as "congested." If it stays congested for too long, disconnect it.

2. **Write timeout** — simpler approach. Set a timeout on the write operation. If `write()` does not complete within N seconds, disconnect the client.

For now, use approach 2 — it is simpler. Set the socket's send timeout with `setsockopt(fd, SOL_SOCKET, SO_SNDTIMEO, ...)`.

The principle: **never let one bad client affect other clients**. If a client cannot keep up, disconnect it. The server's job is to serve the majority, not to wait for the slowest.

## Task

1. Set `SO_SNDTIMEO` on every accepted client socket (timeout: 5 seconds)
2. When `write_exact()` returns -1 with `errno == EAGAIN` or `errno == EWOULDBLOCK`, it means the timeout expired
3. Log: `"client <fd> write timeout, disconnecting"`
4. Close the client and continue serving others
5. Write a test: a client that connects, sends one frame, then stops reading. The server should disconnect it after 5 seconds.

## Hints

- `struct timeval tv; tv.tv_sec = 5; tv.tv_usec = 0; setsockopt(fd, SOL_SOCKET, SO_SNDTIMEO, &tv, sizeof(tv));`
- After the timeout, `write()` returns -1 and `errno` is EAGAIN or EWOULDBLOCK
- The test client: connect, `send_frame()` once, then `sleep(30)` without reading — the server fills the buffer and eventually hits the timeout
- You may need to send a LOT of data to fill the buffer (TCP buffers can be 64KB-256KB)

## Verify

```bash
# Terminal 1
./server --port 9000

# Terminal 2
./test_slow_client --port 9000
```

Expected: server logs "write timeout" after ~5 seconds and disconnects the slow client.

## Done When

Slow clients are detected and disconnected within the timeout period, and other clients are unaffected.
