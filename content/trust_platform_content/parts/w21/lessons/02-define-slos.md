---
id: w21-l02
title: "Define SLOs"
order: 2
type: lesson
duration_min: 45
---

# Define SLOs

## Goal

Set numeric [service-level objectives](https://sre.google/sre-book/service-level-objectives/) for each [SLI](https://sre.google/sre-book/service-level-objectives/) from [L01](01-choose-slis.md), compute the [error budget](https://sre.google/sre-book/embracing-risk/) for each one, and build code that evaluates whether each [SLO](https://sre.google/sre-book/service-level-objectives/) is met over a rolling time window. An [SLO](https://sre.google/sre-book/service-level-objectives/) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be a concrete number tied to a specific [SLI](https://sre.google/sre-book/service-level-objectives/) — not a vague promise like "fast."

## What you build

A `struct slo_target` that holds five fields: `char sli_name[32]` (which [SLI](https://sre.google/sre-book/service-level-objectives/) this target applies to), `double threshold` (the numeric boundary — for example, 200.0 for latency p99 ≤ 200 ms), `int direction` (0 means "value [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be ≤ threshold," 1 means "value [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be ≥ threshold"), `double budget_fraction` (the fraction of samples allowed to violate — for example, 0.001 for 99.9% compliance), and `int window_samples` (how many recent samples the rolling window covers). A `struct slo_evaluator` that owns an array of `slo_target` entries and a `count`. A `slo_evaluator_add()` function that registers a new target. A `slo_evaluator_check()` function that takes an [SLI collector](01-choose-slis.md), reads the last `window_samples` samples for the matching [SLI](https://sre.google/sre-book/service-level-objectives/), counts violations, and returns a `struct slo_result` with `int met` (1 if the [SLO](https://sre.google/sre-book/service-level-objectives/) is met, 0 if breached), `int violations`, `int total`, and `double budget_remaining` (how much [error budget](https://sre.google/sre-book/embracing-risk/) is left as a percentage).

## Why it matters

An [SLI](https://sre.google/sre-book/service-level-objectives/) without an [SLO](https://sre.google/sre-book/service-level-objectives/) is just a number on a screen. The [SLO](https://sre.google/sre-book/service-level-objectives/) turns it into a promise. The [error budget](https://sre.google/sre-book/embracing-risk/) turns the promise into a decision tool: when the budget is spent, you stop shipping features and fix reliability. The [Google SRE book](https://sre.google/sre-book/embracing-risk/) says error budgets "align incentives between development velocity and system reliability." Without them, teams either over-invest in reliability (shipping nothing) or ignore it entirely (breaking everything).

---

## Training Session

### Warmup

Read the [error budget section of the Google SRE book](https://sre.google/sre-book/embracing-risk/). Write down:

1. The formula: `error_budget = 1 - SLO_target`. For a 99.9% [SLO](https://sre.google/sre-book/service-level-objectives/), the budget is 0.1%.
2. What happens when the [error budget](https://sre.google/sre-book/embracing-risk/) runs out.

### Work

#### Do

1. Create `w21/slo.h`.
2. Define `struct slo_target` with the five fields described above.
3. Define `struct slo_result` with the four fields: `met`, `violations`, `total`, `budget_remaining`.
4. Define `struct slo_evaluator` with a dynamic array and a `count`.
5. Create `w21/slo.c`.
6. Write `slo_evaluator_init()` — allocate the array with initial capacity 8, set `count` to zero.
7. Write `slo_evaluator_add()`:
   - Accept all five target fields.
   - Copy the [SLI](https://sre.google/sre-book/service-level-objectives/) name. Store threshold, direction, budget fraction, and window size.
   - Append to the array. Increment `count`.
   - Return the index of the new target.
8. Write `slo_evaluator_check()`:
   - Accept a pointer to an [SLI collector](01-choose-slis.md) and the name of the [SLO](https://sre.google/sre-book/service-level-objectives/) to check.
   - Find the matching `slo_target` by `sli_name`.
   - Read the last `window_samples` samples for that [SLI](https://sre.google/sre-book/service-level-objectives/) from the collector.
   - Count how many violate the threshold (respecting `direction`).
   - Compute `violation_rate = violations / total`.
   - Compute `budget_remaining = (budget_fraction - violation_rate) / budget_fraction * 100.0`.
   - Set `met = (violation_rate <= budget_fraction) ? 1 : 0`.
   - Return the `slo_result`.
9. Write `slo_evaluator_free()` — release the array.
10. Write a `main()` test that:
    - Creates an [SLI collector](01-choose-slis.md) and records 1000 [latency](https://en.wikipedia.org/wiki/Latency_(engineering)) samples where 995 are under 200 ms and 5 are over.
    - Adds an [SLO](https://sre.google/sre-book/service-level-objectives/) target: `latency_ms ≤ 200`, `budget_fraction = 0.01` (99% compliance), `window = 1000`.
    - Checks the [SLO](https://sre.google/sre-book/service-level-objectives/) and prints the result.
    - Adds a tighter [SLO](https://sre.google/sre-book/service-level-objectives/): `budget_fraction = 0.001` (99.9% compliance).
    - Checks again — this one [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) breach.

#### Test

```bash
gcc -Wall -Wextra -Werror -o slo_test w21/slo.c w21/sli.c -lm
./slo_test
```

#### Expected

First [SLO](https://sre.google/sre-book/service-level-objectives/) check: met=1, violations=5, budget remaining is positive. Second [SLO](https://sre.google/sre-book/service-level-objectives/) check: met=0, violations=5, budget remaining is negative. No crashes, no leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./slo_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w21/slo.h w21/slo.c
git commit -m "w21-l02: SLO evaluator with error budget computation"
```

---

## Done when

- `slo_evaluator_add()` registers a new [SLO](https://sre.google/sre-book/service-level-objectives/) target tied to a specific [SLI](https://sre.google/sre-book/service-level-objectives/).
- `slo_evaluator_check()` reads samples from the [SLI collector (L01)](01-choose-slis.md), counts violations, and returns whether the [SLO](https://sre.google/sre-book/service-level-objectives/) is met.
- [Error budget](https://sre.google/sre-book/embracing-risk/) remaining is computed correctly and goes negative when the budget is exhausted.
- At least two targets are tested — one that passes and one that breaches.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Setting an [SLO](https://sre.google/sre-book/service-level-objectives/) of 100% | A 100% [SLO](https://sre.google/sre-book/service-level-objectives/) means zero [error budget](https://sre.google/sre-book/embracing-risk/). Any single violation breaches it. This is unrealistic — even [Google targets 99.99%](https://sre.google/sre-book/embracing-risk/), not 100%. |
| Confusing threshold direction | [Latency](https://en.wikipedia.org/wiki/Latency_(engineering)) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be ≤ threshold. [Throughput](https://en.wikipedia.org/wiki/Throughput) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be ≥ threshold. Use the `direction` field so one function handles both. |
| Using all-time data instead of a rolling window | [SLOs](https://sre.google/sre-book/service-level-objectives/) [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) be evaluated over a recent window (for example, last 1000 samples or last 30 days). Old data dilutes current performance. |
| Forgetting to handle zero samples | If the [SLI collector](01-choose-slis.md) has no samples for a given name, return an error — do not divide by zero. |

## Proof

```bash
./slo_test
# → [slo] latency_ms: threshold=200.00 direction=LE window=1000
# → [slo] violations=5 total=1000 rate=0.50%
# → [slo] budget=1.00% remaining=50.00% → MET
# →
# → [slo] latency_ms: threshold=200.00 direction=LE window=1000
# → [slo] violations=5 total=1000 rate=0.50%
# → [slo] budget=0.10% remaining=-400.00% → BREACHED
```

## Hero visual

```
  SLI Collector (L01)
       │
       ▼
  ┌───────────────────────────────┐
  │       SLO Evaluator           │
  │                               │
  │  target: latency_ms ≤ 200    │
  │  budget: 0.1% (99.9%)        │
  │  window: 1000 samples         │
  │                               │
  │  violations: 5 / 1000         │
  │  rate: 0.50%                  │
  │  budget remaining: -400%      │
  │  verdict: BREACHED            │
  └───────────────────────────────┘
```

## Future Lock

- In [W21 L03](03-dashboards.md) the [dashboard renderer](03-dashboards.md) will display the `slo_result` as colored gauge bars — green for met, red for breached.
- In [W21 L04](04-runbooks.md) the [runbook generator](04-runbooks.md) will trigger runbook activation when `met == 0`.
- In [W21 L05](05-postmortems.md) the [postmortem writer](05-postmortems.md) will reference the breached [SLO](https://sre.google/sre-book/service-level-objectives/) name and its [error budget](https://sre.google/sre-book/embracing-risk/) impact.
- In [W23](../../w23/part.md) the [documentation](../../w23/part.md) will publish these [SLO](https://sre.google/sre-book/service-level-objectives/) targets as part of the system contract.
