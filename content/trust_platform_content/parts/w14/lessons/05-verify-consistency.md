---
id: w14-l05
title: "Verify consistency proofs"
order: 5
duration_minutes: 25
xp: 50
kind: lesson
part: w14
proof:
  type: paste
  instructions: "Paste the output showing: (1) a valid consistency proof verified as PASS, (2) a tampered consistency proof verified as FAIL."
  regex_patterns:
    - "consisten|CONSIST"
    - "PASS|valid|verified"
    - "FAIL|invalid|rejected"
---
# Verify consistency proofs

## Concept

Consistency verification checks that an old tree is truly a prefix of a new tree. The verifier knows the old root hash, the new root hash, the old size, the new size, and the consistency proof (a list of hashes). They do not have either tree. They use only these values to check that the history was not rewritten.

The verification algorithm reverses the proof generation. It uses the proof hashes to reconstruct both the old root and the new root. If the reconstructed old root matches the known old root, and the reconstructed new root matches the known new root, the proof is valid. The old tree is a genuine prefix of the new tree.

This guarantee is critical for append-only logs. If a log server claims to have 100 entries, and later claims to have 150 entries, a consistency proof between size 100 and size 150 proves entries 1-100 are unchanged. Without this check, the log server could secretly replace entry 50 and nobody would notice — the new root would be different, but the old root was never checked against the new tree.

Think of it as a chain of trust: you trusted the old root, the consistency proof links the old root to the new root, so now you can trust the new root too. Each verification extends the trust forward in time.

## Task

1. Write a standalone function `bool verify_consistency(const Hash& old_root, const Hash& new_root, size_t old_size, size_t new_size, const std::vector<Hash>& proof)`
2. This function should work without access to any tree — the verifier only has the roots, sizes, and proof
3. The algorithm reconstructs both roots from the proof hashes:
   - Decompose `old_size` using the same split logic from proof generation
   - Use the proof hashes to rebuild the old root and the new root
   - Compare both to the expected values
4. Write tests:
   - Build a tree with 5 items, record root. Add 3 items (total 8), record root. Generate and verify consistency proof — should PASS
   - Same setup, but tamper with one proof hash — should FAIL
   - Build a tree with 4 items, grow to 8, verify consistency — should PASS
   - Build a tree with 1 item, grow to 4, verify consistency — should PASS
5. Test an append sequence: start with 1 item, add items one at a time up to 10. At each step, verify consistency with the previous size

## Hints

- The verification algorithm mirrors the generation algorithm — it uses the same split points and the same order of hashes
- RFC 6962 section 2.1.2 describes the verification algorithm in detail
- Start by getting the simple case working: old_size is a power of 2, new_size is a power of 2
- The append sequence test is the strongest test — it checks every transition from size N to size N+1
- If verification fails on some sizes but not others, your handling of non-power-of-2 sizes probably has a bug
- A common mistake: using the wrong order when combining hashes (left vs right). Double-check that your generation and verification use the same ordering
- Another common mistake: off-by-one in the split calculation. The largest power of 2 less than N is not the same as the largest power of 2 less than or equal to N

## Verify

```bash
cd build && cmake .. && make verify_consistency_test && ./verify_consistency_test
```

Expected output:
```
Test 1 — consistency (5 -> 8):     PASS
Test 2 — tampered proof:           FAIL (expected)
Test 3 — consistency (4 -> 8):     PASS
Test 4 — consistency (1 -> 4):     PASS
Test 5 — append sequence (1..10):  PASS (9 transitions verified)
All tests passed.
```

## Done When

`verify_consistency()` correctly accepts valid consistency proofs and rejects tampered proofs, and the append sequence test passes for all transitions from size 1 to size 10.
