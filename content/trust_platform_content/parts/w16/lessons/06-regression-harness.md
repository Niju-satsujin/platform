---
id: w16-l06
title: "Regression Harness"
order: 6
type: lesson
duration_min: 45
---

# Regression Harness

## Goal

Build a [regression test](https://en.wikipedia.org/wiki/Regression_testing) harness that exercises the full [monitoring pipeline](https://datatracker.ietf.org/doc/html/rfc6962#section-5): [signal checks (L01)](01-signals-to-monitor.md), [checkpoint collection (L02)](02-collect-checkpoints.md), [equivocation detection (L03)](03-detect-equivocation.md), [alert rules (L04)](04-alert-rules.md), and [incident playbook (L05)](05-incident-playbook.md).

## What you build

A `test_harness` that runs six [test scenarios](https://en.wikipedia.org/wiki/Test_case). Each scenario simulates a specific kind of log misbehavior and checks that the correct [alerts](https://en.wikipedia.org/wiki/Alert_messaging) fire and the correct [playbook steps](https://en.wikipedia.org/wiki/Incident_management) are invoked. The harness uses a `struct test_case` with a name, a setup function, and an expected outcome. It prints PASS or FAIL for each scenario.

## Why it matters

You have five modules built across five lessons. If you change [signal thresholds (L01)](01-signals-to-monitor.md), you might break [alert rules (L04)](04-alert-rules.md). If you change the [checkpoint store format (L02)](02-collect-checkpoints.md), [equivocation detection (L03)](03-detect-equivocation.md) might fail to parse it. A [regression harness](https://en.wikipedia.org/wiki/Regression_testing) catches these breaks before they reach production. In [W20](../../../parts/w20/part.md) you will run this same harness under [chaos conditions](../../../parts/w20/part.md).

---

## Training Session

### Warmup

List the six scenarios your harness [MUST](https://datatracker.ietf.org/doc/html/rfc2119) cover:

1. All signals healthy — no [alerts](https://en.wikipedia.org/wiki/Alert_messaging) fire.
2. Stale [STH](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) — `WARN` alert fires, [playbook](https://en.wikipedia.org/wiki/Incident_management) step P1.
3. [Tree size](https://en.wikipedia.org/wiki/Merkle_tree) shrink — `CRITICAL` alert fires, step P2.
4. [Consistency proof](../../../parts/w14/part.md) failure — `CRITICAL` alert fires, step P3.
5. [Split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) detected — `CRITICAL` alert fires, step P4.
6. [Inclusion](https://datatracker.ietf.org/doc/html/rfc6962#section-4.5) overdue — `WARN` alert fires, step P5.

### Work

#### Do

1. Create `w16/test_harness.c`.
2. Define `struct test_case` with fields: `const char *name`, `void (*setup)(void *ctx)`, `alert_severity expected_severity`, `const char *expected_rule_name`, `const char *expected_playbook_step`.
3. Write `setup_all_healthy(void *ctx)` — create two consistent [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing) with fresh timestamps and valid [proofs](../../../parts/w14/part.md). No [equivocation](https://en.wikipedia.org/wiki/Equivocation_(computer_science)).
4. Write `setup_stale_sth(void *ctx)` — create two [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing) where the age exceeds the [freshness threshold](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5).
5. Write `setup_tree_shrink(void *ctx)` — create a newer [checkpoint](https://en.wikipedia.org/wiki/Application_checkpointing) with a smaller [tree size](https://en.wikipedia.org/wiki/Merkle_tree) than the older one.
6. Write `setup_consistency_fail(void *ctx)` — set the [consistency proof](../../../parts/w14/part.md) as invalid.
7. Write `setup_split_view(void *ctx)` — create two [vantage checkpoints](https://en.wikipedia.org/wiki/Gossip_protocol) with the same [tree size](https://en.wikipedia.org/wiki/Merkle_tree) but different [root hashes](https://en.wikipedia.org/wiki/Merkle_tree).
8. Write `setup_inclusion_overdue(void *ctx)` — set an entry pending longer than the [MMD](https://datatracker.ietf.org/doc/html/rfc6962#section-3).
9. Write `run_test(struct test_case *tc)`:
   - Call `tc->setup()`.
   - Run [signal checks (L01)](01-signals-to-monitor.md).
   - Run [equivocation detection (L03)](03-detect-equivocation.md).
   - Run [alert rules (L04)](04-alert-rules.md).
   - Run [playbook (L05)](05-incident-playbook.md).
   - Compare fired [alerts](https://en.wikipedia.org/wiki/Alert_messaging) against expected. Print PASS or FAIL.
10. Write `main()` that runs all six [test cases](https://en.wikipedia.org/wiki/Test_case) and prints a summary.

#### Test

```bash
gcc -Wall -Wextra -o test_harness \
  w16/test_harness.c w16/monitor_signals.c w16/checkpoint_collector.c \
  w16/equivocation_detector.c w16/alert_rules.c w16/incident_playbook.c
./test_harness
```

#### Expected

Six lines. Each shows the test name and PASS. The summary shows `6/6 passed`.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind --leak-check=full ./test_harness
```

Zero errors, zero leaks.

### Ship It

```bash
git add w16/test_harness.c
git commit -m "w16-l06: regression harness covering six monitoring scenarios"
```

---

## Done when

- Six [test cases](https://en.wikipedia.org/wiki/Test_case) cover all five [alert rules (L04)](04-alert-rules.md) plus the healthy baseline.
- Each test sets up specific conditions, runs the full pipeline, and checks the result.
- All six tests print PASS.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Only testing the happy path | The healthy scenario is just one test. You [MUST](https://datatracker.ietf.org/doc/html/rfc2119) test every failure mode. |
| Not resetting state between tests | Each `setup()` function [MUST](https://datatracker.ietf.org/doc/html/rfc2119) create fresh state. Leftover [alerts](https://en.wikipedia.org/wiki/Alert_messaging) from a previous test cause false passes. |
| Checking only severity, not the rule name | Two rules can fire at `WARN`. Check both [severity](https://en.wikipedia.org/wiki/Syslog#Severity_level) and `rule_name` to be sure the right rule fired. |
| Not linking tests to [playbook steps](https://en.wikipedia.org/wiki/Incident_management) | The harness [MUST](https://datatracker.ietf.org/doc/html/rfc2119) verify that the correct [playbook step](https://en.wikipedia.org/wiki/Incident_management) is invoked for each fired [alert](https://en.wikipedia.org/wiki/Alert_messaging). |

## Proof

```bash
./test_harness
# → [1/6] all_healthy .................. PASS (0 alerts)
# → [2/6] stale_sth ................... PASS (WARN, P1)
# → [3/6] tree_shrink ................. PASS (CRITICAL, P2)
# → [4/6] consistency_fail ............ PASS (CRITICAL, P3)
# → [5/6] split_view .................. PASS (CRITICAL, P4)
# → [6/6] inclusion_overdue ........... PASS (WARN, P5)
# → Summary: 6/6 passed
```

## Hero visual

```
  test scenarios                    pipeline                    results
  ┌────────────────┐    ┌────────────────────────────┐    ┌───────────┐
  │ all_healthy    │───▶│ signals → detect → alert   │───▶│ PASS (0)  │
  │ stale_sth      │───▶│ signals → detect → alert   │───▶│ PASS (P1) │
  │ tree_shrink    │───▶│ signals → detect → alert   │───▶│ PASS (P2) │
  │ consistency    │───▶│ signals → detect → alert   │───▶│ PASS (P3) │
  │ split_view     │───▶│ signals → detect → alert   │───▶│ PASS (P4) │
  │ inclusion      │───▶│ signals → detect → alert   │───▶│ PASS (P5) │
  └────────────────┘    └────────────────────────────┘    └───────────┘
                                                          6/6 passed
```

## Future Lock

- In [W16 Quest](../quest.md) you will run this harness against your full [log monitor](https://datatracker.ietf.org/doc/html/rfc6962#section-5) as the final acceptance test.
- In [W20](../../../parts/w20/part.md) you will inject [chaos faults](../../../parts/w20/part.md) (network drops, delayed responses, corrupted proofs) and confirm the harness still passes.
- In [W21](../../../parts/w21/part.md) you will add [SLO-based test cases](../../../parts/w21/part.md) that check alert latency and freshness targets.
