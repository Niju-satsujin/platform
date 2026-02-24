---
id: w02-l10
title: "poll() with multiple clients"
order: 10
duration_minutes: 30
xp: 75
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste: (1) server log showing 3 clients connected simultaneously, (2) each client sending and receiving data independently."
  regex_patterns:
    - "client.*connect|accept"
    - "3 client|clients: 3"
---
# poll() with multiple clients

## Concept

Now you extend poll to handle many clients at once. The pollfd array grows dynamically: start with just the server fd, and add a new entry every time accept() returns a client fd.

The data structure:

```
fds[0] = server_fd   (always present, watching for new connections)
fds[1] = client_1    (added when client 1 connects)
fds[2] = client_2    (added when client 2 connects)
...
```

The main loop:
1. Call `poll(fds, count, timeout)`
2. If `fds[0]` (server) has POLLIN → accept new client, add to array
3. For each client fd with POLLIN → recv_frame, send_frame (echo)
4. If recv_frame returns 0 → client disconnected, remove from array

When removing a client from the middle of the array, swap it with the last element and decrement the count. This avoids shifting the entire array.

In C, you would use a plain array with a count variable. In C++, you can use `std::vector<struct pollfd>` — it handles the resizing automatically.

## Task

1. Change your pollfd storage from a fixed array to `std::vector<struct pollfd>`
2. Server fd is always at index 0
3. When accept succeeds, push_back a new pollfd entry for the client
4. When a client disconnects, remove its entry from the vector (swap with last + pop_back)
5. Track active client count, print it when it changes
6. Test with 3 nc sessions simultaneously

## Hints

- `std::vector<struct pollfd> fds; fds.push_back({server_fd, POLLIN, 0});`
- To add client: `fds.push_back({client_fd, POLLIN, 0});`
- To remove client at index i: `fds[i] = fds.back(); fds.pop_back();`
- When iterating, go backwards to avoid index confusion after removal
- Keep a separate `std::vector<ClientState>` if you need per-client state (like partial frame buffers)

## Verify

```bash
# Terminal 1
./echo_server

# Terminals 2, 3, 4
nc localhost 9000
```

Expected: all 3 clients can send text and receive echoes independently. Server log shows client count going up and down.

## Done When

3 simultaneous clients can echo independently, and disconnecting one does not affect the others.
