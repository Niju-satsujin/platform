---
id: w13-l03
title: "Dedup & GC Model"
order: 3
type: lesson
duration_min: 50
---

# Dedup & GC Model

## Goal

Prove that [content-addressable storage](https://en.wikipedia.org/wiki/Content-addressable_storage) deduplicates for free, then build a [garbage collector](https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)) that removes blobs no longer referenced by any root.

## What you build

A reference-counting layer on top of the CAS store. Each blob has a reference count. When a higher-level structure (a [Merkle tree node](../../w14/part.md), a [log entry](../../w15/part.md)) points to a digest, the count goes up. When that structure is deleted, the count goes down. A `cas_gc()` function scans all blobs and removes any with a reference count of zero. You also write a test that stores the same data twice and confirms only one file exists on disk.

## Why it matters

[Deduplication](https://en.wikipedia.org/wiki/Data_deduplication) saves storage. If ten users upload the same file, the store holds one copy. But without [garbage collection](https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)), deleted data stays forever and the store grows without bound. [Git](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects) runs `git gc` to pack and prune unreachable objects. Your store does the same — remove blobs that nothing points to.

---

## Training Session

### Warmup

Open your `cas_store/` directory from [L02](02-store-fetch.md). Count the files. Now call `cas_put()` again with the same input string. Count again. Write down:

1. Did a new file appear? No — the digest matched an existing file, so `cas_put()` returned early.
2. This is [deduplication](https://en.wikipedia.org/wiki/Data_deduplication) — identical content maps to the same name.

### Work

#### Do

1. Create `w13/cas_refs.h`.
2. Define a reference table — a simple array or [hash map](https://en.wikipedia.org/wiki/Hash_table) that maps digest strings to integer counts.
3. Declare:
   - `void cas_ref_inc(const char *digest)` — increment the reference count for a digest.
   - `void cas_ref_dec(const char *digest)` — decrement the reference count for a digest.
   - `int cas_ref_count(const char *digest)` — return the current count.
   - `int cas_gc(void)` — scan all blobs in `cas_store/`, delete any whose reference count is zero, return the number of blobs removed.
4. Create `w13/cas_refs.c` and implement the functions.
   - `cas_gc()` calls [opendir()](https://man7.org/linux/man-pages/man3/opendir.3.html) on `cas_store/`, iterates with [readdir()](https://man7.org/linux/man-pages/man3/readdir.3.html), checks the reference count for each file, and calls [unlink()](https://man7.org/linux/man-pages/man2/unlink.2.html) on blobs with count zero.
5. Create `w13/dedup_gc_test.c`:
   - Call `cas_put()` with `"shared data"`. Save the digest.
   - Call `cas_put()` with `"shared data"` again. Assert the digest is the same.
   - List `cas_store/`. Assert only one file exists for that digest.
   - Call `cas_ref_inc()` on the digest (simulating a [Merkle node](../../w14/part.md) reference).
   - Call `cas_gc()`. Assert the blob survives — its reference count is 1.
   - Call `cas_ref_dec()` on the digest.
   - Call `cas_gc()`. Assert the blob is deleted — its reference count was zero.
   - Call `cas_exists()` with the digest. Assert it returns 0.

#### Test

```bash
gcc -Wall -Wextra -Werror -o dedup_gc_test \
  w13/cas.c w13/cas_refs.c w13/dedup_gc_test.c -lcrypto
./dedup_gc_test
```

#### Expected

```
PUT 1: digest=<hex>
PUT 2: digest=<same hex> (dedup)
Files in store: 1
GC with ref=1: 0 removed
GC with ref=0: 1 removed
EXISTS after GC: 0
PASS
```

### Prove It

```bash
# After the test, the store directory should be empty
ls cas_store/ | wc -l
# → 0
```

### Ship It

```bash
git add w13/cas_refs.h w13/cas_refs.c w13/dedup_gc_test.c
git commit -m "w13-l03: reference counting and garbage collection for CAS"
```

---

## Done when

- Storing the same data twice produces one file on disk — [deduplication](https://en.wikipedia.org/wiki/Data_deduplication) confirmed.
- `cas_ref_inc()` and `cas_ref_dec()` track references correctly.
- `cas_gc()` removes only blobs with zero references.
- `cas_gc()` leaves referenced blobs untouched.
- After all references are dropped and GC runs, `cas_exists()` returns 0.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Deleting a blob that still has references | Always check the reference count before calling [unlink()](https://man7.org/linux/man-pages/man2/unlink.2.html). A count greater than zero means someone still needs the blob. |
| Decrementing below zero | [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) decrement below zero. Assert or clamp. A negative count means a double-free bug. |
| Not scanning the directory — only checking the ref table | A blob on disk with no entry in the ref table has zero references. `cas_gc()` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) also remove these orphan blobs. |
| Race between GC and a concurrent `cas_put()` | In this lesson, GC runs single-threaded. In production, you would need a lock or a stop-the-world pause. Note this for now. |

## Proof

```bash
./dedup_gc_test
# → PUT 1: digest=<hex>
# → PUT 2: digest=<same hex> (dedup)
# → Files in store: 1
# → GC with ref=1: 0 removed
# → GC with ref=0: 1 removed
# → EXISTS after GC: 0
# → PASS
```

## Hero visual

```
  cas_put("shared data")       cas_put("shared data")
       │                              │
       ▼                              ▼
  SHA-256 → abc123...            SHA-256 → abc123...
       │                              │
       ▼                              ▼
  write blob                     file exists → skip
       │
       ▼
  cas_store/abc123...   ← only ONE copy on disk

  ref_inc("abc123...")  → refcount = 1
  cas_gc()              → 0 removed (refcount > 0)

  ref_dec("abc123...")  → refcount = 0
  cas_gc()              → unlink("cas_store/abc123...")
                           1 removed
```

## Future Lock

- In [W13 L04](04-integrity-check.md) you will verify that blobs on disk still match their digest — catching silent [bit rot](https://en.wikipedia.org/wiki/Data_degradation) or tampering.
- In [W14](../../w14/part.md) the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) will call `cas_ref_inc()` when it creates a node that references a child digest, and `cas_ref_dec()` when a subtree is pruned.
- In [W15](../../w15/part.md) the [transparency log](../../w15/part.md) will increment references for each new log entry stored in CAS.
- In [W19](../../w19/part.md) the [trust bundle](../../w19/part.md) packager will run `cas_gc()` after exporting to clean up staging blobs.
