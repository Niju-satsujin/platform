---
id: w21-l06
title: "Game-Day Drills"
order: 6
type: lesson
duration_min: 50
---

# Game-Day Drills

## Goal

Build a [game-day drill](https://en.wikipedia.org/wiki/Game_day_(exercise)) runner that simulates [SLO](https://sre.google/sre-book/service-level-objectives/) breaches by injecting faults from the [chaos testing framework (W20)](../../w20/part.md), verifies that the [dashboard (L03)](03-dashboards.md) detects the breach, confirms the [runbook (L04)](04-runbooks.md) steps work, generates a [postmortem (L05)](05-postmortems.md) from the drill results, and produces a drill report. Every drill [MUST](https://datatracker.ietf.org/doc/html/rfc2119) prove the full cycle: inject → detect → respond → recover → verify.

## What you build

A `struct drill_scenario` that holds five fields: `char name[64]` (drill name, for example `"latency_spike_drill"`), `char slo_name[32]` (which [SLO](https://sre.google/sre-book/service-level-objectives/) is targeted), `char fault_type[32]` (what fault to inject — links to the [failure matrix (W20 L01)](../../w20/lessons/01-failure-matrix.md)), `double inject_value` (the degraded value to inject, for example 500.0 ms for a [latency](https://en.wikipedia.org/wiki/Latency_(engineering)) spike), and `int inject_count` (how many bad samples to inject). A `struct drill_result` that holds: `char name[64]`, `int dashboard_detected` (1 if the [dashboard (L03)](03-dashboards.md) showed `[BREACH]`), `int runbook_followed` (1 if all four runbook steps were executed), `int slo_restored` (1 if the [SLO](https://sre.google/sre-book/service-level-objectives/) returned to met status after mitigation), and `uint64_t recovery_ms` (time from fault injection to [SLO](https://sre.google/sre-book/service-level-objectives/) restoration). A `drill_run()` function that executes a scenario end-to-end. A `drill_report()` function that prints all drill results. A `drill_update_runbook()` function that marks the corresponding [runbook (L04)](04-runbooks.md) entries as `drill_tested = 1` for scenarios that passed.

## Why it matters

A [runbook (L04)](04-runbooks.md) you have never tested is a wish, not a plan. [Game-day drills](https://en.wikipedia.org/wiki/Game_day_(exercise)) are the production-readiness equivalent of a fire drill — you practice the response before the real emergency. The [Google SRE book](https://sre.google/sre-book/postmortem-culture/) says teams that run regular drills recover faster from real incidents because the response is muscle memory, not improvisation. The [chaos drills (W20)](../../w20/part.md) already inject faults. This lesson adds the [SLO](https://sre.google/sre-book/service-level-objectives/) layer: did the dashboard catch it? Did the runbook work? Was the [SLO](https://sre.google/sre-book/service-level-objectives/) restored?

---

## Training Session

### Warmup

Read the [chaos drills lesson (W20 L02)](../../w20/lessons/02-chaos-drills.md). Write down:

1. The difference between a [chaos drill (W20)](../../w20/part.md) and a [game-day drill](https://en.wikipedia.org/wiki/Game_day_(exercise)). (Chaos drills test system recovery. Game-day drills test the full human + system response cycle.)
2. Why the [dashboard (L03)](03-dashboards.md) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) detect the breach — if the drill breaks the system silently, the [SLIs](https://sre.google/sre-book/service-level-objectives/) are incomplete.

### Work

#### Do

1. Create `w21/drill.h`.
2. Define `struct drill_scenario` with the five fields described above.
3. Define `struct drill_result` with the five fields described above.
4. Create `w21/drill.c`.
5. Write `drill_run()`:
   - Accept a `drill_scenario`, a pointer to an [SLI collector](01-choose-slis.md), an [SLO evaluator](02-define-slos.md), a [dashboard](03-dashboards.md), and a [runbook](04-runbooks.md).
   - **Inject**: record `inject_count` bad samples into the [SLI collector](01-choose-slis.md) with the `inject_value`.
   - **Detect**: call `dashboard_refresh()` and `dashboard_alerts()`. Check if the targeted [SLO](https://sre.google/sre-book/service-level-objectives/) shows `met == 0`. Set `dashboard_detected`.
   - **Respond**: look up the [runbook](04-runbooks.md) entry for the targeted [SLO](https://sre.google/sre-book/service-level-objectives/). Print each step (detect, diagnose, mitigate, verify). Set `runbook_followed = 1`.
   - **Recover**: record `inject_count` healthy samples into the [SLI collector](01-choose-slis.md) to simulate mitigation.
   - **Verify**: call `slo_evaluator_check()` again. Set `slo_restored` to 1 if the [SLO](https://sre.google/sre-book/service-level-objectives/) is met.
   - Record `recovery_ms` as the elapsed time from injection to restoration using [clock_gettime(CLOCK_MONOTONIC)](https://man7.org/linux/man-pages/man2/clock_gettime.2.html).
   - Return the `drill_result`.
6. Write `drill_report()`:
   - Accept an array of `drill_result` and a count.
   - Print a header: `DRILL | DETECTED | RUNBOOK | RESTORED | RECOVERY_MS`.
   - Print one row per result.
   - Print a summary: `X/Y drills passed` (passed = all three flags are 1).
7. Write `drill_update_runbook()`:
   - Accept a `drill_result` and a pointer to a [runbook](04-runbooks.md).
   - If all three flags (detected, followed, restored) are 1, call `runbook_mark_tested()` for the matching [SLO](https://sre.google/sre-book/service-level-objectives/) name.
   - Return 0 on success.
8. Write a `main()` test that:
   - Sets up an [SLI collector](01-choose-slis.md), [SLO evaluator](02-define-slos.md), [dashboard](03-dashboards.md), and [runbook](04-runbooks.md) with three [SLOs](https://sre.google/sre-book/service-level-objectives/).
   - Runs three drill scenarios — one per [SLO](https://sre.google/sre-book/service-level-objectives/).
   - Prints the drill report.
   - Updates the [runbook](04-runbooks.md) and prints the new coverage.

#### Test

```bash
gcc -Wall -Wextra -Werror -o drill_test \
  w21/drill.c w21/runbook.c w21/dashboard.c w21/slo.c w21/sli.c -lm
./drill_test
```

#### Expected

Three drill results. All three show `DETECTED=1`, `RUNBOOK=1`, `RESTORED=1`. Drill report shows `3/3 passed`. Runbook coverage is 100%. No crashes, no leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./drill_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w21/drill.h w21/drill.c
git commit -m "w21-l06: game-day drill runner with full SLO validation cycle"
```

---

## Done when

- `drill_run()` injects faults, detects the [SLO](https://sre.google/sre-book/service-level-objectives/) breach via the [dashboard](03-dashboards.md), follows the [runbook](04-runbooks.md), recovers, and verifies.
- `drill_report()` prints a clear summary of all drill results.
- `drill_update_runbook()` marks [runbook](04-runbooks.md) entries as `drill_tested` for passing drills.
- At least three drills run — one per [SLO](https://sre.google/sre-book/service-level-objectives/).
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Drill passes even when dashboard did not detect the breach | If `dashboard_detected == 0`, the drill [MUST](https://datatracker.ietf.org/doc/html/rfc2119) fail. A silent [SLO](https://sre.google/sre-book/service-level-objectives/) breach means your [SLIs](https://sre.google/sre-book/service-level-objectives/) or thresholds are wrong. |
| Injecting too few bad samples | If you inject 1 sample into a window of 1000, the [error budget](https://sre.google/sre-book/embracing-risk/) is barely touched. Inject enough to cause a measurable breach. |
| Skipping the recovery phase | A drill that breaks the system and does not restore it leaves the [SLI collector](01-choose-slis.md) in a degraded state. Always inject healthy samples to simulate recovery. |
| Not timing recovery with [CLOCK_MONOTONIC](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) | Use [clock_gettime(CLOCK_MONOTONIC)](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) — not [CLOCK_REALTIME](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) — so [NTP](https://en.wikipedia.org/wiki/Network_Time_Protocol) jumps do not corrupt recovery measurements. |

## Proof

```bash
./drill_test
# → [drill] latency_spike_drill: injecting 50 samples at 500.00 ms
# → [dashboard] latency_ms: BREACHED
# → [runbook] detect: Check dashboard for [BREACH] alert on latency_ms
# → [runbook] diagnose: Compare latency_ms p99 against threshold 200.00
# → [runbook] mitigate: Shed load / scale up
# → [runbook] verify: Re-run dashboard_refresh()
# → [drill] recovering: injecting 50 healthy samples
# → [drill] latency_ms SLO restored: met=1
# → [drill] recovery_ms=2
# →
# → [drill] error_rate_drill: injecting 50 samples at 0.80
# → [dashboard] error_rate: BREACHED
# → ...
# → [drill] error_rate SLO restored: met=1
# →
# → [drill] throughput_drop_drill: injecting 50 samples at 30.00 rps
# → [dashboard] throughput_rps: BREACHED
# → ...
# → [drill] throughput_rps SLO restored: met=1
# →
# → DRILL REPORT
# → DRILL                  | DETECTED | RUNBOOK | RESTORED | RECOVERY_MS
# → latency_spike_drill    |    1     |    1    |    1     |     2
# → error_rate_drill       |    1     |    1    |    1     |     1
# → throughput_drop_drill  |    1     |    1    |    1     |     2
# → 3/3 drills passed
# →
# → Runbook coverage: 100% (3/3 tested)
```

## Hero visual

```
  Drill Scenario                    Full Cycle
  ┌──────────────┐
  │ fault_type   │──► INJECT bad samples into SLI collector
  │ inject_value │         │
  │ inject_count │         ▼
  └──────────────┘    DETECT via dashboard → [BREACH]
                           │
                           ▼
                      RESPOND via runbook → 4 steps
                           │
                           ▼
                      RECOVER → inject healthy samples
                           │
                           ▼
                      VERIFY → SLO met=1, budget > 0
                           │
                           ▼
                      REPORT → drill passed / failed
```

## Future Lock

- In [W22](../../w22/part.md) the [threat model](../../w22/part.md) will include "can an attacker cause an [SLO](https://sre.google/sre-book/service-level-objectives/) breach that the drill did not simulate?" as a threat scenario.
- In [W23](../../w23/part.md) the [documentation](../../w23/part.md) will include the drill report as evidence of production readiness.
- In [W20](../../w20/part.md) the [chaos testing framework (W20)](../../w20/part.md) provides the fault injection engine. This lesson wraps it with the [SLO](https://sre.google/sre-book/service-level-objectives/) detection and response cycle.
- The drill report becomes a gate for release readiness: no release ships unless all drills pass and [runbook](04-runbooks.md) coverage is 100%.
