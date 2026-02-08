---
id: w08-signatures-replay-protection-quest
part: w08-signatures-replay-protection
title: "ARC BOSS: Signed Protocol Demo  4h 🏆"
order: 6
duration_minutes: 240
prereqs: ["w08-signatures-replay-protection-d05-quest-verify-performance-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
---

# ARC BOSS: Signed Protocol Demo  4h 🏆

## Visual Model

![Visual Model](/visuals/w08-signatures-replay-protection.svg)



## Objective
Integrate the week’s lessons into a single working demo.

## Required constraint
- **Integrate everything from this week; prove it under load/failure.**

## Prove it
Attach evidence for: `month-2-demo/README.md`  
Minimum evidence:
- a short run log (start → work → stop)
- one induced failure + the system’s response
- a quick metric or timing baseline

## Notes from the original roadmap
### 🔨 Do (180 min)
Build integrated signed protocol demo (client-server).
> 🆕 **New constraint:** Full request path enforces signature + replay + timeout.

### ✅ Prove (40 min)
Capture pass/fail evidence for valid, tampered, replayed, and expired requests.

### 📦 Ship
`month-2-demo/README.md` + `week-8/day6-signed-protocol-report.md`

### 🏆 Achievement Unlocked: **Trust Forger**
> *You built a signed, replay-protected network protocol with overload controls.*

### 🧠 Self-Check
- [ ] Which attacks are now blocked? · What still is NOT covered? · Which log proves replay defense worked?
