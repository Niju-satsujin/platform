---
id: w03-l02
title: "Serialize the envelope to bytes"
order: 2
duration_minutes: 25
xp: 50
kind: lesson
part: w03
proof:
  type: paste
  instructions: "Paste a hex dump of a serialized envelope showing the 22-byte header followed by payload bytes."
  regex_patterns:
    - "serialize|encode"
    - "22 bytes|header"
---
# Serialize the envelope to bytes

## Concept

To send an Envelope over TCP, you need to convert it to a flat byte array. This is called **serialization** — turning a struct into bytes.

The format is simple: write each header field in order, in network byte order (big-endian), then append the payload.

```
[version: 1 byte][msg_type: 1 byte][request_id: 8 bytes BE][timestamp: 8 bytes BE][payload_len: 4 bytes BE][payload: N bytes]
```

For multi-byte fields (request_id, timestamp, payload_len), you must convert to big-endian before writing. Single-byte fields (version, msg_type) have no byte-order issue.

In C, you would use `memcpy()` to place each field at the right offset. In C++, same approach — or you can write to a `std::vector<uint8_t>` by pushing bytes.

For 64-bit values, there is no standard `htonll()`. You can write your own, or use the `htobe64()` function available on Linux (`#include <endian.h>`).

## Task

1. Write `std::vector<uint8_t> serialize(const Envelope& env)` that:
   - Creates a vector of size HEADER_SIZE + payload_len
   - Writes version at offset 0
   - Writes msg_type at offset 1
   - Writes request_id in big-endian at offset 2
   - Writes timestamp in big-endian at offset 10
   - Writes payload_len in big-endian at offset 18
   - Copies payload bytes starting at offset 22
2. Write a test: create an envelope, serialize it, check the total size is 22 + payload.size()
3. Print a hex dump of the first 30 bytes for debugging

## Hints

- For 64-bit big-endian: `uint64_t be = htobe64(value);` or write your own byte-swap
- `memcpy(buf + offset, &be, 8);` copies the bytes into the buffer
- For 32-bit: `uint32_t be = htonl(value);`
- Hex dump: `printf("%02x ", buf[i]);`
- `#include <cstring>` for `memcpy`
- `#include <endian.h>` for `htobe64` (Linux) or write: `uint64_t swap64(uint64_t v) { return htobe64(v); }`

## Verify

```bash
g++ -std=c++17 -o test_serialize test_serialize.cpp
./test_serialize
```

Expected: hex dump shows version byte, msg_type byte, then 8+8+4 bytes of header, then payload.

## Done When

`serialize()` produces the correct byte layout and a round-trip test (serialize then check bytes) passes.
