---
id: w03-part
title: "Multi-Client Event Loop"
order: 3
type: part
---

# Week 03 — Multi-Client Event Loop

> Learn concurrency without threads using select/poll and connection state machines.

## Theme

Your Week 02 echo server handles one client at a time.
That is not how real servers work.
This week you upgrade it to serve **many clients at once** — without threads.

You will use [select(2)](https://man7.org/linux/man-pages/man2/select.2.html) and [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html) to multiplex I/O.
You will set sockets to non-blocking mode with [fcntl(2)](https://man7.org/linux/man-pages/man2/fcntl.2.html).
You will build a **connection state machine** that tracks each client through CONNECTED → READY → DRAINING → CLOSED.
You will add broadcast, slow-client detection, and observability.

## Project

Upgrade the TCP Echo Server from Week 02 to handle multiple simultaneous clients using `select()`/`poll()`.
Build a connection state machine.
Add broadcast and slow-client detection.

## Lessons

| # | Title | Duration |
|---|-------|----------|
| 1 | Event Loop Mental Model | 120 min |
| 2 | Accept & Track Many Clients | 120 min |
| 3 | Framing Inside the Loop | 120 min |
| 4 | Broadcast & Slow-Client Handling | 120 min |
| 5 | Observability for Connections | 120 min |
| 6 | Regression Harness | 120 min |

## Quest

Build the full multi-client echo server with broadcast, slow-client handling, observability, and regression tests.
**Duration:** 240 min.

## Connections

- **W01** — Config and logging foundations feed into your connection logger.
- **W02** — Your TCP echo server and length-prefix framing are the starting point.
- **W04** — You will replace `poll()` with [epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html) for thousands of connections.
- **W05** — Thread pool integration will offload heavy work from the event loop.
- **W09** — The KV protocol will be served over this exact event loop.
