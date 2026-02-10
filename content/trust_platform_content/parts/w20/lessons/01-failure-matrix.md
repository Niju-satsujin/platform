---
id: w20-l01
title: "Failure Matrix"
order: 1
type: lesson
duration_min: 35
---

# Failure Matrix

## Goal

Build a structured catalogue of every [failure mode](https://en.wikipedia.org/wiki/Failure_mode_and_effects_analysis) your system can experience. Each entry names the fault, identifies the component it hits, states the expected impact, and maps it to the recovery path that [MUST](https://datatracker.ietf.org/doc/html/rfc2119) restore the system.

## What you build

A `struct failure_mode` that holds five fields: `char name[64]` (short identifier such as `"process_crash"` or `"disk_full"`), `char component[64]` (the subsystem affected — [WAL (W10)](../../w10/part.md), [transparency log (W15)](../../w15/part.md), [anchor store (W18)](../../w18/part.md), or [event loop (W03)](../../w03/part.md)), `char signal_or_method[32]` (the injection method — [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html), `fallocate`, `iptables`, or byte flip), `char expected_impact[128]` (what breaks when this fault fires), and `char recovery_path[128]` (the function or procedure that restores the system). A `struct failure_matrix` that owns a growable array of `failure_mode` entries and a `count` field. A `failure_matrix_add()` function that appends a new mode. A `failure_matrix_lookup()` function that finds a mode by name. A `failure_matrix_print()` function that prints the full matrix as a table.

## Why it matters

[Chaos engineering](https://principlesofchaos.org/) without a plan is just random destruction. The [failure matrix](https://en.wikipedia.org/wiki/Failure_mode_and_effects_analysis) is the plan. It forces you to think about every way the system can break before you break it. [Netflix](https://netflix.github.io/chaosmonkey/) documents failure modes before running [Chaos Monkey](https://netflix.github.io/chaosmonkey/) — otherwise you cannot tell whether a drill passed or failed because you have no expected outcome. The matrix also becomes the index for the [operator playbook (L05)](05-operator-playbook.md).

---

## Training Session

### Warmup

Read the first two [principles of chaos engineering](https://principlesofchaos.org/). Write down:

1. What "steady state" means for your system.
2. Why you [MUST](https://datatracker.ietf.org/doc/html/rfc2119) define expected behavior before injecting faults.

### Work

#### Do

1. Create `w20/failure_matrix.h`.
2. Define `struct failure_mode` with the five fields described above.
3. Define `struct failure_matrix` with a dynamic array and a `count` field.
4. Create `w20/failure_matrix.c`.
5. Write `failure_matrix_init()` — allocate the array with initial capacity 16, set `count` to zero.
6. Write `failure_matrix_add()`:
   - Accept pointers to each of the five field values.
   - Copy each value into a new `failure_mode` entry using [strncpy()](https://man7.org/linux/man-pages/man3/strncpy.3.html).
   - Grow the array if needed. Append the entry. Increment `count`.
   - Return the index of the new entry.
7. Write `failure_matrix_lookup()`:
   - Accept a `name` string.
   - Scan the array. If a match is found, copy the entry to the caller's buffer and return success.
   - If no match, return an error code.
8. Write `failure_matrix_print()`:
   - Print a header row: `NAME | COMPONENT | METHOD | IMPACT | RECOVERY`.
   - Print one row per entry.
9. Write `failure_matrix_free()` — release the dynamic array.
10. Write a `main()` test that populates the matrix with at least six failure modes:
    - `process_crash` targeting the [WAL (W10)](../../w10/part.md) via [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html).
    - `disk_full` targeting the [anchor store (W18)](../../w18/part.md) via `fallocate`.
    - `network_partition` targeting the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) link via `iptables`.
    - `corrupt_write` targeting the [transparency log (W15)](../../w15/part.md) via byte flip.
    - `slow_disk` targeting the [WAL (W10)](../../w10/part.md) via `sleep` injection.
    - `oom_kill` targeting the [event loop (W03)](../../w03/part.md) via `cgroup` memory limit.
    Then print the matrix, look up `process_crash`, and print its recovery path.

#### Test

```bash
gcc -Wall -Wextra -Werror -o failure_matrix_test \
  w20/failure_matrix.c
./failure_matrix_test
```

#### Expected

A six-row table with all fields filled. The lookup prints the recovery path for `process_crash`. No crashes, no leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./failure_matrix_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w20/failure_matrix.h w20/failure_matrix.c
git commit -m "w20-l01: failure matrix catalogue"
```

---

## Done when

- `failure_matrix_add()` stores a new [failure mode](https://en.wikipedia.org/wiki/Failure_mode_and_effects_analysis) with all five fields.
- `failure_matrix_lookup()` finds a mode by name or returns an error.
- `failure_matrix_print()` outputs a readable table.
- The matrix contains at least six distinct failure modes covering [WAL (W10)](../../w10/part.md), [transparency log (W15)](../../w15/part.md), [anchor store (W18)](../../w18/part.md), and [event loop (W03)](../../w03/part.md).
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Listing only crash faults | A real system also faces [disk full](https://man7.org/linux/man-pages/man2/fallocate.2.html), [network partition](https://en.wikipedia.org/wiki/Network_partition), [data corruption](https://en.wikipedia.org/wiki/Data_corruption), and [slow IO](https://en.wikipedia.org/wiki/I/O_bound). Include at least four categories. |
| Leaving `recovery_path` blank | Every fault [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a mapped recovery. If you cannot name the recovery function, you have not built it yet. |
| Using fixed-size array without bounds check | If you use a fixed array, check capacity before every add. Better: use a growable array with [realloc()](https://man7.org/linux/man-pages/man3/realloc.3.html). |
| Forgetting `failure_matrix_free()` | Every [malloc()](https://man7.org/linux/man-pages/man3/malloc.3.html) needs a matching [free()](https://man7.org/linux/man-pages/man3/free.3.html). The harness calls `free` after each test. |

## Proof

```bash
./failure_matrix_test
# → NAME            | COMPONENT       | METHOD    | IMPACT                    | RECOVERY
# → process_crash   | wal (w10)       | SIGKILL   | incomplete WAL entry      | wal_recover()
# → disk_full       | anchor (w18)    | fallocate | anchor write fails        | anchor_recover()
# → network_partition| witness         | iptables  | cosignature timeout       | retry_publish()
# → corrupt_write   | log (w15)       | byte flip | Merkle root mismatch      | log_rebuild()
# → slow_disk       | wal (w10)       | sleep     | write latency spike       | backpressure (w06)
# → oom_kill        | event_loop (w03)| cgroup    | process terminated        | restart + wal_recover()
# → lookup process_crash → recovery: wal_recover()
```

## Hero visual

```
  Failure Matrix
  ┌───────────────────┬───────────────┬──────────┬─────────────────────┬──────────────────┐
  │ NAME              │ COMPONENT     │ METHOD   │ IMPACT              │ RECOVERY         │
  ├───────────────────┼───────────────┼──────────┼─────────────────────┼──────────────────┤
  │ process_crash     │ WAL (W10)     │ SIGKILL  │ incomplete entry    │ wal_recover()    │
  │ disk_full         │ anchor (W18)  │ fallocate│ write fails         │ anchor_recover() │
  │ network_partition │ witness       │ iptables │ cosig timeout       │ retry_publish()  │
  │ corrupt_write     │ log (W15)     │ byte flip│ root mismatch       │ log_rebuild()    │
  │ slow_disk         │ WAL (W10)     │ sleep    │ latency spike       │ backpressure     │
  │ oom_kill          │ event_loop    │ cgroup   │ process killed      │ restart+recover  │
  └───────────────────┴───────────────┴──────────┴─────────────────────┴──────────────────┘
```

## Future Lock

- In [W20 L02](02-chaos-drills.md) the [chaos drill runner](02-chaos-drills.md) will iterate over this matrix and inject each fault automatically.
- In [W20 L03](03-recovery-objectives.md) the [recovery objectives validator](03-recovery-objectives.md) will use the `recovery_path` field to measure how long each recovery takes.
- In [W20 L05](05-operator-playbook.md) the [operator playbook](05-operator-playbook.md) will be generated directly from this matrix — one runbook entry per failure mode.
- In [W21](../../w21/part.md) [SLO validation](../../w21/part.md) will link each failure mode to the [SLO](https://en.wikipedia.org/wiki/Service-level_objective) it threatens.
