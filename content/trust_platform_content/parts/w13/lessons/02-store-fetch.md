---
id: w13-l02
title: "Store & Fetch"
order: 2
type: lesson
duration_min: 45
---

# Store & Fetch

## Goal

Implement `cas_put()` and `cas_get()` so blobs are saved to disk under their [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digest and fetched back by that digest.

## What you build

A `w13/cas.c` file that implements the two core operations. `cas_put()` hashes the data, writes it to a file named by the hex digest inside a `cas_store/` directory, and returns the digest. `cas_get()` reads the file back. Writes use the [write-to-temp-then-rename](https://man7.org/linux/man-pages/man2/rename.2.html) pattern from [W10](../../w10/part.md) so a crash never leaves a half-written blob.

## Why it matters

A [content-addressable store](https://en.wikipedia.org/wiki/Content-addressable_storage) that loses data on crash is useless. The [write-to-temp-then-rename](https://man7.org/linux/man-pages/man2/rename.2.html) pattern guarantees atomicity — either the full blob exists under its digest name, or it does not. [Git objects](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects) use the same technique: write to a temp file, [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html), then [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) into the object directory.

---

## Training Session

### Warmup

Read the DESCRIPTION section of [rename(2)](https://man7.org/linux/man-pages/man2/rename.2.html). Write down:

1. What happens if the destination file already exists — it is atomically replaced.
2. Why this matters for crash safety — the old file stays until [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) completes, so readers never see a partial file.

Read the DESCRIPTION section of [fsync(2)](https://man7.org/linux/man-pages/man2/fsync.2.html). Write down what it guarantees — data is flushed from kernel buffers to the storage device.

### Work

#### Do

1. Create `w13/cas.c`.
2. Implement `cas_put()`:
   - Hash the input data with [SHA-256](https://en.wikipedia.org/wiki/SHA-2). Convert the 32-byte hash to a 64-character hex string.
   - Build the final path: `cas_store/<hex_digest>`.
   - Check if the file already exists with [access()](https://man7.org/linux/man-pages/man2/access.2.html). If yes, return the digest immediately — the blob is already stored.
   - [Open](https://man7.org/linux/man-pages/man2/open.2.html) a temp file in the same directory with a `.tmp` suffix using `O_WRONLY | O_CREAT | O_EXCL`.
   - [Write](https://man7.org/linux/man-pages/man2/write.2.html) the full data to the temp file.
   - Call [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) on the file descriptor.
   - [Close](https://man7.org/linux/man-pages/man2/close.2.html) the file descriptor.
   - Call [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) to move the temp file to the final path.
3. Implement `cas_get()`:
   - Build the path from the digest.
   - [Open](https://man7.org/linux/man-pages/man2/open.2.html) the file with `O_RDONLY`. Return -1 if it does not exist.
   - [Read](https://man7.org/linux/man-pages/man2/read.2.html) the full contents. Allocate the output buffer with [malloc()](https://man7.org/linux/man-pages/man3/malloc.3.html).
   - Return 0 on success.
4. Implement `cas_exists()` — call [access()](https://man7.org/linux/man-pages/man2/access.2.html) on the path.
5. Create `w13/store_fetch_test.c`:
   - Call `cas_put()` with `"blob alpha"`. Save the digest.
   - Call `cas_get()` with that digest. Assert the returned data equals `"blob alpha"`.
   - Call `cas_exists()` with that digest. Assert it returns 1.
   - Call `cas_get()` with a made-up digest. Assert it returns -1.
6. Create the `cas_store/` directory with [mkdir()](https://man7.org/linux/man-pages/man2/mkdir.2.html) if it does not exist.

#### Test

```bash
gcc -Wall -Wextra -Werror -o store_fetch_test \
  w13/cas.c w13/store_fetch_test.c -lcrypto
./store_fetch_test
```

#### Expected

```
PUT: digest=<64-char hex>
GET: data="blob alpha" ✓
EXISTS: 1 ✓
GET unknown: -1 ✓
PASS
```

### Prove It

```bash
ls cas_store/
# → one file named by the hex digest
cat cas_store/<digest>
# → blob alpha
```

Verify the file on disk matches what the program returned.

### Ship It

```bash
git add w13/cas.c w13/store_fetch_test.c
git commit -m "w13-l02: cas_put and cas_get with atomic write-then-rename"
```

---

## Done when

- `cas_put()` writes a blob to `cas_store/<digest>` using [write-to-temp-then-rename](https://man7.org/linux/man-pages/man2/rename.2.html).
- `cas_put()` calls [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) before [rename()](https://man7.org/linux/man-pages/man2/rename.2.html).
- `cas_get()` reads the blob back and returns the correct data.
- `cas_exists()` returns 1 for stored blobs and 0 for missing ones.
- A made-up digest returns -1 from `cas_get()`.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Writing directly to the final path | A crash mid-write leaves a corrupt blob. Always write to a temp file, [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html), then [rename()](https://man7.org/linux/man-pages/man2/rename.2.html). |
| Forgetting [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) before [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) | Without [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html), the data may still be in kernel buffers. A power loss could leave an empty file under the digest name. |
| Not handling short [write()](https://man7.org/linux/man-pages/man2/write.2.html) | [write()](https://man7.org/linux/man-pages/man2/write.2.html) may write fewer bytes than requested. Loop until all bytes are written. |
| Leaking the temp file on error | If [write()](https://man7.org/linux/man-pages/man2/write.2.html) or [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) fails, [unlink()](https://man7.org/linux/man-pages/man2/unlink.2.html) the temp file before returning. |
| Not creating `cas_store/` directory | Call [mkdir()](https://man7.org/linux/man-pages/man2/mkdir.2.html) at startup. Check for `EEXIST` — that is not an error. |

## Proof

```bash
./store_fetch_test
# → PUT: digest=<hex>
# → GET: data="blob alpha" ✓
# → EXISTS: 1 ✓
# → GET unknown: -1 ✓
# → PASS
```

## Hero visual

```
  cas_put("blob alpha")
       │
       ▼
  SHA-256("blob alpha") → a1b2c3d4...
       │
       ▼
  open("cas_store/a1b2c3d4...tmp", O_CREAT|O_EXCL)
       │
       ▼
  write(fd, "blob alpha", 10)
       │
       ▼
  fsync(fd)
       │
       ▼
  close(fd)
       │
       ▼
  rename("cas_store/a1b2c3d4...tmp" → "cas_store/a1b2c3d4...")
       │
       ▼
  return digest = "a1b2c3d4..."
```

## Future Lock

- In [W13 L03](03-dedup-gc-model.md) you will discover that `cas_put()` already deduplicates — if the file exists, the early return skips the write. You will add [garbage collection](https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)) to remove blobs that no one references.
- In [W13 L04](04-integrity-check.md) you will add a re-hash check inside `cas_get()` to detect on-disk corruption.
- In [W14](../../w14/part.md) the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) builder will call `cas_put()` for every tree node, linking parents to children by digest.
- In [W19](../../w19/part.md) the [trust bundle](../../w19/part.md) packager will call `cas_get()` to pull verified blobs into a signed bundle.
