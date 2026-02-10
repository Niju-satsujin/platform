---
id: w02-l03
title: "Lesson 3 — Partial IO + Disconnects"
order: 3
duration_min: 120
type: lesson
---

# Lesson 3 (3/7): Partial IO + Disconnects

**Goal:** Make recv and send robust against partial transfers. Handle client disconnects without crashing.

**What you build:** `recv_exact()` and `send_exact()` helper functions that loop until all bytes transfer or an error/disconnect occurs. Integrate them into the echo server.

## Why it matters

- [recv](https://man7.org/linux/man-pages/man2/recv.2.html) is allowed to return fewer bytes than you asked for. This happens under load, with large messages, or across slow networks. If you read 2 bytes of a 4-byte header and treat it as complete, you decode garbage.
- [send](https://man7.org/linux/man-pages/man2/send.2.html) can also write fewer bytes than requested, especially when the kernel's send buffer is full. The remaining bytes are your responsibility.
- When a client disconnects, recv returns 0. If you ignore this and keep reading, you spin forever. If send writes to a closed socket, you get [EPIPE](https://man7.org/linux/man-pages/man7/signal.7.html) and the kernel delivers SIGPIPE by default — which kills your server.
- These are the bugs that only appear in production under load. Build the defense now while the program is simple.

## TRAINING SESSION

### Warmup (5 min)
- Q: [recv](https://man7.org/linux/man-pages/man2/recv.2.html) returns 3 when you asked for 4. Is this an error?
- Q: What signal does the kernel send when you write to a closed socket?
- Recall: From Lesson 2, what are the two reads the server must do per message? (header, then payload)

### Work

**Task 1: Write recv_exact()**

1. Do this: Write a function `recv_exact(fd, buf, count)` that loops calling [recv](https://man7.org/linux/man-pages/man2/recv.2.html) until exactly `count` bytes have been read into `buf`. Handle three cases:
   - recv returns > 0: advance buffer pointer, subtract from remaining count, loop.
   - recv returns 0: client disconnected. Return a distinct status (e.g., 0 or an enum).
   - recv returns -1: check [errno](https://man7.org/linux/man-pages/man3/errno.3.html). If EINTR, retry. Otherwise return error.
2. How to test it: Use it to read the 4-byte frame header. It [MUST](https://datatracker.ietf.org/doc/html/rfc2119) work even if the kernel delivers 1 byte at a time.
3. Expected result: recv_exact always returns after reading exactly `count` bytes, or with a clear disconnect/error status.

**Task 2: Write send_exact()**

1. Do this: Write a function `send_exact(fd, buf, count)` that loops calling [send](https://man7.org/linux/man-pages/man2/send.2.html) until exactly `count` bytes have been written. Handle:
   - send returns > 0: advance, subtract, loop.
   - send returns -1 with errno == EINTR: retry.
   - send returns -1 with errno == [EPIPE](https://man7.org/linux/man-pages/man2/send.2.html): client gone. Return error.
   - send returns -1 with other errno: return error.
   Pass `MSG_NOSIGNAL` flag to [send](https://man7.org/linux/man-pages/man2/send.2.html) to suppress SIGPIPE.
2. How to test it: Send a framed response. Verify the full frame arrives at the client.
3. Expected result: send_exact always writes all bytes or reports an error. No partial sends leak to the application.

**Task 3: Integrate into the echo server**

1. Do this: Replace all raw recv/send calls in the echo server with recv_exact/send_exact. The echo loop becomes:
   - recv_exact(fd, header_buf, 4) → if disconnect, log and close
   - decode length from header
   - recv_exact(fd, payload_buf, length) → if disconnect, log and close
   - send_exact(fd, header_buf, 4) → if error, log and close
   - send_exact(fd, payload_buf, length) → if error, log and close
2. How to test it:
   ```
   trustctl echo-server --port 9900 &
   PID=$!
   sleep 1
   ./echo-client localhost 9900 "partial IO test"
   kill $PID
   ```
3. Expected result: Messages echo correctly. No partial data. Server logs structured events.

**Task 4: Handle client disconnect cleanly**

1. Do this: Test the disconnect path. Connect a client, send one message, then close the client without sending more. The server [MUST](https://datatracker.ietf.org/doc/html/rfc2119):
   - Detect the disconnect (recv_exact returns 0)
   - Log: `{"event":"client_disconnect","client_fd":4}`
   - Close the client fd
   - Return to accept() for the next client
   The server [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) crash, spin, or leak the file descriptor.
2. How to test it:
   ```
   trustctl echo-server --port 9900 &
   PID=$!
   sleep 1
   # Client connects, sends one message, disconnects
   ./echo-client localhost 9900 "one-shot"
   sleep 1
   # Second client can still connect
   ./echo-client localhost 9900 "second client"
   kill $PID
   ```
3. Expected result: First client echoes and disconnects. Second client connects and echoes. Server logs both disconnects.

**Task 5: Suppress SIGPIPE**

1. Do this: Ensure that writing to a disconnected client does not crash the server. Two options:
   - Option A: Pass `MSG_NOSIGNAL` to every [send](https://man7.org/linux/man-pages/man2/send.2.html) call.
   - Option B: Install a process-wide [sigaction](https://man7.org/linux/man-pages/man2/sigaction.2.html) handler for SIGPIPE with SIG_IGN.
   Either way, send_exact [MUST](https://datatracker.ietf.org/doc/html/rfc2119) detect EPIPE and return an error instead of letting the process die.
2. How to test it:
   ```
   trustctl echo-server --port 9900 &
   PID=$!
   sleep 1
   # Connect, send a large message, kill client mid-transfer
   (echo -n "$(head -c 60000 /dev/urandom | base64)" | nc -q 0 localhost 9900) &
   sleep 0.1
   kill %2 2>/dev/null
   sleep 1
   # Server should still be alive
   ./echo-client localhost 9900 "still alive"
   kill $PID
   ```
3. Expected result: Server survives the broken pipe. Next client connects normally.

### Prove (15 min)
- Run the disconnect test. Confirm two sequential clients work.
- Run the SIGPIPE test. Confirm the server survives.
- Explain in 4 lines: Why must you pass MSG_NOSIGNAL to send()? (Hint: default SIGPIPE action is [process termination](https://man7.org/linux/man-pages/man7/signal.7.html).)

### Ship (5 min)
- Submit: recv_exact, send_exact, updated echo-server source
- Paste: log output showing two sequential client_disconnect events
- Paste: output showing server survives a broken pipe

## Done when
- recv_exact reads exactly N bytes or returns disconnect/error.
- send_exact writes exactly N bytes or returns error.
- Client disconnect → server logs it and accepts next client.
- SIGPIPE does not crash the server.
- No file descriptor leaks after disconnect.

## Common mistakes
- Not looping on partial recv → Fix: Always loop. recv(fd, buf, 4) can return 1, 2, or 3 bytes.
- Ignoring EINTR → Fix: If errno == EINTR, retry the call. Signals can interrupt recv/send.
- No MSG_NOSIGNAL on send → Fix: Without it, SIGPIPE kills the process when the client is gone.
- Not closing client_fd after disconnect → Fix: Always close. File descriptors are finite (default ~1024).
- Logging disconnect as error → Fix: Disconnect is normal. Log at info level, not error.

## Proof
- Submit: recv_exact + send_exact + echo-server source
- Paste: two sequential client test output
- Paste: server-survives-broken-pipe evidence

## Hero Visual

```
┌────────────────────────────────────────────────────┐
│              recv_exact() Loop                      │
│                                                    │
│  want = 4 bytes (frame header)                     │
│                                                    │
│  Attempt 1: recv() → got 2     remaining = 2      │
│  Attempt 2: recv() → got 1     remaining = 1      │
│  Attempt 3: recv() → got 1     remaining = 0 ✓    │
│                                                    │
│  Total: 4 bytes assembled correctly                │
│                                                    │
│  ───────────────────────────────                   │
│                                                    │
│  Disconnect path:                                  │
│  recv() → 0  ──► log disconnect ──► close fd       │
│                                                    │
│  Error path:                                       │
│  recv() → -1 ──► check errno ──► EINTR? retry      │
│                               ──► else: return err │
└────────────────────────────────────────────────────┘
```

### What you should notice
- The loop guarantees correctness regardless of how the kernel splits the data.
- Three possible outcomes: success, disconnect, error. All three must be handled.
- This pattern is identical for send_exact — just the syscall changes.

## Future Lock
In **Week 3** (Event Loop), recv_exact becomes non-blocking and buffers partial frames across poll cycles. In **Week 10** (WAL), write_exact writes log entries to disk with the same loop pattern. In **Week 11** (Replication), partial sends across nodes use send_exact over TCP. The loop-until-complete pattern is everywhere.
