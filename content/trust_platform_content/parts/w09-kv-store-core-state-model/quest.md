---
id: w09-kv-store-core-state-model-quest
part: w09-kv-store-core-state-model
title: "BOSS FIGHT: KV + Signed Integration  4h"
order: 6
duration_minutes: 240
prereqs: ["w09-kv-store-core-state-model-d05-quest-kv-concurrency-policy-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
---

# BOSS FIGHT: KV + Signed Integration  4h

## Visual Model

![Visual Model](/visuals/w09-kv-store-core-state-model.svg)



## Objective
Integrate the week’s lessons into a single working demo.

## Required constraint
- **Integrate everything from this week; prove it under load/failure.**

## Prove it
Attach evidence for: `week-9/quest-report.md`  
Minimum evidence:
- a short run log (start → work → stop)
- one induced failure + the system’s response
- a quick metric or timing baseline

## Notes from the original roadmap
### 🔨 Do — Compose signed request handling with KV command execution. **Constraint:** Reject unsigned state-changing commands.
### ✅ Prove — End-to-end signed `put/get/delete` scenario evidence.
### 📦 Ship — `week-9/day6-kv-signed-integration.md`
### 🧠 Self-Check
- [ ] Which commands require signature? · How is request ID propagated? · What evidence proves integration works?
