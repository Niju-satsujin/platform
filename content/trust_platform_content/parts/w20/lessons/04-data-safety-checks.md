---
id: w20-l04
title: "Data Safety Checks"
order: 4
type: lesson
duration_min: 45
---

# Data Safety Checks

## Goal

Build a [data safety checker](https://en.wikipedia.org/wiki/Data_integrity) that runs after every [chaos drill](02-chaos-drills.md) and proves that no committed data was corrupted. The checker replays the [WAL (W10)](../../w10/part.md), verifies [Merkle roots (W15)](../../w15/part.md), and validates the [anchor chain (W18)](../../w18/part.md).

## What you build

A `struct data_safety_result` that holds six fields: `int wal_replay_ok` (1 if the [WAL](../../w10/part.md) replays without errors, 0 otherwise), `uint64_t wal_entries_recovered` (number of entries successfully replayed), `int merkle_root_ok` (1 if the recomputed [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree) matches the stored root from the [transparency log (W15)](../../w15/part.md), 0 otherwise), `int anchor_chain_ok` (1 if the [anchor chain (W18)](../../w18/part.md) passes [consistency verification](../../w18/lessons/03-consistency-proof.md), 0 otherwise), `uint64_t anchor_head_after` (the anchor head value after recovery), and `int overall_ok` (1 only if all three checks pass). A `data_safety_check_wal()` function that replays the [WAL](../../w10/part.md) from a given directory and returns the replay result. A `data_safety_check_merkle()` function that rebuilds the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) from the recovered data and compares it against the stored [checkpoint root](../../w15/lessons/02-checkpoint.md). A `data_safety_check_anchors()` function that runs [anchor_chain_verify()](../../w18/lessons/03-consistency-proof.md) on the recovered [anchor log](../../w18/lessons/01-append-only-model.md). A `data_safety_check_all()` function that runs all three checks and returns the combined `data_safety_result`. A `data_safety_report()` function that prints each check with its status.

## Why it matters

Recovery that brings the system back online but serves corrupted data is worse than staying down. A [chaos drill](02-chaos-drills.md) that reports `PASS` based only on "the process restarted" is incomplete. You [MUST](https://datatracker.ietf.org/doc/html/rfc2119) verify data integrity after every drill. The [WAL (W10)](../../w10/part.md) guarantees that committed entries survive crashes — this checker proves it. The [Merkle root (W15)](../../w15/part.md) guarantees that no entry was silently changed — this checker proves it. The [anchor chain (W18)](../../w18/part.md) guarantees that the log was not rolled back — this checker proves it.

---

## Training Session

### Warmup

Write down the three data integrity guarantees your system provides:

1. [WAL (W10)](../../w10/part.md): committed entries survive process crashes because they are [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html)-ed before acknowledgement.
2. [Transparency log (W15)](../../w15/part.md): entries are never silently changed because the [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree) would change.
3. [Anchor chain (W18)](../../w18/part.md): the log is never silently rolled back because the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) holds the committed root.

### Work

#### Do

1. Create `w20/data_safety.h`.
2. Define `struct data_safety_result` with the six fields described above.
3. Create `w20/data_safety.c`.
4. Write `data_safety_check_wal()`:
   - Accept a path to the [WAL](../../w10/part.md) directory.
   - Open the WAL file. Read entries one by one. For each entry, verify the [CRC](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) or [checksum](https://en.wikipedia.org/wiki/Checksum) matches the data.
   - Count entries that replay successfully. If any entry has a bad checksum, mark `wal_replay_ok` as 0.
   - Return the WAL portion of the result.
5. Write `data_safety_check_merkle()`:
   - Accept the replayed entries and the path to the stored [checkpoint](../../w15/lessons/02-checkpoint.md).
   - Rebuild the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) from the recovered entries using [SHA-256](https://en.wikipedia.org/wiki/SHA-2).
   - Read the stored root from the [checkpoint file](../../w15/lessons/02-checkpoint.md).
   - Compare the two roots using [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html).
   - Set `merkle_root_ok` to 1 if they match, 0 otherwise.
6. Write `data_safety_check_anchors()`:
   - Accept the path to the [anchor store](../../w18/lessons/05-storage-discipline.md).
   - Run [anchor recovery](../../w18/lessons/05-storage-discipline.md) to find the valid anchor head.
   - Run [anchor_chain_verify()](../../w18/lessons/03-consistency-proof.md) across all recovered anchors.
   - Set `anchor_chain_ok` to 1 if the chain is consistent, 0 otherwise.
   - Record `anchor_head_after`.
7. Write `data_safety_check_all()`:
   - Call all three check functions.
   - Set `overall_ok` to 1 only if all three pass.
   - Return the combined result.
8. Write `data_safety_report()`:
   - Print each check name, its status (`OK` or `FAIL`), and the relevant count or value.
   - Print the overall verdict.
9. Write a `main()` test:
   - Create a temporary directory with a valid [WAL](../../w10/part.md) file, a valid [checkpoint](../../w15/lessons/02-checkpoint.md), and valid [anchor records](../../w18/lessons/01-append-only-model.md).
   - Run `data_safety_check_all()`. Expect all checks to pass.
   - Corrupt one byte in the WAL file. Run again. Expect `wal_replay_ok` to fail.

#### Test

```bash
gcc -Wall -Wextra -Werror -o data_safety_test \
  w20/data_safety.c w20/chaos_drill.c w20/failure_matrix.c \
  w20/recovery_objectives.c -lcrypto
./data_safety_test
```

#### Expected

First run: all three checks print `OK`, overall `PASS`. Second run: WAL check prints `FAIL`, overall `FAIL`. No crashes, no leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./data_safety_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w20/data_safety.h w20/data_safety.c
git commit -m "w20-l04: data safety checks for WAL, Merkle, and anchor chain"
```

---

## Done when

- `data_safety_check_wal()` replays the [WAL](../../w10/part.md) and detects corrupt entries.
- `data_safety_check_merkle()` recomputes the [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree) and compares it against the stored [checkpoint](../../w15/lessons/02-checkpoint.md).
- `data_safety_check_anchors()` validates the full [anchor chain](../../w18/lessons/03-consistency-proof.md).
- `data_safety_check_all()` returns `overall_ok=1` only when all three checks pass.
- A corrupted WAL entry causes the checker to report failure.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Skipping the [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree) check | WAL replay alone does not catch silent data corruption. The [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree) is the only proof that entries were not altered. Always check both. |
| Ignoring partial WAL entries | A crash can leave a half-written entry at the end of the [WAL](../../w10/part.md). This is not corruption — it is an expected artifact. Truncate the partial entry and count it as not committed. |
| Checking anchors before WAL replay | The [anchor chain](../../w18/lessons/03-consistency-proof.md) depends on the log state. Replay the [WAL](../../w10/part.md) first, then rebuild the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree), then verify anchors. Order matters. |
| Treating a missing anchor cosignature as data loss | A missing [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) means the anchor was not confirmed, not that data was lost. [Anchor recovery (W18)](../../w18/lessons/05-storage-discipline.md) rolls back the head — the data is still in the log. |

## Proof

```bash
./data_safety_test
# → [safety] WAL replay: 10 entries recovered, OK
# → [safety] Merkle root: match, OK
# → [safety] Anchor chain: 3 anchors verified, OK
# → [safety] overall: PASS
# →
# → [safety] WAL replay: 9 entries OK, 1 corrupt, FAIL
# → [safety] Merkle root: mismatch, FAIL
# → [safety] Anchor chain: 3 anchors verified, OK
# → [safety] overall: FAIL
```

## Hero visual

```
  Data Safety Checker
  ┌──────────────────────────────────────────────┐
  │                                              │
  │  ┌─── WAL Replay ───┐                       │
  │  │ entry 0  ✓ CRC ok│                       │
  │  │ entry 1  ✓ CRC ok│                       │
  │  │ ...               │                       │
  │  │ entry 9  ✓ CRC ok│  ──▶  wal_replay: OK  │
  │  └──────────────────┘                       │
  │                                              │
  │  ┌─── Merkle Root ──┐                       │
  │  │ rebuild tree      │                       │
  │  │ compare roots     │  ──▶  merkle: OK      │
  │  └──────────────────┘                       │
  │                                              │
  │  ┌─── Anchor Chain ─┐                       │
  │  │ verify 0→1       │                       │
  │  │ verify 1→2       │  ──▶  anchors: OK     │
  │  └──────────────────┘                       │
  │                                              │
  │  Overall: PASS                               │
  └──────────────────────────────────────────────┘
```

## Future Lock

- In [W20 L05](05-operator-playbook.md) the [operator playbook](05-operator-playbook.md) will embed data safety check results so operators can see exactly what was verified after each recovery.
- In [W20 L06](06-regression-harness.md) the [regression harness](06-regression-harness.md) will fail the entire suite if any drill produces a data safety failure.
- In [W20 Quest](../quest.md) the full chaos framework will run data safety checks automatically after every injected fault.
- In [W21](../../w21/part.md) [SLO validation](../../w21/part.md) will treat data safety failures as [SLO](https://en.wikipedia.org/wiki/Service-level_objective) breaches — zero tolerance for data corruption.
