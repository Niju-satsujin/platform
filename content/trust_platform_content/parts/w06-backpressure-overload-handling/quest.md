---
id: w06-backpressure-overload-handling-quest
part: w06-backpressure-overload-handling
title: "BOSS FIGHT: Backpressure Report  4h"
order: 6
duration_minutes: 240
prereqs: ["w06-backpressure-overload-handling-d05-quest-failure-injection-matrix-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
---

# BOSS FIGHT: Backpressure Report  4h

## Visual Model

![Visual Model](/visuals/w06-backpressure-overload-handling.svg)



## Objective
Integrate the week’s lessons into a single working demo.

## Required constraint
- **Integrate everything from this week; prove it under load/failure.**

## Prove it
Attach evidence for: `week-6/day6-backpressure-report.md`  
Minimum evidence:
- a short run log (start → work → stop)
- one induced failure + the system’s response
- a quick metric or timing baseline

## Notes from the original roadmap
### 🔨 Do (180 min)
Run overload experiments and finalize backpressure thresholds.
> 🆕 **New constraint:** Maintain defined error-rate cap under target load.

### ✅ Prove (40 min)
Publish throughput/latency/error chart for normal vs overload.

### 📦 Ship
`week-6/day6-backpressure-report.md`

### 🧠 Self-Check
- [ ] Which threshold is most sensitive? · Did error-rate cap hold? · What tradeoff did you accept?
