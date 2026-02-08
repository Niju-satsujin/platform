---
id: w03-multi-client-event-loop-quest
part: w03-multi-client-event-loop
title: "BOSS FIGHT: 30-Min Soak Test  4h"
order: 6
duration_minutes: 240
prereqs: ["w03-multi-client-event-loop-d05-quest-connection-lifecycle-tests-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
---

# BOSS FIGHT: 30-Min Soak Test  4h

## Visual Model

![Visual Model](/visuals/w03-multi-client-event-loop.svg)



## Objective
Integrate the week’s lessons into a single working demo.

## Required constraint
- **Integrate everything from this week; prove it under load/failure.**

## Prove it
Attach evidence for: `week-3/day6-soak-report.md`  
Minimum evidence:
- a short run log (start → work → stop)
- one induced failure + the system’s response
- a quick metric or timing baseline

## Notes from the original roadmap
### 📖 Learn (40 min)
**Load-testing basics**

Key takeaways:
1. Throughput vs latency
2. Percentile thinking
3. Bottleneck classification

### 🔨 Do (180 min)
Plan and run multi-client soak test design.

> 🆕 **New constraint:** Maintain service correctness for 30 minutes under sustained load.

### ✅ Prove (40 min)
Collect p50/p95 latency and error rate over time.

### 📦 Ship
`week-3/day6-soak-report.md`

### 💡 Why This Matters
This is first endurance check. It reveals memory and lifecycle faults hidden in short tests. It unlocks confidence before adding HTTP behavior.

### 🧠 Self-Check
- [ ] Which latency percentile matters most here?
- [ ] What failure appeared first?
- [ ] What metric suggests memory/resource issues?
