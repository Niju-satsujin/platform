---
id: w23-docs-demos-interview-narratives-d01-architecture-diagram-plan
part: w23-docs-demos-interview-narratives
title: "Architecture Diagram Plan"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Architecture Diagram Plan

## Goal

Create an architecture diagram plan that maps every trust guarantee to a visible diagram element, producing a set of layered diagrams suitable for documentation, demos, and interview whiteboard sessions.

### ✅ Deliverables

1. A diagram inventory listing each diagram, its audience, and its purpose.
2. A component-level architecture diagram showing all services and data flows.
3. A trust-boundary overlay diagram highlighting security perimeters.
4. A sequence diagram for the critical verify→attest path.
5. A diagram style guide ensuring visual consistency across all diagrams.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Every trust guarantee maps to ≥1 diagram element | Cross-reference guarantees list |
| 2 | ≥3 distinct diagrams planned (component, trust, sequence) | Count diagram specs |
| 3 | Each diagram has defined audience (eng/exec/interviewer) | Check audience field |
| 4 | Style guide defines colors, shapes, and line semantics | Review style section |
| 5 | Verify→attest sequence diagram has ≥8 steps | Count sequence steps |

## What You're Building Today

You are planning the visual communication layer for your entire project. These diagrams will appear in your README, demo slides, video storyboard, and interview whiteboard sessions. Getting the plan right means consistent, accurate visuals everywhere.

### ✅ Deliverables

- Diagram inventory and audience mapping.
- Draft architecture diagram in ASCII/Mermaid format.
- Style guide document.

```markdown
## Diagram Inventory

| Diagram ID | Name                      | Audience       | Purpose                           | Format     |
|------------|---------------------------|----------------|-----------------------------------|------------|
| DIAG-01    | System Architecture       | Engineers       | Full component + data flow view   | Mermaid    |
| DIAG-02    | Trust Boundary Map        | Security review | Trust perimeters + threat zones   | Draw.io    |
| DIAG-03    | Verify-Attest Sequence    | Interviewers   | Critical path walkthrough         | Mermaid seq|
| DIAG-04    | Deployment Topology       | Ops/SRE        | Node placement + network layout   | ASCII      |
| DIAG-05    | Data Flow (PII)           | Compliance      | Where sensitive data lives/moves  | Draw.io    |

## Style Guide
- Services: rounded rectangles, blue fill (#4A90D9)
- Data stores: cylinders, green fill (#7BC67E)
- Trust boundaries: dashed red lines (#E74C3C)
- Data flow: solid arrows with labels
- External actors: stick figures or cloud shapes
- Font: monospace for technical, sans-serif for labels
- Line thickness: 2px for data flow, 1px for boundaries
- Arrow style: filled head for data flow, open head for control flow
```

```markdown
## Diagram Naming Convention

All diagrams follow the naming pattern: `DIAG-{NN}-{short-name}.{format}`

Examples:
- DIAG-01-system-architecture.mmd
- DIAG-02-trust-boundary-map.drawio
- DIAG-03-verify-attest-sequence.mmd
- DIAG-04-deployment-topology.txt
- DIAG-05-pii-data-flow.drawio

Store all diagrams in `docs/diagrams/` with source files alongside rendered PNGs.
Commit both source and rendered versions for reviewability.
```

You **can:**
- Use Mermaid, Draw.io, ASCII, or PlantUML — choose the best tool per diagram.
- Reference architecture from all 20 previous weeks.
- Use the C4 model for layering guidance (Context → Container → Component → Code).
- Color-code trust domains and data sensitivity levels.
- Create multiple views at different zoom levels for different audiences.

You **cannot yet:**
- Create final polished diagrams (plan first, render in Day 4 storyboard).
- Record the demo walkthrough (that's Day 3).
- Include animated or interactive diagram elements (static-first for portfolio).
- Diagram systems you haven't built (only document what exists in your project).

## Why This Matters

🔴 **Without an architecture diagram plan:**
- Diagrams are inconsistent — each uses different colors, shapes, symbols.
- Key trust guarantees are invisible in the visual layer.
- Interview whiteboard sessions are improvised and incoherent.
- README has no visual overview — readers bounce immediately.

🟢 **With an architecture diagram plan:**
- Every diagram has a purpose and audience.
- Trust guarantees are visually verifiable in the diagrams.
- Interview whiteboard practice uses the same mental model as documentation.
- Consistent style builds professional credibility.

🔗 **Connects:**
- **Week 22** (Threat model) → trust boundaries appear as diagram overlays.
- **Week 21** (SLOs) → SLO monitoring components visible in architecture.
- **Day 2** (README) → architecture diagram is the README hero image.
- **Day 3** (Demo) → diagrams are shown during the live demo.
- **Day 4** (Video) → diagrams are key frames in the storyboard.

🧠 **Mental model: "One Diagram, One Story"** — Each diagram should tell exactly one story to exactly one audience. A diagram that tries to show everything shows nothing. The component diagram answers "what are the pieces?", the trust diagram answers "what is protected?", and the sequence diagram answers "how does it work?"

## Visual Model

```
┌───────────────────────────────────────────────────────┐
│           DIAGRAM LAYERING STRATEGY                   │
│                                                       │
│  Layer 3: TRUST BOUNDARIES (security audience)        │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐       │
│                                                       │
│  Layer 2: DATA FLOWS (engineering audience)           │
│  ┌─────────────────────────────────────────────┐      │
│  │  ──▶──▶──▶──▶──▶──▶──▶──▶──▶──▶──▶──▶──  │      │
│  └─────────────────────────────────────────────┘      │
│                                                       │
│  Layer 1: COMPONENTS (everyone)                       │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│  │  API   │ │ Verify │ │  Raft  │ │ Attest │         │
│  │Gateway │ │Service │ │Cluster │ │Worker  │         │
│  └────────┘ └────────┘ └────────┘ └────────┘         │
│                                                       │
│  Diagrams = Layer 1 alone  (README)                   │
│           + Layer 1+2      (engineering docs)         │
│           + Layer 1+2+3    (security review)          │
└───────────────────────────────────────────────────────┘
```

## Build

File: `week-23/day1-architecture-diagram-plan.md`

## Do

1. **Inventory all trust guarantees your system makes**
   > 💡 *WHY: Every trust guarantee must map to a visual element. If a guarantee isn't visible in any diagram, it's not communicable.*
   List every trust guarantee from your project: signature verification, attestation integrity, consensus consistency, replay protection, key management, certificate chain validation, etc. Each will need a diagram element. Create a mapping table: guarantee → diagram ID → visual element (shape, color, annotation). This inventory becomes your validation checklist — after creating each diagram, verify every mapped guarantee appears.

2. **Define the diagram set and audience for each**
   > 💡 *WHY: Different audiences need different views. An interviewer doesn't need the deployment topology; an SRE doesn't need the threat model overlay.*
   Plan 3-5 diagrams. For each, specify the target audience, the story it tells, and the level of detail.

3. **Create the component-level architecture diagram**
   > 💡 *WHY: This is the "hero" diagram that appears everywhere — README, slides, whiteboard. It must be clear enough to understand in 30 seconds.*
   Show all services, data stores, and external interfaces. Use consistent shapes and colors from your style guide. Include data flow arrows with labels describing what data crosses each boundary (e.g., "signed attestation," "verify request + signature"). Limit to 6-8 components — if you need more detail, create a separate component-level diagram that zooms into a single service. The hero diagram should be readable when shrunk to README width (~800px).

4. **Add trust boundary overlays**
   > 💡 *WHY: Trust boundaries from Week 22 must be visible. This overlay makes security architecture tangible.*
   Use dashed red lines to mark each trust boundary from your threat model. Label each boundary with its ID and the controls protecting it.

5. **Draft the verify→attest sequence diagram**
   > 💡 *WHY: This sequence diagram is your interview showpiece. It demonstrates you understand the critical path end-to-end.*
   Show every step from client request through verification, consensus, and attestation. Include error paths and retry logic.

## Done when

- [ ] Diagram inventory has ≥3 diagrams with audience and purpose — *guides all visual content*
- [ ] Every trust guarantee maps to a visible diagram element — *no invisible security*
- [ ] Component diagram shows all services and data flows — *README hero image ready*
- [ ] Style guide ensures consistent colors, shapes, and labels — *professional visual identity*
- [ ] Document committed to `week-23/day1-architecture-diagram-plan.md` — *referenced by Days 2-5*

## Proof

Upload or paste your diagram plan, style guide, and draft component diagram.

**Quick self-test:**

Q: Why should each diagram tell only one story?
**A: Because a diagram that tries to show everything becomes unreadable. Single-story diagrams are clear, memorable, and appropriate for their audience.**

Q: What are the three diagram layers in the layering strategy?
**A: Layer 1 (Components) for everyone, Layer 2 (Data Flows) for engineers, Layer 3 (Trust Boundaries) for security reviewers.**

Q: Why must every trust guarantee map to a diagram element?
**A: Because if a trust guarantee isn't visible, it can't be communicated, verified, or defended in a review or interview.**
