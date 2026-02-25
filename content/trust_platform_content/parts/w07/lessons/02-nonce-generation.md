---
id: w07-l02
title: "Nonce generation"
order: 2
duration_minutes: 20
xp: 50
kind: lesson
part: w07
proof:
  type: paste
  instructions: "Paste the output of your program that generates and prints 5 unique nonces as hex strings, each 32 hex characters long."
  regex_patterns:
    - "[0-9a-fA-F]{32}"
    - "nonce"
---
# Nonce generation

## Concept

A nonce is a "number used once." The idea is simple: before you sign a message, you generate a random value and include it in the data you sign. Since the random value is different every time, no two signed envelopes will ever be identical — even if the payload is the same.

The attacker can still capture and resend your envelope, but now the receiver can check: "Have I seen this nonce before?" If yes, reject it. If no, accept it and remember the nonce.

For nonces to work, they need to be unique. The easiest way to guarantee uniqueness is to make them random and long enough that collisions are effectively impossible. Sixteen random bytes give you 2^128 possible values. The chance of a collision is so small it will not happen before the heat death of the universe.

Libsodium provides `randombytes_buf()` which fills a buffer with cryptographically secure random bytes. This is the right function to use — do not use `rand()` or `std::rand()`, which are predictable and not suitable for security.

## Task

1. Write a function `generate_nonce()` that returns a 16-byte nonce (use a `std::array<uint8_t, 16>` or `std::vector<uint8_t>`)
2. Inside the function, call `randombytes_buf()` to fill the buffer with 16 random bytes
3. Write a helper function `nonce_to_hex()` that converts a nonce to a 32-character hex string for printing
4. Write a test program that generates 5 nonces, prints each as hex, and verifies all 5 are different from each other
5. Make sure `sodium_init()` is called before generating any nonces

## Hints

- `#include <sodium.h>` for `randombytes_buf()` and `sodium_init()`
- `randombytes_buf(buffer.data(), buffer.size())` fills the buffer in place
- For hex conversion, libsodium has `sodium_bin2hex()` — or write your own with `snprintf` and `%02x`
- To check uniqueness, compare each nonce against all previously generated ones
- 16 bytes = 128 bits = 32 hex characters

## Verify

```bash
cmake --build build
./build/test_nonce_gen
```

Expected output (hex values will differ each run):
```
nonce 1: a3f7c2e91b0d4a58e6f2c8d1b3a7e5f0
nonce 2: 7d1e3f9a2c4b6d8e0f1a3c5e7b9d2f4a
nonce 3: 5b8e2d4f6a1c3e7b9d0f2a4c6e8b1d3f
nonce 4: 1f3a5c7e9b2d4f6a8c0e2b4d6f8a1c3e
nonce 5: 9c2e4f1a3b5d7e8f0a2c4e6b8d1f3a5c
all nonces unique: yes
```

## Done When

Your program generates 5 random 16-byte nonces, prints them as hex, and confirms all 5 are unique.
