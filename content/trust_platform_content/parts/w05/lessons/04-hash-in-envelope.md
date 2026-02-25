---
id: w05-l04
title: "Adding a hash field to the envelope"
order: 4
duration_minutes: 25
xp: 75
kind: lesson
part: w05
proof:
  type: paste
  instructions: "Paste the output of your test showing an envelope being serialized with a hash field, deserialized, and the hash verified as matching the payload."
  regex_patterns:
    - "hash.*valid|hash.*match|verified|integrity.*ok"
    - "[a-f0-9]{64}"
---
# Adding a hash field to the envelope

## Concept

In Week 3 you built a binary protocol envelope — a header with fields like message type, payload length, and version, followed by the payload bytes. Now you add one more field: a **SHA-256 hash of the payload**.

When the sender creates an envelope, they hash the payload and store the 32-byte digest in the header. When the receiver gets the envelope, they hash the payload again and compare it to the hash in the header. If they match, the payload arrived intact. If they differ, something went wrong — a network error, a bug, or an attacker modified the data.

This is called **integrity checking**. It does not prevent someone from changing the data (that requires encryption and signatures, which come later). It detects that data was changed. The receiver knows the message is corrupt and can reject it.

In C, you would add a `unsigned char hash[32]` field to your header struct. In C++, you might use `std::array<uint8_t, 32>`. Either way, the hash sits in the header alongside the other fields, serialized in the same byte stream.

The important decision: **what exactly gets hashed?** You hash the payload — just the payload, not the header. The hash itself is part of the header, so you obviously cannot include it in its own computation. Hash the payload, then write the hash into the header, then serialize both.

## Task

1. Extend your envelope header struct to include a 32-byte hash field
2. When serializing an envelope, compute the SHA-256 of the payload and write it into the hash field
3. When deserializing, read the hash from the header and recompute the hash of the received payload
4. Compare the stored hash with the recomputed hash — print whether the integrity check passes or fails
5. Write a test program that creates an envelope, serializes it to a buffer, deserializes it, and verifies the hash

## Hints

- Add `std::array<uint8_t, crypto_hash_sha256_BYTES> payload_hash` to your header struct
- Hash the payload before writing the header: `crypto_hash_sha256(hash.data(), payload.data(), payload.size())`
- Serialize the hash as raw 32 bytes in the header, right after the existing fields
- Use `memcmp()` or `std::equal()` to compare the stored and recomputed hashes
- Update your serialize/deserialize functions to handle the new field
- Keep the existing fields (type, version, length) — just add the hash field

## Verify

```bash
cmake --build build
./build/envelope_hash_test
```

Expected output:
```
envelope created: payload 26 bytes, hash a1b2c3...
envelope deserialized: hash valid
```

## Done When

Your envelope includes a SHA-256 hash of the payload, and the receiver successfully verifies it after deserialization.
