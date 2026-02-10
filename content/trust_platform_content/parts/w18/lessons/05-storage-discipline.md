---
id: w18-l05
title: "Anchor Storage Discipline"
order: 5
type: lesson
duration_min: 40
---

# Anchor Storage Discipline

## Goal

Make the [anchor log](lessons/01-append-only-model.md) crash-safe. An [anchor record](lessons/01-append-only-model.md) and the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reach stable storage before a receipt is returned to the caller. A crash at any point [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) leave the anchor log in a state where a published anchor is lost or partially written.

## What you build

Three hardened write paths. First, `anchor_persist_record()` serialises an [anchor record](lessons/01-append-only-model.md) to an on-disk file, calls [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) on the file descriptor, then calls [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) on the parent directory to ensure the directory entry is durable. Second, `anchor_persist_cosignature()` writes the [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) bytes received from the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) to a sidecar file named `anchor_<id>.cosig`, calls [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html), and links it to the anchor record on disk. Third, `anchor_atomic_advance()` writes the new anchor log head pointer (the latest `anchor_id`) to a temporary file, calls [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html), then uses [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) to atomically replace the head file — the same pattern you used in [W15 L05](../w15/lessons/05-storage-discipline.md) and [W10 (WAL)](../w10/part.md). A `anchor_recover()` function that scans the anchor directory on startup, finds the highest `anchor_id` with both a valid record file and a matching `.cosig` file, and sets the in-memory anchor log to that point — discarding any incomplete trailing records.

## Why it matters

In [W15 L05](../w15/lessons/05-storage-discipline.md) you made the [transparency log](../w15/part.md) crash-safe. The [anchor log](lessons/01-append-only-model.md) has a harder requirement: it coordinates with an external party. If the process crashes after the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) cosigns but before the [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) is persisted, you lose proof that the anchor was published. Re-requesting a [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) may not be possible if the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) has moved on. By [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html)-ing both the record and the [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) before advancing the head, you guarantee that every anchor marked as published actually has proof on disk. Recovery on restart is deterministic — scan, validate, resume.

---

## Training Session

### Warmup

Re-read your [W15 L05 storage discipline code](../w15/lessons/05-storage-discipline.md). Write down:

1. The order of operations: write data → [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) data → write metadata → [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) metadata → [rename](https://man7.org/linux/man-pages/man2/rename.2.html).
2. Why [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) is atomic on [POSIX](https://en.wikipedia.org/wiki/POSIX) file systems — the old file is replaced in a single directory operation.

### Work

#### Do

1. Create `w18/anchor_storage.h`.
2. Create `w18/anchor_storage.c`.
3. Write `anchor_persist_record()`:
   - Serialise the [anchor record](lessons/01-append-only-model.md) to bytes (use a fixed binary layout or [JSON](https://en.wikipedia.org/wiki/JSON)).
   - Open `anchor_dir/anchor_<id>.rec` with `O_WRONLY | O_CREAT | O_EXCL`.
   - Write the bytes. Call [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html). Close the file.
   - Open the parent directory. Call [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) on it. Close.
4. Write `anchor_persist_cosignature()`:
   - Open `anchor_dir/anchor_<id>.cosig` with `O_WRONLY | O_CREAT | O_EXCL`.
   - Write the [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) bytes. Call [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html). Close.
   - [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) the parent directory.
5. Write `anchor_atomic_advance()`:
   - Write the new `anchor_id` to `anchor_dir/head.tmp`.
   - [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) `head.tmp`.
   - [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) `head.tmp` to `head`.
   - [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) the parent directory.
6. Write `anchor_recover()`:
   - Read `anchor_dir/head` to get the last committed `anchor_id`.
   - For each id from 0 to `anchor_id`, verify both `.rec` and `.cosig` files exist and are readable.
   - If any are missing, set the head to the highest complete id.
   - Return the recovered anchor count.
7. Write a `main()` test: persist three anchors with cosignatures, advance the head, simulate a crash by deleting one `.cosig`, then call `anchor_recover()`.

#### Test

```bash
gcc -Wall -Wextra -Werror -o anchor_store_test \
  w18/anchor_storage.c w18/anchor_record.c -lcrypto
./anchor_store_test /tmp/anchor_test_dir
```

#### Expected

```
persisted anchor 0 + cosig
persisted anchor 1 + cosig
persisted anchor 2 + cosig
head advanced to 2
deleted anchor_2.cosig (simulated crash)
recover: head rolled back to 1
```

### Prove It

```bash
ls /tmp/anchor_test_dir/
# → anchor_0.rec anchor_0.cosig anchor_1.rec anchor_1.cosig anchor_2.rec head
# Note: anchor_2.cosig is missing — recovery excluded it

strace -e fsync,rename ./anchor_store_test /tmp/anchor_test_dir2
# → shows fsync calls before every rename
```

### Ship It

```bash
git add w18/anchor_storage.h w18/anchor_storage.c
git commit -m "w18-l05: crash-safe anchor storage with cosignature persistence"
```

---

## Done when

- `anchor_persist_record()` writes and [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html)s the record before returning.
- `anchor_persist_cosignature()` writes and [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html)s the [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) before returning.
- `anchor_atomic_advance()` uses [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) to atomically update the head pointer.
- `anchor_recover()` rolls back to the highest complete anchor after a simulated crash.
- [strace](https://man7.org/linux/man-pages/man1/strace.1.html) confirms [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) before every [rename()](https://man7.org/linux/man-pages/man2/rename.2.html).

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Advancing the head before persisting the [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) | If you crash after advancing but before writing the cosig, recovery cannot prove the anchor was published. Persist record + cosig first, then advance. |
| Forgetting to [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) the parent directory | The file data may be durable but the directory entry may not. A crash can make the file invisible. Always [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) the directory. |
| Using `O_TRUNC` instead of `O_EXCL` for record files | `O_EXCL` prevents overwriting an existing anchor — enforcing [append-only](https://en.wikipedia.org/wiki/Append-only). `O_TRUNC` silently destroys data. |
| Recovery scanning only the head file | The head file may point to an anchor whose [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) was lost. Recovery [MUST](https://datatracker.ietf.org/doc/html/rfc2119) validate both `.rec` and `.cosig` for every anchor up to the head. |

## Proof

```bash
./anchor_store_test /tmp/anchor_test_dir
# → persisted anchor 0 + cosig
# → persisted anchor 1 + cosig
# → persisted anchor 2 + cosig
# → head advanced to 2
# → deleted anchor_2.cosig (simulated crash)
# → recover: head rolled back to 1
```

## Hero visual

```
  anchor_dir/
  ├── anchor_0.rec     ← fsync ✓
  ├── anchor_0.cosig   ← fsync ✓
  ├── anchor_1.rec     ← fsync ✓
  ├── anchor_1.cosig   ← fsync ✓
  ├── anchor_2.rec     ← fsync ✓       (cosig missing — crash happened here)
  └── head             ← rename(head.tmp → head)
                          points to anchor_id=2
                          after recovery → rolled back to 1
```

## Future Lock

- In [W18 L06](06-regression-harness.md) the [regression harness](06-regression-harness.md) will inject crashes at every stage of the persist-cosig-advance sequence and verify recovery is always correct.
- In [W20](../w20/part.md) [chaos tests](../w20/part.md) will kill the process at random points during anchoring and confirm no data is lost or corrupted.
- In [W19](../w19/part.md) [trust bundles](../w19/part.md) will read the on-disk anchor records and [cosignatures](https://en.wikipedia.org/wiki/Witness_(transparency)) to assemble a portable proof package.
- In [W16](../w16/part.md) [monitors](../w16/part.md) will watch the `head` file timestamp and alert if it stops advancing.
