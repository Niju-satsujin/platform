---
id: w09-l11
title: "fsync tuning — the speed-safety tradeoff"
order: 11
duration_minutes: 20
xp: 50
kind: lesson
part: w09
proof:
  type: paste
  instructions: "Paste benchmark output showing ops/sec for: fsync every write, fsync every 100 writes, and no fsync."
  regex_patterns:
    - "fsync|sync"
    - "ops/sec"
---
# fsync tuning — the speed-safety tradeoff

## Concept

You already learned about fsync in Week 1. Now you see its impact on the WAL.

Three fsync policies for the WAL:
1. **fsync every write** — safest, slowest. Every put is durable before returning.
2. **fsync every N writes** — compromise. You might lose the last N-1 writes on crash.
3. **no fsync** — fastest, least safe. The OS decides when to flush. You might lose seconds of data.

This is the same tradeoff every database makes:
- PostgreSQL defaults to fsync every commit (`synchronous_commit = on`)
- Redis defaults to fsync every second (`appendfsync everysec`)
- SQLite has `PRAGMA synchronous = FULL` (every write) or `NORMAL` (occasionally)

There is no "right answer" — it depends on your use case. For a bank, fsync every write. For a cache, no fsync. For a log, fsync every second.

## Task

1. Add an `FsyncPolicy` parameter to your KVStore: `EVERY_WRITE`, `EVERY_N(100)`, `NONE`
2. Benchmark each policy: 10,000 put operations
3. Record ops/sec for each policy
4. Calculate the ratio: how many times faster is no-fsync vs every-write?

## Hints

- Reuse the FsyncPolicy enum from Week 1 or define a new one with the EVERY_N option
- For EVERY_N: track a counter, fsync when counter reaches N, reset counter
- The ratio is typically 100x-1000x (fsync is very expensive on most hardware)
- Run the benchmark on the actual disk, not a RAM disk — RAM disk makes fsync a no-op

## Verify

```bash
./wal_benchmark
```

Expected:
```
fsync every write: 423 ops/sec
fsync every 100:   38521 ops/sec
no fsync:          487231 ops/sec
```

## Done When

You have ops/sec numbers for all three policies and understand the tradeoff.
