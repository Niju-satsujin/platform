---
id: w18-l06
title: "Week 18 Quality Gate"
order: 6
duration_minutes: 20
xp: 100
kind: lesson
part: w18
proof:
  type: paste
  instructions: "Paste the output of your full test suite and the git tag command."
  regex_patterns:
    - "pass"
    - "v0\\.18"
---

## Concept

Quality gate for Week 18. You have added the receipt system — the missing piece that makes your transparency log useful to end users. A receipt is a portable, self-contained proof that a document was logged. It can be verified offline, stored forever, and shared with anyone.

With Weeks 17 and 18 complete, you have the full CivicTrust issuance pipeline: create a document → sign it → store by hash → log it → generate a receipt → verify the receipt offline. Next week you will build offline verification bundles for air-gapped environments.

## Task

Verify this 6-point checklist:
1. Document hashes are anchored in the transparency log with valid inclusion proofs
2. Receipt generation bundles hash + index + inclusion proof + signed checkpoint
3. Receipt serialization round-trips correctly (serialize → deserialize → compare)
4. Receipt verification works fully offline with only the operator's public key
5. Tampered receipts are correctly rejected (modified hash, modified proof, modified checkpoint)
6. End-to-end test passes (10 valid, 2 tampered)

Run the full test suite. Fix any failures. Tag your repo.

## Hints

- Run all tests: `cd build && ctest --output-on-failure`
- Tag with: `git tag v0.18-anchoring`

## Verify

```bash
cd build && ctest --output-on-failure && git tag v0.18-anchoring
```

All tests pass, tag created.

## Done When

All 6 checklist items pass, full test suite green, repo tagged `v0.18-anchoring`.
