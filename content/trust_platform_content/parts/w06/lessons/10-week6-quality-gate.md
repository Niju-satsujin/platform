---
id: w06-l10
title: "Week 6 quality gate — Signatures + Identity"
order: 10
duration_minutes: 20
xp: 100
kind: lesson
part: w06
proof:
  type: paste
  instructions: "Paste your completed 10-point Week 6 quality gate checklist with each item marked PASS, plus the git tag."
  regex_patterns:
    - "PASS"
    - "v.*sign|w06|week.6"
---
# Week 6 quality gate — Signatures + Identity

## Concept

This is the Week 6 quality gate. Every item must pass before you move on. This week added a critical security layer — if any of these checks fail, your system is not actually verifying identity.

The 10-point Week 6 checklist:

1. **Keygen** — `./keygen <name>` creates a valid Ed25519 key pair, secret key file has restricted permissions (lesson 2)
2. **Sign** — `./sign <keyfile> <file>` produces a valid 64-byte detached signature (lesson 3)
3. **Verify valid** — `./verify <pubkey> <file> <sig>` returns 0 for a valid signature (lesson 4)
4. **Verify tampered** — `./verify` returns 1 for a tampered file (lesson 4)
5. **Signed envelope** — envelope struct includes signature and key_id fields, serialization round-trips correctly (lessons 5-6)
6. **Key registry** — server loads/saves a key registry file, register/lookup/list/remove all work (lesson 7)
7. **Accept registered** — server accepts signed messages from registered keys (lesson 8)
8. **Reject unknown** — server rejects messages from unregistered keys with error response (lesson 8)
9. **Reject tampered** — server rejects messages with invalid signatures (lesson 8)
10. **Benchmark recorded** — signing and verification throughput numbers documented (lesson 9)

After all 10 pass:
```bash
git tag -a v0.6-signatures -m "Week 6: Signatures + Identity complete"
```

## Task

1. Run every check from the list above
2. Mark each item PASS or FAIL
3. Fix any failures — go back to the relevant lesson if needed
4. Create the git tag
5. Review: your server now has authentication. No message is processed without a valid signature from a known key.

## Hints

- Run checks in order — earlier checks are prerequisites for later ones
- Quick smoke test for the full chain: keygen -> sign -> verify -> send to server -> check accepted
- Then: keygen a new key (not registered) -> sign -> send to server -> check rejected
- `git tag -l` should show your previous tags plus the new `v0.6-signatures`
- If any tests from previous weeks broke, fix them before tagging

## Verify

```bash
git tag -l "v*"
```

Expected: all previous tags plus `v0.6-signatures`.

Run the full chain:
```bash
./keygen testuser
./server --register-key testuser.pub testuser
./server --key-registry keys.db &
./client --keyfile testuser.key --message "quality gate test"
# Should be accepted

./keygen stranger
./client --keyfile stranger.key --message "should be rejected"
# Should be rejected
```

## Done When

All 10 checklist items are PASS, `v0.6-signatures` tag exists, and your server authenticates every message before processing it.
