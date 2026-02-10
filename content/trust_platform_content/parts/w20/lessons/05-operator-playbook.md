---
id: w20-l05
title: "Operator Playbook"
order: 5
type: lesson
duration_min: 40
---

# Operator Playbook

## Goal

Build a [playbook](https://en.wikipedia.org/wiki/Runbook) generator that turns the [failure matrix (L01)](01-failure-matrix.md) and [chaos drill](02-chaos-drills.md) results into a structured [operator runbook](https://en.wikipedia.org/wiki/Runbook). Each failure mode gets a page with a detection method, a step-by-step recovery procedure, [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective)/[RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) targets, and a verification checklist.

## What you build

A `struct playbook_entry` that holds seven fields: `char failure_name[64]` (from the [failure matrix](01-failure-matrix.md)), `char detection[256]` (how operators or [monitors (W16)](../../w16/part.md) detect this fault), `char recovery_steps[1024]` (step-by-step recovery procedure), `uint64_t rto_ms` (from the [recovery objective (L03)](03-recovery-objectives.md)), `uint64_t rpo_records` (from the [recovery objective (L03)](03-recovery-objectives.md)), `char verification[256]` (how to confirm recovery is complete), and `int drill_tested` (1 if a [chaos drill](02-chaos-drills.md) has validated this entry, 0 otherwise). A `struct playbook` that owns a growable array of `playbook_entry` entries and a `count` field. A `playbook_generate()` function that iterates over the [failure matrix](01-failure-matrix.md) and creates one `playbook_entry` per failure mode, populating the detection and recovery steps from the matrix and the [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective)/[RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) from the objectives. A `playbook_mark_tested()` function that sets `drill_tested` to 1 for a given failure name after a [chaos drill](02-chaos-drills.md) passes. A `playbook_print()` function that outputs the full playbook as a readable document. A `playbook_coverage()` function that returns the percentage of entries that have been drill-tested.

## Why it matters

When a system fails at 3 AM, the on-call operator does not have time to read source code. They need a [runbook](https://en.wikipedia.org/wiki/Runbook) — a step-by-step guide that tells them: what broke, how to confirm it, how to fix it, and how to verify the fix. Most teams write runbooks by hand and they go stale. Your playbook is generated from real [chaos drills](02-chaos-drills.md). Every entry has been tested. The `drill_tested` flag proves it. If a failure mode has not been drilled, the playbook shows a warning — that is a gap in your preparedness.

---

## Training Session

### Warmup

Pick three failure modes from the [failure matrix (L01)](01-failure-matrix.md). For each one, write:

1. How an operator would notice the failure (a [monitor (W16)](../../w16/part.md) alert, a log message, a health check failure).
2. The first three commands the operator would run to diagnose and recover.

### Work

#### Do

1. Create `w20/playbook.h`.
2. Define `struct playbook_entry` and `struct playbook` with the fields described above.
3. Create `w20/playbook.c`.
4. Write `playbook_init()` — allocate the array with initial capacity 16, set `count` to zero.
5. Write `playbook_generate()`:
   - Accept a pointer to a [failure_matrix](01-failure-matrix.md) and an array of [recovery_objectives](03-recovery-objectives.md).
   - For each entry in the matrix, create a `playbook_entry`:
     - Copy `name` to `failure_name`.
     - Build `detection` from the component and method — for example, `"Monitor (W16) alerts: process_crash on WAL component detected via missing heartbeat"`.
     - Build `recovery_steps` from the `recovery_path` — for example, `"1. Restart process. 2. Run wal_recover(). 3. Verify WAL entries. 4. Resume operations."`.
     - Look up the matching [recovery_objective](03-recovery-objectives.md) and copy `rto_ms` and `rpo_records`.
     - Build `verification` — for example, `"Run data_safety_check_all(). Confirm WAL, Merkle, and anchor checks pass."`.
     - Set `drill_tested` to 0 (not yet tested).
   - Append each entry. Increment `count`.
6. Write `playbook_mark_tested()`:
   - Accept a failure name.
   - Find the matching entry. Set `drill_tested` to 1.
   - Return 0 on success, -1 if not found.
7. Write `playbook_print()`:
   - For each entry, print a structured block:
     ```
     === FAILURE: <name> ===
     Detection: <detection>
     Recovery:  <recovery_steps>
     RTO:       <rto_ms> ms
     RPO:       <rpo_records> records
     Verify:    <verification>
     Tested:    YES/NO
     ```
8. Write `playbook_coverage()`:
   - Count entries where `drill_tested == 1`.
   - Return `(tested * 100) / count`.
9. Write `playbook_free()` — release the dynamic array.
10. Write a `main()` test:
    - Create a [failure matrix](01-failure-matrix.md) with four entries.
    - Create matching [recovery objectives](03-recovery-objectives.md).
    - Generate the playbook. Print it. Expect `coverage: 0%`.
    - Mark two entries as tested. Print coverage. Expect `coverage: 50%`.

#### Test

```bash
gcc -Wall -Wextra -Werror -o playbook_test \
  w20/playbook.c w20/recovery_objectives.c \
  w20/chaos_drill.c w20/failure_matrix.c
./playbook_test
```

#### Expected

A four-entry playbook printed with all fields filled. Coverage starts at 0% and reaches 50% after marking two entries. No crashes, no leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./playbook_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w20/playbook.h w20/playbook.c
git commit -m "w20-l05: operator playbook generator from failure matrix and drill results"
```

---

## Done when

- `playbook_generate()` creates one entry per [failure mode](01-failure-matrix.md) with detection, recovery steps, [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective)/[RPO](https://en.wikipedia.org/wiki/Recovery_point_objective), and verification.
- `playbook_mark_tested()` updates the `drill_tested` flag for a given failure name.
- `playbook_print()` outputs a readable runbook.
- `playbook_coverage()` returns the correct percentage of drill-tested entries.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Writing vague recovery steps like "fix it" | Every step [MUST](https://datatracker.ietf.org/doc/html/rfc2119) name a specific command or function: `wal_recover()`, `anchor_recover()`, `data_safety_check_all()`. An operator at 3 AM cannot interpret "fix it." |
| Skipping the verification step | Recovery without verification is guessing. Every playbook entry [MUST](https://datatracker.ietf.org/doc/html/rfc2119) end with a concrete check that proves the system is healthy. |
| Not tracking `drill_tested` | An untested playbook entry is a theory. The `drill_tested` flag is the difference between "we think this works" and "we proved this works." |
| Hardcoding detection methods | Detection [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) come from the [monitoring system (W16)](../../w16/part.md). Build the detection string from the component and method fields in the [failure matrix](01-failure-matrix.md). |

## Proof

```bash
./playbook_test
# → === FAILURE: process_crash ===
# → Detection: Monitor (W16) alerts on WAL component — missing heartbeat
# → Recovery:  1. Restart process  2. Run wal_recover()  3. Verify WAL  4. Resume
# → RTO:       500 ms
# → RPO:       0 records
# → Verify:    Run data_safety_check_all()
# → Tested:    NO
# →
# → === FAILURE: disk_full ===
# → ...
# →
# → coverage: 0% (0/4 tested)
# →
# → [marking process_crash and disk_full as tested]
# → coverage: 50% (2/4 tested)
```

## Hero visual

```
  Operator Playbook
  ┌──────────────────────────────────────────────────────────┐
  │  === process_crash ===                         TESTED ✓  │
  │  Detect:  heartbeat missing                              │
  │  Recover: restart → wal_recover() → verify               │
  │  RTO: 500ms  RPO: 0 records                             │
  ├──────────────────────────────────────────────────────────┤
  │  === disk_full ===                             TESTED ✓  │
  │  Detect:  disk usage > 95%                               │
  │  Recover: clear space → anchor_recover() → verify        │
  │  RTO: 300ms  RPO: 0 records                             │
  ├──────────────────────────────────────────────────────────┤
  │  === network_partition ===                     UNTESTED  │
  │  Detect:  witness timeout > 5s                           │
  │  Recover: restore network → retry_publish() → verify     │
  │  RTO: 2000ms  RPO: 0 records                            │
  ├──────────────────────────────────────────────────────────┤
  │  === corrupt_write ===                        UNTESTED   │
  │  Detect:  Merkle root mismatch                           │
  │  Recover: log_rebuild() → re-anchor → verify             │
  │  RTO: 1000ms  RPO: 0 records                            │
  └──────────────────────────────────────────────────────────┘
  Coverage: 50% (2/4 tested)
```

## Future Lock

- In [W20 L06](06-regression-harness.md) the [regression harness](06-regression-harness.md) will automatically call `playbook_mark_tested()` as each drill passes and report final coverage.
- In [W20 Quest](../quest.md) the full chaos framework will require 100% playbook coverage — every failure mode must be drilled.
- In [W16](../../w16/part.md) [monitors](../../w16/part.md) will use the detection strings from the playbook to configure real alert rules.
- In [W21](../../w21/part.md) [SLO validation](../../w21/part.md) will link playbook entries to [SLO](https://en.wikipedia.org/wiki/Service-level_objective) targets — a failed drill means the SLO is at risk.
