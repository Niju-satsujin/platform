---
id: w13-l04
title: "Integrity Check"
order: 4
type: lesson
duration_min: 40
---

# Integrity Check

## Goal

Add a verification step to `cas_get()` that re-hashes the blob read from disk and compares it to the requested [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function). If they do not match, the fetch fails — the blob is corrupt or tampered with.

## What you build

A modified `cas_get()` that computes [SHA-256](https://en.wikipedia.org/wiki/SHA-2) over the data it just read and checks the result against the digest the caller asked for. If the hashes differ, the function returns an error code and does not return the data. You also write a test that manually corrupts a blob on disk and confirms the store rejects it.

## Why it matters

Disks can silently flip bits — this is called [bit rot](https://en.wikipedia.org/wiki/Data_degradation). An attacker with write access to the store could modify a blob and hope nobody notices. The whole point of [content-addressable storage](https://en.wikipedia.org/wiki/Content-addressable_storage) is that the name *is* the checksum. If you do not verify on read, you lose that guarantee. This is the same check that [Git](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects) performs when it reads a loose object — re-hash, compare, reject on mismatch.

---

## Training Session

### Warmup

Read the "Data Integrity" section of the [SHA-2](https://en.wikipedia.org/wiki/SHA-2) Wikipedia article. Write down:

1. What "integrity" means in this context — the data has not changed since the hash was computed.
2. Why re-hashing on read is necessary — the hash was computed at write time; the data could have changed since then.

### Work

#### Do

1. Open `w13/cas.c`.
2. Modify `cas_get()`:
   - After reading the blob data from disk, compute [SHA-256](https://en.wikipedia.org/wiki/SHA-2) over the bytes.
   - Convert the hash to a 64-character hex string.
   - Compare it to the `digest` the caller passed in using [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html).
   - If they match, return the data as before.
   - If they do not match, [free()](https://man7.org/linux/man-pages/man3/free.3.html) the data, set `*data_out = NULL`, and return -2 (a new error code meaning "integrity failure").
3. Create `w13/integrity_test.c`:
   - Call `cas_put()` with `"trusted payload"`. Save the digest.
   - Call `cas_get()` with that digest. Assert it returns 0 and the data matches.
   - Now corrupt the blob on disk: [open](https://man7.org/linux/man-pages/man2/open.2.html) the file at `cas_store/<digest>`, overwrite the first byte with `'X'`, [close](https://man7.org/linux/man-pages/man2/close.2.html).
   - Call `cas_get()` with the same digest. Assert it returns -2.
   - Print `"PASS: integrity check caught corruption"`.

#### Test

```bash
gcc -Wall -Wextra -Werror -o integrity_test \
  w13/cas.c w13/integrity_test.c -lcrypto
./integrity_test
```

#### Expected

```
PUT: digest=<hex>
GET (clean): data="trusted payload" ✓
CORRUPT: wrote 'X' at byte 0
GET (corrupt): returned -2 (integrity failure) ✓
PASS: integrity check caught corruption
```

### Prove It

```bash
# The corrupted file is still on disk, but cas_get refuses to return it
cat cas_store/<digest>
# → Xrusted payload   (corrupted)
./integrity_test 2>&1 | grep "integrity failure"
# → GET (corrupt): returned -2 (integrity failure) ✓
```

### Ship It

```bash
git add w13/cas.c w13/integrity_test.c
git commit -m "w13-l04: integrity verification on cas_get with SHA-256 re-hash"
```

---

## Done when

- `cas_get()` re-hashes the blob data with [SHA-256](https://en.wikipedia.org/wiki/SHA-2) after reading.
- If the computed hash matches the requested digest, the data is returned.
- If the computed hash does not match, `cas_get()` returns -2 and does not return the data.
- A manually corrupted blob is rejected.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Skipping the re-hash for performance | The hash takes microseconds for small blobs. The safety it provides is worth more than the CPU time. Never skip it. |
| Returning the data before checking the hash | A caller could use corrupt data if you return first. Verify, then return. |
| Not distinguishing "not found" (-1) from "corrupt" (-2) | The caller needs to know why the fetch failed — missing blobs and corrupt blobs require different responses. |
| Forgetting to [free()](https://man7.org/linux/man-pages/man3/free.3.html) the buffer on integrity failure | If you allocated the data with [malloc()](https://man7.org/linux/man-pages/man3/malloc.3.html), [free()](https://man7.org/linux/man-pages/man3/free.3.html) it before returning the error. Leaking memory on error is a common bug. |

## Proof

```bash
./integrity_test
# → PUT: digest=<hex>
# → GET (clean): data="trusted payload" ✓
# → CORRUPT: wrote 'X' at byte 0
# → GET (corrupt): returned -2 (integrity failure) ✓
# → PASS: integrity check caught corruption
```

## Hero visual

```
  cas_get("a1b2c3...")
       │
       ▼
  read file cas_store/a1b2c3...
       │
       ▼
  SHA-256(file_data) → computed_hash
       │
       ├── computed_hash == "a1b2c3..." ?
       │         │                │
       │        YES              NO
       │         │                │
       │         ▼                ▼
       │   return data       return -2
       │   (integrity OK)   (CORRUPT — hash mismatch)
       │
       ▼
  caller uses verified data
```

## Future Lock

- In [W13 L05](05-chunking-strategy.md) you will split large blobs into fixed-size [chunks](https://en.wikipedia.org/wiki/Chunking_(computing)) — each chunk gets its own digest and its own integrity check.
- In [W14](../../w14/part.md) the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) verifier will call `cas_get()` for every node. A single corrupt node makes the entire tree verification fail — that is the power of hash chains.
- In [W15](../../w15/part.md) the [transparency log](../../w15/part.md) auditor will fetch entries from CAS and reject any that fail the integrity check.
- In [W19](../../w19/part.md) the [trust bundle](../../w19/part.md) verifier will re-hash every blob in the bundle to confirm nothing was altered in transit.
