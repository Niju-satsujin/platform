---
id: w23-docs-demos-interview-narratives-d04-video-storyboard
part: w23-docs-demos-interview-narratives
title: "Video Storyboard"
order: 4
duration_minutes: 120
prereqs: ["w23-docs-demos-interview-narratives-d03-demo-script"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Video Storyboard

## Goal

Create a video storyboard that translates your demo script into a visual narrative where every technical claim is shown with on-screen evidence, suitable for a 3-5 minute portfolio video.

### ✅ Deliverables

1. A storyboard document with shot-by-shot frames, narration, and on-screen content.
2. An evidence mapping table linking each claim to its on-screen proof.
3. A title card and outro design with key stats.
4. A recording checklist covering screen layout, audio, and resolution.
5. An editing plan with transitions, callouts, and timing.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Storyboard has ≥10 frames covering all demo segments | Count frames |
| 2 | Each claim shown with on-screen evidence | Verify evidence mapping table |
| 3 | Video duration planned for 3-5 minutes | Sum frame durations |
| 4 | Title card includes project name, tech stack, and key metric | Check title frame |
| 5 | Recording checklist has ≥6 items | Count checklist items |

## What You're Building Today

You are translating your Day 3 demo script into a visual medium. The video storyboard ensures every frame has a purpose, every claim has on-screen evidence, and the final recording can be edited efficiently.

### ✅ Deliverables

- Shot-by-shot storyboard with narration.
- Evidence mapping table.
- Recording and editing plan.

```markdown
## Storyboard — Trust Platform Demo Video (4 min)

### Frame 1: Title Card (5s)
**Visual:** Dark background, project name centered
**Text:** "Trust Platform — Distributed Verification System"
**Subtext:** "C++ | Linux | Raft Consensus | Ed25519 | SLO-Driven"

### Frame 2: Architecture Overview (20s)
**Visual:** Architecture diagram (DIAG-01) with animated highlight
**Narration:** "This is a distributed trust platform with 4 components..."
**Evidence:** Diagram shows all components from Week 1-20 work

### Frame 3: Live Verify Request (30s)
**Visual:** Terminal showing curl command and JSON response
**Narration:** "Watch a signature verification complete in under 200ms..."
**Evidence:** Response shows latency <200ms and valid attestation ID
**Callout:** Highlight the response time with a yellow box

### Frame 4: Kill Raft Leader (45s)
**Visual:** Split screen — terminal + Grafana dashboard
**Narration:** "Now I kill the consensus leader..."
**Evidence:** Dashboard shows leader change, no SLO breach
**Callout:** Arrow pointing to new leader in dashboard

### Frame 5: Recovery Confirmation (20s)
**Visual:** Terminal re-running verify, dashboard stable
**Narration:** "The system recovered in under 5 seconds..."
**Evidence:** Successful verify response + dashboard green
```

You **can:**
- Use OBS, Loom, or asciinema for recording.
- Plan animated callouts and zoom effects in the editing plan.
- Include picture-in-picture for simultaneous terminal + dashboard views.
- Use chapter markers for easy navigation in the final video.

You **cannot yet:**
- Record the final video (storyboard first, record in Week 24).
- Add music or final polish (editing plan covers this).
- Create animated transitions (plan them in the storyboard, implement in editing).

## Why This Matters

🔴 **Without a storyboard:**
- Recordings meander — no clear narrative arc.
- Claims are stated but not shown — "trust me" instead of "watch this."
- Editing takes 5× longer because you didn't plan transitions.
- The video feels amateur — disconnecting claims from evidence.

🟢 **With a storyboard:**
- Every frame serves the narrative — no filler, no tangents.
- Claims are visually proven — on-screen evidence builds credibility.
- Recording is efficient — you know exactly what to capture.
- Editing follows a plan — callouts, transitions, and timing are predefined.

🔗 **Connects:**
- **Day 3** (Demo script) → storyboard visualizes the demo flow.
- **Day 1** (Architecture diagram) → diagram appears in Frame 2.
- **Week 21** (Dashboard) → Grafana dashboard visible during failure segment.
- **Day 2** (README) → video linked from README.
- **Week 24** (Final demo) → video is the polished version of the rehearsal.

🧠 **Mental model: "Show, Don't Tell"** — In a portfolio video, every claim must be accompanied by on-screen evidence. "99.9% availability" means nothing unless you show the SLO dashboard. "Fault-tolerant" means nothing unless you kill a node and show recovery. The evidence mapping table enforces this discipline.

## Visual Model

```
┌────────────────────────────────────────────────────────┐
│              VIDEO STORYBOARD FLOW                      │
│                                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │Frame │  │Frame │  │Frame │  │Frame │  │Frame │     │
│  │  1   │  │  2   │  │  3   │  │  4   │  │  5   │     │
│  │Title │──│Arch. │──│Verify│──│KILL  │──│Recov.│     │
│  │ Card │  │ Diag │  │ Demo │  │LEADER│  │ Demo │     │
│  │ 5s   │  │ 20s  │  │ 30s  │  │ 45s  │  │ 20s  │     │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘     │
│       │         │         │         │         │         │
│       ▼         ▼         ▼         ▼         ▼         │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │Frame │  │Frame │  │Frame │  │Frame │  │Frame │     │
│  │  6   │  │  7   │  │  8   │  │  9   │  │  10  │     │
│  │SLO   │──│Secur.│──│Metrics│──│Stats │──│Outro │     │
│  │ Dash │  │ Scan │  │Design│  │ Card │  │ CTA  │     │
│  │ 30s  │  │ 20s  │  │ 20s  │  │ 10s  │  │ 10s  │     │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘     │
│                                                         │
│  EVIDENCE MAPPING:                                      │
│  Claim "p99 < 200ms"    → Frame 3: curl response time  │
│  Claim "fault tolerant"  → Frame 4: leader kill+recover │
│  Claim "99.9% SLO"      → Frame 6: Grafana dashboard   │
│  Claim "zero secrets"    → Frame 7: gitleaks scan pass  │
└────────────────────────────────────────────────────────┘
```

## Build

File: `week-23/day4-video-storyboard.md`

## Do

1. **Break the demo into 10-12 visual frames**
   > 💡 *WHY: Frames are the atoms of video editing. Each frame has one purpose — show one thing, prove one claim.*
   Convert your Day 3 demo segments into individual frames. Each frame gets: visual content, narration text, duration, and evidence reference.

2. **Create the evidence mapping table**
   > 💡 *WHY: This table enforces the "show, don't tell" principle. If a claim has no on-screen evidence, either add evidence or cut the claim.*
   List every technical claim in your narration. For each, specify which frame shows the evidence and what on-screen element proves it. Evidence types include: terminal output showing a specific value, dashboard panel showing a metric, code snippet on screen, or side-by-side comparison (before/after). If a claim cannot be evidenced visually, rewrite the narration to make a different claim that can be proven on screen. The evidence mapping is also your editing checklist — during editing, verify each claim has its corresponding visual proof visible in the frame.

3. **Design the title card and stats card**
   > 💡 *WHY: First and last impressions matter most. The title card sets expectations; the stats card leaves a memorable summary.*
   Title card: project name, tech stack, one-line description. Stats card: key numbers (p99 latency, SLO compliance, test count, code lines).

4. **Plan callouts, transitions, and timing**
   > 💡 *WHY: Raw screen recordings are boring. Callouts (arrows, highlights, zoom) direct attention to the evidence that proves your claims.*
   For each frame, note any callout (highlight response time, arrow to leader node, zoom on dashboard panel). Plan transitions between frames (cut, fade, zoom).

5. **Create the recording checklist**
   > 💡 *WHY: Bad recordings waste re-recording time. A checklist ensures resolution, audio, font size, and terminal layout are correct before pressing record.*
   Include: screen resolution (1920×1080), font size (16+), terminal theme (dark), audio levels tested, browser zoom, Grafana in kiosk mode, OBS configured.

## Done when

- [ ] Storyboard has ≥10 frames with narration, visual, and duration — *complete video blueprint*
- [ ] Evidence mapping links every claim to on-screen proof — *credible portfolio video*
- [ ] Title and stats cards designed — *professional opening and closing*
- [ ] Recording checklist has ≥6 items — *prevents re-recording*
- [ ] Document committed to `week-23/day4-video-storyboard.md` — *input to Week 24 final recording*

## Proof

Upload or paste your storyboard, evidence mapping table, and recording checklist.

**Quick self-test:**

Q: Why is the evidence mapping table critical?
**A: It enforces "show, don't tell." Every claim in the narration must have corresponding on-screen proof, or it's just an unverifiable assertion.**

Q: What makes a title card effective?
**A: It communicates project name, tech stack, and key differentiator in <5 seconds. The viewer should know what they're about to see before the demo starts.**

Q: Why plan callouts in the storyboard?
**A: Because viewers don't know where to look on a busy terminal screen. Callouts (arrows, highlights) direct attention to the exact evidence that proves your claim.**
