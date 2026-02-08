---
id: w05-thread-pool-safe-task-execution-quest
part: w05-thread-pool-safe-task-execution
title: "BOSS FIGHT: Threadpool Benchmark  4h"
order: 6
duration_minutes: 240
prereqs: ["w05-thread-pool-safe-task-execution-d05-quest-graceful-shutdown-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
---

# BOSS FIGHT: Threadpool Benchmark  4h

## Visual Model

![Visual Model](/visuals/w05-thread-pool-safe-task-execution.svg)



## Objective
Integrate the week’s lessons into a single working demo.

## Required constraint
- **Integrate everything from this week; prove it under load/failure.**

## Prove it
Attach evidence for: `week-5/day6-threadpool-benchmark.md`  
Minimum evidence:
- a short run log (start → work → stop)
- one induced failure + the system’s response
- a quick metric or timing baseline

## Notes from the original roadmap
### 📖 Learn (40 min)
**Comparative benchmarking**

Key takeaways:
1. Single-thread baseline
2. Worker-pool scaling curve
3. Diminishing returns

### 🔨 Do (180 min)
Plan benchmark comparing event-loop-only vs event-loop+pool workloads.

> 🆕 **New constraint:** Publish scaling limit and likely bottleneck.

### ✅ Prove (40 min)
Capture throughput and p95 latency for 1/2/4 worker counts.

### 📦 Ship
`week-5/day6-threadpool-benchmark.md`

### 💡 Why This Matters
You need proof that concurrency helps, not just complexity. This day quantifies tradeoffs. It unlocks informed backpressure tuning.

### 🧠 Self-Check
- [ ] Where did scaling flatten?
- [ ] What bottleneck appeared?
- [ ] Which worker count is best and why?
