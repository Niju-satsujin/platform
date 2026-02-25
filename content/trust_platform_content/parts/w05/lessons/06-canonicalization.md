---
id: w05-l06
title: "Canonicalization — same data, same hash"
order: 6
duration_minutes: 25
xp: 75
kind: lesson
part: w05
proof:
  type: paste
  instructions: "Paste the output of your test showing that an envelope serialized on both big-endian and little-endian byte order (simulated) produces the same hash."
  regex_patterns:
    - "[a-f0-9]{64}"
    - "match|canonical|same|identical"
---
# Canonicalization — same data, same hash

## Concept

Hashing has a trap: two machines might represent the same data differently. A 32-bit integer `256` is stored as `00 00 01 00` on a big-endian machine and `00 01 00 00` on a little-endian machine. If you hash the raw bytes, you get two different hashes for the same logical value. The hash is correct both times — the bytes really are different — but the meaning is the same.

**Canonicalization** means converting data to a single, agreed-upon format before hashing. Everyone follows the same rules, so the same logical data always produces the same bytes, which produces the same hash.

In C, you have used `htonl()` and `htons()` — "host to network long" and "host to network short". These convert integers to big-endian (network byte order), which is the standard convention. Before hashing, convert all multi-byte fields to network byte order.

The rule is simple:

1. **Before hashing**: convert all integers to network byte order using `htonl()` / `htons()`
2. **Hash the converted bytes**
3. **After hashing**: if you need to use the data, convert back with `ntohl()` / `ntohs()`

This matters for your envelope header. The `type`, `version`, and `length` fields are multi-byte integers. If you hash them in host byte order, a big-endian machine and a little-endian machine will compute different hashes for the same envelope. If you canonicalize first, they will always agree.

String payloads do not need byte-order conversion — they are already a sequence of single bytes. But struct padding can also cause problems: always serialize field-by-field, never hash a raw struct with padding holes.

## Task

1. Write a function that serializes your envelope header into a canonical byte buffer (network byte order, no padding)
2. Write each field in order: type, version, length — each converted with `htonl()` or `htons()` as appropriate
3. Hash the canonical buffer (header + payload) and compare with a hash of the same data serialized without canonicalization
4. Write a test that simulates both byte orders by manually reversing the bytes of an integer, showing they produce different hashes without canonicalization but the same hash with canonicalization
5. Print both hashes to confirm they match after canonicalization

## Hints

- `#include <arpa/inet.h>` for `htonl()`, `htons()`, `ntohl()`, `ntohs()` (on Linux)
- Windows: `#include <winsock2.h>` for the same functions
- Serialize field-by-field into a `std::vector<uint8_t>` — do NOT `memcpy` the whole struct (padding!)
- For the test: manually create a buffer with bytes in "wrong" order and show the hash differs
- Then create both buffers using `htonl()` and show they match
- `uint32_t net_val = htonl(host_val);` then `memcpy(buf + offset, &net_val, 4);`

## Verify

```bash
cmake --build build
./build/canon_test
```

Expected output:
```
without canonicalization: hash1=abc123... hash2=def456... MISMATCH
with canonicalization:    hash1=abc123... hash2=abc123... MATCH
```

## Done When

Your test proves that canonicalized serialization produces identical hashes regardless of simulated byte order.
