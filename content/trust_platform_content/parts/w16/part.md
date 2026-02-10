---
id: w16-part
title: "Log Monitoring & Equivocation Detection"
order: 16
type: part
---

# Week 16 – Log Monitoring & Equivocation Detection

Trust requires watchers. A [monitor](https://datatracker.ietf.org/doc/html/rfc6962#section-5) detects [split views](https://en.wikipedia.org/wiki/Equivocation_(computer_science)), [rollbacks](https://en.wikipedia.org/wiki/Rollback_(data_management)), and silent drops before users notice.

```
  vantage A             vantage B
  ┌──────────┐          ┌──────────┐
  │ poll STH  │          │ poll STH  │
  └─────┬─────┘          └─────┬─────┘
        │                      │
        ▼                      ▼
  ┌──────────────────────────────────┐
  │         gossip & compare          │
  │  STH_A.root  ≟  STH_B.root       │
  └──────────────┬───────────────────┘
                 │
          mismatch? ──▶ ALERT 🚨
                 │
          match?  ──▶ ✓ consistent
```

## What you build

A [log monitor](https://datatracker.ietf.org/doc/html/rfc6962#section-5) that polls [transparency log](../w15/part.md) [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing), detects [equivocation](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) (split views), fires [alerts](https://en.wikipedia.org/wiki/Alert_messaging), and follows an [incident playbook](https://en.wikipedia.org/wiki/Incident_management). The monitor runs from multiple [vantage points](https://en.wikipedia.org/wiki/Gossip_protocol), compares [Signed Tree Heads](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5), verifies [consistency proofs](../w14/part.md), and raises an alarm when the log lies.

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W14 | [Merkle proofs](../w14/part.md) – consistency proofs verify that new checkpoints extend old ones |
| ← builds on | W15 | [Transparency log](../w15/part.md) – the log you are now watching from the outside |
| → leads to | W18 | [Cross-log anchoring](../w18/part.md) – anchoring adds cross-log checks beyond single-log monitoring |
| → leads to | W20 | [Chaos & recovery drills](../w20/part.md) – inject faults into the monitor and prove it recovers |
| → leads to | W21 | [SLI/SLO](../w21/part.md) – define service level indicators for monitoring freshness and alert latency |

## Lessons

1. [Signals to Monitor](lessons/01-signals-to-monitor.md)
2. [Collect Checkpoints](lessons/02-collect-checkpoints.md)
3. [Detect Equivocation](lessons/03-detect-equivocation.md)
4. [Alert Rules](lessons/04-alert-rules.md)
5. [Incident Playbook](lessons/05-incident-playbook.md)
6. [Regression Harness](lessons/06-regression-harness.md)

## Quest

[W16 Quest – Full Log Monitor with Equivocation Detection](quest.md)

## Quiz

[W16 Quiz](quiz.md)
