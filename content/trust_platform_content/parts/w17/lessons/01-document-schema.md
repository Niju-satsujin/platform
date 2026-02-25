---
id: w17-l01
title: "Document Schema"
order: 1
duration_minutes: 25
xp: 50
kind: lesson
part: w17
proof:
  type: paste
  instructions: "Paste the output of your round-trip serialization test showing a Document serialized and deserialized correctly."
  regex_patterns:
    - "serialize|deserialize|round.trip"
    - "pass|OK|match"
---

## Concept

A document in CivicTrust is a structured record — like a birth certificate, a land title, or a building permit. Every document has the same fields: a unique ID (a UUID string), a type (like "birth_certificate" or "permit"), a subject (who the document is about), an issuer (the organization that created it), a timestamp (when it was created), and a body (the actual content as raw bytes).

In C terms, this is a struct with fixed fields plus a variable-length body. The difference in C++ is that you use `std::string` for the text fields and `std::vector<uint8_t>` for the body, so you do not need to manage memory manually.

You also need to serialize and deserialize this struct to bytes. Use the same binary format you learned in Week 3 — length-prefixed fields. Each field is written as: [4-byte length][data]. This lets you reconstruct the exact struct from bytes. You need a round-trip guarantee: if you serialize a Document and then deserialize the bytes, you get back the exact same Document.

## Task

1. Define a `Document` struct with fields: `id` (string), `type` (string), `subject` (string), `issuer` (string), `timestamp` (uint64_t, Unix epoch seconds), `body` (vector of uint8_t)
2. Implement `std::vector<uint8_t> serialize(const Document& doc)` — writes each field as length-prefixed bytes, timestamp as 8 bytes big-endian
3. Implement `Document deserialize(const std::vector<uint8_t>& data)` — reads fields back in the same order
4. Write a round-trip test: create a Document, serialize it, deserialize the bytes, compare every field

## Hints

- For string fields: write the 4-byte length, then the string bytes
- For the timestamp: write it as 8 bytes big-endian (same as you did for the protocol envelope in Week 3)
- For the body: write the 4-byte length, then the body bytes
- In the test, use `assert()` or your test framework to compare each field
- Use `std::chrono::system_clock::now()` to get the current timestamp

## Verify

```bash
cd build && ctest --output-on-failure -R document_schema
```

The test should show the Document survives a serialize → deserialize round-trip with all fields matching.

## Done When

Your Document struct serializes and deserializes correctly, with a passing round-trip test.
