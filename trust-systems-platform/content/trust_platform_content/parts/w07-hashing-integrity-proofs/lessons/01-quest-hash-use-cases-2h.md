---
id: w07-hashing-integrity-proofs-d01-quest-hash-use-cases-2h
part: w07-hashing-integrity-proofs
title: "Quest: Hash Use Cases  2h"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Hash Use Cases  2h

## Goal

Hashing is the most fundamental integrity primitive in distributed systems. Before you sign, encrypt, or verify anything, you hash it. But hashing is subtle: hash the wrong bytes, use the wrong algorithm, or skip canonicalization, and your integrity guarantees silently vanish. Today you build a solid mental model of hash use cases, select appropriate algorithms, and produce deterministic hash output from canonical byte representations in C++ on Linux.

By end of this session you will have:

- ✅ Distinguished preimage resistance, collision resistance, and second-preimage resistance
- ✅ Categorised hash use cases: integrity checks, content addressing, commitment schemes, HMACs
- ✅ Implemented SHA-256 hashing of files and byte buffers using OpenSSL's EVP API
- ✅ Produced identical hashes across runs by canonicalising input bytes before hashing
- ✅ Written cross-platform consistency tests comparing your output to `sha256sum`

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | SHA-256 output matches `sha256sum` for the same input file | Diff hex strings |
| 2 | Hash of a struct produces identical output across compiler runs | Run twice, compare |
| 3 | Code uses OpenSSL EVP API (not deprecated `SHA256()` directly) | Grep for `EVP_DigestUpdate` |
| 4 | Use-case table documents ≥ 4 distinct scenarios | Review markdown output |
| 5 | Canonical byte representation defined for at least one struct | Serialize function present |

## What You're Building Today

You are building a **hash utility library** with functions for hashing files, byte buffers, and serialised structs. The library enforces canonical byte representation before hashing to guarantee cross-run consistency.

- ✅ A `hash_bytes(const uint8_t*, size_t) -> std::array<uint8_t, 32>` function
- ✅ A `hash_file(const char* path) -> std::array<uint8_t, 32>` function
- ✅ A `canonical_serialize(const MyStruct&) -> std::vector<uint8_t>` function
- ✅ A use-case reference table

```cpp
#include <openssl/evp.h>
#include <array>
#include <cstdint>

std::array<uint8_t, 32> hash_bytes(const uint8_t* data, size_t len) {
    std::array<uint8_t, 32> digest{};
    EVP_MD_CTX* ctx = EVP_MD_CTX_new();
    EVP_DigestInit_ex(ctx, EVP_sha256(), nullptr);
    EVP_DigestUpdate(ctx, data, len);
    unsigned int out_len = 0;
    EVP_DigestFinal_ex(ctx, digest.data(), &out_len);
    EVP_MD_CTX_free(ctx);
    return digest;
}
```

You **can**: add SHA-512, BLAKE3, or other algorithms behind the same interface.

You **cannot yet**: use hashes inside a protocol envelope — that is Day 3 (Protocol Hash Envelope).

## Why This Matters

🔴 **Without this, you will:**
- Hash non-canonical data (with padding, alignment, or endianness variance) and get different hashes for the same logical value
- Use MD5 or CRC32 where collision resistance matters, creating exploitable weaknesses
- Confuse non-secret hashes (SHA-256) with secret-keyed MACs (HMAC), misapplying each
- Produce hashes that differ between big-endian and little-endian systems, breaking cross-platform integrity

🟢 **With this, you will:**
- Have a reliable hash function that produces deterministic output for canonical input
- Select the right algorithm for each use case based on security properties
- Build the hash primitive that Week 7 Day 3 wraps into protocol envelopes
- Understand why canonicalization must happen *before* hashing, not after

🔗 **How this connects:**
- **Week 7 Day 2** (streaming hash) — tomorrow extends this to large files without loading into memory
- **Week 7 Day 3** (protocol hash envelope) — embeds the hash in message headers
- **Week 7 Day 4** (canonicalization) — formalises the serialization rules you start today
- **Week 8 Day 2** (sign/verify) — signs the hash, not the raw data
- **Week 8 Day 4** (signed envelope) — the hash becomes part of the signed metadata

🧠 **Mental model: "Fingerprint"** — a hash is a fingerprint of data. Two identical documents always have the same fingerprint. Two different documents (almost certainly) have different fingerprints. But just like real fingerprints, if you scan a dirty finger (non-canonical bytes), you get a bad match even when it is the right person.

## Visual Model

```
  ┌──────────────────────────────────────────────┐
  │            Hash Use Case Map                 │
  │                                              │
  │  Use Case         │ Algorithm │ Keyed? │     │
  │ ──────────────────┼───────────┼────────┤     │
  │  File integrity   │ SHA-256   │  No    │     │
  │  Content address  │ SHA-256   │  No    │     │
  │  Commitment       │ SHA-256   │  No    │     │
  │  Message auth     │ HMAC-256  │  Yes   │     │
  │  Password storage │ Argon2    │  Salt  │     │
  │                                              │
  │  Input Path:                                 │
  │  Raw Struct ──▶ canonical_serialize()         │
  │       │                                      │
  │       ▼                                      │
  │  Canonical Bytes ──▶ hash_bytes()            │
  │       │                                      │
  │       ▼                                      │
  │  32-byte SHA-256 digest                      │
  │  e3b0c44298fc1c14...                         │
  └──────────────────────────────────────────────┘
```

## Build

File: `week-7/day1-hash-use-cases.cpp`

## Do

### 1. **Understand the three hash security properties**

> 💡 *WHY: Choosing the wrong algorithm for the wrong property leads to silent vulnerabilities — CRC32 has zero preimage resistance.*

Study and document in your own words:

| Property | Definition | Broken example |
|----------|-----------|----------------|
| Preimage resistance | Given h, hard to find m where H(m) = h | MD5 (weakened) |
| Second-preimage | Given m1, hard to find m2 ≠ m1 where H(m1) = H(m2) | CRC32 (trivial) |
| Collision resistance | Hard to find any m1 ≠ m2 where H(m1) = H(m2) | SHA-1 (SHAttered) |

### 2. **Implement `hash_bytes` and `hash_file` using OpenSSL EVP**

> 💡 *WHY: The EVP API is OpenSSL's recommended interface — it is algorithm-agnostic and handles engine dispatch.*

Write `hash_bytes()` as shown above. Write `hash_file()` that opens a file, reads in 4 KB chunks, calls `EVP_DigestUpdate` per chunk, and finalises. Link with `-lssl -lcrypto`.

```cpp
std::array<uint8_t, 32> hash_file(const char* path) {
    std::array<uint8_t, 32> digest{};
    FILE* f = fopen(path, "rb");
    EVP_MD_CTX* ctx = EVP_MD_CTX_new();
    EVP_DigestInit_ex(ctx, EVP_sha256(), nullptr);
    char buf[4096];
    size_t n;
    while ((n = fread(buf, 1, sizeof(buf), f)) > 0)
        EVP_DigestUpdate(ctx, buf, n);
    unsigned int out_len;
    EVP_DigestFinal_ex(ctx, digest.data(), &out_len);
    EVP_MD_CTX_free(ctx);
    fclose(f);
    return digest;
}
```

### 3. **Define a canonical serialization for a sample struct**

> 💡 *WHY: `sizeof(MyStruct)` includes compiler-inserted padding. Hashing raw memory produces platform-dependent results.*

Define a struct `Message { uint32_t seq; uint64_t timestamp; char payload[128]; }`. Write `canonical_serialize()` that writes each field in network byte order (big-endian) without padding into a `std::vector<uint8_t>`.

```cpp
std::vector<uint8_t> canonical_serialize(const Message& m) {
    std::vector<uint8_t> buf;
    uint32_t seq_be = htonl(m.seq);
    uint64_t ts_be  = htobe64(m.timestamp);
    buf.insert(buf.end(), (uint8_t*)&seq_be, (uint8_t*)&seq_be + 4);
    buf.insert(buf.end(), (uint8_t*)&ts_be,  (uint8_t*)&ts_be + 8);
    buf.insert(buf.end(), m.payload, m.payload + 128);
    return buf;
}
```

### 4. **Build a use-case reference table**

> 💡 *WHY: A reference table prevents the common mistake of reaching for the wrong hash tool for the job.*

Create a markdown table listing at least 4 use cases with columns: Use Case, Algorithm, Keyed?, Input, Output Size, Notes. Include file integrity, content-addressable storage, commit-then-reveal, and HMAC authentication.

### 5. **Validate against `sha256sum`**

> 💡 *WHY: Cross-tool validation is the only way to prove your implementation is correct — not just self-consistent.*

Create a test file with known content. Hash it with your `hash_file()` and with `sha256sum`. Compare the hex output. They must match exactly.

```bash
echo -n "hello world" > /tmp/test.txt
sha256sum /tmp/test.txt
# b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
```

Run your code and compare: `assert(hex(hash_file("/tmp/test.txt")) == "b94d27b9...")`

## Done when

- [ ] `hash_bytes` output matches `sha256sum` for identical input — *validates correctness*
- [ ] `hash_file` reads in chunks without loading entire file — *prepares for W07D2 streaming*
- [ ] Canonical serialization produces identical bytes across runs — *no padding/endianness variance*
- [ ] Use-case table has ≥ 4 entries with algorithm and keyed/unkeyed distinction — *reference for W07-W08*
- [ ] Test file hash matches `sha256sum` output character-for-character — *cross-tool proof*

## Proof

Paste the hex output of your `hash_file("/tmp/test.txt")` alongside the `sha256sum /tmp/test.txt` output showing an exact match.

**Quick self-test**

1. **Q:** Why not just hash the struct with `hash_bytes((uint8_t*)&msg, sizeof(msg))`?
   **A:** `sizeof(msg)` includes compiler padding bytes between fields. These padding bytes are uninitialised and may differ between runs or compilers, producing different hashes for the same logical data.

2. **Q:** When would you use HMAC-SHA256 instead of plain SHA-256?
   **A:** When you need to prove that the hash was produced by someone who knows a shared secret. Plain SHA-256 can be computed by anyone. HMAC prevents forgery — an attacker cannot produce a valid HMAC without the key.

3. **Q:** Is SHA-256 sufficient for password hashing?
   **A:** No. SHA-256 is too fast — an attacker can try billions of passwords per second on a GPU. Use a memory-hard function like Argon2id or bcrypt that deliberately slows down brute-force attempts.
