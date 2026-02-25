---
id: w16-l01
title: "Monitor service"
order: 1
duration_minutes: 30
xp: 50
kind: lesson
part: w16
proof:
  type: paste
  instructions: "Paste the output of your monitor polling the log, showing checkpoint signature verification and consistency check results (OK or ALERT)."
  regex_patterns:
    - "OK|ALERT|verified"
    - "checkpoint|size|root"
    - "consistency"
---
# Monitor service

## Concept

You built a transparency log in Week 15. The log operator appends entries, builds a Merkle tree, and signs checkpoints. But a signed checkpoint is only useful if someone actually checks it. That is where a monitor comes in.

A monitor is an independent service that watches the transparency log. It does not trust the log operator. Instead, it periodically fetches the latest signed checkpoint and does two things. First, it verifies the signature on the checkpoint using the operator's public key (the same Ed25519 verification you built in Week 6). If the signature is invalid, something is very wrong — either the checkpoint was tampered with in transit, or someone is impersonating the operator. Second, the monitor checks consistency with the previous checkpoint it saw. This uses the consistency proof from Week 14: the monitor asks the log to prove that the old root hash is consistent with the new one. If the proof verifies, it means the log only grew — no entries were changed or deleted. If the proof fails, the operator rewrote history.

In real systems like Certificate Transparency, multiple organizations run monitors independently. Google runs one, Comodo runs one, Let's Encrypt runs one, and so on. The log operator cannot cheat because it would need to fool all of them simultaneously. Your monitor is simpler — it runs locally — but the principle is the same. Trust comes from independent verification, not from trusting the operator.

Think of it like an auditor reviewing a company's books. The company (log operator) publishes financial statements (checkpoints). The auditor (monitor) checks that the numbers add up and are consistent with previous reports. One auditor is good; multiple independent auditors are better.

## Task

1. Create a `Monitor` class that holds:
   - The operator's Ed25519 public key (for signature verification)
   - The last verified checkpoint (size and root hash), initially empty
   - A reference or pointer to the log (or a way to fetch checkpoints from it)
2. Implement `bool check(const SignedCheckpoint& cp)` that:
   - Verifies the Ed25519 signature on the checkpoint — return false and log ALERT if invalid
   - If this is the first checkpoint, accept it (store as last verified)
   - If this is a subsequent checkpoint, request a consistency proof from the log for the old size to the new size
   - Verify the consistency proof against old root and new root — return false and log ALERT if it fails
   - If everything passes, update the last verified checkpoint, log OK, and return true
3. Implement `void poll(Log& log)` that:
   - Fetches the latest signed checkpoint from the log
   - Calls `check()` on it
   - Prints the result: `[Monitor] size=N root=<hex> OK` or `[Monitor] ALERT: <reason>`
4. Write a test that creates a log, appends 5 entries, signs a checkpoint, creates a monitor, and calls `poll()`. The monitor should print OK
5. Extend the test: append 3 more entries, sign a new checkpoint, poll again. The monitor should verify consistency and print OK

## Hints

- Your `SignedCheckpoint` struct from Week 15 should contain `size`, `root_hash`, and `signature`
- For consistency proofs, you built this in Week 14. The proof is a list of hashes that lets you verify the old tree is a prefix of the new tree
- You can store the monitor's state in simple member variables — no need for a database
- The `poll()` method is just a convenience wrapper: fetch checkpoint, call `check()`
- For the test, you can use your existing `TransparencyLog` class directly — no network needed yet
- Print format suggestion: `[Monitor] checkpoint size=8 root=a1b2c3... OK` so you can see what the monitor verified

## Verify

```bash
g++ -std=c++17 -o monitor_basic monitor_basic.cpp -lssl -lcrypto
./monitor_basic
# Should show two OK lines — one for the first checkpoint, one for the second
```

Manually break the test: before the second poll, tamper with an entry in the log (change a leaf hash). The consistency proof should fail and the monitor should print ALERT.

## Done When

The monitor verifies two consecutive checkpoints, printing OK for each. When you tamper with the log between checkpoints, the monitor prints ALERT instead.
