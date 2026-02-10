---
id: w02-l04
title: "Lesson 4 — Timeouts + Error Mapping"
order: 4
duration_min: 120
type: lesson
---

# Lesson 4 (4/7): Timeouts + Error Mapping

**Goal:** Add socket timeouts so a dead client cannot hang the server forever. Map every network error to a structured log event and an exit code.

**What you build:** Configurable recv/send timeouts using [setsockopt](https://man7.org/linux/man-pages/man2/setsockopt.2.html). A centralized error mapping table that converts [errno](https://man7.org/linux/man-pages/man3/errno.3.html) values to log events and actions.

## Why it matters

- Without timeouts, a client that connects and never sends data blocks your server forever. The server sits in [recv](https://man7.org/linux/man-pages/man2/recv.2.html) waiting for bytes that never arrive. No other client can be served.
- [SO_RCVTIMEO](https://man7.org/linux/man-pages/man7/socket.7.html) and [SO_SNDTIMEO](https://man7.org/linux/man-pages/man7/socket.7.html) tell the kernel to return EAGAIN/EWOULDBLOCK after N seconds. Your code then decides what to do.
- Error mapping turns raw errno numbers into human-readable, greppable log events. When a production server sees 500 ECONNRESET events per minute, operators need structured data, not errno 104.
- This is the same pattern used by [nginx](https://nginx.org/en/docs/), [Redis](https://redis.io/docs/management/config/), and [PostgreSQL](https://www.postgresql.org/docs/current/runtime-config-connection.html) for connection timeouts.

## TRAINING SESSION

### Warmup (5 min)
- Q: What happens when recv blocks for 60 seconds with no timeout set?
- Q: What [errno](https://man7.org/linux/man-pages/man3/errno.3.html) does the kernel return when a socket timeout fires?
- Recall: From Lesson 3, what does recv_exact do when recv returns -1?

### Work

**Task 1: Set recv and send timeouts on the client socket**

1. Do this: After [accept](https://man7.org/linux/man-pages/man2/accept.2.html) returns the client fd, set [SO_RCVTIMEO](https://man7.org/linux/man-pages/man7/socket.7.html) and [SO_SNDTIMEO](https://man7.org/linux/man-pages/man7/socket.7.html) using setsockopt. Use a `struct timeval` with seconds from a config flag `--timeout <seconds>` (default: 5).
2. How to test it:
   ```
   trustctl echo-server --port 9900 --timeout 3 &
   PID=$!
   sleep 1
   # Connect but send nothing. Wait for timeout.
   nc localhost 9900
   # After 3 seconds, server should close the connection
   kill $PID
   ```
3. Expected result: After 3 seconds of idle, the server logs a timeout event and closes the connection. Server returns to accept.

**Task 2: Handle timeout in recv_exact**

1. Do this: When recv returns -1 and errno is EAGAIN or EWOULDBLOCK, recv_exact [MUST](https://datatracker.ietf.org/doc/html/rfc2119) return a distinct timeout status. The echo server then logs the timeout and closes the client connection cleanly.
2. How to test it:
   ```
   trustctl echo-server --port 9900 --timeout 2 &
   PID=$!
   sleep 1
   # Connect and send only the 4-byte header, no payload. Server waits for payload, times out.
   printf '\x00\x00\x00\x0a' | nc localhost 9900
   sleep 3
   # Server should still be alive
   ./echo-client localhost 9900 "after timeout"
   kill $PID
   ```
3. Expected result: First client times out. Server logs `recv_timeout`. Second client connects and echoes normally.

**Task 3: Build the error mapping table**

1. Do this: Create a centralized function `map_io_error(errno_value)` that returns a struct with:
   - `event_name`: human-readable event (e.g., `"recv_timeout"`, `"client_reset"`, `"broken_pipe"`)
   - `log_level`: warn for timeouts and resets, error for unexpected failures
   - `action`: close_client, retry, or shutdown
   Map at minimum:
   - EAGAIN / EWOULDBLOCK → recv_timeout, warn, close_client
   - ECONNRESET → client_reset, warn, close_client
   - EPIPE → broken_pipe, warn, close_client
   - EINTR → interrupted, debug, retry
   - Others → io_error, error, close_client
2. How to test it: Force each error and check log output.
3. Expected result: Every IO error produces a structured log event with the correct name and level.

**Task 4: Log every error with context**

1. Do this: When an IO error occurs, emit a structured log event:
   ```
   {"ts":"...","level":"warn","event":"recv_timeout","client_fd":4,
    "errno":11,"timeout_sec":3,"request_id":"..."}
   ```
   Include client_fd, the raw errno, the timeout value, and the request_id.
2. How to test it:
   ```
   trustctl echo-server --port 9900 --timeout 2 &
   PID=$!
   sleep 1
   nc localhost 9900 &
   sleep 3
   cat $TRUST_HOME/logs/trustctl.log | grep recv_timeout
   kill $PID
   ```
3. Expected result: Log file contains a `recv_timeout` event with all fields populated.

**Task 5: Verify server stays alive after all error types**

1. Do this: Trigger timeout, disconnect, and broken pipe errors in sequence. After each, confirm the server accepts the next client.
2. How to test it:
   ```
   trustctl echo-server --port 9900 --timeout 2 &
   PID=$!
   sleep 1

   # Timeout: connect, send nothing
   nc -w 1 localhost 9900 &
   sleep 3

   # Disconnect: connect, send partial frame, close
   printf '\x00\x00' | nc localhost 9900
   sleep 1

   # Normal client after errors
   ./echo-client localhost 9900 "survived all errors"

   kill $PID
   ```
3. Expected result: Server handles all three error types and still serves the final client. Log contains timeout, disconnect, and normal events.

### Prove (15 min)
- Run the timeout test. Confirm server recovers in under `--timeout` seconds.
- Run the error sequence. Confirm server survives all three.
- Explain in 4 lines: Why set timeouts on the client fd, not the listening fd? (Hint: you want accept to block forever waiting for connections, but recv should not block forever on a single client.)

### Ship (5 min)
- Submit: updated source with timeout + error mapping
- Paste: log output showing recv_timeout event with errno and timeout_sec
- Paste: output showing server serves a client after surviving errors

## Done when
- `--timeout` flag sets SO_RCVTIMEO and SO_SNDTIMEO on client sockets.
- Idle client triggers timeout after N seconds. Server logs it and closes the connection.
- Error mapping converts errno → structured log event.
- Server survives timeout, disconnect, and broken pipe errors in sequence.
- Every error is logged with client_fd, errno, and request_id.

## Common mistakes
- Setting timeout on the listen socket → Fix: Set it on the client fd returned by accept, not the server fd.
- Treating timeout as fatal → Fix: Timeout means the client is slow or dead. Close the client, not the server.
- Not distinguishing EAGAIN from ECONNRESET → Fix: Use the error mapping table. Different errors need different log levels.
- Hard-coded timeout → Fix: Use `--timeout` flag with a sane default (5 seconds).
- Missing errno in log → Fix: Always include the raw errno. Operators need it for kernel-level debugging.

## Proof
- Submit: source with timeout + error mapping
- Paste: recv_timeout log event
- Paste: server-survives-error-sequence output

## Hero Visual

```
┌────────────────────────────────────────────────────┐
│             Error Mapping Table                     │
│                                                    │
│  errno           event           level   action    │
│  ─────           ─────           ─────   ──────    │
│  EAGAIN          recv_timeout    warn    close fd   │
│  ECONNRESET      client_reset   warn    close fd   │
│  EPIPE           broken_pipe    warn    close fd   │
│  EINTR           interrupted    debug   retry      │
│  (other)         io_error       error   close fd   │
│                                                    │
│  Timeline:                                         │
│  client connects ──► idle 3s ──► EAGAIN ──► close  │
│                                     │              │
│                          log: recv_timeout          │
│                                     │              │
│                              accept next client    │
└────────────────────────────────────────────────────┘
```

### What you should notice
- Every errno maps to exactly one structured event. No raw numbers in logs.
- Timeout is warn, not error. It is expected behavior, not a bug.
- The server always returns to accept after handling an error.

## Future Lock
In **Week 3** (Event Loop), non-blocking sockets return EAGAIN on every call — your error mapping expands to handle this as "try again later" instead of "timeout." In **Week 4** (HTTP), timeouts prevent slow-loris attacks. In **Week 9** (KV Store), client timeouts trigger automatic reconnection. The error mapping table you build here is the foundation for all network error handling.
