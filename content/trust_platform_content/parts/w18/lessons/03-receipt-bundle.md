---
id: w18-l03
title: "Receipt Bundle Format"
order: 3
duration_minutes: 25
xp: 50
kind: lesson
part: w18
proof:
  type: paste
  instructions: "Paste the output showing a receipt serialized to bytes and deserialized back with all fields matching."
  regex_patterns:
    - "serialize|round.trip|bundle"
    - "match|pass|OK"
---

## Concept

The receipt needs a compact binary format so it can be stored alongside the document or transmitted to the document holder. The format follows the same length-prefixed pattern you have used throughout the project.

The layout is: `[doc_hash: 32 bytes][log_index: 8 bytes big-endian][proof_count: 4 bytes][proof_hashes: 32 bytes each][checkpoint_length: 4 bytes][checkpoint_bytes: variable]`. This is a flat binary format — no JSON, no XML, just raw bytes in a defined order. The advantage is that it is compact, fast to parse, and language-agnostic — any program that knows the format can read it.

The checkpoint itself has its own internal format (root hash, log size, timestamp, signature). You already have serialize/deserialize for it from Week 15. The receipt bundle just wraps everything into a single byte sequence.

## Task

1. Implement `std::vector<uint8_t> serialize_receipt(const Receipt& r)` — writes all fields in the format above
2. Implement `Receipt deserialize_receipt(const std::vector<uint8_t>& data)` — reads them back
3. Write a round-trip test: generate a receipt, serialize it, deserialize the bytes, compare every field
4. Print the receipt size in bytes for a log with 1000 entries (to see how compact the proof is)

## Hints

- The proof has `log2(N)` hashes where N is the log size — for 1000 entries, that is about 10 hashes × 32 bytes = 320 bytes
- The total receipt size for a 1000-entry log should be around 500-600 bytes — very compact
- Use the same big-endian encoding you used in Week 3 for multi-byte integers
- For the round-trip test, compare `doc_hash`, `log_index`, each proof hash, and the checkpoint fields

## Verify

```bash
cd build && ctest --output-on-failure -R receipt_bundle
```

Round-trip test passes, receipt size printed.

## Done When

Your receipt serializes to a compact binary format and deserializes back with all fields matching.
