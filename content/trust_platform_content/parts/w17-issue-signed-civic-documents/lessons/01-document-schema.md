---
id: w17-issue-signed-civic-documents-d01-document-schema
part: w17-issue-signed-civic-documents
title: "Document Schema"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Document Schema

## Goal

Define the canonical schema for signed civic documents so that every issuer, verifier, and archival node agrees on exactly which fields exist, how they are ordered, and how the canonical hash is computed.

### ✅ Deliverables

1. A C++ `CivicDocument` struct with typed fields: issuer ID, subject, issue timestamp, expiration, payload hash, and schema version.
2. A canonical serialisation function that produces a deterministic byte sequence regardless of field insertion order.
3. A SHA-256 canonical hash function that digests the serialised form.
4. Unit tests proving identical documents produce identical hashes across runs.
5. A markdown design document shipped as `week-17/day1-document-schema.md`.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | `CivicDocument` struct compiles with all required fields | `g++ -std=c++20 -c civic_document.cpp` succeeds |
| 2 | Canonical serialisation is deterministic | Two identical structs produce byte-identical output |
| 3 | SHA-256 hash matches reference vector | Compare against `openssl dgst -sha256` of same bytes |
| 4 | Schema version mismatch is detected at parse time | Parser rejects version 0 documents with clear error |
| 5 | Design doc exists and lists all fields | `week-17/day1-document-schema.md` contains field table |

## What You're Building Today

You are building the foundational data structure that every civic document in the CivicTrust system shares. Think of it as the "birth certificate of the birth certificate" — the schema that every downstream component trusts implicitly.

### ✅ Deliverables

- `civic_document.h` — struct definition with strong types
- `canonical_serialise.cpp` — deterministic byte serialisation
- `canonical_hash.cpp` — SHA-256 over canonical bytes
- `schema_test.cpp` — round-trip and determinism tests

```cpp
// civic_document.h — core schema
#pragma once
#include <cstdint>
#include <string>
#include <array>
#include <chrono>

struct CivicDocument {
    uint32_t                schema_version{1};
    std::string             issuer_id;        // DID or public-key fingerprint
    std::string             subject;          // human-readable subject line
    int64_t                 issue_ts;         // Unix epoch seconds
    int64_t                 expiration_ts;    // 0 = no expiry
    std::array<uint8_t,32>  payload_hash;     // SHA-256 of raw payload
};
```

You **can**:
- Serialise and hash any `CivicDocument` deterministically.
- Detect schema-version mismatches before further processing.

You **cannot yet**:
- Sign the document (Week 17, Day 3).
- Anchor to a transparency log (Week 18).
- Verify offline (Week 19).

## Why This Matters

🔴 **Without a canonical schema:**
- Different implementations serialize fields in different orders → different hashes.
- Verifiers reject valid documents because bytes don't match.
- Schema drift between issuers silently corrupts archives.
- No automated tooling can parse unknown field layouts.

🟢 **With a canonical schema:**
- Every node in the network agrees on the byte representation.
- Hash-based integrity checks become trivially reproducible.
- New issuers on-board by implementing one known interface.
- Archival systems index documents without per-issuer parsers.

🔗 **Connects:**
- **Week 7** (Merkle trees) — document hashes become tree leaves.
- **Week 12** (consensus checkpoints) — checkpoint includes latest document hash.
- **Week 14** (identity primitives) — issuer ID format defined there feeds in here.
- **Week 18** (transparency log) — anchored hash must match canonical hash.
- **Week 19** (offline verification) — offline bundle carries serialised document.

🧠 **Mental model: "The Passport Blank"** — A passport blank has pre-printed fields in fixed positions. If you move the photo slot, no border agent's scanner works. The canonical schema is your passport blank: fixed, versioned, universally agreed upon.

## Visual Model

```
┌──────────────────────────────────────────────────┐
│              CivicDocument v1 Schema              │
├──────────────────────────────────────────────────┤
│  schema_version : uint32  [4 bytes, big-endian]  │
│  issuer_id      : string  [len-prefix + UTF-8]   │
│  subject        : string  [len-prefix + UTF-8]   │
│  issue_ts       : int64   [8 bytes, big-endian]  │
│  expiration_ts  : int64   [8 bytes, big-endian]  │
│  payload_hash   : bytes   [32 bytes, raw]        │
├──────────────────────────────────────────────────┤
│                    ▼ canonical_serialise()        │
│        deterministic byte buffer (no padding)     │
│                    ▼ SHA-256                      │
│        canonical_hash  [32 bytes]                 │
└──────────────────────────────────────────────────┘
        ▼                          ▼
   Sign (Day 3)            Anchor (Week 18)
```

## Build

File: `week-17/day1-document-schema.md`

## Do

### 1. **Define the struct with strong types**

> 💡 *WHY: Strong types prevent accidental field swaps (e.g., passing expiration where issue_ts is expected).*

Create `civic_document.h`. Use `int64_t` for timestamps (not `time_t` which varies by platform). Use `std::array<uint8_t,32>` for hashes — never raw pointers.

### 2. **Implement canonical serialisation**

> 💡 *WHY: JSON, MessagePack, and Protobuf all allow field reordering. A hand-rolled canonical form guarantees byte-identical output.*

Write `canonical_serialise()` that writes fields in schema order: version → issuer_id (4-byte length prefix, big-endian, then UTF-8 bytes) → subject → issue_ts → expiration_ts → payload_hash. No padding, no alignment bytes.

### 3. **Implement canonical hash**

> 💡 *WHY: The hash is the document's identity. Every downstream system — signing, anchoring, verification — references this hash.*

Use OpenSSL's `EVP_Digest` with `EVP_sha256()` over the canonical byte buffer. Return `std::array<uint8_t,32>`.

### 4. **Write determinism tests**

> 💡 *WHY: If two machines produce different hashes for the same document, the entire trust chain breaks.*

Construct two `CivicDocument` instances with identical field values. Serialise both. Assert byte-for-byte equality. Hash both. Assert hash equality. Then mutate one field and assert hashes diverge.

### 5. **Write the design document**

> 💡 *WHY: The design doc is the human-readable contract that reviewers and future maintainers rely on when the code is ambiguous.*

Create `week-17/day1-document-schema.md` with: field table, serialisation rules, hash algorithm choice rationale, and a versioning upgrade path (how schema v2 would be introduced without breaking v1 verifiers).

## Done when

- [ ] `CivicDocument` struct compiles cleanly under `-std=c++20 -Wall -Werror` — *reused in every signing and verification module through Week 20*
- [ ] Canonical serialisation produces identical bytes for identical structs across separate program runs — *determinism is the bedrock of Merkle anchoring in Week 18*
- [ ] SHA-256 hash matches `openssl dgst -sha256` reference for a known test vector — *hash correctness is assumed by every downstream verifier*
- [ ] Schema version mismatch raises a clear, typed error — *version gating prevents silent corruption when schema v2 ships*
- [ ] Design document lists all fields, byte layouts, and upgrade strategy — *auditors in Week 20 reference this document during restore validation*

## Proof

Upload your `week-17/day1-document-schema.md` design document **and** a terminal screenshot showing the test binary passing all assertions.

### **Quick self-test**

**Q1:** Why can't you use `std::map` serialisation for canonical form?
→ **A: `std::map` orders by key comparison, but different STL implementations may serialise padding or alignment differently. A hand-rolled serialiser with explicit byte order is the only guarantee of cross-platform determinism.**

**Q2:** What happens if `expiration_ts` is 0?
→ **A: By convention, 0 means "no expiry." The serialiser still writes 8 zero bytes — the field is never omitted, preserving fixed-offset parsing.**

**Q3:** Why big-endian for integer fields?
→ **A: Network byte order (big-endian) is the universal convention for cross-platform binary protocols. It avoids needing to negotiate endianness between heterogeneous nodes.**
