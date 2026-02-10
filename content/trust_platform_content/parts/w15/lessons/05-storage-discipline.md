---
id: w15-l05
title: "Storage Discipline"
order: 5
type: lesson
duration_min: 40
---

# Storage Discipline

## Goal

Make the [transparency log](lessons/01-append-only-model.md) crash-safe. Entry data [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reach stable storage before the [checkpoint](lessons/02-checkpoint.md) advances. The [checkpoint file](lessons/04-audit-client.md) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be updated atomically so a crash never leaves a partial or corrupt saved state.

## What you build

Two hardened write paths. First, a `log_persist_entry()` function that writes an entry's data to an on-disk file and calls [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) on the file descriptor before returning. The [checkpoint](lessons/02-checkpoint.md) [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) advance until every new entry is persisted. Second, a `checkpoint_atomic_save()` function that writes the new [tree head](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) to a temporary file, calls [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html), then uses [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) to atomically replace the old checkpoint file. This is the same write-ahead pattern you used in [W10 (WAL)](../w10/part.md).

## Why it matters

A [transparency log](https://datatracker.ietf.org/doc/html/rfc6962) that loses entries on crash is worse than useless — it looks like tampering. If the server publishes a [checkpoint](lessons/02-checkpoint.md) at size 7 but after a power failure only entries 0–5 survive on disk, the log cannot produce a valid [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) for size 7 anymore. Auditors will flag this as tampering and lose trust. The fix is simple and strict: data hits disk ([fsync](https://man7.org/linux/man-pages/man2/fsync.2.html)) before the [checkpoint](lessons/02-checkpoint.md) moves. The checkpoint itself is replaced atomically ([rename](https://man7.org/linux/man-pages/man2/rename.2.html)). This is the exact same discipline you practiced with the [write-ahead log in W10](../w10/part.md).

---

## Training Session

### Warmup

Re-read the [fsync(2) man page](https://man7.org/linux/man-pages/man2/fsync.2.html). Write down:

1. What [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) guarantees versus what [fflush()](https://man7.org/linux/man-pages/man3/fflush.3.html) guarantees.
2. Why calling [fflush()](https://man7.org/linux/man-pages/man3/fflush.3.html) alone is not enough for crash safety — the data may still be in the kernel's page cache.
3. Why [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) is atomic on [POSIX](https://en.wikipedia.org/wiki/POSIX) file systems.

Then recall the [WAL append flow from W10](../w10/part.md): write record → [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) → advance the commit pointer. The [transparency log](lessons/01-append-only-model.md) follows the same pattern: write entry → [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) → advance the [checkpoint](lessons/02-checkpoint.md).

### Work

#### Do

1. Add to `w15/log.h`:
   - `int log_persist_entry(transparency_log *log, uint64_t index, const char *dir)` — write entry data to `<dir>/<index>.entry`, call [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html), return `0` on success.
   - `int checkpoint_atomic_save(const char *path, const tree_head *th)` — write to `<path>.tmp`, [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html), [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) to `<path>`, return `0` on success.
2. In `w15/log.c`, implement `log_persist_entry()`:
   - Open the file with `O_WRONLY | O_CREAT | O_TRUNC`.
   - Write the entry data.
   - Call [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) on the file descriptor.
   - Close the file.
   - Check every return value. Return `-1` on any failure.
3. Implement `checkpoint_atomic_save()`:
   - Open `<path>.tmp` for writing.
   - Write the tree size (decimal) and root hash (hex), one per line.
   - Call [fflush()](https://man7.org/linux/man-pages/man3/fflush.3.html) then [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html).
   - Close the file.
   - Call [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) from `<path>.tmp` to `<path>`.
   - Return `0` on success, `-1` on any failure.
4. Update `log_append()` to call `log_persist_entry()` before the entry is considered committed. The caller provides a directory path in the log struct.
5. Update the audit client's save logic to use `checkpoint_atomic_save()`.
6. Write `w15/storage_test.c`:
   - Create a log with a temp directory.
   - Append 3 entries. Confirm each `.entry` file exists on disk.
   - Checkpoint and save atomically.
   - Read back the checkpoint file and confirm the values match.
   - Confirm no `.tmp` file remains after a successful save.

#### Test

```bash
gcc -Wall -Wextra -Werror -o storage_test \
  w15/log.c w15/storage_test.c -lcrypto
./storage_test
```

#### Expected

```
persisted: /tmp/w15test/0.entry (OK)
persisted: /tmp/w15test/1.entry (OK)
persisted: /tmp/w15test/2.entry (OK)
checkpoint saved: size=3 root=<hex>
readback: size=3 root=<hex> (match)
tmp file: does not exist (OK)
```

No crashes. No memory leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind --leak-check=full ./storage_test
```

Zero leaks. Zero errors. Confirm the entry files survive (list the temp directory).

### Ship It

```bash
git add w15/log.h w15/log.c w15/storage_test.c
git commit -m "w15-l05: storage discipline — fsync entries, atomic checkpoint save"
```

---

## Done when

- `log_persist_entry()` writes entry data and calls [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) before returning.
- `checkpoint_atomic_save()` writes to a temp file, calls [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html), then [rename()](https://man7.org/linux/man-pages/man2/rename.2.html)s into place.
- No `.tmp` file remains after a successful save.
- The [checkpoint](lessons/02-checkpoint.md) never advances until all entries are on stable storage.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero leaks and zero errors.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Calling [fflush()](https://man7.org/linux/man-pages/man3/fflush.3.html) but not [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) | [fflush](https://man7.org/linux/man-pages/man3/fflush.3.html) pushes data from the C library buffer to the kernel. [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) pushes data from the kernel to the physical disk. You need both. |
| Advancing the [checkpoint](lessons/02-checkpoint.md) before persisting entries | If the server crashes between publishing the [checkpoint](lessons/02-checkpoint.md) and writing entry data, the log is broken. Persist first, checkpoint second. |
| Not checking [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) return value | [rename](https://man7.org/linux/man-pages/man2/rename.2.html) can fail if the temp file and target are on different file systems. Always check. |
| Leaving the `.tmp` file on failure | If [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) fails, remove the `.tmp` file before returning the error. A stale `.tmp` confuses the next save attempt. |

## Proof

```bash
./storage_test
# → 3 persisted lines, checkpoint saved, readback matches, no .tmp
valgrind --leak-check=full ./storage_test
# → 0 errors from 0 contexts
```

## Hero visual

```
  log_append("x")
       │
       ▼
  ┌─────────────────────────────┐
  │  write data to 5.entry      │
  │  fsync(fd)  ← data on disk  │
  │  close(fd)                  │
  └──────────────┬──────────────┘
                 │
                 ▼  (only after fsync succeeds)
  ┌─────────────────────────────┐
  │  log->size = 6              │
  │  log_checkpoint()           │
  │  write checkpoint.tmp       │
  │  fsync(fd)                  │
  │  rename(tmp → checkpoint)   │◀── atomic swap
  └─────────────────────────────┘
```

## Future Lock

- In [W15 L06](06-regression-harness.md) the [regression harness](06-regression-harness.md) will include a crash-simulation test that kills the process between write and [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html), then checks the log recovers cleanly.
- In [W16](../w16/part.md) the [monitoring system](../w16/part.md) relies on this storage discipline — a monitor that sees a valid [checkpoint](lessons/02-checkpoint.md) can trust that all covered entries exist on disk.
- In [W18](../w18/part.md) the [anchoring system](../w18/part.md) will add a second layer: after the checkpoint is saved locally, it is cross-signed into an external ledger with its own [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) discipline.
