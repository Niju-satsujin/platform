---
id: w09-l09
title: "Crash drill — after apply (idempotent replay)"
order: 9
duration_minutes: 20
xp: 50
kind: lesson
part: w09
proof:
  type: paste
  instructions: "Paste output showing: replay applied twice, final state is identical both times."
  regex_patterns:
    - "idempotent|same|identical"
    - "replay"
---
# Crash drill — after apply (idempotent replay)

## Concept

**Scenario**: the KV store writes to the WAL, updates memory, and then crashes before it can do any cleanup (like truncating old WAL entries). On restart, replay runs again. Every record in the WAL is replayed, including records that were already applied to memory before the crash.

This is fine — as long as replay is **idempotent**. Applying the same PUT twice gives the same result (the value is just overwritten with the same data). Applying the same DELETE twice also works (the second delete finds no key and does nothing).

The concern is the version counter. If you replay 10 records, `next_version_` must be set to 11 — not to 21 (which would happen if you added 10 to the current counter instead of taking the max).

The fix: during replay, set `next_version_ = std::max(next_version_, record.lsn + 1)`. This ensures the counter always moves forward but never double-counts.

## Task

1. Write a test that:
   - Creates a KVStore, performs 10 operations
   - Captures the final state (all keys and values)
   - Replays the WAL twice on a fresh KVStore
   - Asserts the final state is identical to the original
   - Asserts `next_version_` is correct (not doubled)
2. Also verify: put("a","1") at LSN 5, replay, then put("b","2") should get LSN 11 (not 6 or 16)

## Hints

- In recovery: `next_version_ = std::max(next_version_, record.lsn + 1);`
- To capture state: iterate the map and collect key-value pairs into a sorted vector
- Compare vectors: `assert(state_original == state_after_replay);`
- The version counter test is the key assertion — double-counting would cause version collisions

## Verify

```bash
./test_crash_after_apply
echo "exit code: $?"
```

Expected: "Idempotent replay verified, version counter correct, exit code 0"

## Done When

Replay is idempotent — applying the WAL twice produces identical state with correct version numbers.
