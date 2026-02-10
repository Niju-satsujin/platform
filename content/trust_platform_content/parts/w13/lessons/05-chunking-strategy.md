---
id: w13-l05
title: "Chunking Strategy"
order: 5
type: lesson
duration_min: 45
---

# Chunking Strategy

## Goal

Split large blobs into fixed-size [chunks](https://en.wikipedia.org/wiki/Chunking_(computing)) before storing them. Each chunk is a separate CAS blob with its own [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digest. A manifest blob lists the chunk digests in order so the original data can be reassembled.

## What you build

Two new functions: `cas_put_chunked()` splits input data into chunks of a configurable size (for example, 4 KB), stores each chunk with `cas_put()`, then stores a manifest blob that lists all chunk digests in order. `cas_get_chunked()` reads the manifest, fetches each chunk by digest, concatenates them, and returns the reassembled data. You also write a test that stores a blob larger than one chunk and reads it back.

## Why it matters

Storing a 1 GB file as a single blob means any one-byte change forces a full re-upload. Splitting into [chunks](https://en.wikipedia.org/wiki/Chunking_(computing)) means only the changed chunk is re-stored — the rest are [deduplicated](https://en.wikipedia.org/wiki/Data_deduplication) because their digests have not changed. This is how [rsync](https://en.wikipedia.org/wiki/Rsync) minimizes transfers and how [Git packfiles](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects) store deltas efficiently. Chunking also lets you verify integrity at the chunk level — a corrupt chunk does not force re-downloading the entire file.

---

## Training Session

### Warmup

Pick a chunk size of 4 bytes (tiny, for testing). Take the string `"AABBCCDD"` (8 bytes). Write down:

1. How many chunks? Two: `"AABB"` and `"CCDD"`.
2. What the manifest would look like: a list of two [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digests, one per line.
3. If you change `"AABB"` to `"AABX"`, which chunk digests change? Only the first one.

### Work

#### Do

1. Create `w13/cas_chunked.h`.
2. Declare:
   - `int cas_put_chunked(const char *data, size_t len, size_t chunk_size, char manifest_digest_out[65])` — split data into chunks, store each, store the manifest, return the manifest digest.
   - `int cas_get_chunked(const char *manifest_digest, char **data_out, size_t *len_out)` — read the manifest, fetch each chunk, concatenate, return the data.
3. Create `w13/cas_chunked.c`.
4. Implement `cas_put_chunked()`:
   - Loop over the input in steps of `chunk_size`. For each chunk, call `cas_put()`. Collect the returned digests.
   - Build a manifest string: one hex digest per line, in order.
   - Call `cas_put()` on the manifest string itself. Return its digest as `manifest_digest_out`.
5. Implement `cas_get_chunked()`:
   - Call `cas_get()` with the manifest digest to get the manifest string.
   - Parse the manifest: split by newline to get the list of chunk digests.
   - For each chunk digest, call `cas_get()`. Concatenate all chunk data in order.
   - Return the concatenated data.
6. Create `w13/chunking_test.c`:
   - Build a test blob of 10 bytes: `"0123456789"`.
   - Call `cas_put_chunked()` with `chunk_size = 4`. Expect 3 chunks (4 + 4 + 2 bytes).
   - Call `cas_get_chunked()` with the manifest digest. Assert the returned data equals `"0123456789"`.
   - Call `cas_put_chunked()` with the same data again. Assert the manifest digest is the same — all chunks were [deduplicated](https://en.wikipedia.org/wiki/Data_deduplication).
   - Modify one byte: `"X123456789"`. Call `cas_put_chunked()`. Assert the manifest digest is different. Count files in `cas_store/` — only the first chunk and the new manifest are new.

#### Test

```bash
gcc -Wall -Wextra -Werror -o chunking_test \
  w13/cas.c w13/cas_chunked.c w13/chunking_test.c -lcrypto
./chunking_test
```

#### Expected

```
PUT chunked: 3 chunks stored, manifest=<hex>
GET chunked: data="0123456789" ✓
PUT same data: manifest=<same hex> (dedup) ✓
PUT modified: manifest=<different hex>, 2 new blobs ✓
PASS
```

### Prove It

```bash
ls cas_store/ | wc -l
# → count matches: 3 chunks + 1 manifest + 1 new chunk + 1 new manifest = 6
# (some chunks may be shared, so count may be less)
```

### Ship It

```bash
git add w13/cas_chunked.h w13/cas_chunked.c w13/chunking_test.c
git commit -m "w13-l05: fixed-size chunking with manifest for large blobs"
```

---

## Done when

- `cas_put_chunked()` splits data into fixed-size chunks and stores each as a CAS blob.
- A manifest blob lists all chunk digests in order.
- `cas_get_chunked()` reassembles the original data from the manifest.
- The reassembled data is byte-for-byte identical to the original.
- Storing the same data twice produces the same manifest digest — [deduplication](https://en.wikipedia.org/wiki/Data_deduplication) works at the chunk level.
- Changing one byte only creates new blobs for the affected chunk and the manifest.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Off-by-one on the last chunk | The last chunk may be smaller than `chunk_size`. Use `remaining = len - offset` and take the minimum of `remaining` and `chunk_size`. |
| Not storing the manifest as a CAS blob | The manifest [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be stored in CAS too — so it also has a digest and can be integrity-checked. |
| Assuming all chunks are the same size when reading | The manifest tells you how many chunks there are. Read each one and get its actual size — do not assume. |
| Missing newline at end of manifest | Be consistent. Either every line ends with `\n` or none do. Inconsistency breaks the parser. |

## Proof

```bash
./chunking_test
# → PUT chunked: 3 chunks stored, manifest=<hex>
# → GET chunked: data="0123456789" ✓
# → PUT same data: manifest=<same hex> (dedup) ✓
# → PUT modified: manifest=<different hex>, 2 new blobs ✓
# → PASS
```

## Hero visual

```
  input: "0123456789"   chunk_size=4
       │
       ├── chunk 0: "0123" → SHA-256 → digest_A → cas_put()
       ├── chunk 1: "4567" → SHA-256 → digest_B → cas_put()
       └── chunk 2: "89"   → SHA-256 → digest_C → cas_put()
                │
                ▼
          manifest blob:
          ┌────────────┐
          │ digest_A   │
          │ digest_B   │
          │ digest_C   │
          └────────────┘
                │
                ▼
          SHA-256(manifest) → manifest_digest → cas_put()

  cas_get_chunked(manifest_digest):
          manifest → [digest_A, digest_B, digest_C]
          cas_get(A) + cas_get(B) + cas_get(C) → "0123456789"
```

## Future Lock

- In [W13 L06](06-regression-harness.md) you will write a harness that tests the full pipeline — put, get, chunk, dedup, GC, and integrity — under stress.
- In [W14](../../w14/part.md) the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) will store large leaf data as chunked blobs. The tree node holds the manifest digest, not the raw data.
- In [W15](../../w15/part.md) the [transparency log](../../w15/part.md) may chunk large audit entries so they can be verified piece by piece.
- In [W19](../../w19/part.md) the [trust bundle](../../w19/part.md) will use chunk manifests to allow partial downloads — a verifier can fetch only the chunks it needs.
