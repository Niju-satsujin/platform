---
id: w18-l02
title: "Receipt Generation"
order: 2
duration_minutes: 30
xp: 75
kind: lesson
part: w18
proof:
  type: paste
  instructions: "Paste the output showing a receipt generated with document hash, log index, inclusion proof, and signed checkpoint."
  regex_patterns:
    - "receipt"
    - "proof|inclusion"
---

## Concept

A receipt is a self-contained proof that a document was logged. It bundles four pieces of information: (1) the document hash, (2) the log index where it was stored, (3) the Merkle inclusion proof (the sibling hashes from leaf to root), and (4) the signed checkpoint at the time of issuance (which contains the root hash and the operator's signature).

With these four pieces, anyone can verify the document was logged without contacting the log server. The verification works like this: take the document hash, use the inclusion proof to recompute the Merkle root, and compare the computed root with the root in the signed checkpoint. If they match, and the checkpoint signature is valid, the document was provably logged.

The receipt is like a notary's stamp on your personal copy of a document. The stamp contains enough information to verify independently — you do not need to go back to the notary's office. In digital terms, the "stamp" is the inclusion proof + signed checkpoint.

## Task

Implement `Receipt generate_receipt(const std::string& doc_hash, uint64_t log_index, const TransparencyLog& log, const Ed25519SecretKey& operator_sk)` that:
1. Gets the inclusion proof for `log_index` from the log's Merkle tree
2. Signs a checkpoint of the current log state with the operator's key
3. Bundles everything into a `Receipt` struct: `doc_hash`, `log_index`, `proof` (vector of hashes), `checkpoint` (SignedCheckpoint)
4. Returns the Receipt

Test by issuing a document, generating a receipt, and printing its contents.

## Hints

- The `Receipt` struct needs: `std::string doc_hash`, `uint64_t log_index`, `std::vector<std::string> proof_hashes`, `SignedCheckpoint checkpoint`
- Use `log.inclusion_proof(log_index)` to get the sibling hashes
- Use `log.sign_checkpoint(operator_sk)` to get the signed checkpoint
- The receipt should be generated right after appending to the log, so the checkpoint reflects the current state

## Verify

```bash
cd build && ctest --output-on-failure -R receipt_gen
```

The receipt should contain all four components with correct values.

## Done When

You can generate a receipt for any issued document, containing the hash, log index, inclusion proof, and signed checkpoint.
