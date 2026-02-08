---
id: w13-content-addressed-storage-d03-chunk-manifest-spec
part: w13-content-addressed-storage
title: "Chunk Manifest Spec"
order: 3
duration_minutes: 120
prereqs: ["w13-content-addressed-storage-d02-cas-write-lifecycle"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Chunk Manifest Spec

## Goal

Large files cannot be stored or transferred as single blobs—network interruptions
force full re-transfer, and deduplication across similar files fails. Today you
break files into chunks, store each chunk as a CAS object, and create a
**manifest** object that commits to the exact order and size of every chunk. The
manifest hash becomes the file's CAS identity.

✅ Deliverables

1. Implement fixed-size chunking with a configurable block size (default 1 MiB).
2. Implement a rolling-hash (Rabin) chunker for content-defined boundaries.
3. Define a manifest JSON schema: `{ chunks: [{id, offset, size}], total_size }`.
4. Store the manifest as a CAS object and prove its hash changes when chunk order changes.
5. Implement reassembly: read manifest → fetch chunks → concatenate → verify final hash.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Fixed chunker produces ceil(file_size / block_size) chunks | exact count |
| 2 | Rolling chunker produces chunks between min and max size bounds | all chunks within [min, max] |
| 3 | Manifest hash changes when chunk order is swapped | different ID on swap |
| 4 | Reassembled file is byte-for-byte identical to original | `diff` returns 0 |
| 5 | Shared chunks between two similar files are stored once | dedup ratio > 0 |

## What You're Building Today

A chunking library and manifest spec that turns large files into a DAG of CAS
objects: leaf nodes are chunks, the root is the manifest. The manifest is itself
a CAS object stored via yesterday's `CASStore::put()`.

✅ Deliverables

- `chunker.h` / `chunker.cpp` — fixed and rolling chunkers.
- `manifest.h` / `manifest.cpp` — manifest creation and reassembly.
- `main.cpp` — CLI: `cas_chunk split <file>` / `cas_chunk assemble <manifest-id>`.
- Unit tests verifying dedup across two nearly-identical files.

```cpp
// Quick taste
Chunker chunker(store, 1 << 20);  // 1 MiB blocks
std::string manifest_id = chunker.split("large_file.bin");
chunker.assemble(manifest_id, "output.bin");
// diff large_file.bin output.bin → identical
```

**Can:**
- Chunk and reassemble any file.
- Deduplicate shared chunks across files.
- Transfer only missing chunks.

**Cannot (yet):**
- Garbage-collect orphaned chunks (Day 4).
- Verify chunk integrity across distributed replicas (Week 14).

## Why This Matters

🔴 **Without chunking**

1. A 4 GiB file requires 4 GiB of contiguous transfer—one packet loss restarts everything.
2. Two versions of a file differing by one byte are stored twice in full.
3. Parallel transfer is impossible—only one thread can process the monolithic blob.
4. Memory-mapped hashing of huge files fails on 32-bit address spaces.

🟢 **With chunk manifests**

1. Resume transfer at chunk granularity—only re-send failed chunks.
2. Content-defined chunking deduplicates overlapping regions across file versions.
3. Chunks can be fetched in parallel from multiple sources.
4. Each chunk fits comfortably in memory for hashing and verification.

🔗 **Connects to**

1. Day 1 — Each chunk is a `CASObject` with its own content-derived ID.
2. Day 2 — Chunks and manifests are persisted via `CASStore::put()`.
3. Day 4 — GC must trace manifest → chunk references before sweeping.
4. Week 14 — Merkle trees can use chunk IDs as leaf nodes.
5. Week 15 — Log entries may reference manifest IDs for versioned artefacts.

🧠 **Mental model:** A book's table of contents lists chapter titles and page
numbers. The manifest is that table of contents—it commits to the order and
identity of every chunk. Change a chapter and the table of contents changes too.

## Visual Model

```
┌──────────────────────────────────────────────────────┐
│              Chunk Manifest Structure                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Original File (12 MiB)                              │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬───┐  │
│  │ C0 │ C1 │ C2 │ C3 │ C4 │ C5 │ C6 │ C7 │ C8 │C9│  │
│  └─┬──┴─┬──┴─┬──┴─┬──┴─┬──┴─┬──┴─┬──┴─┬──┴─┬──┴┬─┘  │
│    │    │    │    │    │    │    │    │    │  │   │
│    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼  ▼   │
│  ┌──────────────────────────────────────────────┐ │
│  │           Manifest (JSON blob)               │ │
│  │  {                                           │ │
│  │    "chunks": [                               │ │
│  │      {"id":"aa..","offset":0,"size":1048576} │ │
│  │      {"id":"bb..","offset":1048576,...}       │ │
│  │      ...                                     │ │
│  │    ],                                        │ │
│  │    "total_size": 12582912                    │ │
│  │  }                                           │ │
│  └──────────────────┬───────────────────────────┘ │
│                     ▼                              │
│              Manifest CAS ID                       │
│              (root identity)                       │
└──────────────────────────────────────────────────────┘
```

## Build

**File:** `week-13/day3-chunk-manifest-spec/chunker.h`

```cpp
#pragma once
#include "cas_store.h"
#include <string>
#include <vector>
#include <cstdint>
#include <cstddef>

struct ChunkEntry {
    std::string id;
    size_t offset;
    size_t size;
};

struct Manifest {
    std::vector<ChunkEntry> chunks;
    size_t total_size;
    std::string to_json() const;
    static Manifest from_json(const std::string& json);
};

class Chunker {
public:
    Chunker(CASStore& store, size_t block_size = 1 << 20);

    // Split file into chunks, store each, create manifest, return manifest ID
    std::string split(const std::string& file_path);

    // Read manifest, fetch chunks, concatenate, write to output path
    void assemble(const std::string& manifest_id, const std::string& out_path);

private:
    CASStore& store_;
    size_t block_size_;
};
```

**File:** `week-13/day3-chunk-manifest-spec/chunker.cpp`

```cpp
#include "chunker.h"
#include <fstream>
#include <stdexcept>

Chunker::Chunker(CASStore& store, size_t block_size)
    : store_(store), block_size_(block_size) {}

std::string Chunker::split(const std::string& file_path) {
    std::ifstream f(file_path, std::ios::binary);
    if (!f) throw std::runtime_error("cannot open " + file_path);

    Manifest manifest;
    manifest.total_size = 0;
    std::vector<uint8_t> buf(block_size_);

    while (f) {
        f.read(reinterpret_cast<char*>(buf.data()), block_size_);
        auto n = static_cast<size_t>(f.gcount());
        if (n == 0) break;

        std::vector<uint8_t> chunk(buf.begin(), buf.begin() + n);
        std::string chunk_id = store_.put(chunk);
        manifest.chunks.push_back({chunk_id, manifest.total_size, n});
        manifest.total_size += n;
    }

    // Store manifest itself as a CAS object
    std::string json = manifest.to_json();
    std::vector<uint8_t> json_bytes(json.begin(), json.end());
    return store_.put(json_bytes);
}
```

## Do

1. **Implement fixed-size chunker**
   💡 WHY: Fixed-size is simplest to reason about and sufficient when files are
   not frequently edited. It establishes the chunk → manifest → CAS ID pipeline.
   - Read file in `block_size` increments, store each chunk via `CASStore::put()`.
   - Build a `Manifest` struct, serialise to JSON, store as CAS object.

2. **Implement manifest serialisation**
   💡 WHY: The manifest IS the commitment—its hash pins the exact chunk order.
   JSON makes it human-readable and debuggable.
   - `to_json()` emits deterministic JSON (sorted keys, no extra whitespace).
   - `from_json()` parses and validates all required fields.

3. **Implement reassembly**
   💡 WHY: If you cannot faithfully reconstruct the original file from chunks,
   the entire chunking scheme is useless.
   - Read manifest → iterate chunks → `store_.get(id)` each → write to output.
   - `diff` original vs reassembled → zero differences.

4. **Add rolling-hash chunker (stretch)**
   💡 WHY: Content-defined chunking finds natural boundaries so insertions
   shift only one chunk boundary, maximising dedup across versions.
   - Implement a Rabin fingerprint window of 48 bytes.
   - Split when `fingerprint % block_size == 0`.

5. **Prove dedup and order commitment**
   💡 WHY: Swapping chunk order and proving the manifest hash changes validates
   that the manifest is a true commitment, not just a list.
   - Store two nearly identical files, count shared chunks.
   - Swap two chunk entries in a manifest, re-hash, assert different ID.

## Done when

- [ ] Fixed chunker produces correct number of chunks for a known file size — *proves partitioning*
- [ ] Reassembled file is byte-for-byte identical to the original — *proves lossless round-trip*
- [ ] Manifest hash changes when chunk order is swapped — *proves order commitment*
- [ ] Two similar files share common chunks in the store — *proves dedup*
- [ ] CLI `split` + `assemble` round-trip works end-to-end — *proves integration*

## Proof

Paste or upload:
1. `diff` output showing reassembled file matches original.
2. Two manifest IDs from similar files + count of shared chunk IDs.
3. Two manifest hashes proving order swap changes the ID.

**Quick self-test**

Q: Why is the manifest stored as a CAS object rather than in a separate database?
A: Storing the manifest in CAS means its integrity is self-verifiable—re-hash the manifest bytes and compare to its ID. A separate database would require its own integrity mechanism.

Q: What happens if a chunk referenced by a manifest is missing from the store?
A: Reassembly fails at that chunk. The system should report which chunk ID is missing so it can be re-fetched or the file declared unrecoverable.

Q: Why must manifest JSON serialisation be deterministic?
A: Non-deterministic JSON (e.g., random key order) would produce different bytes for the same logical manifest, breaking content addressing—same manifest → same hash.
