---
id: w20-l03
title: "Key Compromise Drill"
order: 3
duration_minutes: 25
xp: 75
kind: lesson
part: w20
proof:
  type: paste
  instructions: "Paste the output showing: key compromised, old key revoked, new key active, documents re-verified with correct status."
  regex_patterns:
    - "revok|compromis"
    - "new key|rotated"
---

## Concept

What if an issuer's private key is stolen? This is the worst-case security scenario. The attacker can sign fake documents that look legitimate. You need a response plan: revoke the compromised key immediately, rotate to a new key, and flag all documents signed with the old key as "needs re-verification."

Key revocation (from Week 7) is your first line of defense. Once the key is revoked in the key registry, no new documents can be signed with it, and the verification function reports a warning for documents signed with the revoked key. But the old documents are still in the log — they were valid when they were signed, and the transparency log proves they existed before the compromise.

The drill simulates this scenario end-to-end: issue documents with key A, compromise key A, revoke it, generate a new key B, re-issue critical documents with key B, and verify that the system correctly reports the status of documents signed with both keys.

## Task

1. Issue 5 documents with key A (the "compromised" key)
2. Revoke key A in the key registry
3. Generate a new key B, register it
4. Verify documents 1-5 — they should report "signed with revoked key" warning
5. Re-issue documents 1-3 (the critical ones) with key B
6. Verify the re-issued documents — they should report fully valid
7. Verify that key A cannot be used to issue new documents (policy gate rejects it)

## Hints

- Use `keys.revoke(key_a_id, "compromise detected")` to revoke the key
- Your `verify()` function should check `keys.is_revoked(sdoc.key_id)` and set a warning flag
- Documents signed before revocation are not "invalid" — they were valid at the time. The warning is: "signed with a key that was later revoked"
- The `KeyNotRevokedPolicy` from Week 17 should prevent new issuance with the revoked key
- For re-issuance: create new SignedDocuments with the same content but signed with key B

## Verify

```bash
cd build && ctest --output-on-failure -R key_compromise
```

Old documents flagged, new key works, revoked key cannot sign.

## Done When

Your key compromise drill shows correct handling: revocation, rotation, warning flags on old documents, and rejection of the compromised key.
