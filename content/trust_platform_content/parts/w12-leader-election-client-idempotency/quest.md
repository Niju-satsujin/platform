---
id: w12-leader-election-client-idempotency-quest
part: w12-leader-election-client-idempotency
title: "ARC BOSS: Month 3 Demo  4h 🏆"
order: 6
duration_minutes: 240
prereqs: ["w12-leader-election-client-idempotency-d05-quest-stale-leader-fencing-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
---

# ARC BOSS: Month 3 Demo  4h 🏆

## Visual Model

![Visual Model](/visuals/w12-leader-election-client-idempotency.svg)



## Objective
Integrate the week’s lessons into a single working demo.

## Required constraint
- **Integrate everything from this week; prove it under load/failure.**

## Prove it
Attach evidence for: `week-12/quest-report.md`  
Minimum evidence:
- a short run log (start → work → stop)
- one induced failure + the system’s response
- a quick metric or timing baseline

## Notes from the original roadmap
### 🔨 Do — Build Month 3 integrated demo (durable replicated KV + retries). **Constraint:** Include crash + failover + retry scenario in one scripted flow.
### ✅ Prove — No lost committed writes, no duplicate effects.
### 📦 Ship — `month-3-demo/README.md` + `week-12/day6-month3-report.md`

### 🏆 Achievement Unlocked: **Fault Tamer**
> *You built a replicated KV store that survives crashes, leader failures, and retries safely.*
