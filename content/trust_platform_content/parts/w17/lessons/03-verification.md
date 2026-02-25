---
id: w17-l03
title: "Document Verification"
order: 3
duration_minutes: 25
xp: 50
kind: lesson
part: w17
proof:
  type: paste
  instructions: "Paste the output of your verification test showing signature, hash, and log inclusion all verified."
  regex_patterns:
    - "signature.*valid|valid.*signature"
    - "inclusion|logged"
---

## Concept

Verification is the other side of issuance. Anyone who has a SignedDocument can verify it without trusting the issuer — they just need the issuer's public key and access to the transparency log. Verification checks three things: (1) the Ed25519 signature is valid (the document was really signed by the claimed issuer), (2) the SHA-256 hash matches (the document content has not been altered), and (3) the transparency log contains an inclusion proof for this hash (the document was officially logged).

Each check catches a different kind of attack. A bad signature means someone forged the document. A bad hash means someone modified the content after signing. A missing log entry means the document was never officially issued — it might be a backdated fake.

The beauty of this system is that verification is entirely based on math. You do not need to call the issuer and ask "did you really issue this?" The cryptographic proofs speak for themselves.

## Task

Implement `VerifyResult verify(const SignedDocument& sdoc, const KeyRegistry& keys, const TransparencyLog& log)` that:
1. Looks up the issuer's public key by `sdoc.key_id` in the KeyRegistry (from Week 6)
2. Verifies the Ed25519 signature over the hash
3. Re-serializes the document, computes SHA-256, compares with `sdoc.hash_hex`
4. Requests an inclusion proof from the log for `sdoc.log_index`, verifies it

`VerifyResult` should have: `bool signature_valid`, `bool hash_valid`, `bool logged`, `std::string error` (empty if all pass).

Test with: a valid document (all pass), a document with a tampered body (hash fails), a document with a wrong signature (signature fails).

## Hints

- Use `crypto_sign_verify_detached` from libsodium for signature verification
- The hash check: serialize the document, compute SHA-256, convert to hex, compare with stored hash
- The log check: get an inclusion proof for the stored log_index, verify against the current root hash
- If the key_id is not found in the registry, set `signature_valid = false` and `error = "unknown key"`

## Verify

```bash
cd build && ctest --output-on-failure -R verify
```

You should see three test cases: valid document passes, tampered body caught, wrong signature caught.

## Done When

Your verify function correctly validates authentic documents and catches tampered bodies and forged signatures.
