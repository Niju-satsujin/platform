---
id: w09-l08
title: "Crash drill — mid-write (partial record)"
order: 8
duration_minutes: 25
xp: 75
kind: lesson
part: w09
proof:
  type: paste
  instructions: "Paste output showing: partial WAL record detected, skipped, and previous valid records recovered."
  regex_patterns:
    - "partial|truncat|corrupt"
    - "skip|recover|valid"
---
# Crash drill — mid-write (partial record)

## Concept

**Scenario**: the KV store is writing a WAL record when the machine loses power. The file contains a partial record — maybe the LSN and operation type are there, but the value and checksum are missing.

On restart, the WAL reader encounters this partial record. It tries to read the full record but runs out of bytes. Or it reads enough bytes but the checksum does not match. Either way, the record is corrupt.

Expected behavior: skip the corrupt record and stop reading. All records BEFORE the corrupt one are valid and should be replayed. The corrupt record represents an operation that never completed — it is safe to discard.

This is why the checksum exists. Without it, you would not know if the last record is valid or truncated. The checksum gives you a definitive answer.

## Task

1. Write a test that:
   - Creates a WAL with 5 valid records
   - Appends a partial record: write only the first 10 bytes of a 6th record (no checksum)
   - Creates a new KVStore and replays
   - Asserts: 5 records replayed, 6th is skipped
   - Asserts: the state matches the first 5 operations
2. Also test: WAL file truncated to 0 bytes (empty file) → replay returns empty state, no crash

## Hints

- To write a partial record: serialize a full record, then write only the first N bytes
- `file.write(data.data(), 10);` writes only 10 bytes of the serialized record
- Your WAL reader should catch: not enough bytes to read the header, or checksum mismatch
- Handle gracefully: log a warning ("skipping corrupt record at offset N"), stop reading, proceed with what you have

## Verify

```bash
./test_crash_mid_write
echo "exit code: $?"
```

Expected: "5 records recovered, 1 partial record skipped, exit code 0"

## Done When

The WAL reader detects and skips partial records, recovering all valid data before the corruption.
