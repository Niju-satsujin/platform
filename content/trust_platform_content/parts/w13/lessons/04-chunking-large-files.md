---
id: w13-l04
title: "Chunking large files"
order: 4
duration_minutes: 30
xp: 75
kind: lesson
part: w13
proof:
  type: paste
  instructions: "Paste output showing a large file (>64KB) stored as multiple chunks plus a manifest, then retrieved and reassembled with correct content."
  regex_patterns:
    - "chunk|manifest"
    - "[a-f0-9]{64}"
    - "reassembl|reconstruct|match|verified"
---
# Chunking large files

## Concept

So far you store entire files as single objects. This works fine for small data, but imagine storing a 1GB file. The entire file gets one hash. If you change one byte, the entire 1GB must be re-stored with a new hash. That is wasteful.

The solution is chunking. You split large data into fixed-size chunks — say, 64KB each. Each chunk is stored by its own hash. Then you create a "manifest" — a small object that lists all the chunk hashes in order. The manifest itself is stored by its hash. To retrieve the original data, you first retrieve the manifest by its hash, then retrieve each chunk by its hash from the manifest, then concatenate them. Every piece is individually verified.

This is how IPFS stores files. It is how Git stores large objects with packfiles. It is how cloud storage systems do deduplication — if two large files share some identical 64KB chunks, those chunks are stored only once. The content-addressed property makes deduplication automatic.

In C terms, think of the manifest as a struct with an array of hash pointers. Each pointer leads to a chunk. The manifest itself is just bytes, so it gets its own hash too. It is a tree of hashes pointing to data.

## Task

1. Add a `std::string store_chunked(const std::vector<uint8_t>& data, size_t chunk_size = 65536)` method:
   - If `data.size() <= chunk_size`, just call `store()` and return the hash (no chunking needed)
   - Otherwise, split `data` into chunks of `chunk_size` bytes (last chunk may be smaller)
   - Store each chunk with `store()`, collect the chunk hashes
   - Build a manifest: a simple text format, one chunk hash per line, with a header line like `manifest:chunks`
   - Store the manifest bytes with `store()`, return the manifest hash
2. Add a `std::vector<uint8_t> retrieve_chunked(const std::string& manifest_hash)` method:
   - Retrieve the manifest by hash
   - Parse the chunk hashes from the manifest
   - Retrieve each chunk by hash (each retrieval verifies integrity automatically)
   - Concatenate all chunks in order, return the full data
3. Test with a file larger than 64KB — generate random data, store it chunked, retrieve it, compare

## Hints

- For the manifest format, keep it simple. A text format works fine:
  ```
  cas-manifest-v1
  <chunk-hash-1>
  <chunk-hash-2>
  ...
  ```
- To split data into chunks: loop with `std::vector<uint8_t>(data.begin() + offset, data.begin() + offset + chunk_size)`
- To detect whether a retrieved object is a manifest or raw data, check if it starts with `cas-manifest-v1`
- Generate test data: `std::vector<uint8_t> big_data(200000); std::iota(big_data.begin(), big_data.end(), 0);` gives you ~200KB of data
- The manifest is just data like anything else — it gets stored by hash, verified on retrieval. No special treatment
- If a single chunk is corrupt, retrieval of that chunk will fail (your `retrieve()` already checks integrity), and the whole reassembly fails. That is correct behavior

## Verify

```bash
g++ -std=c++17 -o cas_chunked cas_chunked.cpp -lssl -lcrypto
./cas_chunked
# Should print: stored 200000 bytes as N chunks + manifest
# Should print: retrieved 200000 bytes, content matches original
ls store_dir/ | wc -l
# Should show N+1 files (N chunks + 1 manifest) plus any previous test files
```

## Done When

Large data is split into chunks, each chunk is stored by hash, a manifest links them, and retrieval reassembles the original data correctly with integrity verification at every level.
