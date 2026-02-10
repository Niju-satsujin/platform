---
id: w02-part
title: "TCP Echo Server with Stream-Safe Framing"
order: 2
type: part
---

# TCP Echo Server with Stream-Safe Framing

**Theme:** Shift from local correctness to network correctness: framing, partial reads, robust IO.

## Big Picture

Every distributed system is just processes talking over sockets. The kernel gives you a byte stream, not messages. If you read without framing, bytes merge. If you ignore partial reads, data corrupts silently. If you skip timeouts, your server hangs forever on a dead client.

This week you build the simplest possible networked service — a [TCP](https://datatracker.ietf.org/doc/html/rfc793) echo server — and you build it correctly. Length-prefix framing. Partial-read loops. Disconnect detection. Timeouts. Every line of code here reappears in Weeks 3–24.

## How it connects

**From Week 1:** trustctl gave you config precedence, exit codes, structured logging, and a regression harness. This week you add a `trustctl echo-server` subcommand that reuses all of that infrastructure.

**To Week 3:** The echo server handles one client at a time. Week 3 adds [select/poll](https://man7.org/linux/man-pages/man2/select.2.html) to handle many clients concurrently without threads.

**To Week 9+:** The length-prefix framing protocol you build here becomes the wire format for the KV store's request/response messages.

## What are we building? (0/7)

**trustctl echo-server v0.1** — a TCP echo service with:

- [Socket](https://man7.org/linux/man-pages/man2/socket.2.html) lifecycle: bind → listen → accept → serve → close
- [SO_REUSEADDR](https://man7.org/linux/man-pages/man7/socket.7.html) so restarts don't fail with "address in use"
- 4-byte big-endian length-prefix [framing](https://datatracker.ietf.org/doc/html/rfc1122#section-4.2.2) for every message
- Partial [recv](https://man7.org/linux/man-pages/man2/recv.2.html)/[send](https://man7.org/linux/man-pages/man2/send.2.html) loops — never assume one call moves all bytes
- Clean disconnect detection (recv returns 0)
- [SO_RCVTIMEO](https://man7.org/linux/man-pages/man7/socket.7.html) / [SO_SNDTIMEO](https://man7.org/linux/man-pages/man7/socket.7.html) timeouts
- Structured error mapping: errno → exit code → log event
- Load test script proving N sequential clients work
- 10-test regression harness locking all behavior

## Hero Visual

```
┌──────────────────────────────────────────────────────┐
│            trustctl echo-server v0.1                  │
│                                                      │
│  Client                           Server             │
│  ┌─────┐    [4B len][payload]    ┌─────────┐         │
│  │     │ ──────────────────────► │ socket() │         │
│  │     │                         │ bind()   │         │
│  │     │                         │ listen() │         │
│  │     │    TCP connect          │ accept() │         │
│  │     │ ◄─────────────────────► │          │         │
│  │     │    framed echo          │ recv()   │         │
│  │     │ ◄────────────────────── │ send()   │         │
│  │     │                         │ close()  │         │
│  └─────┘                         └─────────┘         │
│                                                      │
│  Framing: [4-byte big-endian length][payload bytes]  │
└──────────────────────────────────────────────────────┘
```

### What you should notice
- Every message has a length header. The stream never ambiguates message boundaries.
- recv/send loop until all bytes move. One call is never enough.
- The server reuses trustctl's logging and exit codes from Week 1.

## Lessons

- Lesson 1 (1/7): Sockets — The Connect/Accept Contract
- Lesson 2 (2/7): Stream Framing Rule — Length-Prefix Protocol
- Lesson 3 (3/7): Partial IO + Disconnects
- Lesson 4 (4/7): Timeouts + Error Mapping
- Lesson 5 (5/7): Load Test — Many Sequential Clients
- Lesson 6 (6/7): Regression Harness — The Exact 10 Tests
- Boss Project (7/7): Ship trustctl echo-server v0.1
- Quiz: TCP Echo — Practical Debugging Quiz
