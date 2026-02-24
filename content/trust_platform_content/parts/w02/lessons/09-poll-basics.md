---
id: w02-l09
title: "poll() — watch multiple file descriptors"
order: 9
duration_minutes: 30
xp: 75
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste: (1) your poll() setup code, (2) output showing poll wakes up when a client connects."
  regex_patterns:
    - "poll|POLLIN"
---
# poll() — watch multiple file descriptors

## Concept

Your echo server has a problem: it handles one client at a time. While it is stuck in `read()` waiting for client A to send data, client B cannot even connect. This is useless for a real server.

The fix is `poll()`. Instead of blocking on one fd, you give poll a list of fds and it blocks until ANY of them has data ready. Then you handle whichever fd woke up.

```c
struct pollfd fds[2];
fds[0].fd = server_fd;   fds[0].events = POLLIN;  // watch for new connections
fds[1].fd = client_fd;   fds[1].events = POLLIN;  // watch for client data

int ready = poll(fds, 2, timeout_ms);
// now check which fds have data
if (fds[0].revents & POLLIN) { /* new connection */ }
if (fds[1].revents & POLLIN) { /* client sent data */ }
```

`POLLIN` means "there is data to read." You set it in `.events` (what you want to watch) and check it in `.revents` (what actually happened).

The key insight: poll does NOT read or write anything. It only tells you WHICH fds are ready. You still call `accept()`, `read()`, `write()` yourself. Poll just prevents you from blocking on the wrong fd.

## Task

1. Rewrite your echo server to use `poll()` instead of blocking on accept/read
2. Create a `struct pollfd` array — start with just the server fd
3. Call `poll()` with a timeout of 1000ms (1 second)
4. If the server fd has POLLIN, call `accept()` to get a new client
5. For now, only handle one client with poll — multi-client comes next lesson
6. Print "poll returned: N ready" after each poll call (for debugging)

## Hints

- `#include <poll.h>` for `poll()` and `struct pollfd`
- `poll(fds, nfds, timeout_ms)` — returns number of ready fds, 0 on timeout, -1 on error
- `timeout_ms = -1` means block forever, `0` means return immediately
- Use `timeout_ms = 1000` so the server checks for signals periodically
- The server fd becomes ready when a client is waiting to connect

## Verify

```bash
# Terminal 1
./echo_server

# Terminal 2
nc localhost 9000
# type text, see it echoed
```

Expected: same behavior as before, but now using poll. The "poll returned" debug messages show poll waking up on events.

## Done When

The echo server uses poll() to detect new connections and incoming data, instead of blocking directly on accept/read.
