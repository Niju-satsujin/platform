---
id: w13-quiz
title: "Week 13 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 13 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – CAS naming rule

In a [content-addressable store](https://en.wikipedia.org/wiki/Content-addressable_storage), what determines the name (address) of a blob?

- A) A sequential integer assigned by the store
- B) The file path chosen by the user
- C) The [SHA-256](https://en.wikipedia.org/wiki/SHA-2) hash of the blob's content
- D) A random [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier) generated at write time

---

### Q2 – Deterministic hashing

You call `cas_put()` twice with identical input data. What [MUST](https://datatracker.ietf.org/doc/html/rfc2119) happen?

- A) Two different files are created because timestamps differ
- B) The second call creates a backup copy
- C) Both calls return the same [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digest and only one file exists on disk
- D) The second call fails because the digest already exists

---

### Q3 – Atomic write pattern

Why does `cas_put()` write to a temp file, call [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html), and then call [rename()](https://man7.org/linux/man-pages/man2/rename.2.html)?

- A) Because [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) is faster than [write()](https://man7.org/linux/man-pages/man2/write.2.html)
- B) To ensure a crash never leaves a half-written blob under the final digest name
- C) Because the operating system requires this order
- D) To avoid needing [close()](https://man7.org/linux/man-pages/man2/close.2.html)

---

### Q4 – Integrity failure code

`cas_get()` returns -2. What does this mean?

- A) The blob was not found in the store
- B) The blob exists but the re-computed [SHA-256](https://en.wikipedia.org/wiki/SHA-2) hash does not match the requested [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function) — the data is corrupt or tampered with
- C) The caller passed an invalid digest string
- D) The store ran out of disk space

---

### Q5 – GC safety

Why [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) `cas_gc()` remove a blob whose reference count is greater than zero?

- A) Because [unlink()](https://man7.org/linux/man-pages/man2/unlink.2.html) cannot delete files with references
- B) Because another data structure (like a [Merkle tree node](../w14/part.md)) still points to that digest — deleting it would break the structure
- C) Because the operating system locks referenced files
- D) Because the blob might be useful in the future

---

### Q6 – Chunking benefit

Splitting a large blob into fixed-size [chunks](https://en.wikipedia.org/wiki/Chunking_(computing)) before storing means:

- A) Each chunk uses a different hash algorithm
- B) If one byte changes, only the affected chunk (and the manifest) need to be re-stored — all other chunks are [deduplicated](https://en.wikipedia.org/wiki/Data_deduplication)
- C) The total storage used doubles because of the manifest
- D) The blob can no longer be integrity-checked

---

### Q7 – Manifest purpose

What is the purpose of the manifest blob stored by `cas_put_chunked()`?

- A) It holds the original file path for the chunked data
- B) It lists the [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digests of all chunks in order so the original blob can be reassembled
- C) It stores encryption keys for each chunk
- D) It tracks the reference count of each chunk

---

### Q8 – Orphan blobs

A blob exists on disk in `cas_store/` but has no entry in the reference table. What [MUST](https://datatracker.ietf.org/doc/html/rfc2119) `cas_gc()` do?

- A) Ignore it — only blobs in the reference table are checked
- B) Remove it — a blob with no reference entry has zero references and is an orphan
- C) Add it to the reference table with count 1
- D) Move it to a quarantine directory

---

### Q9 – Short answer: fsync timing

In your own words, explain why [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be called *before* [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) in `cas_put()` — not after.

---

### Q10 – Short answer: dedup detection

Explain how `cas_put()` detects that a blob is a duplicate without comparing the full data. What does it check instead?

---

### Q11 – Short answer: integrity vs existence

Explain the difference between `cas_exists()` returning 1 and `cas_get()` returning 0 (success). Why is `cas_exists()` not enough to confirm the blob is safe to use?

---

### Q12 – Short answer: chunk boundary

You store a 10-byte blob with `chunk_size = 4`. How many chunk blobs are created? What is the size of the last chunk?

---

### Q13 – Read the output

A student runs the following commands. Read the output and answer the question below.

```
$ ./cas_full_test put "alpha"
PUT: digest=abc111...

$ ./cas_full_test put "alpha"
PUT: digest=abc111... (already exists)

$ ./cas_full_test put "beta"
PUT: digest=def222...

$ ls cas_store/ | wc -l
2

$ ./cas_full_test gc
GC: 2 removed
```

Why did [garbage collection](https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)) remove both blobs?

---

### Q14 – Read the output

A student stores a blob and then fetches it. Read the output and answer the question below.

```
$ ./cas_full_test put "secret data"
PUT: digest=aaa999...

$ echo -n "XXXXX data" > cas_store/aaa999...

$ ./cas_full_test get aaa999...
ERROR: integrity failure (expected aaa999..., got bbb777...)
```

Explain step by step what happened inside `cas_get()` to produce this error message.
