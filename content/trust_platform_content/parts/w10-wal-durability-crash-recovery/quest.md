---
id: w10-wal-durability-crash-recovery-quest
part: w10-wal-durability-crash-recovery
title: "BOSS FIGHT: Durability Report  4h"
order: 6
duration_minutes: 240
prereqs: ["w10-wal-durability-crash-recovery-d05-quest-checkpoint-compaction-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
---

# BOSS FIGHT: Durability Report  4h

## Visual Model

![Visual Model](/visuals/w10-wal-durability-crash-recovery.svg)



## Objective
Integrate the week’s lessons into a single working demo.

## Required constraint
- **Integrate everything from this week; prove it under load/failure.**

## Prove it
Attach evidence for: `week-10/quest-report.md`  
Minimum evidence:
- a short run log (start → work → stop)
- one induced failure + the system’s response
- a quick metric or timing baseline

## Notes from the original roadmap
### 🔨 Do — Run crash/restart benchmark scenarios for WAL modes. **Constraint:** Define and meet target RTO for restart.
### ✅ Prove — Publish durability vs latency table and recovery timings.
### 📦 Ship — `week-10/day6-durability-report.md`
### 🧠 Self-Check
- [ ] What RTO did you meet? · Which mode has best balance? · Did any committed write get lost?
