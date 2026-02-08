---
id: w11-replicated-kv-23-nodes-quest
part: w11-replicated-kv-23-nodes
title: "BOSS FIGHT: Replication Validation  4h"
order: 6
duration_minutes: 240
prereqs: ["w11-replicated-kv-23-nodes-d05-quest-partition-policy-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
---

# BOSS FIGHT: Replication Validation  4h

## Visual Model

![Visual Model](/visuals/w11-replicated-kv-23-nodes.svg)



## Objective
Integrate the week’s lessons into a single working demo.

## Required constraint
- **Integrate everything from this week; prove it under load/failure.**

## Prove it
Attach evidence for: `week-11/quest-report.md`  
Minimum evidence:
- a short run log (start → work → stop)
- one induced failure + the system’s response
- a quick metric or timing baseline

## Notes from the original roadmap
### 🔨 Do — Run replicated KV validation plan across 2–3 nodes. **Constraint:** Identical committed state after node restart and catch-up.
### ✅ Prove — Publish state-hash comparison across nodes after drills.
### 📦 Ship — `week-11/day6-replication-validation.md`
