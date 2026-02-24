---
id: w02-l06
title: "Write a TCP client"
order: 6
duration_minutes: 25
xp: 50
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste: (1) client sending a message and receiving the echo, (2) output showing the round-trip worked."
  regex_patterns:
    - "connect|sent|received"
---
# Write a TCP client

## Concept

So far you have been testing your server with `nc`. Now you write your own client program. A client has fewer steps than a server:

1. `socket()` — create the fd (same as server)
2. `connect()` — connect to the server at a specific IP and port
3. `write()` / `read()` — send and receive data
4. `close()` — disconnect

No `bind()`, no `listen()`, no `accept()`. The client initiates; the server waits.

`connect()` takes a `sockaddr_in` structure with the server's IP and port. For localhost testing, the IP is `127.0.0.1` (the loopback address — it talks to your own machine).

`inet_pton()` converts an IP address string like "127.0.0.1" to the binary format that `sockaddr_in` expects. The "pton" stands for "presentation to network."

## Task

1. Write a client program that:
   - Takes `--host` and `--port` arguments (default: 127.0.0.1:9000)
   - Creates a socket and connects to the server
   - Sends a message from the command line: `./client send "hello"`
   - Reads the echo back using `read_exact()`
   - Prints the echoed message to stdout
   - Closes the connection
2. Test it against your echo server

## Hints

- `struct sockaddr_in srv{}; srv.sin_family = AF_INET; srv.sin_port = htons(port);`
- `inet_pton(AF_INET, "127.0.0.1", &srv.sin_addr);`
- `connect(fd, (struct sockaddr*)&srv, sizeof(srv))`
- `connect()` returns -1 on failure — print the error and exit 1
- You know the message length (you sent it), so use `read_exact(fd, buf, message_length)` to read the echo

## Verify

```bash
# Terminal 1
./echo_server

# Terminal 2
./client send "hello from client"
```

Expected: client prints the echoed message "hello from client".

## Done When

Your client program connects, sends a message, receives the echo, and prints it correctly.
