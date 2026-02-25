---
id: w07-l09
title: "Week 7 benchmark — nonce tracking and key operations"
order: 9
duration_minutes: 25
xp: 50
kind: lesson
part: w07
proof:
  type: paste
  instructions: "Paste benchmark output showing: (1) nonce insert/lookup throughput, (2) verify-with-nonce-check throughput vs verify-without-nonce-check, (3) key rotation and revocation operation times."
  regex_patterns:
    - "nonce.*ops/sec|ops/sec.*nonce|lookups?/sec"
    - "verify|verification"
    - "rotat|revoc"
---
# Week 7 benchmark — nonce tracking and key operations

## Concept

You have added two layers on top of signature verification: nonce tracking and key status checks. How much overhead do they add?

The answer should be "almost none." A hash set lookup (nonce check) is O(1). A map lookup (key status check) is O(1). Compared to Ed25519 signature verification, which involves elliptic curve math, these checks are noise.

But measure it anyway. Assumptions are the enemy of performance engineering.

You will benchmark three things:

1. **Nonce tracker throughput** — how many insert + lookup operations per second on your NonceTracker, independent of any crypto. This measures your data structure overhead in isolation.
2. **Full verification overhead** — compare verifying an envelope with nonce/timestamp checks vs. without. The difference is the cost of your replay defense.
3. **Key lifecycle operations** — how fast are rotation and revocation? These are admin operations that happen rarely, but you want to make sure they are not accidentally slow.

## Task

1. Benchmark nonce operations: insert 100,000 nonces, then look up 100,000 nonces (half existing, half new). Report ops/sec for each.
2. Benchmark full verification: verify 10,000 envelopes with nonce + timestamp checks enabled. Then verify 10,000 envelopes with only signature checks (bypass nonce/timestamp). Report ops/sec for each.
3. Benchmark key operations: perform 1,000 key rotations and 1,000 key revocations. Report ops/sec for each.
4. Add a prune benchmark: insert 100,000 nonces, then prune all of them. Report prune time.
5. Print all results in a table.

## Hints

- Use `std::chrono::high_resolution_clock` for timing
- For the nonce benchmark, pre-generate all nonces before starting the timer so you measure lookup speed, not random generation speed
- For the verification benchmark, pre-generate all envelopes and signatures before the timing loop
- Key rotation involves `crypto_sign_keypair()` which is the expensive part — measure it
- Format: `"nonce insert: 5,000,000 ops/sec"`, `"verify with replay defense: 45,000 ops/sec"`, `"verify without: 48,000 ops/sec"`

## Verify

```bash
cmake --build build
./build/bench_week7
```

Expected output (numbers will vary by machine):
```
=== Week 7 Benchmark ===
nonce insert:       4,200,000 ops/sec
nonce lookup:       5,100,000 ops/sec
nonce prune (100k): 12 ms
verify (with replay defense):    42,000 ops/sec
verify (signature only):         44,000 ops/sec
replay defense overhead:         ~4%
key rotation:       8,500 ops/sec
key revocation:     12,000,000 ops/sec
```

## Done When

You have measured nonce tracking overhead, full verification throughput with and without replay defense, and key lifecycle operation speed.
