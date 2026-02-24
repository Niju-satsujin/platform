---
id: w02-l07
title: "Length-prefix framing — know where messages end"
order: 7
duration_minutes: 30
xp: 75
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste: (1) your frame format diagram showing [4-byte length][payload], (2) a hex dump or debug output showing the length prefix before a message."
  regex_patterns:
    - "length|frame|header"
    - "4 byte|uint32|htonl"
---
# Length-prefix framing — know where messages end

## Concept

TCP is a byte stream — it has no concept of "messages." If you send "hello" and then "world", the receiver might get "helloworld" in one read, or "hel" and "loworld" in two reads. TCP does not preserve message boundaries.

You need a way to tell the receiver where one message ends and the next begins. This is called **framing**. The simplest framing protocol is **length-prefix**:

```
[4-byte length (big-endian)] [payload bytes]
```

The sender writes a 4-byte integer (the payload length) followed by the payload. The receiver reads 4 bytes, interprets them as a length, then reads exactly that many more bytes. Now both sides agree on message boundaries.

Why big-endian? Network protocols use big-endian byte order by convention (called "network byte order"). `htonl()` converts a host integer to network order, `ntohl()` converts back. You already saw `htons()` for port numbers — same idea for 4-byte values.

Example: sending "hello" (5 bytes):
```
Bytes on wire: 00 00 00 05 68 65 6C 6C 6F
               ^^^^^^^^^^^ ^^^^^^^^^^^^^^^^
               length = 5   payload = "hello"
```

## Task

1. Write `bool send_frame(int fd, const void* data, uint32_t len)` that:
   - Converts `len` to network byte order with `htonl()`
   - Calls `write_exact()` to send the 4-byte header
   - Calls `write_exact()` to send the payload
   - Returns false on any write error
2. Write `ssize_t recv_frame(int fd, void* buf, uint32_t max_len)` that:
   - Calls `read_exact()` to read 4 bytes (the length header)
   - Converts to host byte order with `ntohl()`
   - Validates: if length > max_len, return -1 (message too large)
   - Calls `read_exact()` to read exactly `length` payload bytes
   - Returns the payload length on success
3. Test with socketpair: send 10 frames, receive 10 frames, verify each matches

## Hints

- `#include <arpa/inet.h>` for `htonl()`, `ntohl()`
- `uint32_t net_len = htonl(len); write_exact(fd, &net_len, 4);`
- `uint32_t net_len; read_exact(fd, &net_len, 4); uint32_t len = ntohl(net_len);`
- Max payload: use 1MB (1048576) as a reasonable limit
- This is the most important function pair you will write this week — every future protocol message uses this framing

## Verify

```bash
g++ -std=c++17 -o test_framing test_framing.cpp -lpthread
./test_framing
echo "exit code: $?"
```

Expected: 10 frames sent and received correctly, all payloads match, exit code 0.

## Done When

send_frame/recv_frame correctly handle length-prefix framing and the multi-frame test passes.
