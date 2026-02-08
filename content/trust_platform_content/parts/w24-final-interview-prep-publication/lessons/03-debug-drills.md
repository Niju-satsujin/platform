---
id: w24-final-interview-prep-publication-d03-debug-drills
part: w24-final-interview-prep-publication
title: "Debug Drills"
order: 3
duration_minutes: 120
prereqs: ["w24-final-interview-prep-publication-d02-trust-qa"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Debug Drills

## Goal

Design and document 8 debug drill scenarios that simulate realistic distributed system failures, each ending with a measurable confirmation step proving the issue is resolved.

### ✅ Deliverables

1. Eight debug drill scenarios covering different failure modes.
2. Each drill has: symptoms, investigation steps, root cause, fix, and confirmation.
3. A measurable confirmation step for each drill (metric, log, or test).
4. A tool reference sheet listing debug tools and their use cases.
5. A drill difficulty progression from basic (single-node) to advanced (multi-node race conditions).

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Exactly 8 debug drills documented | Count entries |
| 2 | Each drill ends with a measurable confirmation step | Verify confirmation section per drill |
| 3 | Difficulty progression from L1 to L3 | Check difficulty tags |
| 4 | Tool reference covers ≥6 debug tools | Count tools listed |
| 5 | At least one drill involves a multi-node failure | Find distributed scenario |

## What You're Building Today

You are building a structured set of debugging exercises that train your systematic troubleshooting skills. Each drill simulates a failure you might encounter in production or be asked to debug in an interview. The confirmation step ensures you can prove the fix works — not just hope it does.

### ✅ Deliverables

- 8 debug drill documents with full investigation walkthroughs.
- Measurable confirmation for every drill.
- Debug tool reference sheet.

```markdown
## Drill #1: Verify Service Returns 503 Under Load

**Difficulty:** L1 (single service)
**Failure Mode:** Resource exhaustion

**Symptoms:**
- verify-service returns HTTP 503 for ~15% of requests
- CPU at 95% on verify-service pod
- Latency p99 spikes from 180ms to 2400ms

**Investigation Steps:**
1. Check service logs: `journalctl -u verify-service --since "5m ago"`
2. Check CPU: `top -p $(pgrep verify-service)`
3. Profile hot path: `perf record -p $(pgrep verify-service) -g -- sleep 10`
4. Analyze: `perf report` → identify hot function
5. Check thread pool: verify-service uses 4 threads, each doing Ed25519
   verification synchronously

**Root Cause:**
Thread pool exhaustion. 4 threads × 45ms avg verify = max 88 req/s.
Under 100+ req/s load, requests queue → timeout → 503.

**Fix:**
Increase thread pool to 8 threads OR make Ed25519 verify async.
Config: `--worker-threads=8` in verify-service startup.

**Confirmation (measurable):**
- After fix: `wrk -t4 -c100 -d30s http://localhost:8080/verify`
- Expected: 0% 503 errors, p99 < 200ms, CPU < 75%
- Metric: `trust_verify_errors_total{status="503"}` rate drops to 0
```

You **can:**
- Use strace, perf, gdb, tcpdump, and other Linux debugging tools.
- Reference failures from your actual development experience.

You **cannot yet:**
- Inject all failures live (some are documented thought experiments).
- Practice under interview time pressure (pair practice recommended).

## Why This Matters

🔴 **Without debug drills:**
- Debugging is ad-hoc: "I'll just grep the logs and hope" → slow MTTR.
- Interview debugging questions are fumbled — no systematic approach.
- Confirmation is missing — "I think I fixed it" vs. "here's proof."
- You only know the tools you've accidentally encountered.

🟢 **With debug drills:**
- Systematic debugging process: symptoms → hypothesize → investigate → confirm.
- Interview debugging questions get structured, confident answers.
- Every fix ends with measurable confirmation — provable resolution.
- Tool reference ensures you reach for the right tool immediately.

🔗 **Connects:**
- **Week 5** (Server) → network debugging scenarios (tcpdump, strace).
- **Week 10** (Raft) → distributed failure drills (leader crash, split brain).
- **Week 21** (SLOs) → SLO breach is the symptom in many drills.
- **Week 18** (Testing) → test failures as debugging entry points.
- **Day 4** (System design) → debugging is part of the hardening phase.

🧠 **Mental model: "The Scientific Method of Debugging"** — Observe symptoms → form hypothesis → design experiment → test → confirm or revise. Never skip the confirmation step. "I changed something and it seems to work" is not debugging — it's superstition. Measurable confirmation is what makes debugging engineering.

## Visual Model

```
┌────────────────────────────────────────────────────────┐
│           SYSTEMATIC DEBUG WORKFLOW                     │
│                                                         │
│  ┌──────────┐                                           │
│  │ SYMPTOMS │  What's broken? (metrics, logs, errors)   │
│  └────┬─────┘                                           │
│       ▼                                                 │
│  ┌──────────┐                                           │
│  │HYPOTHESIS│  What could cause this? (≥3 options)      │
│  └────┬─────┘                                           │
│       ▼                                                 │
│  ┌──────────┐                                           │
│  │INVESTIG. │  Which tool confirms/refutes hypothesis?  │
│  │          │  strace │ perf │ gdb │ tcpdump │ logs     │
│  └────┬─────┘                                           │
│       ▼                                                 │
│  ┌──────────┐                                           │
│  │ROOT CAUSE│  The actual reason (not the symptom)      │
│  └────┬─────┘                                           │
│       ▼                                                 │
│  ┌──────────┐                                           │
│  │   FIX    │  Targeted change (minimal blast radius)   │
│  └────┬─────┘                                           │
│       ▼                                                 │
│  ┌──────────┐                                           │
│  │ CONFIRM  │  ⚡ MEASURABLE: metric, test, or load    │
│  │ (PROOF!) │  run that PROVES the fix works            │
│  └──────────┘                                           │
│                                                         │
│  DRILL PROGRESSION:                                     │
│  L1: Single-service (CPU, memory, thread pool)          │
│  L2: Two-service (timeout chain, connection pool)       │
│  L3: Distributed (leader election, split brain, clock)  │
└────────────────────────────────────────────────────────┘
```

## Build

File: `week-24/day3-debug-drills.md`

## Do

1. **Design 8 drill scenarios across 3 difficulty levels**
   > 💡 *WHY: Progression builds skill. L1 drills teach tool usage, L2 teaches cross-service reasoning, L3 teaches distributed systems intuition.*
   Plan: 3× L1 (single service), 3× L2 (multi-service), 2× L3 (distributed). Cover: resource exhaustion, network failures, race conditions, clock skew, data corruption.

2. **Write symptoms, investigation steps, and root cause for each**
   > 💡 *WHY: The investigation path is as valuable as the answer. Interviewers want to see your process, not just your conclusion.*
   For each drill: describe what the engineer observes (metrics, errors, logs), then write 4-6 investigation steps using specific tools with exact commands.

3. **Define a measurable confirmation step for every drill**
   > 💡 *WHY: "It seems fixed" is not engineering. A measurable confirmation (metric returns to baseline, load test passes, test suite green) is proof.*
   For each drill, specify: the command to run, the expected output, and the metric/threshold that constitutes "confirmed fixed."

4. **Build the debug tool reference sheet**
   > 💡 *WHY: Under pressure, you'll forget tool flags. A reference sheet lets you focus on the problem, not the syntax.*
   Cover: strace (syscall tracing), perf (CPU profiling), gdb (core dumps), tcpdump (network), journalctl (logs), ss (sockets), lsof (file descriptors), valgrind (memory). For each: one-line description, primary use case, and key flags.

5. **Create a drill execution guide for self-practice**
   > 💡 *WHY: Drills are only valuable if you practice them. A guide with timing targets and self-scoring makes practice structured.*
   For each drill, set a time target (L1: 10 min, L2: 15 min, L3: 20 min). Score: full marks if root cause found within time, partial if found with hints, retry if not found. Track your scores over multiple practice sessions to see improvement. Include a "hint system" for each drill: if stuck for 5 minutes, reveal Hint 1 (which tool to use), if stuck for 10 minutes, reveal Hint 2 (where to look), ensuring you learn even when stuck.

## Done when

- [ ] 8 debug drills with symptoms, investigation, root cause, fix, and confirmation — *complete debugging curriculum*
- [ ] Every drill has a measurable confirmation step — *provable resolution*
- [ ] Difficulty progression from L1 to L3 — *builds skill systematically*
- [ ] Tool reference covers ≥6 Linux debugging tools — *quick lookup during practice*
- [ ] Document committed to `week-24/day3-debug-drills.md` — *practiced before final demo*

## Proof

Upload or paste your debug drills document and tool reference sheet.

**Quick self-test:**

Q: Why must every debug drill end with a measurable confirmation?
**A: Because without measurement, "I fixed it" is an assumption, not a fact. Measurable confirmation (metric, test, load run) is the difference between debugging and guessing.**

Q: What is the debugging scientific method?
**A: Observe symptoms → form hypothesis → investigate with tools → identify root cause → apply fix → confirm with measurement. Never skip the last step.**

Q: Why include multi-node drills (L3)?
**A: Because distributed failures (split brain, clock skew, partial partitions) are qualitatively different from single-node issues. They require reasoning about state across multiple machines.**
