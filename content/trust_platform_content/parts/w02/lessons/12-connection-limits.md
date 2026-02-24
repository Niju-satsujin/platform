---
id: w02-l12
title: "Connection limits — refuse when full"
order: 12
duration_minutes: 20
xp: 50
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste server log showing it accepting clients up to the limit, then refusing the next one."
  regex_patterns:
    - "limit|max|refuse|reject"
---
# Connection limits — refuse when full

## Concept

Your server should not accept infinite connections. Each connection uses memory (the pollfd entry, the client state struct, the kernel socket buffer). If 10,000 clients connect at once, the server runs out of memory or file descriptors and crashes.

The fix: set a maximum number of simultaneous connections. When the limit is reached, stop calling `accept()` until a slot frees up. Or call `accept()` then immediately close the new fd with an error message.

The second approach is better — it lets the client know WHY it was rejected. If you just stop accepting, the client hangs in connect() and does not know what happened.

```cpp
if (active_clients >= MAX_CLIENTS) {
    int fd = accept(...);
    // optionally send an error frame: "server full"
    close(fd);  // immediately close
    continue;
}
```

A reasonable default: 100-1000 connections. For testing, set it to 5 so you can easily hit the limit.

## Task

1. Add a `--max-clients` command-line option (default: 100)
2. Before accepting a new connection, check if you are at the limit
3. If at the limit, accept the connection, send a one-line error message "server at capacity", then immediately close it
4. Log: `"rejected connection: at capacity (<N>/<MAX>)"`
5. When a client disconnects and the count drops below the limit, resume accepting normally

## Hints

- Track the count with a simple integer, increment on accept, decrement on close
- You still need to call `accept()` even when full — otherwise the connection sits in the kernel backlog
- Send the error message with a simple `write()` (not framed) — the client might not speak your framing protocol
- Or send a framed error message if you prefer consistency

## Verify

```bash
# Start server with max 3 clients
./echo_server --max-clients 3

# Connect 4 nc sessions
nc localhost 9000 &
nc localhost 9000 &
nc localhost 9000 &
nc localhost 9000    # this one should be rejected
```

Expected: first 3 clients connect normally, 4th receives "server at capacity" and gets disconnected.

## Done When

The server enforces the connection limit, rejects excess clients with a clear message, and resumes accepting when clients disconnect.
