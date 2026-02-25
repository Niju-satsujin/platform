---
id: w09-l10
title: "Snapshots for fast recovery"
order: 10
duration_minutes: 25
xp: 75
kind: lesson
part: w09
proof:
  type: paste
  instructions: "Paste output showing: (1) snapshot created, (2) recovery from snapshot + partial WAL is faster than full WAL replay."
  regex_patterns:
    - "snapshot"
    - "recover|restore"
---
# Snapshots for fast recovery

## Concept

If the WAL has 1 million records, replay takes a long time. Snapshots fix this.

A **snapshot** is a dump of the entire in-memory state to a file at a specific point in time. It records: the LSN at which the snapshot was taken, and every key-value pair.

Recovery with snapshots:
1. Load the latest snapshot (restores state up to LSN N)
2. Replay only WAL records after LSN N
3. Done — much faster than replaying from the beginning

After taking a snapshot, you can delete WAL records before the snapshot's LSN — they are no longer needed. This keeps the WAL file from growing forever.

The snapshot format can be simple: `[count: uint32][for each: key_len + key + value_len + value + version]`. Write it atomically: write to a temp file, fsync, rename to the final name. This ensures a crash during snapshot creation does not corrupt the existing snapshot.

## Task

1. Add `void snapshot(const std::string& path)` to KVStore — writes current state + current LSN
2. Add `void load_snapshot(const std::string& path)` — reads state, sets `next_version_`
3. Modify recovery: load snapshot first (if exists), then replay WAL records with LSN > snapshot_lsn
4. Test: write 1000 operations, snapshot at LSN 500, write 500 more, recover from snapshot + WAL
5. Measure: full replay time vs snapshot + partial replay time

## Hints

- Atomic write: `write to path.tmp` → `fsync` → `rename(path.tmp, path)` — rename is atomic on most filesystems
- The snapshot file starts with the LSN: `uint64_t snapshot_lsn`
- During WAL replay after snapshot: `if (record.lsn <= snapshot_lsn) continue;` — skip already-applied records
- For timing: use `std::chrono::high_resolution_clock` around each recovery path

## Verify

```bash
./test_snapshots
```

Expected: "Full replay: 45ms, Snapshot + partial replay: 12ms, State verified identical"

## Done When

Recovery from snapshot + partial WAL produces identical state and is measurably faster than full replay.
