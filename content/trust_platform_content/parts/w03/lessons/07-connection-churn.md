---
id: w03-l07
title: "Connection churn — rapid connect/disconnect"
order: 7
duration_minutes: 20
xp: 50
kind: lesson
part: w03
proof:
  type: paste
  instructions: "Paste test output showing 1000 rapid connect/disconnect cycles with no server crashes or fd leaks."
  regex_patterns:
    - "1000.*cycle|churn"
    - "0 leak|no leak"
---
# Connection churn — rapid connect/disconnect

## Concept

Connection churn means clients connecting and immediately disconnecting — hundreds of times per second. This happens in production when load balancers health-check your server, when clients crash and reconnect, or when a misconfigured client retries in a tight loop.

Churn tests two things:

1. **File descriptor leaks** — every `accept()` returns a new fd. If you forget to `close()` it when the client disconnects, you leak fds. After a few thousand leaks, the OS refuses to create new sockets (`errno = EMFILE`).

2. **State cleanup** — when a client disconnects, you must remove it from your pollfd vector AND clean up any per-client state. If you forget, the stale state accumulates and wastes memory.

The test: a client program that connects, maybe sends one byte, then immediately disconnects. Do this 1000 times. The server should handle all 1000 cycles with no leaks.

You can check for fd leaks by counting open fds: `ls /proc/<pid>/fd | wc -l`. This number should stay constant before and after the test.

## Task

1. Write a churn test that:
   - Connects to the server 1000 times in a tight loop
   - Each connection: connect, optionally send 1 byte, disconnect
   - Runs in 2-3 seconds total
2. Check the server's fd count before and after: `ls /proc/$(pgrep server)/fd | wc -l`
3. Assert the fd count is the same (no leaks)
4. Check the server's memory usage is stable (not growing)

## Hints

- `connect()` + `close()` in a loop — no need for threads
- Add a small `usleep(100)` between connections if you get "connection refused" (server accept queue full)
- `/proc/<pid>/fd` lists all open file descriptors for a process
- `pgrep server` gives you the server's PID
- If the fd count grows, you have a leak — check that every `accept()` path has a corresponding `close()`

## Verify

```bash
./server --port 9000 &
SERVER_PID=$!
echo "fds before: $(ls /proc/$SERVER_PID/fd | wc -l)"
./churn_test --port 9000 --cycles 1000
echo "fds after: $(ls /proc/$SERVER_PID/fd | wc -l)"
kill $SERVER_PID
```

Expected: fd count before and after is the same (within ±1).

## Done When

1000 connect/disconnect cycles cause no fd leaks and no server crashes.
