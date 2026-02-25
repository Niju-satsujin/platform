---
id: w13-l08
title: "Week 13 quality gate"
order: 8
duration_minutes: 20
xp: 100
kind: lesson
part: w13
proof:
  type: paste
  instructions: "Paste your completed 7-point checklist with each item marked PASS, plus the git tag output for v0.13-cas."
  regex_patterns:
    - "PASS"
    - "v0\\.13|v0\\.13-cas"
---
# Week 13 quality gate

## Concept

Same process as every week — pass every checkpoint before moving on. This week is the foundation for Part 4 (Tamper-Evident Transparency). If your content-addressed store has bugs, everything built on top of it — Merkle trees, transparency logs, audit proofs — will be unreliable.

The 7-point checklist for Week 13:

1. **Store by hash works** — `store()` returns a correct SHA-256 hex hash, file exists on disk with that name, and `sha256sum` on the command line gives the same hash
2. **Atomic writes work** — `store()` uses write-tmp-fsync-rename, no leftover `.tmp-` files after successful store, duplicate data is deduplicated (second store skips the write)
3. **Verified retrieval works** — `retrieve()` re-hashes the data and confirms it matches the requested hash, returns an error for corrupt files
4. **Chunking works for large files** — files larger than 64KB are split into chunks, stored individually by hash, linked by a manifest, and correctly reassembled on retrieval
5. **Garbage collection works** — mark-and-sweep removes unreferenced objects and preserves all referenced objects including manifest chunks
6. **Test suite passes** — all 5 test cases pass (store/retrieve small, store/retrieve chunked, corruption detection, GC remove, GC preserve)
7. **Benchmark recorded** — ops/sec and MB/sec for 1KB, 64KB, 1MB, and 10MB file sizes

After passing all 7, tag your repo:

```bash
git tag -a v0.13-cas -m "Week 13: Content-addressed storage complete"
```

## Task

1. Run each check from the list above
2. For each item, write PASS or FAIL
3. Fix any FAIL items before continuing
4. When all 7 are PASS, create the git tag
5. Push the tag to your remote

## Hints

- For check 1: store the string "hello" and compare the hash to `echo -n "hello" | sha256sum`
- For check 2: check that no `.tmp-` files exist after `store()`, and measure that the second `store()` of the same data is nearly instant
- For check 3: corrupt a file with `echo "x" >> store_dir/<hash>` and confirm retrieval fails
- For check 4: store data larger than 64KB and count the files in the store directory — should be N chunks + 1 manifest
- For check 5: run your GC test — unreferenced objects deleted, referenced objects preserved
- For check 6: just run `./cas_test` and confirm 5/5 pass
- For check 7: your benchmark table from lesson 7
- `git tag -a v0.13-cas -m "Week 13 complete"` then `git push origin v0.13-cas`

## Verify

```bash
# Run tests
./build/cas_test

# Verify the tag
git tag -l "v0.13*"

# Quick sanity check: store and retrieve
./build/cas_store --test
```

Expected: all tests pass, tag exists, and every checklist item is PASS.

## Done When

All 7 checklist items are PASS, the `v0.13-cas` git tag exists, and you are ready for Week 14 (Merkle trees).
