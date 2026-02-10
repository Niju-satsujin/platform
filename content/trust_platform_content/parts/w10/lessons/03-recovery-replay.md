---
id: w10-l03
title: "Recovery Replay"
order: 3
type: lesson
duration_min: 45
---

# Recovery Replay

## Goal

Read the [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) file from the beginning and replay every valid record into the [KV store (W09)](../../../parts/w09/part.md) to rebuild in-memory state after a crash.

## What you build

A `wal_recover(path, store)` function. It opens the log file for reading, decodes records one by one using `wal_record_decode()` from [L01](01-record-format-checksum.md), verifies each [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check), and applies SET or DEL operations to the [hash table](https://en.wikipedia.org/wiki/Hash_table). If a record fails the [checksum](https://en.wikipedia.org/wiki/Checksum) check, recovery stops — all records before that point are valid.

## Why it matters

This is the core promise of a [write-ahead log](https://en.wikipedia.org/wiki/Write-ahead_logging): you [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be able to rebuild the exact same [state](https://en.wikipedia.org/wiki/State_(computer_science)) from the log alone. [PostgreSQL](https://www.postgresql.org/) replays its WAL on startup after an unclean shutdown. [SQLite](https://sqlite.org/) replays its journal. If your replay is correct, no committed data is lost. If your replay is wrong, the [database](https://en.wikipedia.org/wiki/Database) is corrupt. Recovery correctness is not optional.

---

## Training Session

### Warmup — Reading binary files

1. Read the DESCRIPTION section of [open(2)](https://man7.org/linux/man-pages/man2/open.2.html) with `O_RDONLY`.
2. Read the DESCRIPTION section of [read(2)](https://man7.org/linux/man-pages/man2/read.2.html). Note that [read(2)](https://man7.org/linux/man-pages/man2/read.2.html) returns 0 at end-of-file.
3. Write down the record layout from [L01](01-record-format-checksum.md): `[CRC32 : 4][length : 4][op : 1][key_len : 2][key][value_len : 2][value]`. You will read these fields in order.

### Work — Build the recovery function

#### Do

1. Create `w10/wal_recovery.h` and `w10/wal_recovery.c`.
2. Write a helper `read_full(fd, buf, len)` that loops on [read(2)](https://man7.org/linux/man-pages/man2/read.2.html) until all bytes are read, returns 0 on EOF, or returns -1 on error. This mirrors the `write_full()` from [L02](02-append-discipline.md).
3. Write `wal_recover(path, store)`. Open the file with `O_RDONLY`. Enter a loop that reads one record at a time.
4. In each iteration, first read the 4-byte [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) and the 4-byte length. If [read(2)](https://man7.org/linux/man-pages/man2/read.2.html) returns 0 for the CRC field, you have reached the end of the log — break out of the loop.
5. Use the length to read the remaining bytes of the record into a buffer.
6. Call `wal_record_decode()` on the full record bytes. If the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) does not match, print a warning and stop — do not apply this record or any that follow.
7. If the record is a SET, call `kv_store_set(store, key, value)`. If DEL, call `kv_store_del(store, key)`.
8. Count how many records were replayed. After the loop, print the count and close the file.
9. Write a `main()` test. Use the WAL writer from [L02](02-append-discipline.md) to write 5 records (3 SETs, 1 DEL, 1 SET). Then create a fresh empty [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) and call `wal_recover()`. Verify that the store contains exactly the right keys and values.

#### Test

```bash
gcc -Wall -Wextra -o wal_recovery_test \
  w10/wal_recovery.c w10/wal_writer.c w10/wal_record.c w10/crc32.c w10/kv_store.c
./wal_recovery_test
```

#### Expected

```
write phase: 5 records written
recovery: replayed 5 records
GET foo → bar
GET name → (nil)
GET count → 99
store has 2 keys — correct
```

### Prove — Recovery correctness

Answer in your own words:

1. Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) recovery stop at the first bad [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) instead of skipping the bad record?
2. After replay, the in-memory store [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be identical to what it was before the crash. How would you test this?
3. What happens if the log file is empty? What state should the store be in?

### Ship

```bash
git add w10/wal_recovery.h w10/wal_recovery.c
git commit -m "w10-l03: WAL recovery replay rebuilds KV state from log"
```

---

## Done when

- `wal_recover()` reads the log file and replays all valid records into the [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database).
- A SET record in the log results in a SET on the store. A DEL record results in a DEL.
- Recovery stops cleanly at end-of-file.
- Recovery stops at the first record with a bad [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check).
- An empty log file produces an empty store.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not handling partial reads at end-of-file | If [read(2)](https://man7.org/linux/man-pages/man2/read.2.html) returns fewer bytes than the length field says, the record is incomplete. Treat it like a [CRC](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) failure — stop and discard. |
| Applying a record before checking the CRC | Always verify the [checksum](https://en.wikipedia.org/wiki/Checksum) first. A corrupt record applied to the store corrupts the [state](https://en.wikipedia.org/wiki/State_(computer_science)). |
| Forgetting to close the file descriptor | Every [open(2)](https://man7.org/linux/man-pages/man2/open.2.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a matching [close(2)](https://man7.org/linux/man-pages/man2/close.2.html). Leaking fds causes resource exhaustion. |
| Replaying DEL for a key that does not exist | This is fine — `kv_store_del()` returns 0 for a missing key. Do not treat it as an error. |

## Proof

```bash
./wal_recovery_test
# → write phase: 5 records written
# → recovery: replayed 5 records
# → GET foo → bar
# → GET name → (nil)
# → GET count → 99
# → store has 2 keys — correct

valgrind --leak-check=full ./wal_recovery_test
# → All heap blocks were freed -- no leaks are possible
```

## 🖼️ Hero Visual

```
  WAL file on disk                          In-memory KV store
  ┌──────────────────────────────┐
  │ record 1: SET foo=bar       │ ──replay──▶ store[foo] = bar
  │ record 2: SET name=alice    │ ──replay──▶ store[name] = alice
  │ record 3: SET count=42     │ ──replay──▶ store[count] = 42
  │ record 4: DEL name          │ ──replay──▶ del store[name]
  │ record 5: SET count=99     │ ──replay──▶ store[count] = 99
  │ (EOF)                       │             ┌────────────────┐
  └──────────────────────────────┘             │ foo  → bar     │
                                               │ count → 99     │
        5 records replayed                     │ (2 keys)       │
                                               └────────────────┘
```

## 🔮 Future Lock

- In [W10 L04](04-crash-scenarios.md) you will deliberately crash the writer mid-record and prove that recovery handles the torn record correctly.
- In [W10 L05](05-checkpointing.md) you will add [checkpointing](https://en.wikipedia.org/wiki/Application_checkpointing) so recovery starts from a snapshot instead of replaying from record 1.
- In [W11](../../../parts/w11/part.md) a follower node will run this same replay logic on WAL records received from the leader, keeping its store in sync.
- In [W15](../../../parts/w15/part.md) the same replay concept powers auditing — you replay a [transparency log](https://en.wikipedia.org/wiki/Certificate_Transparency) to verify no entries were tampered with.
