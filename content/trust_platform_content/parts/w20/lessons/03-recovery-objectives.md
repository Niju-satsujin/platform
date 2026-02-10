---
id: w20-l03
title: "Recovery Objectives"
order: 3
type: lesson
duration_min: 40
---

# Recovery Objectives

## Goal

Build a validator that enforces [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) (Recovery Time Objective) and [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) (Recovery Point Objective) for every [chaos drill](02-chaos-drills.md). After each fault injection, the validator checks: did the system come back within the time limit, and how many committed records were lost?

## What you build

A `struct recovery_objective` that holds four fields: `char failure_name[64]` (matching the [failure matrix (L01)](01-failure-matrix.md) entry), `uint64_t rto_ms` (maximum acceptable recovery time in milliseconds), `uint64_t rpo_records` (maximum acceptable data loss in committed records), and `char description[128]` (human-readable explanation of why these limits exist). A `struct rto_rpo_result` that holds five fields: `char failure_name[64]`, `uint64_t actual_recovery_ms` (elapsed time from the [chaos drill](02-chaos-drills.md)), `uint64_t actual_lost_records` (records committed before the fault but missing after recovery), `int rto_pass` (1 if `actual_recovery_ms <= rto_ms`, 0 otherwise), and `int rpo_pass` (1 if `actual_lost_records <= rpo_records`, 0 otherwise). A `recovery_objective_validate()` function that takes a [chaos drill](02-chaos-drills.md) result and a `recovery_objective`, counts lost records by comparing pre-fault and post-recovery state, and returns an `rto_rpo_result`. A `recovery_objective_report()` function that prints the result with a `PASS` or `FAIL` verdict for each metric.

## Why it matters

Recovery that takes ten minutes is not the same as recovery that takes ten seconds. [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) puts a number on how long your users wait. [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) puts a number on how much data they lose. Without these numbers, "the system recovered" is meaningless — it could have lost half the database and taken an hour. The [WAL from W10](../../w10/part.md) promises zero data loss for committed entries. The [anchor store from W18](../../w18/part.md) promises rollback to the last complete anchor. This lesson makes you prove those promises under fire.

---

## Training Session

### Warmup

Write down the answers to these two questions:

1. If your [WAL (W10)](../../w10/part.md) [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html)-s every entry, what is the theoretical [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective)? (Hint: it should be zero committed records lost.)
2. If [WAL recovery](../../w10/part.md) replays N entries and each replay takes 1 ms, what is the [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) as a function of N?

### Work

#### Do

1. Create `w20/recovery_objectives.h`.
2. Define `struct recovery_objective` and `struct rto_rpo_result` with the fields described above.
3. Create `w20/recovery_objectives.c`.
4. Write `recovery_objective_init()`:
   - Accept the failure name, [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) in milliseconds, [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) in records, and a description.
   - Return a filled `recovery_objective` struct.
5. Write `recovery_objective_count_lost_records()`:
   - Accept a path to the pre-fault data snapshot and a path to the post-recovery data.
   - Read both files. Count how many committed records appear in the pre-fault snapshot but are missing from the post-recovery state.
   - Return the count.
6. Write `recovery_objective_validate()`:
   - Accept a [chaos_drill](02-chaos-drills.md) result and a `recovery_objective`.
   - Compute `actual_recovery_ms` from the drill's `inject_time` and `recover_time` using [clock_gettime()](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) arithmetic.
   - Call `recovery_objective_count_lost_records()` to get `actual_lost_records`.
   - Set `rto_pass` to 1 if `actual_recovery_ms <= rto_ms`, else 0.
   - Set `rpo_pass` to 1 if `actual_lost_records <= rpo_records`, else 0.
   - Return the filled `rto_rpo_result`.
7. Write `recovery_objective_report()`:
   - Print the failure name, the objective values, the actual values, and a `PASS` or `FAIL` for each metric.
   - Print an overall verdict: `PASS` only if both metrics pass.
8. Write a `main()` test:
   - Set an [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) of 500 ms and [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) of 0 records for `process_crash`.
   - Create a pre-fault snapshot file with 10 committed records.
   - Create a post-recovery file with 10 records (simulating zero loss).
   - Run `recovery_objective_validate()` with a simulated drill result of 120 ms recovery.
   - Print the report. Expect both metrics to pass.
   - Repeat with a simulated drill of 800 ms recovery. Expect [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) to fail.

#### Test

```bash
gcc -Wall -Wextra -Werror -o recovery_obj_test \
  w20/recovery_objectives.c w20/chaos_drill.c w20/failure_matrix.c
./recovery_obj_test
```

#### Expected

Two reports. The first shows `RTO: PASS (120ms <= 500ms)` and `RPO: PASS (0 <= 0)` with overall `PASS`. The second shows `RTO: FAIL (800ms > 500ms)` with overall `FAIL`.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./recovery_obj_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w20/recovery_objectives.h w20/recovery_objectives.c
git commit -m "w20-l03: RTO/RPO validator for chaos drill results"
```

---

## Done when

- `recovery_objective_validate()` computes actual recovery time and lost records from a [chaos drill](02-chaos-drills.md) result.
- `rto_pass` is 1 only when actual recovery time is within the [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) limit.
- `rpo_pass` is 1 only when actual lost records are within the [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) limit.
- The report clearly shows objective vs actual values and a per-metric verdict.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Using wall-clock time instead of [CLOCK_MONOTONIC](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) | Wall-clock time can jump due to [NTP](https://en.wikipedia.org/wiki/Network_Time_Protocol) adjustments. Always use [CLOCK_MONOTONIC](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) for elapsed time measurement. |
| Counting uncommitted records as lost | Only records that were [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html)-ed before the fault count. Buffered-but-not-flushed records are not committed and are not RPO violations. |
| Setting [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) to zero without [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) | Zero [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be backed by [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) on every commit. Without it, the OS can lose buffered writes on crash. |
| Hardcoding recovery times | Actual recovery time depends on the number of [WAL](../../w10/part.md) entries to replay. Measure it; do not assume a fixed value. |

## Proof

```bash
./recovery_obj_test
# → [rto/rpo] failure=process_crash
# → [rto/rpo] RTO objective=500ms actual=120ms PASS
# → [rto/rpo] RPO objective=0 actual=0 PASS
# → [rto/rpo] verdict: PASS
# →
# → [rto/rpo] failure=process_crash
# → [rto/rpo] RTO objective=500ms actual=800ms FAIL
# → [rto/rpo] RPO objective=0 actual=0 PASS
# → [rto/rpo] verdict: FAIL
```

## Hero visual

```
  Recovery Objectives Validator
  ┌──────────────────────────────────────────────────────┐
  │  Failure: process_crash                              │
  │                                                      │
  │  RTO  ████████░░░░░░░  120ms / 500ms limit    PASS  │
  │  RPO  ░░░░░░░░░░░░░░░  0 / 0 records lost    PASS  │
  │                                                      │
  │  Overall: PASS                                       │
  └──────────────────────────────────────────────────────┘
  ┌──────────────────────────────────────────────────────┐
  │  Failure: process_crash (slow recovery)              │
  │                                                      │
  │  RTO  █████████████████ 800ms / 500ms limit   FAIL  │
  │  RPO  ░░░░░░░░░░░░░░░  0 / 0 records lost    PASS  │
  │                                                      │
  │  Overall: FAIL                                       │
  └──────────────────────────────────────────────────────┘
```

## Future Lock

- In [W20 L04](04-data-safety-checks.md) the [data safety checker](04-data-safety-checks.md) will extend [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) checks beyond record counts to verify data integrity — ensuring recovered records are not corrupted.
- In [W20 L05](05-operator-playbook.md) the [operator playbook](05-operator-playbook.md) will include [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) and [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) targets for each failure mode so operators know whether recovery met its goals.
- In [W20 L06](06-regression-harness.md) the [regression harness](06-regression-harness.md) will enforce that all drills pass their [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective)/[RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) objectives before the suite reports green.
- In [W21](../../w21/part.md) [SLO validation](../../w21/part.md) will aggregate [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) measurements into availability budgets.
