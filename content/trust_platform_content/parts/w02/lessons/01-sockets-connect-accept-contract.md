---
id: w02-l01
title: "Lesson 1 — Sockets: The Connect/Accept Contract"
order: 1
duration_min: 120
type: lesson
---

# Lesson 1 (1/7): Sockets — The Connect/Accept Contract

**Goal:** Build a minimal TCP server that binds to a port, accepts one connection, reads raw bytes, echoes them back, and closes.

**What you build:** `trustctl echo-server --port <PORT>` that accepts a single TCP connection, echoes raw bytes, and shuts down cleanly.

## Why it matters

- A [socket](https://man7.org/linux/man-pages/man2/socket.2.html) is the kernel's interface for network IO. Every networked program — web servers, databases, your KV store in Week 9 — starts with this exact syscall sequence.
- The [bind](https://man7.org/linux/man-pages/man2/bind.2.html) → [listen](https://man7.org/linux/man-pages/man2/listen.2.html) → [accept](https://man7.org/linux/man-pages/man2/accept.2.html) contract is not optional. Skip one step and the kernel refuses your connection.
- [SO_REUSEADDR](https://man7.org/linux/man-pages/man7/socket.7.html) prevents the "address already in use" error that bites every developer the first time they restart a server. Without it, you wait 60 seconds in [TIME_WAIT](https://datatracker.ietf.org/doc/html/rfc793#section-3.5).
- This lesson is raw bytes only. No framing. You will see the problem that creates, and Lesson 2 fixes it.

## TRAINING SESSION

### Warmup (10 min)
- Q: Name the five syscalls a TCP server makes before it can read data from a client.
- Q: What happens if you call [listen](https://man7.org/linux/man-pages/man2/listen.2.html) without calling [bind](https://man7.org/linux/man-pages/man2/bind.2.html) first?
- Recall: From Week 1, what exit code does trustctl use for usage errors?

### Work

**Task 1: Add the echo-server subcommand to trustctl**

1. Do this: Register a new subcommand `echo-server` in trustctl's router. It [MUST](https://datatracker.ietf.org/doc/html/rfc2119) accept `--port <PORT>`. If `--port` is missing, exit 64. Reuse trustctl's existing config, logging, and exit code infrastructure.
2. How to test it:
   ```
   trustctl echo-server
   echo $?
   ```
3. Expected result: Exit 64 with message "missing required flag: --port".

**Task 2: Create, bind, listen**

1. Do this: Create a TCP socket with [socket(AF_INET, SOCK_STREAM, 0)](https://man7.org/linux/man-pages/man2/socket.2.html). Set [SO_REUSEADDR](https://man7.org/linux/man-pages/man7/socket.7.html) with [setsockopt](https://man7.org/linux/man-pages/man2/setsockopt.2.html). [Bind](https://man7.org/linux/man-pages/man2/bind.2.html) to `0.0.0.0:<PORT>`. Call [listen](https://man7.org/linux/man-pages/man2/listen.2.html) with backlog 1.
2. How to test it:
   ```
   trustctl echo-server --port 9900 &
   PID=$!
   sleep 1
   ss -tlnp | grep 9900
   kill $PID
   ```
3. Expected result: `ss` shows a LISTEN socket on port 9900.

**Task 3: Accept one client and echo raw bytes**

1. Do this: Call [accept](https://man7.org/linux/man-pages/man2/accept.2.html) to get the client file descriptor. Loop: [recv](https://man7.org/linux/man-pages/man2/recv.2.html) up to 1024 bytes. If recv returns > 0, [send](https://man7.org/linux/man-pages/man2/send.2.html) back the same bytes. If recv returns 0, the client disconnected — close the client socket, log it, and go back to accept.
2. How to test it:
   ```
   trustctl echo-server --port 9900 &
   PID=$!
   sleep 1
   echo "hello" | nc localhost 9900
   kill $PID
   ```
3. Expected result: `nc` prints `hello` back. Server logs the connection and disconnect.

**Task 4: Handle server restart without "address in use"**

1. Do this: Kill the server and restart it immediately on the same port. [SO_REUSEADDR](https://man7.org/linux/man-pages/man7/socket.7.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be set so this works without waiting.
2. How to test it:
   ```
   trustctl echo-server --port 9900 &
   PID=$!
   sleep 1
   kill $PID
   wait $PID
   trustctl echo-server --port 9900 &
   PID=$!
   sleep 1
   echo "restart test" | nc localhost 9900
   kill $PID
   ```
3. Expected result: Second server starts immediately. No "address already in use" error.

**Task 5: Observe the framing problem**

1. Do this: Send two messages rapidly from a client without any delay between them. Observe that the server may receive both messages merged into one recv call.
2. How to test it:
   ```
   trustctl echo-server --port 9900 &
   PID=$!
   sleep 1
   (echo -n "AAAA"; echo -n "BBBB") | nc localhost 9900
   kill $PID
   ```
3. Expected result: Server might echo `AAAABBBB` as one blob instead of two separate messages. This is the byte stream problem. Lesson 2 fixes it with framing.

### Prove (15 min)
- Run the nc echo test. Confirm bytes come back.
- Restart the server twice. Confirm no bind errors.
- Explain in 4 lines: Why does TCP merge your two sends into one recv? (Hint: [Nagle's algorithm](https://man7.org/linux/man-pages/man7/tcp.7.html) and kernel buffering.)

### Ship (5 min)
- Submit: trustctl source with echo-server subcommand
- Paste: output of `ss -tlnp | grep 9900` showing LISTEN state
- Paste: output of `echo "hello" | nc localhost 9900`

## Done when
- `trustctl echo-server --port 9900` listens on port 9900.
- `echo "hello" | nc localhost 9900` returns `hello`.
- Server restarts immediately without "address already in use".
- Missing `--port` exits 64.
- Server logs connection and disconnect events.

## Common mistakes
- Forgetting SO_REUSEADDR → Fix: Set it with [setsockopt](https://man7.org/linux/man-pages/man2/setsockopt.2.html) immediately after socket().
- Binding to 127.0.0.1 instead of 0.0.0.0 → Fix: Use INADDR_ANY unless you want localhost only.
- Not closing the client socket after disconnect → Fix: When recv returns 0, close the fd immediately.
- Assuming recv reads the full message → Fix: This is the bug Lesson 2 solves. Note it now.
- Forgetting to integrate with trustctl's logger → Fix: Every accept/disconnect/error emits a structured log event.

## Proof
- Submit: source code with echo-server subcommand
- Paste: ss output showing LISTEN on port 9900
- Paste: nc echo round-trip output

## Hero Visual

```
┌──────────────────────────────────────────┐
│       Socket Lifecycle (Server)          │
│                                          │
│  socket()  ──► fd = 3                    │
│      │                                   │
│  setsockopt(SO_REUSEADDR)               │
│      │                                   │
│  bind(0.0.0.0:9900)                     │
│      │                                   │
│  listen(backlog=1)                       │
│      │                                   │
│  accept()  ──► client_fd = 4  (blocks)  │
│      │                                   │
│  recv(client_fd) ──► data               │
│      │                                   │
│  send(client_fd, data)                  │
│      │                                   │
│  close(client_fd)                       │
│      │                                   │
│  (loop back to accept)                  │
└──────────────────────────────────────────┘
```

### What you should notice
- accept() blocks until a client connects. The server does nothing while waiting.
- Each syscall can fail. You must check return values.
- This handles one client at a time. Week 3 fixes that.

## Future Lock
In **Week 3** (Event Loop), you replace the blocking accept loop with [select](https://man7.org/linux/man-pages/man2/select.2.html)/[poll](https://man7.org/linux/man-pages/man2/poll.2.html) to serve many clients simultaneously. In **Week 4** (HTTP), you parse HTTP requests over these same sockets. In **Week 9** (KV Store), the socket lifecycle is identical — only the protocol changes. The bind/listen/accept pattern you build here is permanent.
