---
id: w15-l01
title: "Append-Only Model"
order: 1
type: lesson
duration_min: 35
---

# Append-Only Model

## Goal

Define the data structures that represent an [append-only log](https://en.wikipedia.org/wiki/Append-only) — an ordered, immutable sequence of entries where new entries go at the end and nothing is ever edited or removed.

## What you build

A `struct log_entry` that holds a sequence number, the raw data bytes, and the [SHA-256](https://en.wikipedia.org/wiki/SHA-2) leaf hash of the data. A `struct transparency_log` that owns a growable array of entries and a `size` counter. An `log_append()` function that adds an entry at position `size`, computes its [leaf hash](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1) using the `0x00` domain-separation prefix from [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962), increments `size`, and returns the new index. A `log_get()` function that returns the entry at a given index or an error if the index is out of range. No delete. No update.

## Why it matters

The entire [transparency log](https://datatracker.ietf.org/doc/html/rfc6962) design depends on one rule: once an entry is written, it [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) change. If someone can edit entry 7 after the fact, every [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree) that covered entry 7 becomes a lie. [Certificate Transparency](https://datatracker.ietf.org/doc/html/rfc6962), [Go SumDB](https://go.dev/ref/mod#checksum-database), and [Sigstore Rekor](https://docs.sigstore.dev/) all enforce this append-only rule. Your [WAL discipline from W10](../w10/part.md) already proved you can write records that survive crashes; now you add the rule that records are never overwritten.

---

## Training Session

### Warmup

Read the first two paragraphs of the [Append-only Wikipedia page](https://en.wikipedia.org/wiki/Append-only). Write down:

1. What operations an [append-only](https://en.wikipedia.org/wiki/Append-only) structure allows.
2. What operations it forbids.
3. Why databases and logs use this pattern.

Then re-read [RFC 6962 §2.1](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1) and note how the leaf hash uses a `0x00` prefix byte.

### Work

#### Do

1. Create `w15/log.h`.
2. Define `struct log_entry` with:
   - `uint64_t index` — the sequence number (0, 1, 2, …).
   - `uint8_t *data` — pointer to a copy of the raw entry bytes.
   - `size_t data_len` — length of the data.
   - `uint8_t leaf_hash[32]` — the [SHA-256](https://en.wikipedia.org/wiki/SHA-2) leaf hash: `SHA-256(0x00 ‖ data)`.
3. Define `struct transparency_log` with:
   - `struct log_entry *entries` — a dynamically allocated array.
   - `uint64_t size` — how many entries the log contains.
   - `uint64_t capacity` — how many slots are allocated.
4. Write `transparency_log *log_create()` — allocate the log, set `size = 0`, pick an initial capacity (e.g. 16).
5. Write `int log_append(transparency_log *log, const uint8_t *data, size_t len)` — copy the data, compute the [leaf hash](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1), store the entry at `log->entries[log->size]`, increment `size`. Grow the array if needed. Return the new index.
6. Write `log_entry *log_get(transparency_log *log, uint64_t index)` — return a pointer to the entry, or `NULL` if the index is out of range.
7. Write `void log_free(transparency_log *log)` — free every entry's data, free the entries array, free the log.
8. Create `w15/log.c` — implement all functions.
9. Write `w15/log_model_test.c` — a `main()` that appends 5 entries, prints each entry's index and [leaf hash](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1), tries to get index 5 (should fail), and frees the log.

#### Test

```bash
gcc -Wall -Wextra -Werror -o log_model_test \
  w15/log.c w15/log_model_test.c -lcrypto
./log_model_test
```

#### Expected

```
appended index=0 leaf_hash=<hex>
appended index=1 leaf_hash=<hex>
appended index=2 leaf_hash=<hex>
appended index=3 leaf_hash=<hex>
appended index=4 leaf_hash=<hex>
get(5): NULL (out of range)
```

No crashes. No memory leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind --leak-check=full ./log_model_test
```

Zero leaks. Zero errors.

### Ship It

```bash
git add w15/log.h w15/log.c w15/log_model_test.c
git commit -m "w15-l01: append-only log model with leaf hashing"
```

---

## Done when

- `log_append()` adds entries in order starting from index 0.
- Each entry's [leaf hash](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1) is `SHA-256(0x00 ‖ data)`.
- `log_get()` returns the correct entry or `NULL` for out-of-range.
- There is no delete function. There is no update function.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero leaks and zero errors.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Storing a pointer to the caller's buffer instead of copying | The caller may free or reuse the buffer. Always `memcpy` the data into a fresh allocation owned by the log. |
| Forgetting the `0x00` prefix when hashing the leaf | Without the prefix you break [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) [domain separation](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1). The hash [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be `SHA-256(0x00 ‖ data)`, not `SHA-256(data)`. |
| Using `realloc` without checking for failure | If `realloc` returns `NULL`, the old pointer is still valid. Check the return before assigning. |
| Adding a `log_delete()` or `log_update()` function | An [append-only](https://en.wikipedia.org/wiki/Append-only) log [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) support deletion or mutation. The whole security model depends on this. |

## Proof

```bash
./log_model_test
# → 5 appended lines with hex hashes, get(5) returns NULL
valgrind --leak-check=full ./log_model_test
# → 0 errors from 0 contexts
```

## Hero visual

```
  log_append("alpha")  log_append("beta")  log_append("gamma")
         │                     │                     │
         ▼                     ▼                     ▼
  ┌────────────┐       ┌────────────┐       ┌────────────┐
  │ index = 0  │       │ index = 1  │       │ index = 2  │
  │ data=alpha │       │ data=beta  │       │ data=gamma │
  │ leaf_hash  │       │ leaf_hash  │       │ leaf_hash  │
  │ =SHA256(   │       │ =SHA256(   │       │ =SHA256(   │
  │  0x00‖α)   │       │  0x00‖β)   │       │  0x00‖γ)   │
  └────────────┘       └────────────┘       └────────────┘
         │                     │                     │
         └─────────────────────┴─────────────────────┘
                          │
                   transparency_log
                    size = 3
```

## Future Lock

- In [W15 L02](02-checkpoint.md) you will build a [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) over these entries and publish a [signed tree head](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5).
- In [W15 L03](03-consistency-proof.md) you will generate [consistency proofs](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) that prove the log only grew — no entries were changed or removed.
- In [W15 L05](05-storage-discipline.md) you will add [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) calls so entries survive crashes before the tree head advances.
- In [W16](../w16/part.md) a [monitor](../w16/part.md) will poll this log and alert when the [append-only](https://en.wikipedia.org/wiki/Append-only) rule is violated.
- In [W18](../w18/part.md) the [anchoring system](../w18/part.md) will cross-sign the tree head into an external ledger.
