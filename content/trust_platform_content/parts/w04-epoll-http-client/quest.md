---
id: w04-epoll-http-client-quest
part: w04-epoll-http-client
title: "ARC BOSS: Month 1 Demo  4h 🏆"
order: 6
duration_minutes: 240
prereqs: ["w04-epoll-http-client-d05-quest-end-to-end-trace-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
---

# ARC BOSS: Month 1 Demo  4h 🏆

## Visual Model

![Visual Model](/visuals/w04-epoll-http-client.svg)



## Objective
Integrate the week’s lessons into a single working demo.

## Required constraint
- **Integrate everything from this week; prove it under load/failure.**

## Prove it
Attach evidence for: `month-1-demo/README.md`  
Minimum evidence:
- a short run log (start → work → stop)
- one induced failure + the system’s response
- a quick metric or timing baseline

## Notes from the original roadmap
### 📖 Learn (40 min)
**Month synthesis and gap analysis**

Key takeaways:
1. Architecture map
2. Bottleneck list
3. Reliability debt backlog

### 🔨 Do (180 min)
Build Month 1 integrated demo (CLI + echo server + event loop + HTTP client).

> 🆕 **New constraint:** Demo must include one induced failure and recovery behavior.

### ✅ Prove (40 min)
Capture baseline metrics and demo checklist completion.

### 📦 Ship
`month-1-demo/README.md` + `month-1-demo/diagram.png` + `week-4/day6-month1-report.md`

### 🏆 Achievement Unlocked: **Byte Wrangler**
> *You built a multi-client event-driven server with framing, timeouts, and observability from scratch.*

### 💡 Why This Matters
You close Month 1 with a coherent system, not fragments. Failure demonstration proves you understand behavior under stress. It unlocks concurrency and crypto work with a stable base.

### 🧠 Self-Check
- [ ] Which component is weakest now?
- [ ] What failure did you induce?
- [ ] What metric baseline carries into Month 2?
