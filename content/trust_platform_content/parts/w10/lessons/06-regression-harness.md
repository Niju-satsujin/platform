---
id: w10-l06
title: "Regression Harness"
order: 6
type: lesson
duration_min: 35
---

# Regression Harness

## Goal

Build an automated [regression harness](https://en.wikipedia.org/wiki/Regression_testing) that tests every part of the [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) system — record encoding, append discipline, recovery replay, crash scenarios, and [checkpointing](https://en.wikipedia.org/wiki/Application_checkpointing) — in a single script. Run it on every build to prove nothing is broken.

## What you build

A shell script `w10/test_harness.sh` that compiles all components, runs 6 test categories, counts passes and failures, and exits with a non-zero code if any test fails. You also write a C test runner `w10/wal_full_test.c` that exercises the end-to-end flow: write, crash, recover, checkpoint, recover again.

## Why it matters

A [write-ahead log](https://en.wikipedia.org/wiki/Write-ahead_logging) is the foundation of data durability. If a future change breaks the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) computation, the record encoding, or the recovery logic, you will silently lose data on the next crash. The [regression harness](https://en.wikipedia.org/wiki/Regression_testing) catches that before it reaches production. This is the same pattern used by [SQLite's test suite](https://sqlite.org/testing.html), which runs millions of tests to protect its WAL implementation. In [W09 L06](../../../parts/w09/lessons/06-regression-harness.md) you built a harness for the [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) — this one protects the durability layer underneath it.

---

## Training Session

### Warmup — Test categories

1. List the 6 components built in [L01](01-record-format-checksum.md) through [L05](05-checkpointing.md): record codec, CRC32, WAL writer, recovery, crash scenarios, and checkpointing.
2. For each component, write down one thing that could break silently. Example: a wrong [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) polynomial would produce valid-looking but wrong checksums.
3. Read the man page for [trap](https://man7.org/linux/man-pages/man1/trap.1p.html). Write down how to use `trap cleanup EXIT` to ensure temp files are removed even if the script fails.

### Work — Build the harness

#### Do

1. Create `w10/wal_full_test.c`. This is the end-to-end C test.
2. Write test 1: encode and decode 10 records. Verify every field matches after the round trip.
3. Write test 2: flip one bit in each encoded record. Verify that `wal_record_decode()` returns `CRC_MISMATCH` for every one.
4. Write test 3: use the WAL writer to append 20 records. Close the file. Verify the file size equals the sum of all encoded record sizes.
5. Write test 4: write 20 records, recover into a fresh store, verify all keys and values match.
6. Write test 5: write 20 records, corrupt record 15, recover. Verify the store has exactly 14 records worth of data.
7. Write test 6: write 20 records, checkpoint after record 10. Write 10 more. Recover with checkpoint. Verify the store matches a full replay of all 30 records.
8. Print a summary: `6/6 tests passed` or the count of failures.
9. Create `w10/test_harness.sh`. Add `set -e` and a [trap](https://man7.org/linux/man-pages/man1/trap.1p.html) on EXIT that removes temp files and kills background processes.
10. The script compiles every C file with `gcc -Wall -Wextra -Werror`. Runs `wal_full_test`. Checks the exit code. Prints the final result.

#### Test

```bash
chmod +x w10/test_harness.sh
./w10/test_harness.sh
```

#### Expected

```
[build] compiling WAL components... ok
[test 1] record codec round-trip... PASS
[test 2] CRC corruption detection... PASS
[test 3] append discipline file size... PASS
[test 4] full recovery replay... PASS
[test 5] crash recovery (corrupt record)... PASS
[test 6] checkpoint + partial replay... PASS
6/6 tests passed
```

### Prove — Harness completeness

Answer in your own words:

1. Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the harness compile with `-Werror`?
2. What would happen if you removed test 2 (CRC corruption) and someone accidentally changed the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) polynomial?
3. Why does the harness use a [trap](https://man7.org/linux/man-pages/man1/trap.1p.html) on EXIT instead of cleaning up at the end of the script?

### Ship

```bash
git add w10/wal_full_test.c w10/test_harness.sh
git commit -m "w10-l06: regression harness for WAL system"
```

---

## Done when

- `wal_full_test.c` runs 6 test categories and prints `6/6 tests passed`.
- `test_harness.sh` compiles with `-Wall -Wextra -Werror`, runs the test, and exits 0 on success.
- The [trap](https://man7.org/linux/man-pages/man1/trap.1p.html) cleans up temp files on any exit path.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero leaks on the full test.
- Breaking any one component causes at least one test to fail.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not cleaning up temp WAL files between tests | Each test [MUST](https://datatracker.ietf.org/doc/html/rfc2119) start with a fresh WAL file. Delete or use unique file names for each test. |
| Hardcoding file paths | Use temp files in `/tmp` or a test directory. Hardcoded paths break on other machines. |
| No trap on EXIT | If a test fails early, temp files and background processes are left behind. Always use [trap](https://man7.org/linux/man-pages/man1/trap.1p.html). |
| Ignoring compiler warnings | `-Werror` turns warnings into errors. Fix every warning — they often hide real bugs in record encoding or pointer arithmetic. |

## Proof

```bash
./w10/test_harness.sh
# → [build] compiling WAL components... ok
# → [test 1] record codec round-trip... PASS
# → [test 2] CRC corruption detection... PASS
# → [test 3] append discipline file size... PASS
# → [test 4] full recovery replay... PASS
# → [test 5] crash recovery (corrupt record)... PASS
# → [test 6] checkpoint + partial replay... PASS
# → 6/6 tests passed

valgrind --leak-check=full ./wal_full_test
# → All heap blocks were freed -- no leaks are possible
```

## 🖼️ Hero Visual

```
  test_harness.sh
  ┌──────────────────────────────────────────────────────────┐
  │ set -e                                                    │
  │ trap cleanup EXIT                                         │
  │                                                           │
  │ gcc -Wall -Wextra -Werror ... -o wal_full_test            │
  │                                                           │
  │ ./wal_full_test                                           │
  │  ├── test 1: codec round-trip .............. PASS         │
  │  ├── test 2: CRC corruption ................ PASS         │
  │  ├── test 3: append file size .............. PASS         │
  │  ├── test 4: full recovery ................. PASS         │
  │  ├── test 5: crash recovery ................ PASS         │
  │  └── test 6: checkpoint + replay ........... PASS         │
  │                                                           │
  │ 6/6 tests passed                                          │
  │ exit 0                                                    │
  └──────────────────────────────────────────────────────────┘
```

## 🔮 Future Lock

- In [W11](../../../parts/w11/part.md) you will extend this harness to test [replication](https://en.wikipedia.org/wiki/Replication_(computing)) — a leader writes, a follower replays, and the harness verifies both stores match.
- In [W12](../../../parts/w12/part.md) the harness will test that [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) consensus produces the same WAL on every node.
- In [W15](../../../parts/w15/part.md) the harness pattern will verify that [transparency log](https://en.wikipedia.org/wiki/Certificate_Transparency) entries cannot be tampered with after they are appended.
