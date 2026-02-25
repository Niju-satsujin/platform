---
id: w07-l03
title: "Timestamp in the envelope"
order: 3
duration_minutes: 25
xp: 50
kind: lesson
part: w07
proof:
  type: paste
  instructions: "Paste the output of your program that creates a signed envelope with a nonce and timestamp, then verifies it successfully."
  regex_patterns:
    - "timestamp|time"
    - "nonce"
    - "verified|valid|accepted"
---
# Timestamp in the envelope

## Concept

A nonce makes every message unique, but it creates a new problem: you have to remember every nonce you have ever seen. If your system runs for a year, that is millions of nonces stored in memory. You need a way to forget old nonces.

The solution is a timestamp. Include the current time in the envelope, and reject any envelope whose timestamp is too old. Say you set a window of 30 seconds. Any envelope older than 30 seconds is rejected regardless of whether you have seen its nonce before. This means you only need to store nonces from the last 30 seconds — a bounded set that never grows beyond control.

The timestamp goes inside the signed data, not outside. If the timestamp were outside the signature, an attacker could change it to make an old message look new. By signing the timestamp along with the nonce and payload, any modification breaks the signature.

Your new envelope structure:

```
[nonce (16 bytes)] [timestamp (8 bytes, uint64)] [payload (N bytes)]
```

All of these bytes get signed together. The signature covers the nonce, the timestamp, and the payload as one contiguous block.

## Task

1. Update your envelope structure to include a `nonce` field (16 bytes) and a `timestamp` field (uint64, seconds since Unix epoch)
2. When creating an envelope, generate a fresh nonce and capture the current time
3. When signing, concatenate nonce + timestamp + payload into a single buffer, then sign that buffer
4. When verifying, extract the nonce and timestamp, reconstruct the signed buffer, and verify the signature against it
5. Write a test that creates an envelope with nonce + timestamp, signs it, and verifies it

## Hints

- For the current time: `std::chrono::system_clock::now()` then convert to seconds since epoch using `std::chrono::duration_cast<std::chrono::seconds>`
- Store the timestamp as `uint64_t` — 8 bytes, big-endian in the buffer for consistency
- Use `memcpy()` to pack the nonce, timestamp, and payload into a contiguous buffer before signing
- `crypto_sign_detached()` and `crypto_sign_verify_detached()` from libsodium work on arbitrary byte buffers
- Big-endian conversion: shift bytes manually or use a helper (`htobe64` on Linux, or write your own)

## Verify

```bash
cmake --build build
./build/test_envelope_timestamp
```

Expected output:
```
envelope created: nonce=<hex>, timestamp=<epoch_seconds>
signature verification: valid
envelope accepted
```

## Done When

Your signed envelope includes a nonce and timestamp, and the signature covers all three fields (nonce + timestamp + payload).
