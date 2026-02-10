---
id: w20-l06
title: "Regression Harness"
order: 6
type: lesson
duration_min: 50
---

# Regression Harness

## Goal

Build an automated test suite that runs every [chaos drill](02-chaos-drills.md) from the [failure matrix (L01)](01-failure-matrix.md), validates [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective)/[RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) objectives, checks [data safety](04-data-safety-checks.md) after each drill, updates the [operator playbook](05-operator-playbook.md) coverage, and gates the build on all tests passing.

## What you build

A `w20/chaos_harness.c` file with 16+ named test functions that each print `PASS` or `FAIL`. The harness runs all tests in sequence and exits with code `0` only if every test passes. Tests cover: [failure matrix](01-failure-matrix.md) population and lookup, [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html) drill on a child process, disk-full drill with [fallocate](https://man7.org/linux/man-pages/man2/fallocate.2.html), corrupt-write drill with byte flip, [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) pass scenario, [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) fail scenario, [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) pass scenario, [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) fail scenario, [WAL replay](../../w10/part.md) safety check, [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree) safety check, [anchor chain](../../w18/lessons/03-consistency-proof.md) safety check, corrupted WAL detection, [playbook generation](05-operator-playbook.md), playbook coverage tracking, playbook mark-tested, and full end-to-end chaos cycle (inject → recover → validate → report).

## Why it matters

Each lesson tested its own component in isolation. But [chaos engineering](https://principlesofchaos.org/) is a pipeline: identify fault → inject fault → measure recovery → verify data → update playbook. A bug in one stage can silently corrupt a later stage. The [regression harness](https://en.wikipedia.org/wiki/Regression_testing) runs the full pipeline, catches regressions when you change any layer, and proves that all the parts compose correctly. No code merges to the chaos module unless all 16 tests pass.

---

## Training Session

### Warmup

List every function you wrote in [L01](01-failure-matrix.md) through [L05](05-operator-playbook.md). Write them in the order they are called during a single chaos drill cycle:

1. `failure_matrix_add()` — register the fault.
2. `recovery_objective_init()` — set [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective)/[RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) targets.
3. `chaos_drill_run()` — inject the fault and measure recovery.
4. `recovery_objective_validate()` — check time and data loss.
5. `data_safety_check_all()` — verify [WAL](../../w10/part.md), [Merkle](https://en.wikipedia.org/wiki/Merkle_tree), and [anchors](../../w18/part.md).
6. `playbook_generate()` — create the runbook.
7. `playbook_mark_tested()` — record that the drill passed.
8. `playbook_coverage()` — report overall readiness.

### Work

#### Do

1. Create `w20/chaos_harness.c`.
2. Write a `run_test()` helper that takes a test name and a function pointer, calls it, and prints `PASS` or `FAIL`.
3. Write the following test functions:

   **Failure matrix tests**
   - `test_matrix_add` — add three [failure modes](01-failure-matrix.md), verify `count` is 3.
   - `test_matrix_lookup` — look up a mode by name, verify all fields match.
   - `test_matrix_lookup_missing` — look up a mode that does not exist, expect error.

   **Chaos drill tests**
   - `test_drill_sigkill` — fork a child, run a [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html) [drill](02-chaos-drills.md), verify child died.
   - `test_drill_disk_full` — create a tmpfs, fill it, verify write fails.
   - `test_drill_corrupt` — write a file, flip a byte, verify content changed.

   **Recovery objective tests**
   - `test_rto_pass` — simulate 120 ms recovery against 500 ms [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective), expect pass.
   - `test_rto_fail` — simulate 800 ms recovery against 500 ms [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective), expect fail.
   - `test_rpo_pass` — simulate 0 lost records against 0 [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective), expect pass.
   - `test_rpo_fail` — simulate 3 lost records against 0 [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective), expect fail.

   **Data safety tests**
   - `test_wal_replay_ok` — create a valid [WAL](../../w10/part.md), replay, expect ok.
   - `test_merkle_root_ok` — build a tree, check root, expect match.
   - `test_anchor_chain_ok` — create valid [anchors](../../w18/part.md), verify chain, expect ok.
   - `test_wal_corrupt_detected` — corrupt one WAL entry, expect replay to fail.

   **Playbook tests**
   - `test_playbook_generate` — generate from a 4-entry matrix, expect 4 playbook entries.
   - `test_playbook_coverage` — mark 2 of 4 tested, expect 50% coverage.

4. Write `main()` that runs all 16 tests and exits 0 only if all pass. After all tests, print a summary: `16/16 passed` or `N/16 passed, M failed`.

#### Test

```bash
gcc -Wall -Wextra -Werror -o chaos_harness \
  w20/chaos_harness.c w20/failure_matrix.c w20/chaos_drill.c \
  w20/recovery_objectives.c w20/data_safety.c w20/playbook.c -lcrypto
./chaos_harness
```

#### Expected

```
test_matrix_add            PASS
test_matrix_lookup         PASS
test_matrix_lookup_missing PASS
test_drill_sigkill         PASS
test_drill_disk_full       PASS
test_drill_corrupt         PASS
test_rto_pass              PASS
test_rto_fail              PASS
test_rpo_pass              PASS
test_rpo_fail              PASS
test_wal_replay_ok         PASS
test_merkle_root_ok        PASS
test_anchor_chain_ok       PASS
test_wal_corrupt_detected  PASS
test_playbook_generate     PASS
test_playbook_coverage     PASS
16/16 passed
```

### Prove It

```bash
valgrind ./chaos_harness
# → zero errors, zero leaks
```

### Ship It

```bash
git add w20/chaos_harness.c
git commit -m "w20-l06: regression harness for full chaos engineering pipeline"
```

---

## Done when

- All 16 tests pass.
- Each test is independent — failure in one does not skip the rest.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.
- The harness exits with code `0` when all tests pass and non-zero when any test fails.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Tests sharing state | Each test [MUST](https://datatracker.ietf.org/doc/html/rfc2119) create its own [failure matrix](01-failure-matrix.md), [drill](02-chaos-drills.md) context, and temp directory. Shared state causes order-dependent failures. |
| Not cleaning up child processes | After a [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html) drill, call [waitpid()](https://man7.org/linux/man-pages/man2/waitpid.2.html) to reap the child. Otherwise you create [zombie processes](https://en.wikipedia.org/wiki/Zombie_process). |
| Not cleaning up temp files | Use [mkdtemp()](https://man7.org/linux/man-pages/man3/mkdtemp.3.html) and remove the directory after each test. Leftover files cause false passes in later runs. |
| Only testing happy paths | At least 5 of the 16 tests [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be failure scenarios: [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) fail, [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) fail, corrupt WAL, lookup missing, and coverage gap. |

## Proof

```bash
./chaos_harness
# → 16/16 passed

valgrind ./chaos_harness
# → ERROR SUMMARY: 0 errors from 0 contexts
```

## Hero visual

```
  chaos_harness
  ┌──────────────────────────────────────────────────┐
  │  Matrix tests      ███ 3/3                       │
  │  Drill tests       ███ 3/3                       │
  │  RTO/RPO tests     ████ 4/4                      │
  │  Data safety tests ████ 4/4                      │
  │  Playbook tests    ██  2/2                       │
  │                                                  │
  │  Total: 16/16 PASS       valgrind: 0 errors      │
  └──────────────────────────────────────────────────┘
```

## Future Lock

- In [W20 Quest](../quest.md) you will extend this harness into the full end-to-end chaos framework that runs every drill from the matrix and requires 100% playbook coverage.
- In [W21](../../w21/part.md) [SLO validation](../../w21/part.md) will wrap these tests with [SLO](https://en.wikipedia.org/wiki/Service-level_objective) budget checks — a failing drill consumes error budget.
- In [W16](../../w16/part.md) [monitors](../../w16/part.md) will trigger automated chaos drills on a schedule and report results through the same harness.
- As the project grows, this harness becomes the gate — no code merges to the chaos module unless all 16 tests pass.
