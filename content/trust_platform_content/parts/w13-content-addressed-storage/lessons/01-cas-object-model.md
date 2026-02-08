---
id: w13-content-addressed-storage-d01-cas-object-model
part: w13-content-addressed-storage
title: "CAS Object Model"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# CAS Object Model

## Goal

Content-Addressed Storage (CAS) replaces arbitrary filenames with **deterministic
hash-derived identifiers**. Today you internalise the core invariant: the address
of every object IS the canonical hash of its normalised byte representation. Two
blobs with identical content always resolve to the same address—no registry, no
coordination, no conflicts.

✅ Deliverables

1. Implement a `CASObject` struct that stores raw bytes and computes its own SHA-256 ID.
2. Write a normalisation function that strips trailing whitespace and enforces LF line endings.
3. Prove that identical content always yields the same object ID.
4. Prove that a single-bit difference yields a completely different ID.
5. Build a CLI driver that accepts a file path, normalises, hashes, and prints the CAS ID.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | `CASObject::id()` returns hex-encoded SHA-256 of normalised bytes | exact match against `sha256sum` |
| 2 | Two identical files produce the same CAS ID | 100 % reproducible |
| 3 | One-byte mutation produces a different CAS ID | Hamming distance > 0 on every bit pair |
| 4 | Normalisation is idempotent—running twice yields same bytes | byte-for-byte equality |
| 5 | CLI exits 0 on valid input, exits 1 with message on empty input | return code check |

## What You're Building Today

A minimal CAS object library in C++ that takes raw bytes, normalises them, and
derives a content address via SHA-256. The library exposes a `CASObject` struct
and a standalone `cas_id()` helper.

✅ Deliverables

- `cas_object.h` — header with `CASObject` and helpers.
- `cas_object.cpp` — implementation.
- `main.cpp` — CLI driver: `./cas_id <file>`.
- `CMakeLists.txt` — build file linking OpenSSL.

```cpp
// Quick taste — full version in Build section
#include "cas_object.h"
#include <iostream>

int main(int argc, char* argv[]) {
    if (argc < 2) { std::cerr << "usage: cas_id <file>\n"; return 1; }
    auto obj = CASObject::from_file(argv[1]);
    std::cout << obj.id() << "\n";
    return 0;
}
```

**Can:**
- Hash any file up to available RAM.
- Compare two CAS IDs for deduplication.
- Pipe output to other UNIX tools.

**Cannot (yet):**
- Store objects persistently (Day 2).
- Chunk large files (Day 3).
- Garbage-collect unreferenced objects (Day 4).

## Why This Matters

🔴 **Without content addressing**

1. Filenames collide across nodes—two engineers push `config.yaml` with different content.
2. No intrinsic integrity check—bit-rot goes unnoticed until runtime failure.
3. Deduplication requires an external index that itself can desynchronise.
4. Renaming a file breaks every reference to it.

🟢 **With content addressing**

1. Identity IS content—rename the file, the CAS ID stays the same.
2. Integrity is built-in—recompute the hash, compare, done.
3. Deduplication is automatic—same bytes → same address → store once.
4. Distributed nodes converge without coordination—hash is universal.

🔗 **Connects to**

1. Day 2 — CAS Write Lifecycle uses `CASObject` for atomic blob persistence.
2. Day 3 — Chunk Manifest Spec hashes chunks then hashes the manifest.
3. Week 14 — Merkle trees build on per-object hashes as leaf nodes.
4. Week 15 — Transparency log entries reference CAS object IDs.
5. Week 16 — Monitors verify object integrity during gossip.

🧠 **Mental model:** Think of a library where every book's shelf position is
determined by its ISBN, and the ISBN is computed from the exact text inside the
book. Move the book, its ISBN stays. Change one word, the ISBN changes. No
librarian needed.

## Visual Model

```
┌──────────────────────────────────────────────────┐
│                 CAS Object Model                 │
├──────────────────────────────────────────────────┤
│                                                  │
│   Raw Bytes ──▶ Normalise ──▶ SHA-256 ──▶ ID    │
│                                                  │
│   ┌────────────┐    ┌────────────┐   ┌────────┐ │
│   │ "Hello\r\n"│──▶│ "Hello\n"  │──▶│ a1b2c3 │ │
│   └────────────┘    └────────────┘   └────────┘ │
│                                                  │
│   ┌────────────┐    ┌────────────┐   ┌────────┐ │
│   │ "Hello\n"  │──▶│ "Hello\n"  │──▶│ a1b2c3 │ │
│   └────────────┘    └────────────┘   └────────┘ │
│                          ▼                       │
│                  Same content ──▶ Same ID        │
│                                                  │
│   ┌────────────┐    ┌────────────┐   ┌────────┐ │
│   │ "Hellp\n"  │──▶│ "Hellp\n"  │──▶│ f4e5d6 │ │
│   └────────────┘    └────────────┘   └────────┘ │
│                          ▼                       │
│                  Different content ──▶ Diff ID   │
└──────────────────────────────────────────────────┘
```

## Build

**File:** `week-13/day1-cas-object-model/cas_object.h`

```cpp
#pragma once
#include <string>
#include <vector>
#include <cstdint>

struct CASObject {
    std::vector<uint8_t> data;   // normalised content

    // Compute hex-encoded SHA-256 of `data`
    std::string id() const;

    // Normalise raw bytes: strip trailing whitespace per line, enforce LF
    static std::vector<uint8_t> normalise(const std::vector<uint8_t>& raw);

    // Convenience: load from file path
    static CASObject from_file(const std::string& path);
};
```

**File:** `week-13/day1-cas-object-model/cas_object.cpp`

```cpp
#include "cas_object.h"
#include <openssl/sha.h>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <iomanip>

std::string CASObject::id() const {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256(data.data(), data.size(), hash);
    std::ostringstream oss;
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i)
        oss << std::hex << std::setfill('0') << std::setw(2)
            << static_cast<int>(hash[i]);
    return oss.str();
}

std::vector<uint8_t> CASObject::normalise(const std::vector<uint8_t>& raw) {
    std::vector<uint8_t> out;
    out.reserve(raw.size());
    for (size_t i = 0; i < raw.size(); ++i) {
        if (raw[i] == '\r') continue;           // drop CR
        out.push_back(raw[i]);
    }
    // strip trailing whitespace on each line
    // (left as exercise — skeleton above)
    return out;
}

CASObject CASObject::from_file(const std::string& path) {
    std::ifstream f(path, std::ios::binary);
    if (!f) throw std::runtime_error("cannot open " + path);
    std::vector<uint8_t> raw((std::istreambuf_iterator<char>(f)),
                              std::istreambuf_iterator<char>());
    return CASObject{normalise(raw)};
}
```

## Do

1. **Create project skeleton**
   💡 WHY: Separating header, implementation, and driver keeps compilation fast
   and lets tests link against the library without the `main` symbol.
   - `mkdir -p week-13/day1-cas-object-model && cd week-13/day1-cas-object-model`
   - Create `cas_object.h`, `cas_object.cpp`, `main.cpp`, `CMakeLists.txt`.

2. **Implement `normalise()`**
   💡 WHY: Normalisation guarantees that the same logical content—regardless of
   OS line-ending conventions—always produces the same hash.
   - Strip `\r`, collapse trailing spaces per line, ensure final `\n`.
   - Write a unit test: feed `"Hello\r\n  \r\n"` and assert LF-only output.

3. **Implement `CASObject::id()`**
   💡 WHY: SHA-256 is the standard hash for CAS because it is collision-resistant
   and widely audited.
   - Link OpenSSL (`target_link_libraries(cas_id OpenSSL::Crypto)`).
   - Verify against `echo -n "Hello\n" | sha256sum`.

4. **Build the CLI driver**
   💡 WHY: A CLI lets you pipe CAS IDs into downstream tools (grep, diff, sort)
   which is essential for scripting integrity checks.
   - Accept one argument: file path.
   - Print hex CAS ID to stdout, errors to stderr, exit codes 0/1.

5. **Run the dedup & mutation proof**
   💡 WHY: These two tests ARE the CAS invariant—same content same ID, different
   content different ID. If either fails, the entire storage model is unsound.
   - Create two files with identical content → assert same ID.
   - Flip one byte → assert different ID.
   - Record both outputs in `proof.txt`.

## Done when

- [ ] `CASObject::id()` matches `sha256sum` output for the same normalised bytes — *proves hash correctness*
- [ ] Two identical files produce the same CAS ID in repeated runs — *proves determinism*
- [ ] A one-bit change yields a completely different CAS ID — *proves avalanche property*
- [ ] `normalise()` is idempotent (double-normalise == single-normalise) — *proves convergence*
- [ ] CLI exits 0 on valid input and exits 1 with a message on missing/empty input — *proves error handling*

## Proof

Paste or upload:
1. Terminal output showing two identical files producing the same CAS ID.
2. Terminal output showing a one-byte mutation producing a different CAS ID.
3. `diff` of normalise(raw) vs normalise(normalise(raw)) showing zero diff.

**Quick self-test**

Q: Why must normalisation happen BEFORE hashing?
A: Because different byte representations of the same logical content (e.g., CRLF vs LF) would produce different hashes, breaking the "same content → same ID" invariant.

Q: What happens if you skip normalisation and two nodes use different OS conventions?
A: The same logical file gets two different CAS IDs—deduplication fails, and Merkle trees on different nodes diverge.

Q: Why is SHA-256 preferred over MD5 for CAS IDs?
A: MD5 has known collision attacks—an adversary can craft two different blobs with the same MD5 hash, breaking the "different content → different ID" guarantee.
