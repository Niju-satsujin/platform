---
id: w06-l06
title: "Key ID field"
order: 6
duration_minutes: 25
xp: 50
kind: lesson
part: w06
proof:
  type: paste
  instructions: "Paste output showing an envelope with a key_id field, demonstrating that the server can look up the correct public key using the key_id without trying all known keys."
  regex_patterns:
    - "key.id|key_id"
    - "[0-9a-f]{16}"
    - "lookup|found|matched"
---
# Key ID field

## Concept

Your server will eventually know many public keys — one for each registered client. When an envelope arrives, the server needs to verify the signature. But which public key should it use?

One approach: try every known key until one works. This is slow (linear scan) and fragile (what if two keys happen to produce valid-looking results?).

A better approach: the sender includes a **key_id** in the envelope — a short identifier that tells the server which public key to use. The server does a fast lookup instead of a brute-force scan.

The key_id is typically the first 8 bytes of the public key, hex-encoded as 16 characters. This is not a secret — it is derived from the public key, which is already public. It is just a short handle for convenience.

In C terms, think of it like indexing into an array with a hash versus scanning the entire array. Same result, much faster.

Why 8 bytes? Collision probability. With 8 bytes (64 bits), you need about 2^32 (4 billion) keys before you have a 50% chance of a collision. For any realistic system, this is more than enough.

## Task

1. Write a function `compute_key_id()` that takes a public key (32 bytes) and returns the first 8 bytes as a hex string (16 hex chars)
2. Add a `key_id` field to your envelope struct (8 bytes raw, or 16 chars hex)
3. Update `sign_envelope()` to also set the `key_id` field from the signer's public key
4. Update serialization/deserialization to include the `key_id` field
5. Write a test that generates two key pairs, creates envelopes signed by each, and shows that the `key_id` correctly identifies which key signed which envelope
6. Print: `"key_id: <hex> -> lookup: found <name>"`

## Hints

- First 8 bytes of the public key: `memcpy(key_id, pk, 8)` or use `std::array<unsigned char, 8>`
- `sodium_bin2hex()` to convert 8 bytes to 16 hex characters
- Store key_id in the envelope right before the signature in the wire format
- In your key registry (next lesson), map `key_id -> public_key`
- Use `std::unordered_map<std::string, PublicKey>` for the registry, keyed by hex key_id

## Verify

```bash
g++ -std=c++17 -o test_key_id test_key_id.cpp -lsodium
./test_key_id
```

Expected:
- Two different key_ids printed (16 hex chars each)
- Each envelope's key_id matches the signer's public key prefix
- Lookup messages: `"key_id: <hex> -> lookup: found alice"` and `"key_id: <hex> -> lookup: found bob"`

## Done When

The envelope includes a key_id field derived from the signer's public key, and a receiver can use it to look up the correct public key without trying all known keys.
