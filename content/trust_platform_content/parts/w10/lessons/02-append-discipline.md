---
id: w10-l02
title: "Append Discipline"
order: 2
type: lesson
duration_min: 40
---

# Append Discipline

## Goal

Write [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) records to disk using strict [append-only](https://en.wikipedia.org/wiki/Append-only) file discipline. Every record is appended, never overwritten. Each append is followed by [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) to guarantee the data has reached stable storage before the server replies to the client.

## What you build

A `struct wal_writer` that holds an open file descriptor. You write `wal_open()`, `wal_append()`, and `wal_close()`. The append function encodes the record with [L01](01-record-format-checksum.md), calls [write(2)](https://man7.org/linux/man-pages/man2/write.2.html) to append it, then calls [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) to flush the kernel buffer to disk.

## Why it matters

Without [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html), data that looks written may still be sitting in the kernel [page cache](https://en.wikipedia.org/wiki/Page_cache). A power failure would lose it. Every durable [database](https://en.wikipedia.org/wiki/Database) — [PostgreSQL](https://www.postgresql.org/), [MySQL InnoDB](https://dev.mysql.com/doc/refman/en/innodb-storage-engine.html), [SQLite in WAL mode](https://sqlite.org/wal.html) — calls [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) or [fdatasync](https://man7.org/linux/man-pages/man2/fdatasync.2.html) after writing log records. The [append-only](https://en.wikipedia.org/wiki/Append-only) rule means you never seek backward and overwrite old records, which makes the log safe to read during [recovery (L03)](03-recovery-replay.md).

---

## Training Session

### Warmup — File IO syscalls

1. Read the DESCRIPTION section of [open(2)](https://man7.org/linux/man-pages/man2/open.2.html). Note the `O_APPEND`, `O_CREAT`, and `O_WRONLY` flags.
2. Read the DESCRIPTION section of [write(2)](https://man7.org/linux/man-pages/man2/write.2.html). Write down what a [short write](https://en.wikipedia.org/wiki/Short_(finance)) means — when [write(2)](https://man7.org/linux/man-pages/man2/write.2.html) returns fewer bytes than you asked for.
3. Read the DESCRIPTION section of [fsync(2)](https://man7.org/linux/man-pages/man2/fsync.2.html). Write down the difference between [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) and [fdatasync](https://man7.org/linux/man-pages/man2/fdatasync.2.html).

### Work — Build the WAL writer

#### Do

1. Create `w10/wal_writer.h`. Define `struct wal_writer` with an `int fd` and a `uint64_t offset` field that tracks how many bytes have been written.
2. Create `w10/wal_writer.c`.
3. Write `wal_open(path)`. Call [open(2)](https://man7.org/linux/man-pages/man2/open.2.html) with flags `O_WRONLY | O_CREAT | O_APPEND` and mode `0644`. Store the [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) in the struct. If [open(2)](https://man7.org/linux/man-pages/man2/open.2.html) fails, return an error. Set `offset` to the current file size using [lseek()](https://man7.org/linux/man-pages/man2/lseek.2.html) with `SEEK_END`.
4. Write a helper `write_full(fd, buf, len)` that loops on [write(2)](https://man7.org/linux/man-pages/man2/write.2.html) until all bytes are written or an error occurs. This handles [short writes](https://en.wikipedia.org/wiki/Short_(finance)).
5. Write `wal_append(writer, record)`. Call `wal_record_encode()` from [L01](01-record-format-checksum.md) to serialize the record into a local buffer. Call `write_full()` to append the bytes. Call [fsync(fd)](https://man7.org/linux/man-pages/man2/fsync.2.html). Update `offset`. Return success or error.
6. Write `wal_close(writer)`. Call [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) one final time, then [close(fd)](https://man7.org/linux/man-pages/man2/close.2.html).
7. Write a `main()` test. Open a WAL file. Append three SET records and one DEL record. Close the file. Print the total bytes written.
8. Verify the file exists on disk and its size matches the expected total.

#### Test

```bash
gcc -Wall -Wextra -o wal_writer_test w10/wal_writer.c w10/wal_record.c w10/crc32.c
./wal_writer_test
ls -l test.wal
```

#### Expected

```
wal_open: ok
append SET foo=bar → 21 bytes
append SET name=alice → 27 bytes
append SET count=42 → 24 bytes
append DEL name → 19 bytes
wal_close: ok
total offset: 91
-rw-r--r-- 1 user user 91 ... test.wal
```

### Prove — Durability guarantee

Answer in your own words:

1. What data could be lost if you skip [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) and a power failure happens?
2. Why does [O_APPEND](https://man7.org/linux/man-pages/man2/open.2.html) prevent two threads from overwriting each other's records?
3. Why is handling [short writes](https://en.wikipedia.org/wiki/Short_(finance)) important when writing to a local file?

### Ship

```bash
git add w10/wal_writer.h w10/wal_writer.c
git commit -m "w10-l02: WAL writer with append-only discipline and fsync"
```

---

## Done when

- `wal_open()` creates or opens an existing WAL file in [append-only](https://en.wikipedia.org/wiki/Append-only) mode.
- `wal_append()` encodes, writes, and [fsyncs](https://man7.org/linux/man-pages/man2/fsync.2.html) each record.
- `write_full()` retries on [short writes](https://en.wikipedia.org/wiki/Short_(finance)).
- `wal_close()` [fsyncs](https://man7.org/linux/man-pages/man2/fsync.2.html) and closes the [file descriptor](https://en.wikipedia.org/wiki/File_descriptor).
- The file size on disk matches the sum of all encoded record sizes.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting O_APPEND | Without [O_APPEND](https://man7.org/linux/man-pages/man2/open.2.html), the file offset starts at 0 and you overwrite old records. Always open with `O_APPEND`. |
| Skipping fsync | Data sits in the [page cache](https://en.wikipedia.org/wiki/Page_cache) until [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html). A crash loses unflushed data. Call [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) after every append. |
| Not handling short writes | [write(2)](https://man7.org/linux/man-pages/man2/write.2.html) may write fewer bytes than requested. Loop until all bytes are written or an error occurs. |
| Calling fsync on every byte instead of every record | [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) is expensive. Call it once per record, not once per byte. One [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) after the full record is enough. |

## Proof

```bash
./wal_writer_test
# → wal_open: ok
# → append SET foo=bar → 21 bytes
# → wal_close: ok
# → total offset: 91

ls -l test.wal
# → -rw-r--r-- 1 user user 91 ... test.wal

xxd test.wal | head -6
# → shows binary record bytes with CRC headers
```

## 🖼️ Hero Visual

```
  wal_append() flow:

  record ──▶ wal_record_encode() ──▶ write_full() ──▶ fsync() ──▶ return OK
                                          │                │
                                          ▼                ▼
                                     kernel buffer    stable storage
                                     (page cache)      (disk platter)

  file on disk (append-only):
  ┌──────────────┬──────────────┬──────────────┬──────────────┐
  │ record 1     │ record 2     │ record 3     │ record 4     │
  │ SET foo=bar  │ SET name=... │ SET count=42 │ DEL name     │
  └──────────────┴──────────────┴──────────────┴──────────────┘
  offset 0       offset 21      offset 48      offset 72      offset 91
                  ▲ never overwritten — append only
```

## 🔮 Future Lock

- In [W10 L03](03-recovery-replay.md) you will read this log file from the beginning and replay every valid record into the [KV store (W09)](../../../parts/w09/part.md) to recover state after a crash.
- In [W10 L04](04-crash-scenarios.md) you will simulate a crash mid-write and prove that the [CRC32 (L01)](01-record-format-checksum.md) detects the torn record.
- In [W10 L05](05-checkpointing.md) you will add [checkpointing](https://en.wikipedia.org/wiki/Application_checkpointing) so recovery does not have to replay the entire log from the beginning.
- In [W11](../../../parts/w11/part.md) a leader ships these appended records to followers over the network.
