---
id: w10-l04
title: "Crash Scenarios"
order: 4
type: lesson
duration_min: 45
---

# Crash Scenarios

## Goal

Simulate crash scenarios that can happen to a [write-ahead log](https://en.wikipedia.org/wiki/Write-ahead_logging). Prove that your [CRC32 (L01)](01-record-format-checksum.md) and [recovery (L03)](03-recovery-replay.md) logic handles each one correctly without losing valid data and without applying corrupt data.

## What you build

A crash simulation test program. It creates a valid WAL, then introduces three kinds of damage: a torn record (partial write), a zeroed-out region (disk corruption), and a truncated file (power loss during [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html)). After each damage scenario, you run `wal_recover()` and verify the store contains exactly the right data.

## Why it matters

You cannot wait for a real crash to test your recovery code. Every production [database](https://en.wikipedia.org/wiki/Database) has a crash test suite. [SQLite](https://sqlite.org/) has over 100 crash simulation tests. [PostgreSQL](https://www.postgresql.org/) tests torn pages, partial writes, and file corruption. If your recovery code has never seen a damaged log, you cannot trust it. The [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) from [L01](01-record-format-checksum.md) and the stop-on-bad-CRC rule from [L03](03-recovery-replay.md) are only trustworthy if you prove they work under fire.

---

## Training Session

### Warmup — Kinds of crash damage

1. Read the DESCRIPTION section of [ftruncate(2)](https://man7.org/linux/man-pages/man2/ftruncate.2.html). Note that it can shorten a file, simulating a power loss that cut a write short.
2. Write down three crash scenarios: (a) process killed mid-[write(2)](https://man7.org/linux/man-pages/man2/write.2.html) — only half the record bytes are on disk, (b) disk block returns zeroes — the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) will not match, (c) file truncated — end-of-file appears in the middle of a record.
3. For each scenario, write down what `wal_recover()` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) do: stop at the damaged record and return all records before it.

### Work — Build the crash simulator

#### Do

1. Create `w10/wal_crash_test.c`.
2. Write a helper `create_baseline_wal(path)` that uses the WAL writer from [L02](02-append-discipline.md) to write 5 valid records: SET a=1, SET b=2, SET c=3, DEL b, SET d=4. Close the file.
3. Write `scenario_torn_record(path)`. Copy the baseline file to a test file. Open the test file with [O_WRONLY](https://man7.org/linux/man-pages/man2/open.2.html). Seek to the start of record 5. Overwrite the first 3 bytes with garbage. Close the file. Now the last record has a bad [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check).
4. Run `wal_recover()` on the damaged file. Verify that the store contains keys `a`, `c`, `d` is absent, and `b` is absent. Recovery [MUST](https://datatracker.ietf.org/doc/html/rfc2119) replay exactly 4 records.
5. Write `scenario_zeroed_region(path)`. Copy the baseline. Overwrite 8 bytes in the middle of record 3 with zeroes. Run recovery. Verify the store contains only `a` and `b` — records 1 and 2. Records 3, 4, and 5 are lost because recovery stops at the first bad [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check).
6. Write `scenario_truncated_file(path)`. Copy the baseline. Use [ftruncate(2)](https://man7.org/linux/man-pages/man2/ftruncate.2.html) to chop the file 10 bytes before the end. Run recovery. Verify the store contains keys from records 1–4 only. Record 5 is incomplete and discarded.
7. Print a summary: all three scenarios passed, with the record counts and key sets.

#### Test

```bash
gcc -Wall -Wextra -o wal_crash_test \
  w10/wal_crash_test.c w10/wal_recovery.c w10/wal_writer.c \
  w10/wal_record.c w10/crc32.c w10/kv_store.c
./wal_crash_test
```

#### Expected

```
scenario 1 — torn record: recovered 4/5 records, keys={a,c} ✓
scenario 2 — zeroed region: recovered 2/5 records, keys={a,b} ✓
scenario 3 — truncated file: recovered 4/5 records, keys={a,c,d} ✓
all crash scenarios passed
```

### Prove — No valid data lost

For each scenario, explain in one sentence:

1. Why the valid records before the damage point are still intact.
2. Why the damaged record and all records after it are correctly discarded.
3. Why it would be unsafe to skip the damaged record and continue.

### Ship

```bash
git add w10/wal_crash_test.c
git commit -m "w10-l04: crash scenario tests — torn, zeroed, truncated"
```

---

## Done when

- Torn record scenario: recovery replays all records before the damaged one.
- Zeroed region scenario: recovery stops at the corrupted record.
- Truncated file scenario: recovery stops at the incomplete record.
- No scenario causes a crash, [segfault](https://en.wikipedia.org/wiki/Segmentation_fault), or [undefined behavior](https://en.wikipedia.org/wiki/Undefined_behavior).
- No valid data is lost in any scenario.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Recovery reads past end-of-file | Check the return value of [read(2)](https://man7.org/linux/man-pages/man2/read.2.html). If it returns 0 or fewer bytes than expected, stop. |
| Assuming the damage is always at the end | Zeroed regions can appear anywhere. Your recovery [MUST](https://datatracker.ietf.org/doc/html/rfc2119) stop at the first bad record regardless of position. |
| Skipping bad records and continuing | Never skip. A bad [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) means you cannot trust the length field either, so you do not know where the next record starts. |
| Not resetting the store between scenarios | Each scenario [MUST](https://datatracker.ietf.org/doc/html/rfc2119) start with a fresh empty store. Otherwise keys from a previous scenario leak into the next test. |

## Proof

```bash
./wal_crash_test
# → scenario 1 — torn record: recovered 4/5 records, keys={a,c} ✓
# → scenario 2 — zeroed region: recovered 2/5 records, keys={a,b} ✓
# → scenario 3 — truncated file: recovered 4/5 records, keys={a,c,d} ✓
# → all crash scenarios passed

valgrind --leak-check=full ./wal_crash_test
# → All heap blocks were freed -- no leaks are possible
```

## 🖼️ Hero Visual

```
  Baseline WAL:
  ┌───────┬───────┬───────┬───────┬───────┐
  │ SET a │ SET b │ SET c │ DEL b │ SET d │  5 records, all valid
  └───────┴───────┴───────┴───────┴───────┘

  Scenario 1 — torn record (garbage in record 5):
  ┌───────┬───────┬───────┬───────┬▒▒▒▒▒▒▒┐
  │ SET a │ SET b │ SET c │ DEL b │CORRUPT │  recovery stops → 4 replayed
  └───────┴───────┴───────┴───────┴▒▒▒▒▒▒▒┘

  Scenario 2 — zeroed region (middle of record 3):
  ┌───────┬───────┬▒▒▒▒▒▒▒┬───────┬───────┐
  │ SET a │ SET b │ 00 00 │ DEL b │ SET d │  recovery stops → 2 replayed
  └───────┴───────┴▒▒▒▒▒▒▒┴───────┴───────┘

  Scenario 3 — truncated file:
  ┌───────┬───────┬───────┬───────┬────┐
  │ SET a │ SET b │ SET c │ DEL b │ SE │  file ends mid-record → 4 replayed
  └───────┴───────┴───────┴───────┴────┘
```

## 🔮 Future Lock

- In [W10 L05](05-checkpointing.md) you will add [checkpointing](https://en.wikipedia.org/wiki/Application_checkpointing) so that even if the tail of the log is damaged, recovery only needs to replay records written after the last checkpoint.
- In [W10 L06](06-regression-harness.md) you will wrap these crash scenarios into an automated [regression harness](https://en.wikipedia.org/wiki/Regression_testing) that runs on every build.
- In [W11](../../../parts/w11/part.md) a follower that receives a corrupt WAL record from the leader [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reject it using the same [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) check, protecting the replica from corruption.
