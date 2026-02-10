---
id: w21-l04
title: "Runbooks"
order: 4
type: lesson
duration_min: 40
---

# Runbooks

## Goal

Build a [runbook](https://en.wikipedia.org/wiki/Runbook) generator that produces a structured response plan for every [SLO](https://sre.google/sre-book/service-level-objectives/) breach scenario. Each [runbook](https://en.wikipedia.org/wiki/Runbook) entry [MUST](https://datatracker.ietf.org/doc/html/rfc2119) include four steps: detect, diagnose, mitigate, and verify. The runbook [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be generated from the [SLO targets (L02)](02-define-slos.md) and the [failure matrix (W20 L01)](../../w20/lessons/01-failure-matrix.md) — not written by hand.

## What you build

A `struct runbook_entry` that holds seven fields: `char slo_name[32]` (which [SLO](https://sre.google/sre-book/service-level-objectives/) this runbook covers), `char detect[256]` (how to detect the breach — which [dashboard (L03)](03-dashboards.md) alert or [monitor (W16)](../../w16/part.md) signal fires), `char diagnose[256]` (how to find the root cause — which logs to check, which [SLIs](https://sre.google/sre-book/service-level-objectives/) to compare), `char mitigate[256]` (the immediate action to restore service — rollback, restart, shed load), `char verify[256]` (how to confirm the [SLO](https://sre.google/sre-book/service-level-objectives/) is met again — re-check the [dashboard (L03)](03-dashboards.md)), and `int drill_tested` (1 if a [game-day drill (L06)](06-drills.md) has validated this runbook, 0 if untested). A `struct runbook` that owns an array of entries and a `count`. A `runbook_generate()` function that takes an [SLO evaluator](02-define-slos.md) and produces one entry per target. A `runbook_print()` function that outputs the runbook as a readable table. A `runbook_coverage()` function that returns the percentage of entries where `drill_tested == 1`.

## Why it matters

When a production system breaks at 3 AM, the on-call engineer needs a step-by-step plan — not a blank screen. The [Google SRE book](https://sre.google/sre-book/postmortem-culture/) says runbooks reduce [mean time to repair](https://en.wikipedia.org/wiki/Mean_time_to_repair) by removing the need to think under pressure. A runbook that has been validated by a [game-day drill (L06)](06-drills.md) is worth far more than one that has only been written — because you know the steps actually work.

---

## Training Session

### Warmup

Read the [operator playbook (W20 L05)](../../w20/lessons/05-operator-playbook.md) lesson. Write down:

1. The four-step structure: detect → diagnose → mitigate → verify.
2. Why the `drill_tested` flag matters — what is the difference between a runbook that has been tested and one that has not?

### Work

#### Do

1. Create `w21/runbook.h`.
2. Define `struct runbook_entry` with the seven fields described above.
3. Define `struct runbook` with a dynamic array and a `count`.
4. Create `w21/runbook.c`.
5. Write `runbook_init()` — allocate the array with initial capacity 8, set `count` to zero.
6. Write `runbook_generate()`:
   - Accept a pointer to an [SLO evaluator](02-define-slos.md).
   - For each [SLO](https://sre.google/sre-book/service-level-objectives/) target, create a `runbook_entry`.
   - Set `slo_name` from the target's [SLI](https://sre.google/sre-book/service-level-objectives/) name.
   - Set `detect` to: `"Check dashboard for [BREACH] alert on <sli_name>"`.
   - Set `diagnose` to: `"Compare <sli_name> p99 against threshold <threshold>. Check monitor (W16) for correlated signals."`.
   - Set `mitigate` to: `"If latency: shed load or scale up. If error rate: rollback last deploy. If throughput: check upstream dependencies."`.
   - Set `verify` to: `"Re-run dashboard_refresh(). Confirm <sli_name> SLO shows met=1 and budget_remaining > 0."`.
   - Set `drill_tested` to 0 (untested by default).
   - Append the entry. Increment `count`.
7. Write `runbook_mark_tested()`:
   - Accept a `slo_name` string.
   - Find the matching entry and set `drill_tested` to 1.
   - Return 0 on success, -1 if not found.
8. Write `runbook_print()`:
   - Print a header: `SLO | DETECT | DIAGNOSE | MITIGATE | VERIFY | TESTED`.
   - Print one row per entry, truncating long fields to fit.
9. Write `runbook_coverage()`:
   - Count entries where `drill_tested == 1`.
   - Return `(tested * 100) / count`.
10. Write `runbook_free()` — release the array.
11. Write a `main()` test that:
    - Creates an [SLO evaluator](02-define-slos.md) with three targets.
    - Generates the runbook.
    - Prints it (all entries show `TESTED=NO`).
    - Marks two entries as tested.
    - Prints coverage (should be 66%).

#### Test

```bash
gcc -Wall -Wextra -Werror -o runbook_test \
  w21/runbook.c w21/slo.c w21/sli.c -lm
./runbook_test
```

#### Expected

A three-row runbook table. Coverage starts at 0%, ends at 66% after marking two entries. No crashes, no leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./runbook_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w21/runbook.h w21/runbook.c
git commit -m "w21-l04: runbook generator with drill coverage tracking"
```

---

## Done when

- `runbook_generate()` produces one entry per [SLO](https://sre.google/sre-book/service-level-objectives/) target with all four steps filled.
- `runbook_mark_tested()` updates the `drill_tested` flag for a named entry.
- `runbook_print()` outputs a readable table.
- `runbook_coverage()` returns the correct percentage.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Writing runbooks by hand instead of generating them | Runbooks [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be generated from [SLO](https://sre.google/sre-book/service-level-objectives/) targets so every target gets a runbook automatically. Hand-written runbooks drift from the actual system. |
| Leaving "mitigate" vague ("fix the problem") | Each mitigation step [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be a concrete action: "rollback," "restart service," "shed 50% of traffic." The on-call engineer [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) have to invent the fix at 3 AM. |
| Skipping the "verify" step | Without verification, you do not know the mitigation worked. Always re-check the [dashboard (L03)](03-dashboards.md) after mitigating. |
| 100% coverage with no real drills | The `drill_tested` flag [MUST](https://datatracker.ietf.org/doc/html/rfc2119) only be set after a real [game-day drill (L06)](06-drills.md) passes. Do not mark it manually without running the drill. |

## Proof

```bash
./runbook_test
# → SLO            | DETECT                          | DIAGNOSE              | MITIGATE           | VERIFY              | TESTED
# → latency_ms     | Check dashboard [BREACH] alert  | Compare p99 vs 200    | Shed load/scale up | Re-run refresh()    | NO
# → error_rate     | Check dashboard [BREACH] alert  | Compare p99 vs 0.10   | Rollback deploy    | Re-run refresh()    | NO
# → throughput_rps | Check dashboard [BREACH] alert  | Compare p99 vs 100    | Check upstream     | Re-run refresh()    | NO
# →
# → coverage: 0% (0/3 tested)
# →
# → [marking latency_ms and error_rate as tested]
# →
# → coverage: 66% (2/3 tested)
```

## Hero visual

```
  SLO Breach Alert
       │
       ▼
  ┌─────────────────────────────────────┐
  │           Runbook Entry             │
  │                                     │
  │  1. DETECT   → dashboard alert      │
  │  2. DIAGNOSE → compare SLI vs SLO   │
  │  3. MITIGATE → rollback / shed load │
  │  4. VERIFY   → re-check dashboard   │
  │                                     │
  │  drill_tested: YES / NO             │
  └─────────────────────────────────────┘
       │
       ▼
  Coverage: 66% (2/3 tested)
```

## Future Lock

- In [W21 L05](05-postmortems.md) the [postmortem writer](05-postmortems.md) will reference the runbook that was followed (or should have been followed) during an incident.
- In [W21 L06](06-drills.md) the [game-day drill runner](06-drills.md) will execute each runbook and mark it as `drill_tested = 1` if the steps succeed.
- In [W23](../../w23/part.md) the [documentation](../../w23/part.md) will publish these runbooks as the official incident-response playbook.
- In [W20](../../w20/part.md) the [operator playbook (W20 L05)](../../w20/lessons/05-operator-playbook.md) shares the same four-step structure — this lesson adds [SLO](https://sre.google/sre-book/service-level-objectives/) awareness on top.
