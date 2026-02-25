---
id: w19-l02
title: "Bundle Format"
order: 2
duration_minutes: 25
xp: 50
kind: lesson
part: w19
proof:
  type: paste
  instructions: "Paste the output showing a bundle serialized and deserialized with all fields matching."
  regex_patterns:
    - "serialize|round.trip|bundle"
    - "match|pass"
---

## Concept

The verification bundle needs a binary format so it can be saved to a file, copied to a USB drive, and loaded on the air-gapped machine. The format follows the same length-prefixed pattern you have used throughout the project.

The layout is: `[magic: 4 bytes "CVBV"][version: 1 byte][doc_length: 4 bytes][document_bytes][receipt_length: 4 bytes][receipt_bytes][operator_pk: 32 bytes][issuer_pk: 32 bytes][key_id_length: 4 bytes][key_id_bytes]`. The magic bytes "CVBV" (CivicVerify Bundle V1) let you quickly check if a file is a valid bundle. The version byte lets you change the format later without breaking old bundles.

This is the same approach used by real file formats. PNG files start with a magic number, ZIP files start with "PK", and ELF executables start with 0x7F "ELF". The magic number is a quick sanity check before you invest time parsing the rest.

## Task

1. Implement `std::vector<uint8_t> serialize_bundle(const VerificationBundle& bundle)` — writes the magic, version, then all components with length prefixes
2. Implement `VerificationBundle deserialize_bundle(const std::vector<uint8_t>& data)` — validates magic + version, then reads components
3. If the magic bytes do not match, throw an exception with "invalid bundle format"
4. Write a round-trip test: create a bundle, serialize to bytes, write to a file, read the file, deserialize, compare all fields

## Hints

- Magic bytes: `{'C', 'V', 'B', 'V'}` — 4 bytes
- Version: `0x01` — 1 byte
- The receipt bytes come from `serialize_receipt()` from Week 18
- Ed25519 public keys are exactly 32 bytes each (no length prefix needed)
- For the file test, write the bytes to a temp file and read them back — this simulates the USB drive transfer

## Verify

```bash
cd build && ctest --output-on-failure -R bundle_format
```

Round-trip test passes, invalid magic is rejected.

## Done When

Your bundle serializes to a file and deserializes back with all fields matching, and invalid files are rejected.
