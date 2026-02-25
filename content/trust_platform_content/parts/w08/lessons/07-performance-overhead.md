---
id: w08-l07
title: "Performance overhead measurement"
order: 7
duration_minutes: 25
xp: 50
kind: lesson
part: w08
proof:
  type: paste
  instructions: "Paste output showing throughput (messages/sec) with crypto disabled and with crypto enabled, plus the calculated overhead percentage."
  regex_patterns:
    - "msg/s|messages.*sec|throughput"
    - "overhead|percent|%"
---
# Performance overhead measurement

## Concept

Cryptography costs CPU time. Signing a message means computing an Ed25519 signature. Verifying one means computing it again on the server side. Hashing the payload, checking nonces in a hash set, comparing timestamps — each step adds microseconds.

The question is: how many microseconds? And does it matter?

You measure this by running the same workload twice. First with all crypto disabled (just parse and echo), then with all crypto enabled (verify signature, check nonce, check timestamp, check revocation). The difference is your crypto overhead.

Typical Ed25519 verification takes 50-100 microseconds on modern hardware. If your server processes 1000 messages per second, that is 50-100ms of CPU time per second — about 5-10% overhead. That is usually acceptable. But you do not guess — you measure.

The measurement must be fair. Same number of messages, same payload size, same network conditions. Only the crypto checks change. Run each configuration at least 3 times and use the median to avoid noise from the OS scheduler.

## Task

1. Add a `--no-crypto` flag to your server that skips all signature verification, nonce checking, and timestamp validation (still parses the envelope, just does not verify)
2. Write a benchmark client that sends N signed messages as fast as possible and measures wall-clock time
3. Run the benchmark against the server with `--no-crypto` — record messages per second
4. Run the benchmark against the server normally (crypto enabled) — record messages per second
5. Calculate the overhead: `overhead_pct = (1 - throughput_crypto / throughput_nocrypto) * 100`
6. Run each configuration 3 times, report the median
7. Print a summary table: `NO_CRYPTO: X msg/s | CRYPTO: Y msg/s | OVERHEAD: Z%`

## Hints

- Use `std::chrono::high_resolution_clock` for timing the benchmark
- Send at least 1000 messages per run to get stable numbers — short runs are noisy
- Keep the payload small and fixed (e.g., 64 bytes) so you measure crypto, not I/O
- The `--no-crypto` flag should be compile-time or runtime — either works, but runtime is easier to toggle
- On a typical machine, expect 10,000-50,000 msg/s without crypto and a 5-20% drop with crypto
- If your overhead is over 50%, check if you are doing unnecessary copies or allocations in the crypto path
- If your overhead is under 1%, your benchmark might not be measuring what you think — verify the crypto path is actually running

## Verify

```bash
# Terminal 1 — server without crypto
./server --port 9000 --no-crypto

# Terminal 2 — benchmark
./bench_crypto --host 127.0.0.1 --port 9000 --count 5000

# Restart server with crypto
# Terminal 1
./server --port 9000

# Terminal 2
./bench_crypto --host 127.0.0.1 --port 9000 --count 5000
```

Expected output (example numbers — yours will differ):
```
NO_CRYPTO: 25000 msg/s (median of 3 runs)
CRYPTO:    21500 msg/s (median of 3 runs)
OVERHEAD:  14.0%
```

## Done When

You have throughput numbers for both configurations and can state the percentage overhead of your cryptographic checks.
