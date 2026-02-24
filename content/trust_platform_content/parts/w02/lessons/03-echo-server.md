---
id: w02-l03
title: "Echo server — read and write back"
order: 3
duration_minutes: 25
xp: 50
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste: (1) nc session showing you type text and the server echoes it back, (2) server output showing bytes read/written."
  regex_patterns:
    - "echo|read|write"
    - "bytes"
---
# Echo server — read and write back

## Concept

An echo server is the "hello world" of networking. It reads whatever the client sends and writes the same bytes back. It is simple, but it teaches you the core loop that every TCP server uses.

After `accept()` gives you a client fd, the loop is:

```
while true:
    n = read(client_fd, buffer, buffer_size)
    if n <= 0: break  // client disconnected or error
    write(client_fd, buffer, n)
```

`read()` returns the number of bytes it actually read. It might be less than `buffer_size` — that is normal. TCP is a byte stream, not a message stream. The OS gives you whatever has arrived so far.

`write()` also might not write all the bytes in one call — we will handle that in the next lesson. For now, assume `write()` sends everything (it usually does for small messages).

When `read()` returns 0, the client has closed their end of the connection. When it returns -1, something went wrong. In both cases, close the client fd and move on.

## Task

1. Extend your server: after accepting a client, enter a read-write loop
2. Use a buffer of 4096 bytes
3. Read from client_fd, write the same bytes back
4. When read returns 0 or -1, close the client fd and print "client disconnected"
5. After the client disconnects, go back to accept() to wait for the next client
6. Test with `nc`: type text, press Enter, see it echoed back

## Hints

- `char buf[4096]; ssize_t n = read(client_fd, buf, sizeof(buf));`
- `write(client_fd, buf, n);`
- `ssize_t` is the return type — signed size. Negative means error.
- The outer loop: `while (true) { int cfd = accept(...); ... inner loop ... close(cfd); }`
- This handles one client at a time — the server blocks on accept while no client is connected, and blocks on read while waiting for data

## Verify

```bash
# Terminal 1
./echo_server

# Terminal 2
nc localhost 9000
hello
world
^C
```

Expected: each line you type in nc appears echoed back. When you press Ctrl+C in nc, the server prints "client disconnected" and waits for the next client.

## Done When

The echo server correctly echoes arbitrary text from nc and handles client disconnect without crashing.
