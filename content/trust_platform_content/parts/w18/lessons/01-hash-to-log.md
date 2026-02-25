---
id: w18-l01
title: "Hash-to-Log Anchoring"
order: 1
duration_minutes: 25
xp: 50
kind: lesson
part: w18
proof:
  type: paste
  instructions: "Paste the output showing a document issued and its hash found in the transparency log."
  regex_patterns:
    - "hash|anchor"
    - "log|appended|index"
---

## Concept

Anchoring is the act of writing a document's hash into the transparency log. You already did this in Week 17's signing workflow — the `issue()` function appends the hash to the log. This lesson makes sure that link is solid and verifiable.

The anchor creates a permanent, tamper-evident record. Once a hash is in the log, it cannot be removed (the log is append-only) and it cannot be changed (the Merkle tree would detect it). The log entry ties the document to a specific point in time — the timestamp in the signed checkpoint proves the document existed no later than that time.

Think of it like a notary's ledger in a town hall. When a document is notarized, the notary writes the document number in the ledger. Years later, anyone can check the ledger to confirm the document was officially recorded. The ledger pages are numbered and bound — you cannot rip out a page without it being obvious.

## Task

1. Verify that your `issue()` function from Week 17 correctly appends the document hash to the transparency log
2. After issuing a document, retrieve the log entry by index and confirm the stored hash matches
3. Request an inclusion proof for the entry and verify it against the current root hash
4. Write a test that issues 5 documents and verifies all 5 are anchored in the log with valid inclusion proofs

## Hints

- The `issue()` function should return the log index where the hash was stored
- Use `log.get_entry(index)` to retrieve the stored hash and compare with `sdoc.hash_hex`
- Use `log.inclusion_proof(index)` to get the Merkle proof, then verify with `verify_inclusion()`
- The test should issue 5 different documents (different IDs, types, subjects) and check each one

## Verify

```bash
cd build && ctest --output-on-failure -R anchor
```

All 5 documents should be found in the log with valid inclusion proofs.

## Done When

Every issued document has a verifiable anchor in the transparency log — you can prove it is there using a Merkle inclusion proof.
