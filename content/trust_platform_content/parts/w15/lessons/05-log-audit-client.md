---
id: w15-l05
title: "Log Audit Client"
order: 5
duration_minutes: 30
xp: 75
kind: lesson
part: w15
proof:
  type: paste
  instructions: "Paste the output of your audit client verifying two consecutive checkpoints and confirming consistency."
  regex_patterns:
    - "consistency|consistent"
    - "OK|verified|valid"
---

## Concept

An audit client is a program that watches the transparency log and checks that everything is honest. It works like a watchdog. Every few seconds (or minutes), it fetches the latest signed checkpoint from the log server. Then it does two checks: first, it verifies the checkpoint signature using the operator's public key (you built this in Week 6). Second, it checks that the new checkpoint is consistent with the previous one — meaning the log only grew, nothing was changed or deleted.

The consistency check uses the consistency proof you built in Week 14. If the old checkpoint said "the log has 100 entries with root hash X," and the new checkpoint says "the log has 150 entries with root hash Y," the audit client asks the log for a consistency proof between size 100 and size 150. If the proof verifies, it means entries 1-100 are identical in both versions — the log only appended entries 101-150.

If either check fails — bad signature or inconsistent log — the audit client raises an alarm. This is the key property of transparency: even if the log operator is malicious, they cannot cheat without being detected by at least one honest audit client. In C terms, think of the audit client as a periodic polling loop that reads state and asserts invariants.

## Task

Build an `AuditClient` class that:
1. Stores the last-seen `SignedCheckpoint` (initially empty)
2. Has a `check(const TransparencyLog& log, const Ed25519PublicKey& operator_pk)` method
3. On each call: fetch the latest checkpoint, verify signature, if a previous checkpoint exists then verify consistency proof between old and new, update stored checkpoint
4. Returns an `AuditResult` with: `signature_valid`, `consistency_valid`, `new_size`, `old_size`
5. If any check fails, print "AUDIT ALERT" with details

Test by appending entries to the log, running the audit client multiple times, and verifying it reports OK each time.

## Hints

- Store the last checkpoint as a `std::optional<SignedCheckpoint>` — empty on first run
- On first run, skip the consistency check (there is no "old" to compare against)
- The consistency proof comes from your Merkle tree's `consistency_proof(old_size, new_size)` method from Week 14
- For the test: append 10 entries, audit (first check — should be OK), append 10 more, audit again (should verify consistency between size 10 and 20)

## Verify

```bash
cd build && ctest --output-on-failure -R audit
```

You should see the audit client report OK for both checks, with log sizes increasing.

## Done When

Your audit client verifies both signature and consistency across two consecutive checkpoints, and correctly detects when the log is honest (all checks pass).
