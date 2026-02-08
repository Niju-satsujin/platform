---
id: w07-hashing-integrity-proofs-quest
part: w07-hashing-integrity-proofs
title: "BOSS FIGHT: Hash Integration  4h"
order: 6
duration_minutes: 240
prereqs: ["w07-hashing-integrity-proofs-d05-quest-integrity-audit-drill-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
---

# BOSS FIGHT: Hash Integration  4h

## Visual Model

![Visual Model](/visuals/w07-hashing-integrity-proofs.svg)



## Objective
Integrate the week’s lessons into a single working demo.

## Required constraint
- **Integrate everything from this week; prove it under load/failure.**

## Prove it
Attach evidence for: `week-7/day6-hash-integration-report.md`  
Minimum evidence:
- a short run log (start → work → stop)
- one induced failure + the system’s response
- a quick metric or timing baseline

## Notes from the original roadmap
### 🔨 Do (180 min)
Integrate hash tool and protocol digest fields into existing stack.
> 🆕 **New constraint:** Protocol versioning for backward compatibility.

### ✅ Prove (40 min)
Run compatibility tests between old/new message formats.

### 📦 Ship
`week-7/day6-hash-integration-report.md`

### 🧠 Self-Check
- [ ] Why version protocol now? · What compatibility break did you avoid? · Which old clients still work?
