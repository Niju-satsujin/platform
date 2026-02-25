---
id: w03-l03
title: "Deserialize bytes back to an envelope"
order: 3
duration_minutes: 25
xp: 50
kind: lesson
part: w03
proof:
  type: paste
  instructions: "Paste a round-trip test: create envelope, serialize, deserialize, assert all fields match."
  regex_patterns:
    - "deserialize|decode|parse"
    - "assert|match"
---
# Deserialize bytes back to an envelope

## Concept

Deserialization is the reverse: take a byte array and reconstruct the Envelope struct. Read each field from the correct offset, convert from big-endian back to host byte order.

The critical part: **validation**. Before reading field values, check that you have enough bytes. If someone sends you 10 bytes and you try to read a 22-byte header, that is a buffer overread — a security vulnerability in C/C++.

Always check sizes first:
1. Do you have at least 22 bytes? (header size) — if not, reject
2. Read payload_len from the header — is it reasonable? (not larger than your max message size) — if not, reject
3. Do you have exactly 22 + payload_len bytes? — if not, reject

Only after all checks pass do you read the actual field values.

## Task

1. Write `std::optional<Envelope> deserialize(const uint8_t* data, size_t len)` that:
   - Returns `std::nullopt` if len < HEADER_SIZE
   - Reads all header fields, converting from big-endian
   - Checks payload_len does not exceed MAX_PAYLOAD (e.g., 1MB)
   - Checks len == HEADER_SIZE + payload_len
   - Copies payload bytes into the Envelope
   - Returns the Envelope on success
2. Write a round-trip test: create Envelope → serialize → deserialize → assert all fields match
3. Write failure tests: too short, payload_len mismatch, payload_len too large

## Hints

- `#include <optional>` for `std::optional`
- `std::nullopt` is the "no value" return
- `be64toh()` converts big-endian 64-bit to host order (opposite of `htobe64`)
- `ntohl()` converts big-endian 32-bit to host order
- For the round-trip test: compare every field with `assert(original.version == parsed.version)` etc.
- For the payload comparison: `assert(original.payload == parsed.payload)` works because vector has `==`

## Verify

```bash
g++ -std=c++17 -o test_roundtrip test_roundtrip.cpp
./test_roundtrip
echo "exit code: $?"
```

Expected: exit code 0, all assertions pass. Envelope survives serialize → deserialize with all fields intact.

## Done When

Round-trip test passes and all three failure cases (too short, mismatch, too large) return std::nullopt.
