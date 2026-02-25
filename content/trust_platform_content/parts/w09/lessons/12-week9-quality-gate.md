---
id: w09-l12
title: "Week 9 quality gate"
order: 12
duration_minutes: 20
xp: 100
kind: lesson
part: w09
proof:
  type: paste
  instructions: "Paste your completed quality gate checklist with each item PASS."
  regex_patterns:
    - "PASS"
    - "v0\\.9|week-9"
---
# Week 9 quality gate

## Concept

The 8-point checklist for Week 9:

1. **KV API complete** — get/put/delete with version tracking, all edge cases tested
2. **WAL format valid** — serialize/deserialize round-trip with checksum validation
3. **WAL append** — every operation writes to WAL before memory update
4. **WAL replay** — fresh KVStore recovers full state from WAL
5. **Crash drill 1** — data in WAL but not in memory is recovered
6. **Crash drill 2** — partial WAL record is detected and skipped
7. **Crash drill 3** — replay is idempotent, version counter is correct
8. **Snapshots** — recovery from snapshot + partial WAL is faster and produces identical state

After all 8 pass:
```bash
git tag -a v0.9-kv -m "Week 9: KV Store + WAL complete"
```

## Task

1. Run each check
2. Mark PASS or FAIL
3. Fix any failures
4. Tag the repo

## Hints

- Run crash drills 3 times each to verify they are deterministic
- Check that fsync benchmark numbers are recorded in your project notes
- This is the foundation for replication in Week 10 — the WAL format must be solid

## Verify

```bash
cmake --build build && cd build && ctest --output-on-failure
git tag -l "v0.*"
```

Expected: all tests pass, tag exists.

## Done When

All 8 checklist items are PASS and the v0.9 tag exists.
