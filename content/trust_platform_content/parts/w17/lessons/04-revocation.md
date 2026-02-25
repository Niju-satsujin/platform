---
id: w17-l04
title: "Document Revocation"
order: 4
duration_minutes: 25
xp: 50
kind: lesson
part: w17
proof:
  type: paste
  instructions: "Paste the output showing a document revoked and verification reporting it as revoked."
  regex_patterns:
    - "revok"
---

## Concept

Sometimes a document needs to be canceled. A building permit might be revoked, a certificate might be recalled, or a credential might expire early. But you cannot delete it from the transparency log — the log is append-only. If you could delete entries, the whole system would lose its tamper-evident property.

The solution is to issue a revocation entry. This is a new entry in the transparency log that says: "document with hash X is revoked, reason: Y, revoked by: Z, at time: T." The revocation entry itself is signed by the revoker's Ed25519 key. Now when someone verifies the document, they also check: is there a revocation entry for this document hash? If yes, the verification result reports "revoked" along with the reason.

In C terms, think of it like writing "VOID" across a check instead of erasing it. The original check is still there — you can see what it said — but it is clearly marked as no longer valid. The "VOID" stamp itself has a signature, so you know it was done by an authorized person.

## Task

1. Define a `RevocationEntry` struct: `doc_hash` (string), `reason` (string), `revoker_key_id` (string), `timestamp` (uint64_t), `signature` (vector of uint8_t)
2. Implement `void revoke(const std::string& doc_hash, const std::string& reason, const Ed25519SecretKey& sk, const std::string& key_id, TransparencyLog& log)` — creates a revocation entry, signs it, appends to the log
3. Update `verify()` to scan the log for revocation entries matching the document hash — if found, set `VerifyResult::revoked = true` and `revocation_reason`
4. Test: issue a document, verify (should pass), revoke it, verify again (should report revoked)

## Hints

- Serialize the revocation entry with a type prefix (e.g., the first byte is 0x01 for document, 0x02 for revocation) so you can distinguish them in the log
- For the log scan: iterate through log entries, deserialize each, check if it is a revocation entry matching the target hash
- A more efficient approach: maintain an in-memory `std::unordered_set<std::string>` of revoked hashes, updated on each append
- The revoker does not have to be the same as the issuer — in real systems, an authority might revoke documents issued by others

## Verify

```bash
cd build && ctest --output-on-failure -R revoc
```

You should see: document issued → verified OK → revoked → verified as REVOKED with reason.

## Done When

You can revoke a document and the verify function correctly reports it as revoked with the reason.
