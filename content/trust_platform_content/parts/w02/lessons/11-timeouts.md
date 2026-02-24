---
id: w02-l11
title: "Timeouts — disconnect idle clients"
order: 11
duration_minutes: 20
xp: 50
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste server log showing an idle client being disconnected after the timeout expires."
  regex_patterns:
    - "timeout|idle|disconnect"
---
# Timeouts — disconnect idle clients

## Concept

A client connects and then does nothing. Maybe the user walked away, maybe the process crashed but the TCP connection is still open. Your server wastes a slot in the pollfd array on this zombie connection.

The fix: track when each client last sent data. After every poll loop, check all clients. If any client has been idle for more than N seconds, disconnect them.

```cpp
struct ClientState {
    int fd;
    time_t last_active;  // updated on every successful recv
};
```

After each poll loop:
```cpp
time_t now = time(nullptr);
for (auto& client : clients) {
    if (now - client.last_active > TIMEOUT_SECONDS) {
        // close and remove
    }
}
```

A common timeout is 30-60 seconds. For testing, use 5 seconds so you do not wait forever.

This is your first example of a principle that comes up everywhere in distributed systems: **do not trust the other side to behave correctly**. The client might never send data, might send garbage, or might send data incredibly slowly. Your server must handle all of these.

## Task

1. Add a `last_active` timestamp to your per-client state
2. Update it every time you successfully receive data from a client
3. After each poll loop, scan all clients and disconnect any that have been idle for more than `IDLE_TIMEOUT` seconds
4. Make `IDLE_TIMEOUT` configurable via command line (default 30, use 5 for testing)
5. Log the disconnection: `"client <fd> timed out after <N>s"`

## Hints

- `time(nullptr)` returns current time in seconds (good enough for timeout tracking)
- Compare with `>` not `>=` to avoid disconnecting clients exactly at the boundary
- When disconnecting, close the fd AND remove from the pollfd vector
- Iterate backwards when removing to avoid index shifts

## Verify

```bash
# Start server with 5s timeout
./echo_server --timeout 5

# Connect with nc, do nothing, wait 6 seconds
nc localhost 9000
# (wait 6 seconds without typing)
```

Expected: server prints "client timed out after 5s" and nc connection closes.

## Done When

Idle clients are automatically disconnected after the timeout, and the server reclaims their slot.
