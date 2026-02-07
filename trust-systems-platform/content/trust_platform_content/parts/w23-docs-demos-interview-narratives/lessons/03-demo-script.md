---
id: w23-docs-demos-interview-narratives-d03-demo-script
part: w23-docs-demos-interview-narratives
title: "Demo Script"
order: 3
duration_minutes: 120
prereqs: ["w23-docs-demos-interview-narratives-d02-readme-outline"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Demo Script

## Goal

Write a complete demo script that showcases your distributed trust platform in a timed presentation format, including one planned failure and recovery segment that demonstrates resilience engineering.

### ✅ Deliverables

1. A timed demo script with speaker notes and terminal commands for each segment.
2. A planned failure+recovery segment demonstrating system resilience.
3. A pre-demo checklist ensuring environment readiness.
4. Backup plans for each segment if something goes wrong.
5. A Q&A preparation sheet with expected questions and answers.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Demo script has ≥5 timed segments totaling 10-15 minutes | Sum segment durations |
| 2 | One segment includes planned failure + recovery | Find failure segment |
| 3 | Every segment has exact terminal commands | Check command column |
| 4 | Pre-demo checklist has ≥8 items | Count checklist items |
| 5 | Q&A sheet covers ≥10 expected questions | Count Q&A entries |

## What You're Building Today

You are scripting a live technical demonstration that proves your system works, breaks gracefully, and recovers automatically. The demo is your highest-impact portfolio artifact — it converts "I built this" into "watch it work."

### ✅ Deliverables

- Complete demo script with timing and commands.
- Failure/recovery segment design.
- Pre-demo checklist.

```markdown
## Demo Script — Trust Platform Live Demo (12 min)

### Segment 1: System Overview (2 min)
**Speaker notes:** "This is a distributed trust verification platform..."
**Visual:** Show architecture diagram (DIAG-01)
**Action:** Point to each component while explaining the data flow

### Segment 2: Live Verification (2 min)
**Speaker notes:** "Let's verify a signature end-to-end..."
**Terminal:**
```bash
# Submit a verification request
curl -X POST http://localhost:8080/verify \
  -H "Content-Type: application/json" \
  -d '{"payload": "hello", "signature": "<sig>", "pubkey": "<key>"}'
# Expected: {"status": "verified", "attestation_id": "att-001"}
```

### Segment 3: Planned Failure — Kill Raft Leader (3 min)
**Speaker notes:** "Now let's see what happens when the leader dies..."
**Terminal:**
```bash
# Identify and kill the Raft leader
./scripts/kill-leader.sh
# Show: system elects new leader within 5s
# Re-run verification — still works!
curl -X POST http://localhost:8080/verify ...
```
**Recovery:** New leader elected, verify still succeeds
```

You **can:**
- Use tmux with multiple panes for impressive terminal layouts.
- Pre-stage data that makes the demo more visual (colorized output).

You **cannot yet:**
- Record the video (that's Day 4 storyboard).
- Rehearse to final timing (that's Week 24 Day 5).

## Why This Matters

🔴 **Without a demo script:**
- Live demos are improvised → you forget steps, fumble commands, lose time.
- No failure segment → you only show the happy path (unimpressive).
- Environment breaks during demo → no backup plan, demo fails publicly.
- Q&A catches you off guard with questions you should have anticipated.

🟢 **With a demo script:**
- Every second is accounted for — smooth, professional delivery.
- Planned failure segment demonstrates real engineering depth.
- Pre-demo checklist prevents environment-related failures.
- Q&A prep turns hard questions into confident answers.

🔗 **Connects:**
- **Day 1** (Architecture diagram) → shown in overview segment.
- **Day 2** (README) → demo follows the quickstart flow.
- **Week 10** (Raft) → failure segment kills Raft leader.
- **Week 21** (SLOs) → show dashboard during recovery.
- **Day 4** (Video) → demo script becomes video content.

🧠 **Mental model: "The Demo Paradox"** — The best demos look effortless but are meticulously scripted. Every "spontaneous" moment is planned. The failure segment isn't a risk — it's the highlight. Showing your system break and recover is more impressive than showing it never break.

## Visual Model

```
┌────────────────────────────────────────────────────────┐
│              DEMO FLOW TIMELINE                         │
│                                                         │
│  0:00    2:00    4:00    6:00    9:00    12:00          │
│  │       │       │       │       │       │              │
│  ▼       ▼       ▼       ▼       ▼       ▼              │
│  ┌───┐   ┌───┐   ┌──────────┐   ┌───┐   ┌───┐         │
│  │ 1 │   │ 2 │   │    3     │   │ 4 │   │ 5 │         │
│  │Ovr│   │Ver│   │ FAILURE  │   │SLO│   │Q&A│         │
│  │   │   │ify│   │+RECOVERY │   │   │   │   │         │
│  └───┘   └───┘   └──────────┘   └───┘   └───┘         │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  PRE-DEMO CHECKLIST                              │   │
│  │  □ Services running    □ Test data loaded        │   │
│  │  □ Terminals arranged  □ Dashboard open          │   │
│  │  □ Backup slides ready □ Timer visible           │   │
│  │  □ Network verified    □ Recording software on   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  BACKUP PLAN (if segment fails)                  │   │
│  │  Seg 1: Switch to pre-recorded clip              │   │
│  │  Seg 2: Use cached response + explain            │   │
│  │  Seg 3: Show logs from previous failure test     │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

## Build

File: `week-23/day3-demo-script.md`

## Do

1. **Outline demo segments with time budgets**
   > 💡 *WHY: A demo without a time budget runs long. Budget each segment tight — you'll always take longer than planned.*
   Plan 5 segments totaling 10-12 minutes. Leave 2-3 minutes for Q&A buffer. The failure segment gets the most time (3 min) because it's the showpiece.

2. **Write exact terminal commands for each segment**
   > 💡 *WHY: Typing commands live is error-prone. Pre-written commands can be copy-pasted or aliased. The audience sees results, not your typing speed.*
   For each segment, write the exact command(s) to run, the expected output, and what to say while waiting for output.

3. **Design the planned failure and recovery segment**
   > 💡 *WHY: This is the most impressive part of your demo. Killing a Raft leader and watching the system recover demonstrates real distributed systems engineering.*
   Script: identify the leader, kill the process, show election happening, re-run verify, show it succeeds. Point to the dashboard showing the SLO held.

4. **Create the pre-demo checklist**
   > 💡 *WHY: Demo failures are almost always environment failures. A checklist prevents "works on my machine" moments.*
   List ≥8 items: services running, test data loaded, terminals arranged, dashboard open, network working, recording started, timer visible, backup slides ready.

5. **Prepare Q&A with ≥10 expected questions**
   > 💡 *WHY: The best Q&A answers are prepared. Anticipate questions about scalability, security, trade-offs, and "why not use X?" alternatives.*
   For each question, write a 2-3 sentence answer that references specific project decisions and metrics. Common categories: "How does this scale?" (reference capacity plan), "What about security?" (reference threat model), "Why C++ instead of Go/Rust?" (systems control, zero-cost abstractions), "What would you do differently?" (show growth mindset with specific alternatives). Practice bridging from the question back to your project's strengths.

## Done when

- [ ] Demo script has ≥5 timed segments totaling 10-15 minutes — *rehearsable and repeatable*
- [ ] Failure+recovery segment scripted with exact commands — *showpiece ready*
- [ ] Pre-demo checklist has ≥8 items — *prevents environment failures*
- [ ] Q&A sheet covers ≥10 expected questions — *confident under pressure*
- [ ] Document committed to `week-23/day3-demo-script.md` — *input to Day 4 video storyboard*

## Proof

Upload or paste your demo script, checklist, and Q&A sheet.

**Quick self-test:**

Q: Why is the failure segment the highlight of the demo?
**A: Because anyone can show a system working. Showing it break and recover demonstrates real engineering — fault tolerance, consensus, and SLO resilience.**

Q: Why write exact commands instead of typing live?
**A: Live typing is slow and error-prone. Pre-written commands ensure the demo flows smoothly and the audience focuses on results, not keystrokes.**

Q: What should the pre-demo checklist prevent?
**A: Environment-related failures — services not running, stale data, network issues, missing tools — the things that ruin demos but have nothing to do with your code quality.**
