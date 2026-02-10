---
id: w21-quest
title: "Quest – Full SLI/SLO Production Readiness Framework"
order: 7
type: quest
duration_min: 90
---

# Quest – Full SLI/SLO Production Readiness Framework

## Mission

Build a complete [production readiness framework](part.md). An [SLI collector (L01)](lessons/01-choose-slis.md) captures [latency](https://en.wikipedia.org/wiki/Latency_(engineering)), [error rate](https://en.wikipedia.org/wiki/Bit_error_rate), and [throughput](https://en.wikipedia.org/wiki/Throughput). An [SLO evaluator (L02)](lessons/02-define-slos.md) checks each indicator against its target and computes the [error budget](https://sre.google/sre-book/embracing-risk/). A [dashboard (L03)](lessons/03-dashboards.md) renders live status with gauge bars and [burn-rate](https://sre.google/workbook/alerting-on-slos/) alerts. A [runbook (L04)](lessons/04-runbooks.md) provides step-by-step incident response for every [SLO](https://sre.google/sre-book/service-level-objectives/) breach. A [postmortem writer (L05)](lessons/05-postmortems.md) captures [blameless](https://sre.google/sre-book/postmortem-culture/) incident reports. A [game-day drill runner (L06)](lessons/06-drills.md) simulates breaches, validates the full response cycle, and gates the build on 100% drill pass rate and 100% [runbook](lessons/04-runbooks.md) coverage.

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | [SLI collector (L01)](lessons/01-choose-slis.md) records samples for at least 3 indicators: [latency](https://en.wikipedia.org/wiki/Latency_(engineering)), [error rate](https://en.wikipedia.org/wiki/Bit_error_rate), and [throughput](https://en.wikipedia.org/wiki/Throughput) | `sli_collector_latest()` returns a valid sample for each name |
| R2 | [SLI percentile (L01)](lessons/01-choose-slis.md) computes [p99](https://en.wikipedia.org/wiki/Percentile) correctly using [qsort()](https://man7.org/linux/man-pages/man3/qsort.3.html) and nearest-rank | 100 known samples → p99 matches the expected value |
| R3 | [SLO evaluator (L02)](lessons/02-define-slos.md) registers targets for all 3 [SLIs](https://sre.google/sre-book/service-level-objectives/) | `slo_evaluator.count == 3` |
| R4 | [SLO check (L02)](lessons/02-define-slos.md) returns `met=1` when violations are within the [error budget](https://sre.google/sre-book/embracing-risk/) | 5 violations out of 1000 with 1% budget → `met=1` |
| R5 | [SLO check (L02)](lessons/02-define-slos.md) returns `met=0` when violations exceed the [error budget](https://sre.google/sre-book/embracing-risk/) | 5 violations out of 1000 with 0.1% budget → `met=0` |
| R6 | [Error budget](https://sre.google/sre-book/embracing-risk/) goes negative when exhausted | `budget_remaining < 0` when violation rate exceeds budget fraction |
| R7 | [Dashboard (L03)](lessons/03-dashboards.md) renders a table with gauge bars for all 3 [SLOs](https://sre.google/sre-book/service-level-objectives/) | `dashboard_render()` output contains 3 rows with `[███` patterns |
| R8 | [Dashboard alerts (L03)](lessons/03-dashboards.md) print `[BREACH]` for failed [SLOs](https://sre.google/sre-book/service-level-objectives/) | Inject violations → `dashboard_alerts()` outputs `[BREACH]` |
| R9 | [Dashboard alerts (L03)](lessons/03-dashboards.md) print `[BURN]` when budget is below 20% | Budget at 15% → `dashboard_alerts()` outputs `[BURN]` |
| R10 | [Runbook (L04)](lessons/04-runbooks.md) is generated with one entry per [SLO](https://sre.google/sre-book/service-level-objectives/) target | `runbook.count == slo_evaluator.count` |
| R11 | Each [runbook](lessons/04-runbooks.md) entry has all four steps filled: detect, diagnose, mitigate, verify | No field is empty (first character is not `\0`) |
| R12 | [Runbook coverage (L04)](lessons/04-runbooks.md) starts at 0% and reaches 100% after all drills pass | `runbook_coverage()` returns 0 initially, 100 after drills |
| R13 | [Postmortem (L05)](lessons/05-postmortems.md) captures incident metadata: title, [SLO](https://sre.google/sre-book/service-level-objectives/) breached, root cause, impact, timeline | `postmortem_print()` outputs all fields non-empty |
| R14 | [Postmortem action items (L05)](lessons/05-postmortems.md) track completion percentage | Add 3 actions, complete 1 → `postmortem_actions_done()` returns 33 |
| R15 | [Game-day drill (L06)](lessons/06-drills.md) injects faults and detects the [SLO](https://sre.google/sre-book/service-level-objectives/) breach via the [dashboard](lessons/03-dashboards.md) | `drill_result.dashboard_detected == 1` |
| R16 | [Game-day drill (L06)](lessons/06-drills.md) follows the [runbook](lessons/04-runbooks.md) and restores the [SLO](https://sre.google/sre-book/service-level-objectives/) | `drill_result.runbook_followed == 1 && drill_result.slo_restored == 1` |
| R17 | Full drill report shows all drills passed | `drill_report()` prints `3/3 drills passed` |
| R18 | End-to-end cycle: inject → detect → respond → recover → verify → postmortem | Single function runs the pipeline for one [SLO](https://sre.google/sre-book/service-level-objectives/) and produces a [postmortem](lessons/05-postmortems.md) |

## Constraints

- C only. No external monitoring or alerting libraries.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) compile with `gcc -Wall -Wextra -Werror -lm`.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) use [clock_gettime(CLOCK_MONOTONIC)](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) for all timing measurements.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) use [qsort()](https://man7.org/linux/man-pages/man3/qsort.3.html) for [percentile](https://en.wikipedia.org/wiki/Percentile) computation — no manual sorting.
- The [SLI collector (L01)](lessons/01-choose-slis.md), [SLO evaluator (L02)](lessons/02-define-slos.md), [dashboard (L03)](lessons/03-dashboards.md), [runbook (L04)](lessons/04-runbooks.md), [postmortem (L05)](lessons/05-postmortems.md), and [drill runner (L06)](lessons/06-drills.md) from the lessons are reused as libraries — do not rewrite them.
- Every [malloc()](https://man7.org/linux/man-pages/man3/malloc.3.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a matching [free()](https://man7.org/linux/man-pages/man3/free.3.html).

## Bonus challenges

| Bonus | Description |
|-------|-------------|
| B1 | Multi-window [SLO](https://sre.google/sre-book/service-level-objectives/) — evaluate the same [SLI](https://sre.google/sre-book/service-level-objectives/) over 3 different windows (100, 1000, 10000 samples) and show all three on the [dashboard](lessons/03-dashboards.md) |
| B2 | [Burn rate](https://sre.google/workbook/alerting-on-slos/) computation — calculate the current [burn rate](https://sre.google/workbook/alerting-on-slos/) as `(violation_rate / budget_fraction)` and add it as a column to the [dashboard](lessons/03-dashboards.md) |
| B3 | Postmortem archive — store multiple [postmortems](lessons/05-postmortems.md) in a linked list and print a summary table of all past incidents |
| B4 | [Chaos drill (W20)](../w20/part.md) integration — instead of simulating faults by injecting bad samples, call the real [chaos drill runner (W20 L02)](../w20/lessons/02-chaos-drills.md) and measure the [SLI](https://sre.google/sre-book/service-level-objectives/) impact of actual faults |

## Verification

```bash
# Build
gcc -Wall -Wextra -Werror -o slo_harness \
  w21/slo_harness.c w21/sli.c w21/slo.c w21/dashboard.c \
  w21/runbook.c w21/postmortem.c w21/drill.c -lm

# R1 + R2: SLI collector
./slo_harness sli-test
# → [sli] latency_ms: latest=187.00 p99=198.00
# → [sli] error_rate: latest=0.05 p99=0.49
# → [sli] throughput_rps: latest=142.00 p99=149.00

# R3–R6: SLO evaluator
./slo_harness slo-test
# → [slo] latency_ms: violations=5/1000 budget=1.00% remaining=50.00% → MET
# → [slo] latency_ms: violations=5/1000 budget=0.10% remaining=-400.00% → BREACHED

# R7–R9: Dashboard
./slo_harness dashboard-test
# → SLI            | CURRENT | TARGET  | BUDGET  | STATUS   | GAUGE
# → latency_ms     |  185.00 |  200.00 |  62.0%  | OK       | [████████████░░░░░░░░]
# → error_rate     |    0.45 |    0.10 | -400.0% | BREACHED | [░░░░░░░░░░░░░░░░░░░░]
# → throughput_rps |  105.00 |  100.00 |  85.0%  | OK       | [█████████████████░░░]
# →
# → [BREACH] error_rate: SLO violated, budget exhausted

# R10–R12: Runbook
./slo_harness runbook-test
# → Generated 3 runbook entries
# → coverage: 0% (0/3 tested)

# R13–R14: Postmortem
./slo_harness postmortem-test
# → POSTMORTEM: Latency spike during deploy
# → SLO breached: latency_ms
# → Actions complete: 33% (1/3)

# R15–R17: Game-day drills
./slo_harness drill-test
# → [drill] latency_spike_drill: DETECTED=1 RUNBOOK=1 RESTORED=1
# → [drill] error_rate_drill: DETECTED=1 RUNBOOK=1 RESTORED=1
# → [drill] throughput_drop_drill: DETECTED=1 RUNBOOK=1 RESTORED=1
# → 3/3 drills passed
# → Runbook coverage: 100% (3/3 tested)

# R18: End-to-end
./slo_harness e2e latency_ms
# → [e2e] inject latency_spike → detect breach → follow runbook → recover → verify SLO
# → [e2e] postmortem generated: "Game-day drill: latency_ms breach"
# → [e2e] result: PASS

# Full regression
./slo_harness
# → 18/18 passed
```

## Ship

```bash
git add w21/
git commit -m "w21 quest: full SLI/SLO production readiness framework"
```
