---
id: w02-l04
title: "Partial reads — TCP gives you chunks"
order: 4
duration_minutes: 25
xp: 50
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste your read_exact() function and a test showing it correctly assembles a full message from multiple small reads."
  regex_patterns:
    - "read_exact|read_all|read_n"
---
# Partial reads — TCP gives you chunks

## Concept

When you call `read(fd, buf, 100)`, you ask for 100 bytes. But TCP might give you only 37 bytes. This is NOT an error — TCP is a byte stream. The OS delivers whatever has arrived from the network so far.

If you are expecting a 100-byte message and `read()` returns 37, you must call `read()` again to get the remaining 63 bytes. And the second read might give you only 20. And the third gives you 43. Eventually you have all 100.

In C, you write a loop:
```c
size_t total = 0;
while (total < expected) {
    ssize_t n = read(fd, buf + total, expected - total);
    if (n <= 0) break;  // error or disconnect
    total += n;
}
```

This pattern is so common it deserves its own function. Call it `read_exact()` — it reads exactly N bytes, calling `read()` as many times as needed.

Most networking bugs come from ignoring partial reads. The code works in testing (where messages are small and arrive in one piece) but breaks in production (where large messages arrive in chunks). Always use `read_exact()`.

## Task

1. Write a function `ssize_t read_exact(int fd, void* buf, size_t count)` that:
   - Loops calling `read()` until exactly `count` bytes are received
   - Returns `count` on success
   - Returns 0 if the client disconnects mid-read
   - Returns -1 on error
2. Write a test that:
   - Creates a socketpair (two connected sockets for local testing)
   - Sends 1000 bytes in 10-byte chunks from one end
   - Calls `read_exact(other_end, buf, 1000)` on the other end
   - Asserts all 1000 bytes match

## Hints

- `#include <sys/socket.h>` for `socketpair()`
- `socketpair(AF_UNIX, SOCK_STREAM, 0, fds)` creates two connected sockets in `int fds[2]`
- Use `fds[0]` as the "server" end and `fds[1]` as the "client" end
- For the test: fork a child process, have the child send small chunks with `usleep(1000)` between them, have the parent call `read_exact()`
- Or use threads: `#include <thread>` and `std::thread`

## Verify

```bash
g++ -std=c++17 -o test_partial test_partial.cpp -lpthread
./test_partial
echo "exit code: $?"
```

Expected: exit code 0, all assertions pass. The 1000 bytes arrive correctly despite being sent in 10-byte pieces.

## Done When

`read_exact()` correctly assembles a full message from multiple partial reads.
