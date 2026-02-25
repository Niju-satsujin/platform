---
id: w18-l04
title: "Verify Receipt Offline"
order: 4
duration_minutes: 25
xp: 75
kind: lesson
part: w18
proof:
  type: paste
  instructions: "Paste the output showing receipt verification passing for a valid receipt and failing for a tampered one."
  regex_patterns:
    - "valid|verified|pass"
    - "tamper|invalid|fail|reject"
---

## Concept

Receipt verification is fully offline — you do not need to contact the log server. All you need is the receipt bytes and the operator's public key. The verification does three checks: (1) verify the checkpoint signature using the operator's public key, (2) take the document hash and the inclusion proof hashes, recompute the Merkle root by hashing up the tree, (3) compare the computed root with the root in the signed checkpoint.

If all three checks pass, you have mathematical proof that the document hash was in the Merkle tree at the time the checkpoint was signed. No network needed, no server trust needed — just the operator's public key (which can be published openly).

This is powerful because it means verification can happen anywhere: on an air-gapped computer, in a rural area with no internet, or years after the log server has shut down. As long as someone saved the receipt and knows the operator's public key, they can verify.

## Task

Implement `bool verify_receipt(const Receipt& receipt, const Ed25519PublicKey& operator_pk)` that:
1. Verifies the checkpoint signature with `operator_pk`
2. Recomputes the Merkle root from `receipt.doc_hash` + `receipt.proof_hashes` + `receipt.log_index`
3. Compares the computed root with `receipt.checkpoint.root_hash`
4. Returns true only if all checks pass

Test with three cases:
- Valid receipt → returns true
- Tampered receipt (modify one proof hash) → returns false
- Tampered checkpoint (modify root hash) → signature check fails

## Hints

- Use `verify_inclusion(doc_hash, proof_hashes, log_index, checkpoint.root_hash)` from your Week 14 Merkle code
- Use `crypto_sign_verify_detached` from libsodium for the checkpoint signature
- For the tamper test: make a copy of the receipt, flip one byte in a proof hash, verify should fail
- For the checkpoint tamper test: modify the root hash in the checkpoint — the signature will no longer match

## Verify

```bash
cd build && ctest --output-on-failure -R verify_receipt
```

Valid receipt passes, tampered receipt and checkpoint both fail.

## Done When

Your receipt verification works fully offline, accepts valid receipts, and rejects any tampered component.
