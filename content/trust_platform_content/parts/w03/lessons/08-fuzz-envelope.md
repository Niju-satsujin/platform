---
id: w03-l08
title: "Fuzz the envelope parser"
order: 8
duration_minutes: 25
xp: 75
kind: lesson
part: w03
proof:
  type: paste
  instructions: "Paste output of the fuzz test showing N iterations with 0 crashes."
  regex_patterns:
    - "fuzz|random"
    - "0 crash|no crash"
---
# Fuzz the envelope parser

## Concept

Fuzz testing means throwing random data at your code and checking if it crashes. It is the most effective way to find parsing bugs.

The idea is simple: generate random byte arrays of various sizes (0 bytes, 1 byte, 21 bytes, 22 bytes, 100 bytes, 100000 bytes), pass each one to your `deserialize()` function, and verify it either returns a valid Envelope or returns `std::nullopt`. It should NEVER crash, NEVER access memory out of bounds, NEVER hang.

You do not check if the parsed values make sense — you just check for crashes. If `deserialize()` returns an Envelope with version=255 and msg_type=200, that is fine for the fuzz test. Your application code rejects those values later.

Run at least 100,000 iterations. With random data, most will fail to parse (nullopt). A few might accidentally have valid headers. That is fine — the point is that none of them crash.

## Task

1. Write a fuzz test that:
   - Generates random byte arrays of sizes: 0, 1, 10, 21, 22, 23, 100, 1000, 100000
   - For each size, generates 10,000 random arrays
   - Calls `deserialize()` on each one
   - Counts: valid parses, invalid parses (nullopt), crashes (should be 0)
2. Also fuzz with specific patterns:
   - All zeros
   - All 0xFF bytes
   - Valid header + truncated payload
   - Valid header + oversized payload_len

## Hints

- `std::mt19937 rng(42);` — fixed seed for reproducibility
- `std::uniform_int_distribution<uint8_t> dist(0, 255);`
- Fill buffer: `for (auto& b : buf) b = dist(rng);`
- Run with AddressSanitizer to catch memory bugs: `g++ -fsanitize=address -g ...`
- AddressSanitizer will abort immediately on any out-of-bounds access — that is what you want

## Verify

```bash
g++ -std=c++17 -fsanitize=address -g -o fuzz_envelope fuzz_envelope.cpp
./fuzz_envelope
echo "exit code: $?"
```

Expected: prints "100000 iterations, 0 crashes" and exits 0. No AddressSanitizer errors.

## Done When

100,000+ random inputs produce zero crashes and zero sanitizer errors.
