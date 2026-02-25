---
id: w13-quest
title: "Week 13 Boss: Content-Addressed Store"
part: w13
kind: boss
proof:
  type: paste
  instructions: "Paste: (1) output showing store-by-hash returning a SHA-256 hex string, (2) output showing retrieve-by-hash returning the original data, (3) output showing retrieval fails when a file is corrupted, (4) quality gate checklist with all items PASS."
  regex_patterns:
    - "[a-f0-9]{64}"
    - "verified|integrity|match"
    - "PASS"
---
# Week 13 Boss: Content-Addressed Store

## Goal

Prove your content-addressed storage system works end-to-end: data goes in by hash, comes back out by hash, and any corruption is detected automatically.

## Requirements

1. **Store by hash** — given arbitrary data, compute its SHA-256 hash and store the data in a file named by that hash
2. **Atomic writes** — use write-tmp-fsync-rename so a crash mid-write cannot leave a corrupt file
3. **Verified retrieval** — given a hash, read the file, re-hash the contents, and confirm they match before returning the data
4. **Corruption detection** — if a stored file is tampered with, retrieval returns an error instead of bad data
5. **Chunked storage** — files larger than 64KB are split into chunks, each stored by hash, linked by a manifest
6. **Garbage collection** — unreferenced objects are removed, referenced objects are preserved
7. **Test suite passes** — all 5 test cases green
8. **Benchmark recorded** — throughput numbers for 1KB, 64KB, 1MB, and 10MB files

## Verify

```bash
# Run the test suite
./build/cas_test

# Run the benchmark
./build/cas_benchmark

# Check the git tag
git tag -l "v0.13*"
```

## Done When

Test suite passes, benchmark numbers are recorded, quality gate is green, and `v0.13-cas` tag exists.
