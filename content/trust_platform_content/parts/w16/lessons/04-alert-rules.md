---
id: w16-l04
title: "Alert Rules"
order: 4
type: lesson
duration_min: 40
---

# Alert Rules

## Goal

Build an [alert rule engine](https://en.wikipedia.org/wiki/Alert_messaging) that evaluates [monitoring signals (L01)](01-signals-to-monitor.md) and [equivocation evidence (L03)](03-detect-equivocation.md), then fires [alerts](https://en.wikipedia.org/wiki/Alert_messaging) with severity levels and actionable detail.

## What you build

An `alert_rules` module. It takes an array of [signal checks (L01)](01-signals-to-monitor.md) and an array of [equivocation evidence (L03)](03-detect-equivocation.md). It evaluates each against a set of [rules](https://en.wikipedia.org/wiki/Rule-based_system). Each rule has a [severity](https://en.wikipedia.org/wiki/Syslog#Severity_level) level: `INFO`, `WARN`, `CRITICAL`. A stale [STH](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) is `WARN`. A [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) is `CRITICAL`. The module outputs [alert](https://en.wikipedia.org/wiki/Alert_messaging) structs that the [incident playbook (L05)](05-incident-playbook.md) consumes.

## Why it matters

Raw [signals](https://en.wikipedia.org/wiki/Signal_(information_theory)) are noise until you apply rules. A tree that grows slowly is normal. A tree that shrinks is an emergency. Without severity levels, every blip wakes someone at 3 AM. Without detail text, the on-call engineer has no idea what happened. Good [alert rules](https://en.wikipedia.org/wiki/Alert_messaging) separate signal from noise and give responders what they need to act. In [W21](../../../parts/w21/part.md) you will formalize these rules as [SLI/SLO](../../../parts/w21/part.md) definitions.

---

## Training Session

### Warmup

Write down three things that make an [alert](https://en.wikipedia.org/wiki/Alert_messaging) useful:

1. A clear [severity](https://en.wikipedia.org/wiki/Syslog#Severity_level) level.
2. A description of what was observed.
3. A link to the [playbook](https://en.wikipedia.org/wiki/Incident_management) step to follow.

### Work

#### Do

1. Create `w16/alert_rules.h`.
2. Define an [enum](https://en.cppreference.com/w/c/language/enum) `alert_severity` with values: `SEVERITY_INFO`, `SEVERITY_WARN`, `SEVERITY_CRITICAL`.
3. Define `struct alert` with fields: `alert_severity severity`, `const char *rule_name`, `const char *detail`, `uint64_t timestamp`.
4. Define `struct alert_rule` with fields: `const char *name`, `alert_severity severity`, a [function pointer](https://en.cppreference.com/w/c/language/pointer#Pointers_to_functions) `int (*evaluate)(void *context)`, and `const char *playbook_step`.
5. Write the following [rule evaluation functions](https://en.wikipedia.org/wiki/Rule-based_system):
   - `rule_stale_sth(void *ctx)` — returns 1 if [STH freshness](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) signal is unhealthy.
   - `rule_tree_shrink(void *ctx)` — returns 1 if [tree size](https://en.wikipedia.org/wiki/Merkle_tree) decreased.
   - `rule_consistency_fail(void *ctx)` — returns 1 if [consistency proof](../../../parts/w14/part.md) failed.
   - `rule_split_view(void *ctx)` — returns 1 if [equivocation](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) was detected.
   - `rule_inclusion_overdue(void *ctx)` — returns 1 if [inclusion delay](https://datatracker.ietf.org/doc/html/rfc6962#section-4.5) exceeds [MMD](https://datatracker.ietf.org/doc/html/rfc6962#section-3).
6. Write `evaluate_rules(struct alert_rule *rules, int rule_count, void *context, struct alert *alerts, int *alert_count)`:
   - Loop through all [rules](https://en.wikipedia.org/wiki/Rule-based_system). Call each `evaluate()` [function pointer](https://en.cppreference.com/w/c/language/pointer#Pointers_to_functions). If it returns 1, populate an [alert](https://en.wikipedia.org/wiki/Alert_messaging) struct and append it.
7. Write `print_alert(struct alert *a)` — prints `[SEVERITY] rule_name: detail`.
8. Write a `main()` test. Set up signals where [STH](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) is stale and a [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) was detected. Run `evaluate_rules()` and print the fired [alerts](https://en.wikipedia.org/wiki/Alert_messaging).

#### Test

```bash
gcc -Wall -Wextra -o alert_test w16/alert_rules.c
./alert_test
```

#### Expected

Two [alerts](https://en.wikipedia.org/wiki/Alert_messaging) fire. One `WARN` for the stale [STH](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5). One `CRITICAL` for the [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)). Each includes detail text and a [playbook](https://en.wikipedia.org/wiki/Incident_management) step reference.

### Prove It

Run under [AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html):

```bash
gcc -fsanitize=address -Wall -Wextra -o alert_test w16/alert_rules.c
./alert_test
```

Zero errors.

### Ship It

```bash
git add w16/alert_rules.h w16/alert_rules.c
git commit -m "w16-l04: alert rule engine with severity levels and playbook references"
```

---

## Done when

- Five [rules](https://en.wikipedia.org/wiki/Rule-based_system) are defined, each with a [severity](https://en.wikipedia.org/wiki/Syslog#Severity_level) and a [function pointer](https://en.cppreference.com/w/c/language/pointer#Pointers_to_functions).
- `evaluate_rules()` loops through all rules and collects fired [alerts](https://en.wikipedia.org/wiki/Alert_messaging).
- [Split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) always fires as `CRITICAL`.
- Every [alert](https://en.wikipedia.org/wiki/Alert_messaging) includes a [playbook](https://en.wikipedia.org/wiki/Incident_management) step reference.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Making all [alerts](https://en.wikipedia.org/wiki/Alert_messaging) the same [severity](https://en.wikipedia.org/wiki/Syslog#Severity_level) | If everything is `CRITICAL`, nothing is. Use `INFO` for informational, `WARN` for degraded, `CRITICAL` for confirmed misbehavior. |
| Firing an [alert](https://en.wikipedia.org/wiki/Alert_messaging) with no detail text | The on-call engineer needs to know what happened. Include the observed value and the threshold. |
| Not linking to a [playbook](https://en.wikipedia.org/wiki/Incident_management) step | An alert without a response action is just noise. Every rule [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reference a [playbook step (L05)](05-incident-playbook.md). |
| Evaluating rules only once | The monitor runs in a [polling loop (L02)](02-collect-checkpoints.md). Rules [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be evaluated on every poll cycle. |

## Proof

```bash
./alert_test
# → [WARN] stale_sth: STH age 600s exceeds max 300s — see playbook step P1
# → [CRITICAL] split_view: equivocation at tree_size=1024 — see playbook step P4
```

## Hero visual

```
  signal checks          rule engine               alerts
  ┌──────────────┐      ┌──────────────────┐      ┌────────────────────────┐
  │ freshness: ✗ │─────▶│ rule_stale_sth   │─────▶│ [WARN] stale STH      │
  │ growth: ✓    │      │ rule_tree_shrink  │      │                        │
  │ consistency:✓│      │ rule_consistency  │      │                        │
  │ inclusion: ✓ │      │ rule_inclusion    │      │                        │
  └──────────────┘      └──────────────────┘      └────────────────────────┘
  equivocation          ┌──────────────────┐      ┌────────────────────────┐
  ┌──────────────┐      │ rule_split_view  │─────▶│ [CRITICAL] split view  │
  │ split_view:✗ │─────▶│                  │      │                        │
  └──────────────┘      └──────────────────┘      └────────────────────────┘
```

## Future Lock

- In [W16 L05](05-incident-playbook.md) you will define the [playbook](https://en.wikipedia.org/wiki/Incident_management) steps that each [alert](https://en.wikipedia.org/wiki/Alert_messaging) references.
- In [W16 L06](06-regression-harness.md) you will test that every [rule](https://en.wikipedia.org/wiki/Rule-based_system) fires exactly when it should and stays silent otherwise.
- In [W21](../../../parts/w21/part.md) you will convert these [alert rules](https://en.wikipedia.org/wiki/Alert_messaging) into formal [SLI/SLO](../../../parts/w21/part.md) definitions with error budgets.
- In [W20](../../../parts/w20/part.md) you will inject faults that trigger each rule under [chaos conditions](../../../parts/w20/part.md).
