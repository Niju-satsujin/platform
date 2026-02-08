---
id: w13-content-addressed-storage-d02-cas-write-lifecycle
part: w13-content-addressed-storage
title: "CAS Write Lifecycle"
order: 2
duration_minutes: 120
prereqs: ["w13-content-addressed-storage-d01-cas-object-model"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# CAS Write Lifecycle

## Goal

Yesterday you built the identity function for CAS: content → hash → address.
Today you make objects **durable**. The core invariant: an incomplete write must
NEVER appear as a valid object in the store. You implement atomic blob persistence
using the classic write-to-temp-then-rename pattern and verify checksums at rest.

✅ Deliverables

1. Implement `CASStore::put()` that writes to a temp file, fsyncs, then atomically renames.
2. Implement `CASStore::get()` that reads, re-hashes, and returns only if the checksum matches.
3. Implement `CASStore::exists()` that checks for the object path without reading.
4. Write a crash-simulation test that kills the write mid-stream and verifies no partial object.
5. Build a CLI `cas_store put <file>` / `cas_store get <id>` tool.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | `put()` writes temp file, fsyncs, and renames atomically | strace shows rename after fsync |
| 2 | Interrupted write leaves zero partial objects in store | kill -9 during write → `ls` shows no orphan |
| 3 | `get()` recomputes hash and rejects tampered objects | flip one byte on disk → get returns error |
| 4 | Object path maps hash prefix to directory fan-out | `ab/cdef01...` two-char prefix dir structure |
| 5 | CLI returns 0 on success, 1 on not-found, 2 on corruption | exit code check |

## What You're Building Today

A `CASStore` class that manages on-disk object persistence. Objects are stored
under a fan-out directory structure (`objects/ab/cdef01234...`) to avoid
single-directory inode pressure. Writes use a staging area and atomic rename.

✅ Deliverables

- `cas_store.h` / `cas_store.cpp` — store implementation.
- `main.cpp` — CLI driver with `put` and `get` subcommands.
- `CMakeLists.txt` — build file.
- `test_crash.sh` — bash script that simulates crash during write.

```cpp
// Quick taste
CASStore store("/tmp/cas");
std::string id = store.put(blob_bytes);   // atomic write
auto data = store.get(id);                // verified read
```

**Can:**
- Persist any blob up to filesystem limits.
- Verify integrity on every read.
- Survive process crash during write.

**Cannot (yet):**
- Handle multi-chunk files (Day 3).
- Remove unreferenced objects (Day 4).

## Why This Matters

🔴 **Without atomic writes**

1. Power loss mid-write leaves a half-written blob with a valid-looking path.
2. A reader picks up the partial blob, computes a wrong hash, and silently corrupts downstream state.
3. No checksum at rest means bit-rot accumulates undetected.
4. Fan-out omission causes ext4 directory lookup degradation at ~10 K entries.

🟢 **With atomic write-then-rename**

1. Readers see either the old state or the complete new object—never partial.
2. fsync before rename guarantees data is on disk, not just in page cache.
3. Re-hash on read catches silent corruption immediately.
4. Two-character fan-out keeps directory sizes manageable at millions of objects.

🔗 **Connects to**

1. Day 1 — Uses `CASObject::id()` and `normalise()` from yesterday.
2. Day 3 — Chunk manifests are stored as CAS objects via this same `put()` path.
3. Day 4 — GC policy deletes objects via the path structure you define today.
4. Week 14 — Merkle tree nodes reference CAS object IDs persisted by this store.
5. Week 15 — Transparency log entries point to CAS blobs.

🧠 **Mental model:** Think of a post office with numbered PO boxes. To deliver a
letter, you first place it in a staging drawer, stamp it, then move it into the
box. If you are interrupted before the move, the box remains empty—never
half-stuffed.

## Visual Model

```
┌───────────────────────────────────────────────────────┐
│              CAS Write Lifecycle                      │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Caller ──▶ put(bytes)                                │
│               │                                       │
│               ▼                                       │
│  ┌─────────────────────────┐                          │
│  │  1. Normalise + Hash    │──▶ id = sha256(norm)     │
│  └─────────────────────────┘                          │
│               │                                       │
│               ▼                                       │
│  ┌─────────────────────────┐                          │
│  │  2. Write to tmp/XXXXXX │  (staging area)          │
│  └─────────────────────────┘                          │
│               │                                       │
│               ▼                                       │
│  ┌─────────────────────────┐                          │
│  │  3. fsync(fd)           │  (flush to disk)         │
│  └─────────────────────────┘                          │
│               │                                       │
│               ▼                                       │
│  ┌─────────────────────────┐                          │
│  │  4. rename(tmp, ab/cd…) │  (atomic commit)         │
│  └─────────────────────────┘                          │
│               │                                       │
│          ▼         ▼                                   │
│     [SUCCESS]   [CRASH]                                │
│     Object       tmp file                              │
│     visible      cleaned on                            │
│     at path      next startup                          │
└───────────────────────────────────────────────────────┘
```

## Build

**File:** `week-13/day2-cas-write-lifecycle/cas_store.h`

```cpp
#pragma once
#include <string>
#include <vector>
#include <cstdint>
#include <optional>
#include <filesystem>

class CASStore {
public:
    explicit CASStore(const std::filesystem::path& root);

    // Atomically persist blob, return CAS ID
    std::string put(const std::vector<uint8_t>& data);

    // Read and verify object; nullopt if missing or corrupt
    std::optional<std::vector<uint8_t>> get(const std::string& id) const;

    // Check existence without reading
    bool exists(const std::string& id) const;

    std::filesystem::path root() const { return root_; }

private:
    std::filesystem::path root_;
    std::filesystem::path object_path(const std::string& id) const;
    std::filesystem::path tmp_dir() const;
};
```

**File:** `week-13/day2-cas-write-lifecycle/cas_store.cpp`

```cpp
#include "cas_store.h"
#include "cas_object.h"
#include <fstream>
#include <unistd.h>
#include <cstdio>
#include <stdexcept>

CASStore::CASStore(const std::filesystem::path& root) : root_(root) {
    std::filesystem::create_directories(root_ / "objects");
    std::filesystem::create_directories(root_ / "tmp");
}

std::filesystem::path CASStore::object_path(const std::string& id) const {
    return root_ / "objects" / id.substr(0, 2) / id.substr(2);
}

std::string CASStore::put(const std::vector<uint8_t>& data) {
    auto norm = CASObject::normalise(data);
    CASObject obj{norm};
    std::string id = obj.id();

    if (exists(id)) return id;  // dedup: already stored

    auto dest = object_path(id);
    std::filesystem::create_directories(dest.parent_path());

    // 1. Write to staging temp file
    auto tmp = tmp_dir() / "cas_XXXXXX";
    std::string tmp_s = tmp.string();
    int fd = mkstemp(tmp_s.data());
    if (fd < 0) throw std::runtime_error("mkstemp failed");
    ::write(fd, norm.data(), norm.size());

    // 2. fsync to guarantee durability
    fsync(fd);
    close(fd);

    // 3. Atomic rename — readers never see partial data
    std::rename(tmp_s.c_str(), dest.c_str());
    return id;
}

std::optional<std::vector<uint8_t>> CASStore::get(const std::string& id) const {
    auto path = object_path(id);
    std::ifstream f(path, std::ios::binary);
    if (!f) return std::nullopt;

    std::vector<uint8_t> data((std::istreambuf_iterator<char>(f)),
                               std::istreambuf_iterator<char>());
    CASObject obj{data};
    if (obj.id() != id) return std::nullopt;  // integrity check failed
    return data;
}
```

## Do

1. **Set up project structure**
   💡 WHY: Reusing yesterday's `CASObject` avoids re-implementing hash logic and
   proves composition across days.
   - Copy `cas_object.h/cpp` from Day 1 into this project.
   - Create `cas_store.h`, `cas_store.cpp`, `main.cpp`, `CMakeLists.txt`.

2. **Implement fan-out directory mapping**
   💡 WHY: A flat directory with millions of entries degrades lookup from O(1) to
   O(n) on many filesystems. Two-char fan-out caps each directory at 256 × N.
   - `object_path("abcdef...")` → `objects/ab/cdef...`
   - Write a test asserting correct path construction.

3. **Implement atomic `put()`**
   💡 WHY: Write-to-temp + fsync + rename is the POSIX-blessed pattern for
   crash-safe file creation. Rename on the same filesystem is atomic per POSIX.
   - Use `mkstemp` for the temp file.
   - `fsync()` the file descriptor before `rename()`.
   - Return early if `exists()` is already true (dedup).

4. **Implement verified `get()`**
   💡 WHY: Re-hashing on read catches silent corruption (bit-rot, accidental
   overwrite) at the earliest possible moment.
   - Read bytes, compute SHA-256, compare to the requested ID.
   - Return `std::nullopt` if hash mismatches or file is missing.

5. **Run crash simulation**
   💡 WHY: This is the acid test—if a kill -9 during write produces a reachable
   partial object, the entire CAS guarantee is broken.
   - Write a bash script that starts a large `put()`, sends SIGKILL, then
     checks for orphaned files in `objects/`.
   - Record output in `proof.txt`.

## Done when

- [ ] `put()` uses write-to-temp + fsync + rename (confirmed via `strace`) — *proves atomicity*
- [ ] `get()` rejects a tampered-on-disk object (flip a byte, read fails) — *proves integrity verification*
- [ ] Kill -9 during write leaves no partial object in `objects/` — *proves crash safety*
- [ ] Fan-out produces `objects/ab/cdef...` path structure — *proves scalable layout*
- [ ] CLI `put` then `get` round-trips successfully — *proves end-to-end correctness*

## Proof

Paste or upload:
1. `strace` excerpt showing `openat(tmp)` → `fsync` → `rename` sequence.
2. Screenshot or log showing crash simulation left zero orphans.
3. Output of `get()` rejecting a manually corrupted blob.

**Quick self-test**

Q: Why must `fsync()` happen BEFORE `rename()`?
A: Without fsync, the kernel may reorder operations—rename lands on disk before the data, so a crash after rename but before data flush produces a zero-length or partial file at the final path.

Q: Why is `rename()` atomic on POSIX but a copy-then-delete is not?
A: `rename()` on the same filesystem updates a single directory entry pointer in one metadata operation. Copy-then-delete involves multiple data + metadata writes that can be interrupted.

Q: What happens if `exists()` returns true but the on-disk blob is corrupt?
A: `put()` skips writing (dedup), but `get()` will detect corruption via re-hash. Day 5's audit catches this at rest.
