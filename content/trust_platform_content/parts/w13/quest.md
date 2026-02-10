---
id: w13-quest
title: "Quest – Full Content-Addressable Store"
order: 7
type: quest
duration_min: 90
---

# Quest – Full Content-Addressable Store

## Mission

Build a complete [content-addressable store](https://en.wikipedia.org/wiki/Content-addressable_storage) that saves blobs by [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digest, [deduplicates](https://en.wikipedia.org/wiki/Data_deduplication) identical content, [garbage-collects](https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)) unreferenced blobs, verifies [integrity](https://en.wikipedia.org/wiki/Data_integrity) on every fetch, and supports [chunking](https://en.wikipedia.org/wiki/Chunking_(computing)) for large blobs. Every lesson from this week feeds into this deliverable.

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | `cas_put()` stores a blob at `cas_store/<sha256_hex>` using [write-to-temp-then-rename](https://man7.org/linux/man-pages/man2/rename.2.html) with [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) | File exists on disk, content matches input |
| R2 | `cas_get()` returns the blob data and verifies [integrity](04-integrity-check.md) by re-hashing with [SHA-256](https://en.wikipedia.org/wiki/SHA-2) | Corrupted blob returns -2, clean blob returns 0 |
| R3 | [Deduplication](https://en.wikipedia.org/wiki/Data_deduplication): storing the same data twice produces one file on disk | `ls cas_store/ \| wc -l` shows 1 after two puts of identical data |
| R4 | `cas_ref_inc()` / `cas_ref_dec()` track reference counts correctly | `cas_ref_count()` returns the right value after inc/dec |
| R5 | `cas_gc()` removes blobs with zero references and keeps blobs with count > 0 | After gc, `cas_exists()` returns 0 for unreferenced, 1 for referenced |
| R6 | `cas_put_chunked()` splits data into fixed-size chunks, stores each, and stores a manifest | Manifest lists correct digests; each digest is in the store |
| R7 | `cas_get_chunked()` reassembles the original data from the manifest | Reassembled bytes are identical to the original |
| R8 | Full [regression harness (L06)](lessons/06-regression-harness.md) passes 3 consecutive runs | `./w13/test_harness.sh` exits 0 three times in a row |

## Constraints

- C only. No external CAS libraries.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) compile with `gcc -Wall -Wextra -Werror -lcrypto`.
- Every blob write [MUST](https://datatracker.ietf.org/doc/html/rfc2119) use the [write-to-temp, fsync, rename](https://man7.org/linux/man-pages/man2/rename.2.html) pattern from [W10](../../w10/part.md).
- Every `cas_get()` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) verify [integrity](04-integrity-check.md) before returning data.
- `cas_gc()` [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) remove blobs with a reference count greater than zero.
- Temp files [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be cleaned up on every error path — no `.tmp` files left behind.
- All allocated memory [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be freed. Run [Valgrind](https://valgrind.org/docs/manual/manual.html) to confirm zero leaks.

## Bonus challenges

| Bonus | Description |
|-------|-------------|
| B1 | Fan-out directory structure — store blobs in `cas_store/ab/cd/<rest>` (first 2 bytes as subdirectories) to avoid a single directory with thousands of entries |
| B2 | Concurrent put — allow multiple threads to call `cas_put()` safely using file-level locks or atomic [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) |
| B3 | Content-defined chunking — instead of fixed-size chunks, use a [rolling hash](https://en.wikipedia.org/wiki/Rolling_hash) (like [Rabin fingerprint](https://en.wikipedia.org/wiki/Rabin_fingerprint)) to find chunk boundaries, improving dedup across shifted data |
| B4 | Blob statistics — `cas_stats()` returns total blob count, total bytes stored, and bytes saved by [deduplication](https://en.wikipedia.org/wiki/Data_deduplication) |

## Verification

```bash
# Build
gcc -Wall -Wextra -Werror -o cas_full_test \
  w13/cas.c w13/cas_refs.c w13/cas_chunked.c w13/cas_full_test.c -lcrypto

# R1: put + file on disk
./cas_full_test put "hello world"
ls cas_store/
# → one file named by hex digest

# R2: integrity check
./cas_full_test get <digest>
# → data: "hello world"
# Corrupt the file, fetch again
./cas_full_test get <digest>
# → ERROR: integrity failure

# R3: dedup
./cas_full_test put "hello world"
ls cas_store/ | wc -l
# → still 1

# R4 + R5: ref counting and GC
./cas_full_test ref-inc <digest>
./cas_full_test gc
# → 0 removed
./cas_full_test ref-dec <digest>
./cas_full_test gc
# → 1 removed

# R6 + R7: chunked put and get
./cas_full_test put-chunked 4 "0123456789"
./cas_full_test get-chunked <manifest_digest>
# → data: "0123456789"

# R8: full harness
./w13/test_harness.sh
# → Run 1/3: PASS
# → Run 2/3: PASS
# → Run 3/3: PASS

# Memory check
valgrind --leak-check=full ./cas_full_test put "test"
# → 0 errors, 0 leaks
```

## Ship

```bash
git add w13/
git commit -m "w13 quest: full content-addressable store with dedup, GC, integrity, and chunking"
```
