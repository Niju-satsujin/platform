---
id: w09-l05
title: "WAL append — write before apply"
order: 5
duration_minutes: 25
xp: 75
kind: lesson
part: w09
proof:
  type: paste
  instructions: "Paste output showing: (1) WAL file growing with each put, (2) the in-memory state matching the WAL contents."
  regex_patterns:
    - "WAL|append|write"
    - "lsn|record"
---
# WAL append — write before apply

## Concept

The rule is simple: **write to the WAL first, then update memory**. Never the other way around.

Why? If you update memory first and crash before writing the WAL, the change is lost. If you write the WAL first and crash before updating memory, you can recover by replaying the WAL — the data is on disk.

The write sequence for every put or delete:
1. Create a WAL record with the operation details
2. Serialize the record to bytes
3. Append the bytes to the WAL file
4. Call `fsync()` on the WAL file (so the data is on disk, not in OS cache)
5. Now update the in-memory hash map

If you crash between steps 4 and 5, the WAL has the record but memory does not. On restart, replay the WAL and memory catches up. No data lost.

If you crash between steps 3 and 4 (data written but not fsync'd), the record might be lost. That is the fsync tradeoff — you choose whether to accept this risk (faster) or not (safer).

## Task

1. Create a `WALWriter` class that manages the WAL file
2. `WALWriter(const std::string& path)` — opens or creates the file in append mode
3. `void append(const WALRecord& record)` — serializes and writes to the file, then flushes
4. Modify your `KVStore::put()`: create WAL record → append to WAL → then update memory
5. Modify your `KVStore::delete()`: same pattern
6. After 5 puts, dump the WAL file contents and verify 5 records are there

## Hints

- Open the WAL file with `std::ofstream` in `std::ios::app | std::ios::binary` mode
- Write the serialized bytes: `file.write(reinterpret_cast<const char*>(data.data()), data.size());`
- `file.flush();` pushes to OS cache — add `fsync()` for durability
- The WAL file grows forever (for now) — truncation comes with snapshots in lesson 10
- Keep the `WALWriter` as a member of `KVStore` — the store owns the WAL

## Verify

```bash
./test_wal_append
hexdump -C data.wal | head -20
```

Expected: 5 WAL records in the file, each with a valid checksum.

## Done When

Every put and delete writes to the WAL before updating memory, and the WAL file contains the correct records.
