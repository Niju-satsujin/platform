---
id: w09-l07
title: "Crash drill — after WAL write, before apply"
order: 7
duration_minutes: 25
xp: 75
kind: lesson
part: w09
proof:
  type: paste
  instructions: "Paste output showing: put written to WAL, simulated crash, restart, replay recovers the put."
  regex_patterns:
    - "crash|simulate"
    - "recover|replay|found"
---
# Crash drill — after WAL write, before apply

## Concept

This is the first of three crash drills. You simulate a crash at a specific point and verify the data is recoverable.

**Scenario**: the KV store writes a PUT to the WAL and calls fsync. Then — before updating the in-memory map — the process crashes. On restart, the WAL contains the record but the map is empty.

Expected behavior: replay reads the WAL, finds the record, applies it to the map. The data is recovered.

How to simulate a crash: call `_exit(1)` (not `exit()` — `_exit` skips cleanup, simulating a real crash). Or use `kill -9` on the process.

A simpler approach for testing: do not call `_exit`. Instead, write to the WAL but skip the memory update. Then create a new KVStore from scratch, replay, and verify. This simulates the effect of a crash without actually crashing.

## Task

1. Write a test that:
   - Creates a KVStore with WAL
   - Calls the WAL append directly (bypass the normal put path) to write a PUT record
   - Does NOT update the in-memory map
   - Creates a NEW KVStore
   - Calls recover() with the same WAL path
   - Asserts the key exists with the correct value
2. This proves the WAL is the source of truth, not memory

## Hints

- Expose `wal_writer_.append(record)` or write a test-only method that writes to WAL without updating memory
- The new KVStore starts with an empty map — recover() fills it from the WAL
- Use a temp directory for the WAL file so tests do not interfere with each other
- After recovery: `assert(store.get("test_key").has_value())`

## Verify

```bash
./test_crash_after_wal
echo "exit code: $?"
```

Expected: "Crash drill 1 passed: data recovered from WAL"

## Done When

Data written to the WAL but not applied to memory is recovered after a simulated crash.
