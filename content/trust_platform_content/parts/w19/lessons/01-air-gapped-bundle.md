---
id: w19-l01
title: "Air-Gapped Bundle"
order: 1
duration_minutes: 25
xp: 50
kind: lesson
part: w19
proof:
  type: paste
  instructions: "Paste the output showing the VerificationBundle struct created with all components."
  regex_patterns:
    - "bundle"
    - "document|receipt|key"
---

## Concept

An air-gapped computer has no network connection at all — no internet, no local network, nothing. This is common in high-security environments (military, banking) and in places with poor connectivity (rural areas, disaster zones). If you want to verify a document on such a machine, you need to bring everything on a USB drive or similar physical medium.

A verification bundle is a single file that contains everything: the original document (serialized bytes), the receipt (inclusion proof + signed checkpoint), the operator's public key (so you can verify the checkpoint signature), and the issuer's public key (so you can verify the document signature). With this bundle, a verifier needs nothing else — no server, no database, no internet.

In C terms, think of a verification bundle as a tarball that contains all the files needed to run a verification program. Except instead of files, it contains binary-serialized cryptographic proofs.

## Task

1. Define a `VerificationBundle` struct with: `std::vector<uint8_t> document_bytes` (the serialized document), `Receipt receipt`, `Ed25519PublicKey operator_pk`, `Ed25519PublicKey issuer_pk`, `std::string issuer_key_id`
2. Implement a function `VerificationBundle create_bundle(const SignedDocument& sdoc, const Receipt& receipt, const Ed25519PublicKey& operator_pk, const Ed25519PublicKey& issuer_pk)` that assembles the bundle
3. Test by issuing a document, generating a receipt, creating a bundle, and printing its component sizes

## Hints

- The bundle is just a container — it holds references to things you already have
- The document bytes come from serializing the Document struct (from Week 17)
- The operator's public key is used to verify the checkpoint signature
- The issuer's public key is used to verify the document signature
- Print sizes like: "Document: 256 bytes, Receipt: 520 bytes, Keys: 64 bytes, Total: 840 bytes"

## Verify

```bash
cd build && ctest --output-on-failure -R bundle_create
```

Bundle created with all four components present.

## Done When

Your VerificationBundle struct holds all components needed for offline verification and you can create one from an issued document.
