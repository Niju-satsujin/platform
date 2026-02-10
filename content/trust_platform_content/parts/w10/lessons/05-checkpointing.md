---
id: w10-l05
title: "Checkpointing"
order: 5
type: lesson
duration_min: 50
---

# Checkpointing

## Goal

Add periodic [checkpointing](https://en.wikipedia.org/wiki/Application_checkpointing) to the [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) system. A checkpoint writes a full snapshot of the [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) to a separate file so that recovery only needs to replay records written after the checkpoint, not the entire log.

## What you build

A `wal_checkpoint(store, checkpoint_path, wal_offset)` function that iterates over every key-value pair in the [hash table](https://en.wikipedia.org/wiki/Hash_table), writes them to a checkpoint file, and records the WAL offset at which the snapshot was taken. You also modify `wal_recover()` from [L03](03-recovery-replay.md) to load the checkpoint first, then replay only the WAL records after the recorded offset.

## Why it matters

Without [checkpointing](https://en.wikipedia.org/wiki/Application_checkpointing), recovery time grows with the total history of the [database](https://en.wikipedia.org/wiki/Database). A store that has processed one million SET operations would replay all one million records on every restart. [PostgreSQL](https://www.postgresql.org/) solves this with its [CHECKPOINT](https://www.postgresql.org/docs/current/sql-checkpoint.html) command. [Redis](https://redis.io/) solves it with [RDB snapshots](https://redis.io/docs/management/persistence/). Your checkpoint bounds recovery time to the number of records written since the last snapshot.

---

## Training Session

### Warmup — Snapshot design

1. Read the first two paragraphs of [Application checkpointing](https://en.wikipedia.org/wiki/Application_checkpointing). Write down the key idea: save enough state so you can restart from the checkpoint instead of from the beginning.
2. Sketch the checkpoint file format on paper: `[magic : 4 bytes][wal_offset : 8 bytes][num_keys : 4 bytes]` followed by repeated `[key_len : 2][key][value_len : 2][value]` entries.
3. Read the DESCRIPTION section of [ftruncate(2)](https://man7.org/linux/man-pages/man2/ftruncate.2.html). Note that after a checkpoint, you could optionally truncate old WAL records — but you will not do that in this lesson.

### Work — Build the checkpoint system

#### Do

1. Create `w10/wal_checkpoint.h` and `w10/wal_checkpoint.c`.
2. Write `wal_checkpoint_write(store, checkpoint_path, wal_offset)`. Open the checkpoint file with `O_WRONLY | O_CREAT | O_TRUNC` and mode `0644`. Write the magic bytes `"CKPT"`. Write the `wal_offset` as a `uint64_t` — this is the byte position in the WAL at the time of the snapshot. Write `num_keys`.
3. Iterate over every bucket in the [hash table](https://en.wikipedia.org/wiki/Hash_table). For each entry, write `key_len`, the key, `value_len`, and the value. Count entries as you go and verify the count matches `num_keys`.
4. Call [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) and [close](https://man7.org/linux/man-pages/man2/close.2.html) the file.
5. Write `wal_checkpoint_load(checkpoint_path, store, wal_offset_out)`. Open the file with `O_RDONLY`. Read and verify the magic bytes. Read `wal_offset` into the output parameter. Read `num_keys`. For each key-value pair, read the fields and call `kv_store_set(store, key, value)`.
6. Modify the recovery flow: create `wal_recover_with_checkpoint(wal_path, checkpoint_path, store)`. If the checkpoint file exists, call `wal_checkpoint_load()` first to populate the store and get the WAL offset. Then open the WAL and seek to that offset using [lseek()](https://man7.org/linux/man-pages/man2/lseek.2.html). Replay only the records after the checkpoint.
7. Write a `main()` test. Write 10 records to the WAL. Replay all 10 into a store. Take a checkpoint at offset after record 7. Write 3 more records. Now simulate a restart: create a fresh store, call `wal_recover_with_checkpoint()`. Verify the store matches.

#### Test

```bash
gcc -Wall -Wextra -o wal_checkpoint_test \
  w10/wal_checkpoint.c w10/wal_recovery.c w10/wal_writer.c \
  w10/wal_record.c w10/crc32.c w10/kv_store.c
./wal_checkpoint_test
```

#### Expected

```
wrote 10 WAL records
checkpoint at offset 187 with 5 keys
wrote 3 more WAL records
recovery: loaded checkpoint (5 keys), replayed 3 WAL records
GET a → 100
GET d → 4
GET e → 55
store has 5 keys — correct
```

### Prove — Checkpoint correctness

Answer in your own words:

1. Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the checkpoint file be [fsynced](https://man7.org/linux/man-pages/man2/fsync.2.html) before it is considered valid?
2. What happens if the checkpoint file is corrupt? How should recovery handle it?
3. Why do you record the WAL offset in the checkpoint instead of a record count?

### Ship

```bash
git add w10/wal_checkpoint.h w10/wal_checkpoint.c
git commit -m "w10-l05: periodic checkpointing bounds recovery time"
```

---

## Done when

- `wal_checkpoint_write()` dumps the full store to a checkpoint file with a WAL offset.
- `wal_checkpoint_load()` restores the store from the checkpoint file.
- `wal_recover_with_checkpoint()` loads the checkpoint, then replays only post-checkpoint WAL records.
- Recovery produces the same store state whether you replay the full WAL or use checkpoint + tail.
- The checkpoint file is [fsynced](https://man7.org/linux/man-pages/man2/fsync.2.html) before being considered valid.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not fsyncing the checkpoint file | A crash during checkpoint write leaves a corrupt file. [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) before closing. |
| Wrong WAL offset in checkpoint | The offset [MUST](https://datatracker.ietf.org/doc/html/rfc2119) point to the first byte after the last record included in the snapshot. Off by one means replaying a record twice or missing one. |
| Deleting the WAL before checkpoint is fsynced | If the checkpoint write fails after you deleted the WAL, you lose all data. Never delete the old WAL until the new checkpoint is confirmed on disk. |
| Forgetting to handle missing checkpoint file | On first startup there is no checkpoint. `wal_recover_with_checkpoint()` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) fall back to full WAL replay if the checkpoint file does not exist. |

## Proof

```bash
./wal_checkpoint_test
# → wrote 10 WAL records
# → checkpoint at offset 187 with 5 keys
# → wrote 3 more WAL records
# → recovery: loaded checkpoint (5 keys), replayed 3 WAL records
# → store has 5 keys — correct

valgrind --leak-check=full ./wal_checkpoint_test
# → All heap blocks were freed -- no leaks are possible
```

## 🖼️ Hero Visual

```
  Full WAL on disk:
  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │10 │  10 records total
  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
                                  ▲
                          checkpoint here (offset 187)

  Checkpoint file:                      Recovery with checkpoint:
  ┌────────────────────┐                ┌──────────────────┐
  │ magic: CKPT        │   ──load──▶    │ store = snapshot  │
  │ wal_offset: 187    │                │ (5 keys)          │
  │ num_keys: 5        │                └───────┬──────────┘
  │ a=100, c=3, d=4... │                        │
  └────────────────────┘                        ▼
                                        replay records 8, 9, 10
                                        from WAL offset 187
                                                │
                                                ▼
                                        ┌──────────────────┐
                                        │ final store      │
                                        │ (5 keys, updated)│
                                        └──────────────────┘
```

## 🔮 Future Lock

- In [W10 L06](06-regression-harness.md) you will add checkpoint-aware tests to the [regression harness](https://en.wikipedia.org/wiki/Regression_testing) to verify checkpoint + replay always matches full replay.
- In [W11](../../../parts/w11/part.md) a new follower can bootstrap from a checkpoint snapshot instead of replaying the entire WAL history from the leader.
- In [W15](../../../parts/w15/part.md) the [transparency log](https://en.wikipedia.org/wiki/Certificate_Transparency) uses a similar idea: periodic signed tree heads act as checkpoints for auditors.
