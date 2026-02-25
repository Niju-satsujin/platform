---
id: w17-quest
title: "Week 17 Boss: Issue and Verify a Document"
part: w17
kind: boss
proof:
  type: paste
  instructions: "Paste output showing: (1) a document issued with type and subject, (2) Ed25519 signature attached, (3) stored by SHA-256 hash in CAS, (4) hash appended to transparency log, (5) independent verification passing all three checks (signature valid, hash valid, log inclusion proof valid)."
  regex_patterns:
    - "issue|issued"
    - "sign|signature"
    - "hash|sha256|SHA-256"
    - "log|logged|transparency"
    - "verif|valid|PASS"
---
# Week 17 Boss: Issue and Verify a Document

## Goal

Prove your document issuance system works end-to-end. Issue a signed document, store it in content-addressed storage, log it in the transparency log, and then independently verify it — confirming the signature, the hash, and the log inclusion proof.

## Requirements

1. **Create a document** with a type (e.g., "land_title"), a subject, an issuer, and a body
2. **Issue it** — serialize, hash with SHA-256, sign with Ed25519, bundle into a SignedDocument
3. **Store by hash** — the SignedDocument is stored in content-addressed storage (the key is its hash)
4. **Log the hash** — append the document hash to the transparency log
5. **Verify independently** — given only the SignedDocument and access to the key registry + log, confirm:
   - Signature is valid (Ed25519 verification passes)
   - Hash is valid (re-hash the document bytes, compare with stored hash)
   - Log inclusion proof is valid (Merkle proof from the transparency log)
6. **Revocation works** — revoke a document and verify that verification reports it as revoked
7. **Policy gates work** — attempt to issue a document that violates a policy (e.g., self-issuance) and confirm it is rejected

## Verify

```bash
# Build
cmake --build build

# Run the end-to-end test
./build/test_issuance_e2e
```

## Done When

The end-to-end test issues a document, verifies it (all three checks pass), revokes it (verification reports revoked), and rejects a policy-violating issuance. All output is printed to stdout.
