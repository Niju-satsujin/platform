---
id: w20-part
title: "Chaos Engineering & Recovery Drills"
order: 20
type: part
---

# Week 20 – Chaos Engineering & Recovery Drills

You don't know your system works until you've broken it on purpose and recovered.

## Hero visual

```
                    Chaos Controller
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌────────────┐ ┌────────────┐ ┌────────────┐
   │ SIGKILL    │ │ disk full  │ │ network    │
   │ process    │ │ injection  │ │ partition  │
   └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
         │               │               │
         ▼               ▼               ▼
   ┌─────────────────────────────────────────────┐
   │              Target System                   │
   │  WAL (W10)  │  Log (W15)  │  Anchors (W18)  │
   └─────────────────────────────────────────────┘
         │               │               │
         ▼               ▼               ▼
   ┌─────────────────────────────────────────────┐
   │           Recovery & Validation              │
   │  RTO check  │  RPO check  │  data integrity │
   └─────────────────────────────────────────────┘
         │
         ▼
   ┌─────────────────────────────────────────────┐
   │          Operator Playbook Report            │
   │  failure → detection → recovery → verify    │
   └─────────────────────────────────────────────┘
```

## What you build

A [chaos testing](https://principlesofchaos.org/) framework that stress-tests your system by breaking it on purpose and proving it recovers correctly:

1. A [failure matrix](lessons/01-failure-matrix.md) that catalogues every failure mode — process crash, disk full, network partition, corrupt write — and maps each to the component it targets and the expected recovery path.
2. A [chaos drill runner](lessons/02-chaos-drills.md) that injects real faults using [kill(2)](https://man7.org/linux/man-pages/man2/kill.2.html), [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html), and filesystem manipulation, then measures whether the system recovers within its stated objectives.
3. A [recovery objectives validator](lessons/03-recovery-objectives.md) that enforces [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) (Recovery Time Objective) and [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) (Recovery Point Objective) — proving how fast recovery happens and how much data is lost.
4. A [data safety checker](lessons/04-data-safety-checks.md) that verifies zero data corruption after each drill by replaying the [WAL (W10)](../w10/part.md), checking [Merkle roots (W15)](../w15/part.md), and validating [anchor chains (W18)](../w18/part.md).
5. An [operator playbook](lessons/05-operator-playbook.md) generator that turns drill results into structured runbooks — each failure mode gets a detection method, a recovery procedure, and a verification step.
6. A [regression harness](lessons/06-regression-harness.md) that runs the full chaos suite automatically and gates merges on all drills passing.

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W06 | [Backpressure (W06)](../w06/part.md) — chaos drills overload queues to test [backpressure](../w06/part.md) behavior under fault conditions |
| ← builds on | W10 | [WAL crash recovery (W10)](../w10/part.md) — the [write-ahead log](../w10/part.md) is the primary recovery mechanism tested by chaos drills |
| ← builds on | W15 | [Transparency log (W15)](../w15/part.md) — [data safety checks](lessons/04-data-safety-checks.md) verify the [transparency log](../w15/part.md) stays consistent after faults |
| ← builds on | W18 | [Anchor recovery (W18)](../w18/part.md) — chaos drills crash the system between [anchor](../w18/lessons/01-append-only-model.md) creation and [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) publication |
| → leads to | W16 | [Monitoring (W16)](../w16/part.md) — [monitors](../w16/part.md) detect injected faults and trigger alerts during chaos drills |
| → leads to | W21 | [SLO breach (W21)](../w21/part.md) — chaos drills measure whether [SLO](https://en.wikipedia.org/wiki/Service-level_objective) targets survive real faults |

## Lessons

1. [Failure Matrix](lessons/01-failure-matrix.md)
2. [Chaos Drills](lessons/02-chaos-drills.md)
3. [Recovery Objectives](lessons/03-recovery-objectives.md)
4. [Data Safety Checks](lessons/04-data-safety-checks.md)
5. [Operator Playbook](lessons/05-operator-playbook.md)
6. [Regression Harness](lessons/06-regression-harness.md)

## Quest

[W20 Quest – Full Chaos Testing Framework](quest.md)

## Quiz

[W20 Quiz](quiz.md)
