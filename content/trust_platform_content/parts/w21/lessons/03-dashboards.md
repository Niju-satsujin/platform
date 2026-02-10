---
id: w21-l03
title: "Dashboards"
order: 3
type: lesson
duration_min: 40
---

# Dashboards

## Goal

Build a text-based [dashboard](https://en.wikipedia.org/wiki/Dashboard_(computing)) that reads [SLI](https://sre.google/sre-book/service-level-objectives/) samples from the [collector (L01)](01-choose-slis.md), evaluates each [SLO](https://sre.google/sre-book/service-level-objectives/) using the [evaluator (L02)](02-define-slos.md), and renders a live status view with gauge bars, [burn-rate](https://sre.google/workbook/alerting-on-slos/) alerts, and breach warnings. The dashboard [MUST](https://datatracker.ietf.org/doc/html/rfc2119) show at a glance whether the system is healthy.

## What you build

A `struct dashboard_row` that holds five fields: `char sli_name[32]`, `double current_value`, `double threshold`, `double budget_remaining_pct`, and `int met` (1 or 0). A `struct dashboard` that owns an array of `dashboard_row` entries and a `count`. A `dashboard_refresh()` function that takes an [SLI collector](01-choose-slis.md) and an [SLO evaluator](02-define-slos.md), evaluates each target, and populates the rows. A `dashboard_render()` function that prints the dashboard as a table with a gauge bar for each row — filled proportionally to `budget_remaining_pct`. A `dashboard_alerts()` function that scans the rows and prints a `[BREACH]` warning for any [SLO](https://sre.google/sre-book/service-level-objectives/) where `met == 0`, and a `[BURN]` warning for any [SLO](https://sre.google/sre-book/service-level-objectives/) where [budget remaining](https://sre.google/sre-book/embracing-risk/) is below 20%.

## Why it matters

Numbers in a log file are invisible. A [dashboard](https://en.wikipedia.org/wiki/Dashboard_(computing)) makes the state of the system visible at a glance. The [Google SRE workbook](https://sre.google/workbook/alerting-on-slos/) recommends [burn-rate alerts](https://sre.google/workbook/alerting-on-slos/) — rather than alerting on every single violation, you alert when the [error budget](https://sre.google/sre-book/embracing-risk/) is being consumed faster than expected. This prevents alert fatigue while still catching real problems early.

---

## Training Session

### Warmup

Read the [burn-rate alerting section of the Google SRE workbook](https://sre.google/workbook/alerting-on-slos/). Write down:

1. What a [burn rate](https://sre.google/workbook/alerting-on-slos/) of 1.0 means (budget consumed at exactly the expected pace).
2. Why a [burn rate](https://sre.google/workbook/alerting-on-slos/) above 1.0 means you will exhaust the budget before the window ends.

### Work

#### Do

1. Create `w21/dashboard.h`.
2. Define `struct dashboard_row` with the five fields described above.
3. Define `struct dashboard` with a dynamic array and a `count`.
4. Create `w21/dashboard.c`.
5. Write `dashboard_init()` — allocate the array with initial capacity 8, set `count` to zero.
6. Write `dashboard_refresh()`:
   - Accept pointers to an [SLI collector](01-choose-slis.md) and an [SLO evaluator](02-define-slos.md).
   - For each [SLO](https://sre.google/sre-book/service-level-objectives/) target, call `slo_evaluator_check()` to get the result.
   - Call `sli_collector_latest()` to get the current value.
   - Populate a `dashboard_row` with the name, current value, threshold, budget remaining, and met status.
   - Store the row. Update `count`.
7. Write `dashboard_render()`:
   - Print a header: `SLI | CURRENT | TARGET | BUDGET | STATUS | GAUGE`.
   - For each row, print the values.
   - For the gauge, print a bar of 20 characters: filled characters for the portion of budget remaining, empty characters for the rest. Clamp to 0–100%.
   - Example: `[████████████░░░░░░░░]  62%`.
8. Write `dashboard_alerts()`:
   - Scan all rows.
   - If `met == 0`, print `[BREACH] <sli_name>: SLO violated, budget exhausted`.
   - If `met == 1` but `budget_remaining_pct < 20.0`, print `[BURN] <sli_name>: budget below 20%, burn rate too high`.
9. Write `dashboard_free()` — release the array.
10. Write a `main()` test that:
    - Creates an [SLI collector](01-choose-slis.md) with mixed data — some healthy, some degraded.
    - Registers three [SLO](https://sre.google/sre-book/service-level-objectives/) targets.
    - Calls `dashboard_refresh()`, `dashboard_render()`, and `dashboard_alerts()`.

#### Test

```bash
gcc -Wall -Wextra -Werror -o dashboard_test \
  w21/dashboard.c w21/slo.c w21/sli.c -lm
./dashboard_test
```

#### Expected

A three-row dashboard table with gauge bars. At least one `[BREACH]` or `[BURN]` alert. No crashes, no leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./dashboard_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w21/dashboard.h w21/dashboard.c
git commit -m "w21-l03: text dashboard with gauge bars and burn-rate alerts"
```

---

## Done when

- `dashboard_refresh()` reads [SLI](https://sre.google/sre-book/service-level-objectives/) data and [SLO](https://sre.google/sre-book/service-level-objectives/) results into rows.
- `dashboard_render()` prints a readable table with gauge bars.
- `dashboard_alerts()` prints `[BREACH]` for failed [SLOs](https://sre.google/sre-book/service-level-objectives/) and `[BURN]` for low-budget [SLOs](https://sre.google/sre-book/service-level-objectives/).
- All three [SLIs](https://sre.google/sre-book/service-level-objectives/) appear in the dashboard.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Displaying raw violation count instead of budget percentage | Users need to see how much budget is left, not just how many violations occurred. Normalize to a percentage. |
| Gauge bar overflows or underflows | Clamp `budget_remaining_pct` to the range 0–100 before computing bar length. A negative budget means 0 filled characters. |
| Alert fatigue from per-sample alerts | Alert on [burn rate](https://sre.google/workbook/alerting-on-slos/) trends, not on individual samples. One bad sample does not mean a [BREACH]. |
| Not refreshing before rendering | The dashboard [MUST](https://datatracker.ietf.org/doc/html/rfc2119) call `dashboard_refresh()` before `dashboard_render()`. Stale rows show outdated data. |

## Proof

```bash
./dashboard_test
# → SLI            | CURRENT | TARGET  | BUDGET  | STATUS   | GAUGE
# → latency_ms     |  185.00 |  200.00 |  62.0%  | OK       | [████████████░░░░░░░░]
# → error_rate      |    0.45 |    0.10 |  -400%  | BREACHED | [░░░░░░░░░░░░░░░░░░░░]
# → throughput_rps  |  105.00 |  100.00 |  85.0%  | OK       | [█████████████████░░░]
# →
# → [BREACH] error_rate: SLO violated, budget exhausted
```

## Hero visual

```
  ┌──────────────────────────────────────────────────────────┐
  │                    SLO Dashboard                         │
  ├──────────────┬─────────┬─────────┬────────┬──────────────┤
  │ SLI          │ CURRENT │ TARGET  │ BUDGET │ GAUGE        │
  ├──────────────┼─────────┼─────────┼────────┼──────────────┤
  │ latency_ms   │  185.00 │  200.00 │  62%   │ ████████████ │
  │ error_rate   │    0.45 │    0.10 │  -400% │ ░░░░░░░░░░░░ │
  │ throughput   │  105.00 │  100.00 │  85%   │ █████████████│
  └──────────────┴─────────┴─────────┴────────┴──────────────┘
         │
         ▼
  [BREACH] error_rate: SLO violated
  [BURN]   latency_ms: budget below 20%
```

## Future Lock

- In [W21 L04](04-runbooks.md) the [runbook generator](04-runbooks.md) will be triggered by `[BREACH]` alerts from this dashboard.
- In [W21 L06](06-drills.md) the [game-day drill runner](06-drills.md) will verify that the dashboard shows the correct breach status during injected faults.
- In [W23](../../w23/part.md) the [documentation](../../w23/part.md) will include a screenshot of this dashboard as the operational overview.
- In [W22](../../w22/part.md) the [threat model](../../w22/part.md) will use dashboard visibility gaps as an attack surface — if an attacker can degrade the system without triggering a dashboard alert, the [SLI](https://sre.google/sre-book/service-level-objectives/) selection is incomplete.
