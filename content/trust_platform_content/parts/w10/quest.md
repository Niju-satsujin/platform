---
id: w10-quest
title: "Quest — WAL-Backed KV Store"
order: 7
type: quest
duration_min: 90
---

# Quest — WAL-Backed KV Store

## Mission

Integrate all six lessons into a complete [write-ahead log](https://en.wikipedia.org/wiki/Write-ahead_logging) system for the [KV store (W09)](../w09/part.md). Every SET and DEL is written to a [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check)-checksummed [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) file before it is applied to the in-memory [hash table](https://en.wikipedia.org/wiki/Hash_table). After a crash, the store recovers its full state by replaying the log. Periodic [checkpointing](https://en.wikipedia.org/wiki/Application_checkpointing) bounds recovery time. The full [regression harness](https://en.wikipedia.org/wiki/Regression_testing) passes.

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check)-checksummed record format — encode and decode round-trip for SET and DEL | [Codec test (L01)](lessons/01-record-format-checksum.md) — bit-flip causes `CRC_MISMATCH` |
| R2 | [Append-only](https://en.wikipedia.org/wiki/Append-only) WAL writer with [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) after every record | File size equals sum of all encoded record sizes |
| R3 | Recovery replays the full WAL into an empty store and produces the correct [state](https://en.wikipedia.org/wiki/State_(computer_science)) | [Recovery test (L03)](lessons/03-recovery-replay.md) — all keys match |
| R4 | Crash scenarios: torn record, zeroed region, and truncated file all handled correctly | [Crash test (L04)](lessons/04-crash-scenarios.md) — no valid data lost, no corrupt data applied |
| R5 | [Checkpoint](https://en.wikipedia.org/wiki/Application_checkpointing) write and load — snapshot of the store with WAL offset | Checkpoint + tail replay matches full replay |
| R6 | Recovery with checkpoint: loads snapshot, replays only post-checkpoint records | [Checkpoint test (L05)](lessons/05-checkpointing.md) — store matches |
| R7 | [Regression harness](https://en.wikipedia.org/wiki/Regression_testing) passes all 6 test categories | `./w10/test_harness.sh` → `6/6 tests passed` |
| R8 | Zero memory leaks, no [undefined behavior](https://en.wikipedia.org/wiki/Undefined_behavior) | [Valgrind](https://valgrind.org/docs/manual/manual.html) reports 0 leaks, 0 errors |

## Graded Objectives

| Grade | Criteria |
|-------|----------|
| **Pass** | R1–R3: record codec, WAL writer, and basic recovery work for a clean log |
| **Merit** | R4–R5: crash scenarios are handled and checkpointing works |
| **Distinction** | R6–R8: checkpoint-aware recovery, full harness, and zero leaks |

## Constraints

- C only. No external [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) or [database](https://en.wikipedia.org/wiki/Database) libraries.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) compile with `gcc -Wall -Wextra -Werror`.
- The [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) implementation [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be your own table-driven code, not a library call.
- Every [write(2)](https://man7.org/linux/man-pages/man2/write.2.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be followed by [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) before the server replies OK.
- The WAL file [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) be opened with [O_TRUNC](https://man7.org/linux/man-pages/man2/open.2.html) — only append.
- Recovery [MUST](https://datatracker.ietf.org/doc/html/rfc2119) stop at the first bad [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) — never skip corrupt records.

## Bonus Challenges

| Bonus | Description |
|-------|-------------|
| B1 | WAL compaction — after a checkpoint, create a new WAL containing only post-checkpoint records and atomically [rename(2)](https://man7.org/linux/man-pages/man2/rename.2.html) it into place. |
| B2 | Group commit — batch multiple records into a single [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) call. Measure the throughput improvement. |
| B3 | Checksummed checkpoint — add a [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) to the checkpoint file header so corrupt checkpoints are detected. |
| B4 | WAL size monitoring — add a counter that tracks total WAL bytes. Trigger an automatic checkpoint when the WAL exceeds a threshold. |

## Verification

```bash
# Build everything
gcc -Wall -Wextra -Werror -o wal_full_test \
  w10/wal_full_test.c w10/wal_checkpoint.c w10/wal_recovery.c \
  w10/wal_writer.c w10/wal_record.c w10/crc32.c w10/kv_store.c

# R1: codec round-trip
./wal_full_test
# → [test 1] record codec round-trip... PASS

# R2: append discipline
# → [test 3] append discipline file size... PASS

# R3: full recovery
# → [test 4] full recovery replay... PASS

# R4: crash scenarios
# → [test 5] crash recovery (corrupt record)... PASS

# R5 + R6: checkpoint
# → [test 6] checkpoint + partial replay... PASS

# R7: full harness
./w10/test_harness.sh
# → 6/6 tests passed

# R8: memory safety
valgrind --leak-check=full ./wal_full_test
# → All heap blocks were freed -- no leaks are possible
# → ERROR SUMMARY: 0 errors from 0 contexts
```

## Ship

```bash
git add w10/
git commit -m "w10 quest: WAL-backed KV store with CRC32, recovery, checkpointing, and harness"
```
