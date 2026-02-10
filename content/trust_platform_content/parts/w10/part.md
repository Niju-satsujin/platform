---
id: w10-part
title: "Write-Ahead Log & Crash Recovery"
order: 10
type: part
---

# Write-Ahead Log & Crash Recovery

Durability means surviving crash and restart without data loss. Every mutation hits the [write-ahead log](https://en.wikipedia.org/wiki/Write-ahead_logging) before it touches memory.

## 🖼️ Hero Visual

```
  client          KV server                          disk
  ┌──────┐    ┌───────────────────────────────┐    ┌──────────────────────┐
  │ SET  │───▶│  parse ──▶ WAL append ──▶ apply│   │  wal.log             │
  │ DEL  │    │           │                    │   │ ┌──────────────────┐ │
  │ GET  │◀───│  lookup ◀─┘  fsync ───────────────▶│ │ [CRC|len|op|k|v]│ │
  └──────┘    │                                │   │ │ [CRC|len|op|k|v]│ │
              │  ┌─────────────────────────┐   │   │ │ [CRC|len|op|k|v]│ │
              │  │   hashmap (in-memory)   │   │   │ │ ...              │ │
              │  │ ┌───┬───┬───┬───┬───┐   │   │   │ └──────────────────┘ │
              │  │ │k:v│k:v│   │k:v│   │   │   │   │                      │
              │  │ └───┴───┴───┴───┴───┘   │   │   │  checkpoint.dat       │
              │  └─────────────────────────┘   │   │ ┌──────────────────┐ │
              │  crash? ──▶ replay WAL ──▶ ok  │   │ │ snapshot @ LSN N │ │
              └───────────────────────────────┘   │ └──────────────────┘ │
                                                   └──────────────────────┘
```

## What you build

A [write-ahead log](https://en.wikipedia.org/wiki/Write-ahead_logging) for the [KV store (W09)](../w09/part.md). Every SET and DEL is serialized into a [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check)-checksummed record and appended to a log file with [append-only](https://en.wikipedia.org/wiki/Append-only) discipline. After a crash, the recovery routine replays the log to rebuild the [hash table](https://en.wikipedia.org/wiki/Hash_table) state. You simulate crash scenarios to prove correctness, add periodic [checkpointing](https://en.wikipedia.org/wiki/Application_checkpointing) to bound recovery time, and run a full [regression harness](https://en.wikipedia.org/wiki/Regression_testing) to prove nothing breaks.

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W07 | [Hashing](../w07/part.md) – CRC32 uses the same integrity idea as hash functions |
| ← builds on | W09 | [KV store](../w09/part.md) – the store you are making durable |
| → leads to | W11 | [Replication](../w11/part.md) – followers replay shipped WAL records to stay in sync |
| → leads to | W15 | [Transparency log](../w15/part.md) – append-only log model powers tamper-evident logs |

## Lessons

| # | Status | Lesson |
|---|--------|--------|
| 0/7 | ⬡ | Start here |
| 1/7 | ⬡ | [Record Format & Checksum](lessons/01-record-format-checksum.md) |
| 2/7 | ⬡ | [Append Discipline](lessons/02-append-discipline.md) |
| 3/7 | ⬡ | [Recovery Replay](lessons/03-recovery-replay.md) |
| 4/7 | ⬡ | [Crash Scenarios](lessons/04-crash-scenarios.md) |
| 5/7 | ⬡ | [Checkpointing](lessons/05-checkpointing.md) |
| 6/7 | ⬡ | [Regression Harness](lessons/06-regression-harness.md) |
| 7/7 | ⬡ | [Quest — WAL-Backed KV Store](quest.md) |

## Quest

[W10 Quest — WAL-Backed KV Store](quest.md)

## Quiz

[W10 Quiz](quiz.md)
