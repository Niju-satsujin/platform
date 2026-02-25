---
id: w06-l09
title: "Week 6 benchmark — signing and verification throughput"
order: 9
duration_minutes: 25
xp: 50
kind: lesson
part: w06
proof:
  type: paste
  instructions: "Paste benchmark results showing: (1) Ed25519 sign operations per second, (2) Ed25519 verify operations per second, (3) comparison of envelope throughput with and without signature verification."
  regex_patterns:
    - "sign.*sec|ops/s|throughput"
    - "verify.*sec|ops/s"
    - "[0-9]+"
---
# Week 6 benchmark — signing and verification throughput

## Concept

Signatures are not free. Every message now requires a `crypto_sign_detached` on the sender side and a `crypto_sign_verify_detached` on the server side. How much does this cost?

Ed25519 is designed to be fast, but "fast" is relative. If your server processes 50,000 messages per second without signatures, and signing adds 50 microseconds per message, you just dropped to 20,000 messages per second. You need to measure this to know where you stand.

Three things to benchmark:

1. **Raw signing throughput** — how many signatures per second can you produce? This is the ceiling for your client.
2. **Raw verification throughput** — how many verifications per second? This is the ceiling for your server.
3. **End-to-end envelope throughput** — how fast does your server process signed envelopes compared to unsigned ones? This shows the real-world impact.

Ed25519 verification is typically faster than signing. On modern hardware, expect roughly:
- Signing: 50,000-100,000 operations/second
- Verification: 15,000-70,000 operations/second

Your numbers will vary based on hardware. The important thing is to measure and record them.

## Task

1. Write a benchmark program that measures:
   - Ed25519 key generation: operations per second
   - Ed25519 signing (detached, 256-byte message): operations per second
   - Ed25519 verification (detached, 256-byte message): operations per second
2. Run each benchmark for at least 1 second to get stable numbers
3. Test with different message sizes: 64 bytes, 256 bytes, 1 KB, 4 KB
4. Compare: run your server stress test with signature verification enabled vs disabled
5. Record all numbers in a table

## Hints

- Use `std::chrono::high_resolution_clock` for timing
- Pattern: `auto start = now(); for (int i = 0; i < N; i++) { do_op(); } auto elapsed = now() - start;`
- Pick N large enough that elapsed > 1 second
- Ed25519 signing time is constant regardless of message size (the message is hashed internally)
- Verification time is also constant regardless of message size
- The end-to-end difference comes from serialization overhead, not the crypto itself

## Verify

```bash
g++ -std=c++17 -O2 -o bench_sign bench_sign.cpp -lsodium
./bench_sign
```

Expected output format:
```
Ed25519 keygen:    XXXXX ops/sec
Ed25519 sign:      XXXXX ops/sec  (256B message)
Ed25519 verify:    XXXXX ops/sec  (256B message)
Envelope (unsigned): XXXXX envelopes/sec
Envelope (signed):   XXXXX envelopes/sec
Signature overhead:  XX%
```

## Done When

You have throughput numbers for signing and verification, and you know the percentage overhead that signatures add to your envelope processing pipeline.
