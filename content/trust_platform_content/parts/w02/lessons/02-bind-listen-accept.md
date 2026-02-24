---
id: w02-l02
title: "bind, listen, accept — the server handshake"
order: 2
duration_minutes: 30
xp: 50
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste: (1) server output showing 'listening on port 9000', (2) output of 'nc localhost 9000' connecting successfully."
  regex_patterns:
    - "listening|accept"
    - "9000"
---
# bind, listen, accept — the server handshake

## Concept

Three calls turn a raw socket into a server:

**bind()** — attaches the socket to a specific port. Without bind, the OS assigns a random port and nobody can find you. You bind to port 9000 so clients know where to connect.

**listen()** — tells the OS "I am ready to receive connections." The second argument is the backlog — how many pending connections the OS queues before refusing new ones. A backlog of 5 is fine for now.

**accept()** — blocks (waits) until a client connects. When a client connects, accept returns a NEW file descriptor for that specific client. The original socket keeps listening for more clients.

Think of it like a restaurant: `bind()` puts the sign on the door, `listen()` opens for business, and `accept()` seats each customer at their own table.

The `sockaddr_in` struct describes the address you bind to. It needs: the address family (AF_INET), the port (converted to network byte order with `htons()`), and the IP address (INADDR_ANY means "listen on all interfaces").

## Task

1. Write a server program that:
   - Creates a socket
   - Sets SO_REUSEADDR (so you can restart without "address already in use" errors)
   - Binds to port 9000
   - Calls listen with backlog 5
   - Prints "listening on port 9000" to stderr
   - Calls accept() once — blocks until a client connects
   - Prints "client connected" to stderr
   - Closes the client fd and the server fd
2. Test it by connecting with `nc` (netcat) from another terminal

## Hints

- `struct sockaddr_in addr{}; addr.sin_family = AF_INET; addr.sin_port = htons(9000); addr.sin_addr.s_addr = INADDR_ANY;`
- `setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt))` where `int opt = 1;`
- `bind(fd, (struct sockaddr*)&addr, sizeof(addr))`
- `int client_fd = accept(fd, nullptr, nullptr);` — nullptr means you don't need the client's address info
- `#include <netinet/in.h>` for `sockaddr_in`, `#include <arpa/inet.h>` for `htons`
- `nc localhost 9000` is a simple TCP client you can use for testing

## Verify

```bash
# Terminal 1
./server

# Terminal 2
nc localhost 9000
```

Expected: Terminal 1 prints "listening on port 9000" then "client connected" when nc connects.

## Done When

The server accepts one client connection and you can see both messages printed.
