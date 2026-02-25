---
id: w17-l02
title: "Signing Workflow"
order: 2
duration_minutes: 30
xp: 75
kind: lesson
part: w17
proof:
  type: paste
  instructions: "Paste the output showing a document issued, stored by hash, and logged in the transparency log."
  regex_patterns:
    - "signed|signature"
    - "stored|hash"
    - "logged|appended"
---

## Concept

The issuance workflow combines everything you have built so far into a single pipeline. When an issuer wants to create a signed document, the system does five things in order: (1) serialize the Document to bytes, (2) hash those bytes with SHA-256 (from Week 5), (3) sign the hash with the issuer's Ed25519 private key (from Week 6), (4) store the serialized document in content-addressed storage by its hash (from Week 13), (5) append the hash to the transparency log (from Week 15).

The result is a `SignedDocument` that bundles together: the original Document, the SHA-256 hash, the Ed25519 signature, and the issuer's key ID (so the verifier knows which public key to use). This is the "issued" form of the document — it has cryptographic proof of who created it and when.

Think of it like a physical notary stamp. The notary reads the document, stamps it with their seal (the signature), files a copy (content-addressed storage), and writes an entry in their official ledger (the transparency log). Anyone can later check the stamp, verify the copy, and look up the ledger entry.

## Task

Implement `SignedDocument issue(const Document& doc, const Ed25519SecretKey& sk, const std::string& key_id, ContentStore& cas, TransparencyLog& log)` that:
1. Serializes the document to bytes
2. Computes SHA-256 hash of the serialized bytes
3. Signs the hash with the Ed25519 secret key
4. Stores the serialized bytes in content-addressed storage
5. Appends the hash to the transparency log
6. Returns a SignedDocument containing: the Document, the hash, the signature, the key_id, and the log index

Test by issuing a document and verifying it exists in both CAS and the log.

## Hints

- The `SignedDocument` struct needs: `Document doc`, `std::string hash_hex`, `std::vector<uint8_t> signature`, `std::string key_id`, `uint64_t log_index`
- Use your existing `ContentStore::store()` from Week 13 — it takes bytes and returns the hex hash
- Use your existing `TransparencyLog::append()` from Week 15 — it takes bytes and returns the log index
- For the hash, pass the serialized bytes (not the Document struct) to your SHA-256 function from Week 5
- For the signature, sign the hash bytes (not the full document) with `crypto_sign_detached` from libsodium

## Verify

```bash
cd build && ctest --output-on-failure -R issuance
```

Output should show the document was signed, stored by its hash, and appended to the log with an index.

## Done When

You can issue a document and it is automatically signed, stored in CAS, and logged in the transparency log.
