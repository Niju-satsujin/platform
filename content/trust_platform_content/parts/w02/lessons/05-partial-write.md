---
id: w02-l05
title: "Partial writes — the send buffer can be full"
order: 5
duration_minutes: 20
xp: 50
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste your write_exact() function and a test showing it handles partial writes correctly."
  regex_patterns:
    - "write_exact|write_all|send_all"
---
# Partial writes — the send buffer can be full

## Concept

Just like `read()` can return fewer bytes than you asked for, `write()` can also write fewer bytes than you requested. This happens when the OS send buffer is full — the network cannot keep up with how fast you are writing.

If you call `write(fd, buf, 1000)` and it returns 600, then 600 bytes were sent and 400 are still waiting. You must call `write()` again with the remaining 400 bytes.

The fix is the same pattern as `read_exact()`: loop until all bytes are written.

```cpp
ssize_t write_exact(int fd, const void* buf, size_t count) {
    size_t total = 0;
    while (total < count) {
        ssize_t n = write(fd, (const char*)buf + total, count - total);
        if (n <= 0) return n;  // error
        total += n;
    }
    return total;
}
```

Partial writes are rare in testing (small messages, fast local network) but common in production. If you skip this, your server will silently lose data under load.

## Task

1. Write `ssize_t write_exact(int fd, const void* buf, size_t count)` — same loop pattern as read_exact
2. Update your echo server to use `write_exact()` instead of bare `write()`
3. Write a test using socketpair that sends a large message (1MB) and verifies all bytes arrive

## Hints

- Cast to `const char*` for pointer arithmetic: `(const char*)buf + total`
- For the large-message test: create a 1MB buffer filled with a known pattern (e.g., repeating 0-255)
- Send it all at once with `write_exact()`, receive with `read_exact()`, compare
- `write()` returns -1 on error — check `errno` for the specific error

## Verify

```bash
g++ -std=c++17 -o test_write_exact test_write_exact.cpp -lpthread
./test_write_exact
echo "exit code: $?"
```

Expected: exit code 0. A 1MB message survives the round trip with zero corruption.

## Done When

`write_exact()` handles partial writes and your large-message test passes.
