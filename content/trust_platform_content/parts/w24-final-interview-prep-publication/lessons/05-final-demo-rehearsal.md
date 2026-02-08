---
id: w24-final-interview-prep-publication-d05-final-demo-scorecard
part: w24-final-interview-prep-publication
title: "Final Demo Scorecard"
order: 5
duration_minutes: 120
prereqs: ["w24-final-interview-prep-publication-d04-system-design-walkthrough"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Final Demo Scorecard

## Goal

Execute a complete final demo rehearsal within your target time, including one intentional failure drill, and score yourself against a rubric covering technical depth, communication clarity, and recovery handling.

### ✅ Deliverables

1. A demo scorecard rubric with ≥10 scoring criteria across 3 categories.
2. A timed rehearsal log recording actual segment durations vs. targets.
3. A self-score with evidence for each rubric criterion.
4. A failure drill execution report with timing and recovery metrics.
5. An improvement action list for final polish before the real demo.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Demo completed within target time (10-15 min) | Check total time in rehearsal log |
| 2 | Intentional failure drill executed with recovery | Verify failure segment in log |
| 3 | Self-score covers all rubric criteria | Verify all rows scored |
| 4 | Recovery confirmed with measurable metric | Check metric in failure report |
| 5 | Improvement action list has ≥5 concrete items | Count action items |

## What You're Building Today

You are running the final dress rehearsal of your distributed trust platform demo. This is where preparation meets execution. The scorecard ensures you objectively evaluate your performance and identify specific improvements before the real presentation.

### ✅ Deliverables

- Completed scorecard with rubric scores.
- Timed rehearsal log.
- Improvement action list.

```markdown
## Demo Scorecard Rubric

### Category 1: Technical Depth (40 points)
| # | Criterion                                    | Max | Score | Evidence          |
|---|----------------------------------------------|-----|-------|-------------------|
| 1 | Architecture explanation covers all components| 5   |       |                   |
| 2 | Live verify request succeeds on first attempt | 5   |       |                   |
| 3 | Failure drill: system recovers within 10s     | 10  |       | recovery_time:    |
| 4 | SLO dashboard shows correct data              | 5   |       |                   |
| 5 | Explains one tradeoff with alternatives        | 5   |       |                   |
| 6 | Capacity numbers cited from memory             | 5   |       |                   |
| 7 | Security claim backed by on-screen evidence    | 5   |       |                   |

### Category 2: Communication (30 points)
| # | Criterion                                    | Max | Score | Evidence          |
|---|----------------------------------------------|-----|-------|-------------------|
| 1 | Opening hook delivered in <30 seconds         | 5   |       |                   |
| 2 | No filler words ("um", "uh") in key segments  | 5   |       |                   |
| 3 | Each segment transitions smoothly              | 5   |       |                   |
| 4 | Technical terms defined before use             | 5   |       |                   |
| 5 | Q&A answers are concise (<60 seconds each)    | 5   |       |                   |
| 6 | Closing summary references key metrics         | 5   |       |                   |

### Category 3: Execution (30 points)
| # | Criterion                                    | Max | Score | Evidence          |
|---|----------------------------------------------|-----|-------|-------------------|
| 1 | Total time within target (10-15 min)          | 10  |       | actual_time:      |
| 2 | All terminal commands execute successfully     | 5   |       |                   |
| 3 | No environment failures requiring debug        | 5   |       |                   |
| 4 | Pre-demo checklist completed before start      | 5   |       |                   |
| 5 | Backup plan used effectively (if needed)       | 5   |       |                   |

## Rehearsal Log

| Segment                   | Target  | Actual | Delta  | Notes              |
|---------------------------|---------|--------|--------|--------------------|
| 1. Architecture overview  | 2:00    |        |        |                    |
| 2. Live verification      | 2:00    |        |        |                    |
| 3. Failure + recovery     | 3:00    |        |        |                    |
| 4. SLO dashboard          | 2:00    |        |        |                    |
| 5. Q&A                    | 3:00    |        |        |                    |
| TOTAL                     | 12:00   |        |        |                    |
```

You **can:**
- Record the rehearsal for self-review.
- Run multiple rehearsals and compare scores.

You **cannot yet:**
- Get external feedback (find a practice partner after self-scoring).
- Guarantee real interview conditions (but you can simulate them).

## Why This Matters

🔴 **Without a scored rehearsal:**
- You think you're ready but discover problems during the real demo.
- Timing is off — you rush the important parts and drag the simple ones.
- The failure drill panics you because you haven't practiced it.
- No objective self-assessment — "I think it went okay" isn't actionable.

🟢 **With a scored rehearsal:**
- Objective rubric identifies exactly which areas need improvement.
- Timed rehearsal log reveals pacing issues before they matter.
- Failure drill is practiced and predictable — no surprises.
- Improvement action list gives you concrete next steps.

🔗 **Connects:**
- **Week 23 Day 3** (Demo script) → script is the input to rehearsal.
- **Week 23 Day 4** (Storyboard) → visual plan guides what to show.
- **Week 23 Day 5** (Stories) → Q&A segment uses story bank.
- **Day 1-2** (Q&A prep) → Q&A answers rehearsed under time pressure.
- **Day 3** (Debug drills) → failure segment uses debug methodology.

🧠 **Mental model: "Rehearsal is Free Failure"** — Every mistake you make in rehearsal is a mistake you won't make in the real demo. The scorecard makes failure productive by turning it into a learning signal. A bad rehearsal with a good action list is more valuable than a good rehearsal with no reflection.

## Visual Model

```
┌────────────────────────────────────────────────────────┐
│             FINAL DEMO REHEARSAL FLOW                   │
│                                                         │
│  ┌──────────┐                                           │
│  │PRE-DEMO  │  Checklist: services, data, terminals,    │
│  │CHECKLIST │  dashboard, recording, timer              │
│  └────┬─────┘                                           │
│       ▼                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐          │
│  │Seg 1:    │─▶│Seg 2:    │─▶│Seg 3:        │          │
│  │Overview  │  │Verify    │  │KILL LEADER   │          │
│  │(2 min)   │  │(2 min)   │  │+ RECOVERY    │          │
│  └──────────┘  └──────────┘  │(3 min)       │          │
│                              └──────┬───────┘          │
│                                     ▼                   │
│  ┌──────────┐  ┌──────────┐                             │
│  │Seg 5:    │◀─│Seg 4:    │  Timer running ──▶          │
│  │Q&A       │  │Dashboard │                             │
│  │(3 min)   │  │(2 min)   │                             │
│  └────┬─────┘  └──────────┘                             │
│       ▼                                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │           SCORECARD ASSESSMENT                   │   │
│  │                                                  │   │
│  │  Technical: __/40   Comms: __/30   Exec: __/30  │   │
│  │  TOTAL: __/100                                   │   │
│  │                                                  │   │
│  │  Target: ≥75 to pass, ≥90 for excellence         │   │
│  └──────────────────────────────────────────────────┘   │
│       ▼                                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │           IMPROVEMENT ACTIONS                    │   │
│  │  1. _____________________________________        │   │
│  │  2. _____________________________________        │   │
│  │  3. _____________________________________        │   │
│  │  4. _____________________________________        │   │
│  │  5. _____________________________________        │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

## Build

File: `week-24/day5-final-demo-scorecard.md`

## Do

1. **Complete the pre-demo checklist**
   > 💡 *WHY: The checklist is your launch sequence. Skipping it means risking preventable failures during rehearsal. Treat it like a pilot's pre-flight.*
   Walk through every item from your Week 23 Day 3 checklist. Verify services are running, test data is loaded, terminals are arranged, and the timer is visible.

2. **Run the full demo with a timer**
   > 💡 *WHY: Time pressure reveals the parts where you hesitate, fumble, or over-explain. The timer log shows exactly where to tighten.*
   Start the timer. Execute each segment following the Day 3 script. Record actual time for each segment. Do NOT pause to fix issues — note them and continue.

3. **Execute the intentional failure drill**
   > 💡 *WHY: This is the showpiece moment. You need to practice it until killing a node and watching recovery feels routine, not stressful.*
   Kill the Raft leader (or simulate the planned failure). Time the recovery. Verify with a metric that the system has recovered (e.g., verify request succeeds, SLO dashboard returns to green).

4. **Score yourself against the rubric**
   > 💡 *WHY: Self-scoring with a rubric prevents self-deception. You must provide evidence for each score — not just "I think I did well."*
   For each rubric criterion, assign a score and write one sentence of evidence. Be honest — a low score today is an improvement opportunity, not a failure.

5. **Create the improvement action list**
   > 💡 *WHY: The action list converts a rehearsal into preparation. Without it, you'll make the same mistakes next time.*
   List ≥5 specific, actionable improvements: "Reduce overview segment by 30s by cutting the deployment topology detail" is good. "Be better" is not.

## Done when

- [ ] Demo completed within 10-15 minutes with timer log — *proves pacing works*
- [ ] Failure drill executed with measurable recovery confirmation — *showpiece practiced*
- [ ] Self-score completed for all rubric criteria with evidence — *objective assessment*
- [ ] Score ≥75/100 or clear action plan to reach it — *demo readiness verified*
- [ ] Document committed to `week-24/day5-final-demo-scorecard.md` — *capstone of the 24-week curriculum*

## Proof

Upload or paste your completed scorecard, rehearsal log, and improvement action list.

**Quick self-test:**

Q: Why run the failure drill during rehearsal?
**A: Because the failure segment is the most impressive — and most stressful — part of the demo. Practicing it until recovery is routine removes anxiety and ensures smooth execution.**

Q: What makes a good improvement action item?
**A: It's specific, measurable, and actionable. "Cut overview segment by 30 seconds by removing deployment topology" is good. "Improve presentation" is useless.**

Q: What score target should you aim for?
**A: ≥75/100 is passing (demo-ready). ≥90/100 is excellent. Below 75 means run another rehearsal after implementing your action items.**
