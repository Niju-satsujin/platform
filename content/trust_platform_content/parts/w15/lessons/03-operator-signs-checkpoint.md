---
id: w15-l03
title: "Operator signs a checkpoint"
order: 3
duration_minutes: 25
xp: 75
kind: lesson
part: w15
proof:
  type: paste
  instructions: "Paste the output showing a signed checkpoint with log_size, root_hash (hex), timestamp, and signature (hex)."
  regex_patterns:
    - "log.?size|entries"
    - "root.?hash"
    - "signature|sig"
---
# Operator signs a checkpoint

## Concept

Your log now has a Merkle root hash that summarizes every entry. But who says that root hash is correct? Right now, only the log operator knows the root hash, and you have to trust them. If the operator is dishonest, they could give you a fake root hash that does not match the real log contents.

A checkpoint solves this. A checkpoint is a signed statement by the log operator that says: "At this point in time, the log has N entries and the root hash is H." The operator signs this statement with their Ed25519 private key — the same kind of key you built in Week 6. Now the statement is bound to the operator's identity. They cannot deny it later, because only they have the private key that produced the signature.

Think of it like a notarized document. The operator stamps the log state with their signature. Anyone who has the operator's public key can verify the signature and confirm the operator really did commit to that log state. If the operator later tries to change the log (modify an old entry, for example), the checkpoint signature will not match the new root hash, and the tampering is exposed.

The checkpoint itself is small — just a log size (integer), a root hash (32 bytes), a timestamp, and a signature (64 bytes). It can be published, shared, stored by auditors, or embedded in other systems. It is the operator's promise that the log is correct.

## Task

1. Define a `SignedCheckpoint` struct containing: `uint64_t log_size`, `std::array<uint8_t, 32> root_hash`, `uint64_t timestamp` (Unix seconds), `std::array<uint8_t, 64> signature`
2. Implement a method on `TransparencyLog`: `SignedCheckpoint sign_checkpoint(const Ed25519SecretKey& sk) const`
3. The method serializes the checkpoint body (log_size + root_hash + timestamp) into a byte buffer, signs it with Ed25519, and stores the signature in the struct
4. Use a deterministic serialization: 8 bytes little-endian for log_size, then 32 bytes of root_hash, then 8 bytes little-endian for timestamp
5. Use your Ed25519 signing function from Week 6 (or a library like libsodium `crypto_sign_detached`)
6. Write a test that appends entries, signs a checkpoint, and prints all fields in hex

## Hints

- For the timestamp, use `std::chrono::system_clock::now()` and convert to seconds since epoch
- Little-endian serialization of a `uint64_t`: write bytes 0-7 from least significant to most significant. You can use `memcpy` into a `uint8_t[8]` buffer — on little-endian machines (x86) this just works
- The serialized checkpoint body should be exactly 48 bytes: 8 (log_size) + 32 (root_hash) + 8 (timestamp)
- If you are using libsodium: `crypto_sign_detached(sig, nullptr, message, message_len, secret_key)`
- Print the root hash and signature as hex strings for readability. A helper like `to_hex()` is useful
- Keep the `SignedCheckpoint` struct simple — it is just data, no methods needed

## Verify

```bash
cmake --build build
./build/test_sign_checkpoint
```

Expected output:
```
Appended 10 entries
Checkpoint:
  log_size:  10
  root_hash: a1b2c3...  (64 hex chars)
  timestamp: 1737849600
  signature: d4e5f6...  (128 hex chars)
```

## Done When

Your log operator can sign a checkpoint that contains the log size, root hash, timestamp, and a valid Ed25519 signature over the serialized checkpoint body.
