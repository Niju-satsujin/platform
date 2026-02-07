---
id: w07-hashing-integrity-proofs-d04-quest-canonicalization-rules-2h
part: w07-hashing-integrity-proofs
title: "Quest: Canonicalization Rules  2h"
order: 4
duration_minutes: 120
prereqs: ["w07-hashing-integrity-proofs-d03-quest-protocol-hash-envelope-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Canonicalization Rules  2h

## Goal

Hashing the same logical data in two different byte representations produces two different digests. If your sender serialises a struct with little-endian integers and your receiver uses big-endian, the hashes will never match — even though the logical data is identical. This is the #1 cause of false hash mismatches in real systems. Today you define and implement a **single canonical serialization** for all data that will be hashed or signed, and you write tests that prove cross-platform consistency.

By end of this session you will have:

- ✅ Documented a canonical serialization spec (byte order, field order, padding, encoding)
- ✅ Implemented a `CanonicalWriter` that serialises structs into a deterministic byte stream
- ✅ Implemented a `CanonicalReader` that deserialises and validates the byte stream
- ✅ Tested that the same logical struct produces identical bytes on x86-64 and ARM64 (or simulated)
- ✅ Catalogued 5 common canonicalization pitfalls with examples

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | All integers serialised in big-endian (network byte order) | Hex-dump output, verify MSB first |
| 2 | No compiler padding in serialised output | sizeof(canonical) < sizeof(struct) for padded types |
| 3 | String fields length-prefixed, not null-terminated | Inspect wire format |
| 4 | Same struct produces same bytes on two different builds | Compile with different -O levels, compare |
| 5 | Pitfall catalogue has ≥ 5 entries with code examples | Review document |

## What You're Building Today

You are building a canonical serialization layer that guarantees identical byte output for identical logical input, regardless of platform, compiler, or optimisation level. This layer sits between your data structures and the hash/sign functions.

- ✅ A `CanonicalWriter` class with typed `write_u32`, `write_u64`, `write_bytes` methods
- ✅ A `CanonicalReader` class with corresponding `read_u32`, `read_u64`, `read_bytes` methods
- ✅ A pitfall catalogue markdown document
- ✅ Cross-compilation or cross-flag tests

```cpp
class CanonicalWriter {
public:
    void write_u8(uint8_t v) { buf_.push_back(v); }
    void write_u32(uint32_t v) {
        uint32_t be = htonl(v);
        append_raw(&be, 4);
    }
    void write_u64(uint64_t v) {
        uint64_t be = htobe64(v);
        append_raw(&be, 8);
    }
    void write_bytes(const uint8_t* data, uint32_t len) {
        write_u32(len);  // length prefix
        buf_.insert(buf_.end(), data, data + len);
    }
    const std::vector<uint8_t>& data() const { return buf_; }

private:
    std::vector<uint8_t> buf_;
    void append_raw(const void* p, size_t n) {
        auto* b = reinterpret_cast<const uint8_t*>(p);
        buf_.insert(buf_.end(), b, b + n);
    }
};
```

You **can**: add `write_bool`, `write_string`, or varint encoding for compact formats.

You **cannot yet**: sign the canonical bytes — that is Week 8 Day 2 (Sign/Verify Spec).

## Why This Matters

🔴 **Without this, you will:**
- Get different hashes for the same logical message on sender vs receiver, causing false rejections
- Introduce undetectable bugs when changing compilers, optimisation flags, or target architectures
- Hash padding bytes whose content is undefined, producing non-deterministic digests
- Have no spec for a third-party implementation to match your wire format

🟢 **With this, you will:**
- Guarantee hash stability across platforms, compilers, and software versions
- Produce a serialization spec that a teammate (or future you) can implement in any language
- Eliminate the entire class of "phantom mismatch" bugs from your integrity pipeline
- Build the canonical layer that Week 8 Day 2 signs and verifies

🔗 **How this connects:**
- **Week 7 Day 1** (hash use cases) — canonical serialization was introduced; today it is formalised
- **Week 7 Day 3** (protocol hash envelope) — the payload passed to `hash_bytes` must be canonical
- **Week 8 Day 2** (sign/verify) — signs canonical bytes, not raw struct memory
- **Week 8 Day 4** (signed envelope v1) — the envelope header is serialised canonically before signing
- **Week 12 Day 2** (protocol versioning) — canonical format includes version for forward compat

🧠 **Mental model: "Notarial Copy"** — when a notary certifies a document, they work from a *standard form* — same font, same layout, same field order. If two notaries certify the same data but use different forms, the certifications don't match. Canonicalization is the standard form.

## Visual Model

```
  Logical Struct (in memory)
  ┌──────────────────────────────────────┐
  │ uint32_t seq   = 42                  │
  │ [4 bytes padding]  ← compiler adds   │
  │ uint64_t ts    = 1707350400          │
  │ char name[5]   = "Alice"             │
  │ [3 bytes padding]  ← alignment       │
  └──────────────────────────────────────┘
  sizeof = 24 bytes (with padding)

        │  CanonicalWriter
        ▼
  Canonical Bytes (wire format)
  ┌──────────────────────────────────────┐
  │ 00 00 00 2A        ← seq (BE u32)   │
  │ 00 00 00 00 65 C5  ← ts  (BE u64)   │
  │ D4 00                                │
  │ 00 00 00 05        ← name len (BE)   │
  │ 41 6C 69 63 65     ← "Alice" (raw)  │
  └──────────────────────────────────────┘
  17 bytes (no padding, deterministic)

  SHA-256(canonical) = same on every platform
```

## Build

File: `week-7/day4-canonicalization.cpp`

## Do

### 1. **Document your canonical serialization spec**

> 💡 *WHY: A spec is the contract. Without it, two implementers will make different choices and produce different bytes.*

Write a markdown spec covering:

| Rule | Specification |
|------|--------------|
| Integer byte order | Big-endian (network order) |
| Integer sizes | Explicit: u8, u16, u32, u64 |
| Strings / byte arrays | 4-byte big-endian length prefix + raw bytes |
| Booleans | 1 byte: 0x00 = false, 0x01 = true |
| Field order | Alphabetical by field name within a struct |
| Padding | None — fields are packed contiguously |
| Absent/optional fields | Not permitted in v1 — all fields mandatory |

### 2. **Implement `CanonicalWriter`**

> 💡 *WHY: A writer class enforces the spec in code — you can't accidentally skip the byte-order conversion.*

Implement the class as shown above. Add `write_u16` with `htons`. Add `write_string(const std::string&)` that calls `write_bytes`. Ensure no method writes raw struct memory.

### 3. **Implement `CanonicalReader`**

> 💡 *WHY: The reader validates on deserialisation — catching spec violations at parse time rather than at hash-compare time.*

Create a `CanonicalReader` that takes a `const uint8_t*` and `size_t`. Implement `read_u32()` that reads 4 bytes and calls `ntohl`. Implement `read_bytes()` that reads the length prefix, checks bounds, and returns a span. Throw on buffer underflow.

```cpp
class CanonicalReader {
public:
    CanonicalReader(const uint8_t* data, size_t len) : data_(data), len_(len) {}
    uint32_t read_u32() {
        check(4);
        uint32_t v;
        std::memcpy(&v, data_ + pos_, 4);
        pos_ += 4;
        return ntohl(v);
    }
    // ... read_u64, read_bytes similarly
private:
    const uint8_t* data_;
    size_t len_, pos_ = 0;
    void check(size_t n) {
        if (pos_ + n > len_) throw std::runtime_error("canonical: buffer underflow");
    }
};
```

### 4. **Write a round-trip test**

> 💡 *WHY: Serialise → hash → deserialise → re-serialise → hash must produce the same digest. If it doesn't, your canonical form is not stable.*

Create a `Message` struct. Serialise it with `CanonicalWriter`. Hash the output. Deserialise with `CanonicalReader`. Re-serialise the parsed values. Hash again. Assert both hashes are identical.

### 5. **Catalogue canonicalization pitfalls**

> 💡 *WHY: Every entry in this catalogue is a real bug that has caused production incidents. Documenting them prevents repetition.*

Write a markdown list of ≥ 5 pitfalls:

1. **Hashing raw struct memory** — includes padding, different on ARM vs x86
2. **Floating-point representation** — NaN has multiple bit patterns; avoid floats in canonical forms
3. **String encoding** — UTF-8 vs UTF-16 vs locale-dependent; always specify UTF-8
4. **Map/set ordering** — hash maps iterate in random order; sort keys before serialising
5. **Timestamp format** — `time_t` is 32-bit on some platforms; use explicit 64-bit epoch nanoseconds

## Done when

- [ ] Canonical spec document covers byte order, field order, strings, padding — *contract for all hashing/signing*
- [ ] `CanonicalWriter` produces no padding and uses big-endian for all integers — *deterministic output*
- [ ] `CanonicalReader` validates bounds and converts byte order on read — *safe deserialisation*
- [ ] Round-trip test: write → hash → read → re-write → hash produces identical digests — *stability proof*
- [ ] Pitfall catalogue has ≥ 5 entries with code examples — *team reference document*

## Proof

Paste the hex dump of your canonical serialization for a sample struct **and** the two SHA-256 digests from the round-trip test showing they are identical.

**Quick self-test**

1. **Q:** Why alphabetical field order instead of declaration order?
   **A:** Declaration order depends on the source language and may change when fields are added. Alphabetical order is language-independent and insertion-order-stable — a new field "beta" always goes between "alpha" and "gamma" regardless of when it was added.

2. **Q:** Why not use Protocol Buffers or MessagePack for canonical serialization?
   **A:** Most general-purpose serialization formats do *not* guarantee canonical output. Protobuf allows fields in any order and has multiple valid varint encodings for the same value. If you need canonical bytes, you must either use a format that guarantees it (e.g., CBOR deterministic mode) or write your own.

3. **Q:** What happens if you need to add a field to a canonicalised struct in production?
   **A:** You must version the format. v1 messages have fields A, B, C. v2 adds field D. The hash is computed over the versioned canonical form. A v1 verifier ignores field D; a v2 verifier requires it. The version byte is part of the canonical bytes.
