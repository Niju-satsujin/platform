---
id: w05-l01
title: "What is hashing?"
order: 1
duration_minutes: 20
xp: 50
kind: lesson
part: w05
proof:
  type: paste
  instructions: "Paste your program output showing two different inputs producing two different 64-character hex digests, and two identical inputs producing the same digest."
  regex_patterns:
    - "[a-f0-9]{64}"
    - "match|same|equal|identical"
---
# What is hashing?

## Concept

Imagine you have a 10 GB file. You send it to a friend. How does your friend know the file arrived without a single byte changed? They could send the whole file back for comparison, but that defeats the purpose.

Instead, you run the file through a **hash function**. It reads every byte and produces a short, fixed-size output called a **digest** — always the same length no matter how big the input is. For SHA-256, the digest is always 32 bytes (64 hex characters).

Three properties make this useful:

1. **Deterministic** — the same input always produces the same digest. Run it a million times, same answer.
2. **Avalanche effect** — change one bit of input and the digest changes completely. Not one character — the whole thing looks different.
3. **One-way** — given a digest, you cannot work backward to find the input. There is no "un-hash" function.

In C, you have probably used simple hash functions for hash tables — something like `hash = hash * 31 + c`. Cryptographic hash functions are much stronger. You cannot predict the output, you cannot find two different inputs that produce the same output (collision resistance), and you cannot reverse the process.

SHA-256 is the specific algorithm you will use. The "256" means the output is 256 bits (32 bytes). It is part of the SHA-2 family, widely trusted, and the default recommendation in libsodium.

You do not need to understand the math inside SHA-256. You need to understand what it guarantees: same input = same output, different input = different output, and you cannot go backward.

## Task

1. Write a C++ program that takes two strings as command-line arguments
2. Compute the SHA-256 hash of each string (use any method for now — even a placeholder print is fine if libsodium is not installed yet)
3. Print each hash as a 64-character hex string
4. Compare the two hashes and print whether they match or not
5. Test with identical strings (should match) and different strings (should not match)

## Hints

- If libsodium is not installed yet, you can use a placeholder or the `std::hash` function just to get the structure working — you will replace it with the real thing in lesson 3
- To print bytes as hex: `printf("%02x", byte)` for each byte in the digest
- `argc` and `argv` work the same in C++ as in C
- Focus on the structure: read input, compute hash, print hex, compare

## Verify

```bash
g++ -std=c++17 -o hash_demo hash_demo.cpp
./hash_demo "hello" "hello"
./hash_demo "hello" "Hello"
```

Expected: first run shows two identical hex strings and prints "match". Second run shows two completely different hex strings and prints "no match".

## Done When

Your program prints hex digests for two inputs and correctly reports whether they match.
