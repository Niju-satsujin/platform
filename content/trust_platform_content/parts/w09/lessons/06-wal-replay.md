---
id: w09-l06
title: "WAL replay — rebuild from the log"
order: 6
duration_minutes: 25
xp: 75
kind: lesson
part: w09
proof:
  type: paste
  instructions: "Paste output showing: (1) 10 operations written, (2) process restarted, (3) all 10 operations replayed, (4) final state matches expected."
  regex_patterns:
    - "replay|recover|rebuild"
    - "match|correct|identical"
---
# WAL replay — rebuild from the log

## Concept

On startup, your KV store checks if a WAL file exists. If it does, it reads every record and applies the operations to the in-memory hash map. This is called **replay** — you replay the history of operations to rebuild the state.

The replay loop:
1. Open the WAL file
2. Read one record at a time
3. Validate the checksum — if invalid, this record is corrupt (crash during write), stop here
4. Apply the operation: if PUT, insert into the map; if DELETE, remove from the map
5. Update the version counter to the record's LSN
6. Repeat until end of file

After replay, the in-memory state is identical to what it was before the crash. The user does not even know a crash happened.

Key detail: replay must be **idempotent**. If you replay the same WAL twice (maybe the first replay crashed too), the result must be the same. This works naturally with PUT (overwrite) and DELETE (remove if exists).

## Task

1. Create a `WALReader` class: `WALReader(const std::string& path)`
2. `std::vector<WALRecord> read_all()` — reads and validates all records from the WAL file
3. Add a `KVStore::recover(const std::string& wal_path)` method that replays the WAL
4. Test: write 10 operations → destroy the KVStore → create a new one → replay → verify all data is correct
5. Test idempotency: replay the same WAL twice → verify the state is the same

## Hints

- Reading binary records: read LSN (8 bytes), op (1 byte), key_len (4 bytes), key (key_len bytes), etc.
- When a checksum does not match, stop reading — everything after is suspect
- After replay, `next_version_` should be set to `max_lsn + 1` to avoid version collisions
- For the test: put("a","1"), put("b","2"), delete("a"), put("c","3"), ... then destroy and rebuild

## Verify

```bash
./test_wal_replay
echo "exit code: $?"
```

Expected: "Replayed 10 records, state verified, exit code 0"

## Done When

The KV store recovers its full state from the WAL and the idempotency test passes.
