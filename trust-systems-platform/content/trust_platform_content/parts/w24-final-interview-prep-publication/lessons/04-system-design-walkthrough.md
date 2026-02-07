---
id: w24-final-interview-prep-publication-d04-system-design-walkthrough
part: w24-final-interview-prep-publication
title: "System Design Walkthrough"
order: 4
duration_minutes: 120
prereqs: ["w24-final-interview-prep-publication-d03-debug-drills"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# System Design Walkthrough

## Goal

Create a complete system design walkthrough document that separates your trust platform into MVP and hardening phases, demonstrating the structured thinking interviewers look for in system design interviews.

### ✅ Deliverables

1. A phased design document with distinct MVP and hardening sections.
2. An MVP scope definition with explicit "in scope" and "out of scope" lists.
3. A hardening roadmap with prioritized improvements and justifications.
4. A capacity estimation section (back-of-envelope calculations).
5. A design rationale for every major architectural choice.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | MVP and hardening phases clearly separated | Verify distinct sections |
| 2 | MVP scope lists ≥5 in-scope and ≥5 out-of-scope items | Count items |
| 3 | Hardening roadmap has ≥8 prioritized improvements | Count entries |
| 4 | Capacity estimation uses back-of-envelope math | Check calculations |
| 5 | ≥5 design rationales with alternatives considered | Count rationale entries |

## What You're Building Today

You are writing the definitive design document for your trust platform, structured the way you'd present it in a 45-minute system design interview. The key technique is phasing: start with an MVP that works, then layer on hardening improvements.

### ✅ Deliverables

- Phased design document (MVP + hardening).
- Capacity estimation calculations.
- Design rationale document.

```markdown
## System Design: Distributed Trust Verification Platform

### Phase 1: MVP (Weeks 1-12)
**Goal:** End-to-end trust verification with basic reliability

**In Scope:**
- Single-region deployment, 3-node Raft cluster
- Ed25519 signature verification via HTTP API
- Raft consensus for attestation state
- Basic logging and health checks
- Unit and integration tests

**Out of Scope (deferred to hardening):**
- Multi-region deployment
- Automatic horizontal scaling
- HSM key management
- SLO monitoring and alerting
- Threat model and security controls

**Architecture (MVP):**
Client → API Gateway → Verify Service → Raft Cluster → Attestation Store

### Capacity Estimation (MVP):
- Target: 100 verify requests/second
- Ed25519 verify: ~45ms CPU per request
- Thread pool: 100 req/s × 0.045s = 4.5 cores needed
- Provision: 8 cores (2× headroom)
- Raft writes: ~60 attestations/minute → WAL: 60 × 256 bytes × 60 × 24 = ~22 MB/day
- Storage: 100 GB disk → ~12 years of WAL data

### Phase 2: Hardening (Weeks 13-24)
**Priority-ordered improvements:**
1. HSM-backed key storage (Week 14) — eliminates key-on-disk risk
2. mTLS between all services (Week 14) — secures internal traffic
3. SLO monitoring + dashboards (Week 21) — observability
4. Threat model + controls (Week 22) — structured security
5. Rate limiting + circuit breaking — protects against abuse
6. Multi-node scaling + capacity plan (Week 21) — growth readiness
7. Automated secret rotation (Week 22) — operational hygiene
8. Chaos testing + debug drills (Week 24) — resilience validation
```

You **can:**
- Reference your actual project architecture and decisions.
- Use back-of-envelope math for capacity estimates.

You **cannot yet:**
- Present this live (rehearse timing after writing).
- Get interviewer feedback (mock with a partner).

## Why This Matters

🔴 **Without a phased design:**
- You try to design everything at once → overwhelmed, unstructured answer.
- Interviewers can't tell what's MVP vs. nice-to-have.
- No capacity estimation → design doesn't address scale.
- Design rationale is missing → "I chose Raft" but not "why Raft."

🟢 **With a phased design:**
- MVP shows you can ship something that works quickly.
- Hardening shows you understand production readiness.
- Capacity estimation proves you think about scale.
- Design rationale demonstrates principled decision-making.

🔗 **Connects:**
- **Weeks 1-12** → MVP phase maps to the building weeks.
- **Weeks 13-24** → hardening phase maps to the production-readiness weeks.
- **Week 21** (SLOs + capacity) → hardening includes reliability engineering.
- **Week 22** (Security) → hardening includes security controls.
- **Day 1** (Dist sys Q&A) → design rationale answers reference these decisions.

🧠 **Mental model: "MVP Then Harden"** — In a design interview, never start with the perfect system. Start with the simplest system that works (MVP), then systematically add hardening layers. This mirrors real engineering: you ship something, learn from production, then improve. Interviewers want to see both your "get it working" and your "make it right" thinking.

## Visual Model

```
┌────────────────────────────────────────────────────────┐
│         SYSTEM DESIGN INTERVIEW STRUCTURE               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  PHASE 1: MVP (15 min of interview)             │    │
│  │                                                  │    │
│  │  Requirements → API → Components → Data model   │    │
│  │                                                  │    │
│  │  ┌──────┐   ┌────────┐   ┌──────┐   ┌───────┐  │    │
│  │  │Client│──▶│API GW  │──▶│Verify│──▶│ Raft  │  │    │
│  │  └──────┘   └────────┘   └──────┘   └───────┘  │    │
│  │                                                  │    │
│  │  Capacity: 100 req/s → 8 cores → 100GB disk    │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                               │
│                         ▼                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │  PHASE 2: HARDENING (15 min of interview)       │    │
│  │                                                  │    │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐   │    │
│  │  │ Security   │ │Reliability │ │ Scalability│   │    │
│  │  │ HSM, mTLS  │ │ SLOs, dash │ │ capacity   │   │    │
│  │  │ threats    │ │ alerts     │ │ scaling    │   │    │
│  │  └────────────┘ └────────────┘ └────────────┘   │    │
│  │                                                  │    │
│  │  Priority: Security → Reliability → Scale        │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                               │
│                         ▼                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │  DEEP DIVE (15 min — interviewer choice)        │    │
│  │  Consensus? Security? Observability? Scale?      │    │
│  └─────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

## Build

File: `week-24/day4-system-design-walkthrough.md`

## Do

1. **Define MVP scope with explicit in/out-of-scope lists**
   > 💡 *WHY: Scope control is the #1 skill in design interviews. Saying "this is out of scope for MVP" shows you can prioritize.*
   List 5+ items in scope (core verification, Raft, basic API) and 5+ items deferred to hardening (HSM, mTLS, SLOs, scaling, security testing).

2. **Draw the MVP architecture and explain each component**
   > 💡 *WHY: The architecture diagram is your interview whiteboard. Practice drawing it in under 2 minutes with clean labels and data flow arrows.*
   Name each component, explain its responsibility in one sentence, and describe the data flow from client request to attestation storage.

3. **Do back-of-envelope capacity estimation**
   > 💡 *WHY: Capacity estimation shows you think about real-world scale. Even rough estimates (100 req/s × 45ms = 4.5 cores) impress interviewers.*
   Calculate: compute (req/s × time per request = cores), storage (writes/day × size × retention), and network (req/s × payload × overhead).

4. **Build the hardening roadmap with priorities and rationale**
   > 💡 *WHY: The hardening phase shows production thinking. Priority order shows you understand which improvements have the highest impact.*
   Order improvements by blast-radius reduction: security first (HSM, mTLS), then reliability (SLOs, alerts), then scalability (capacity, auto-scaling).

5. **Document design rationale for every major choice**
   > 💡 *WHY: "Why Raft?" will be asked. Pre-written rationale with alternatives considered (Paxos, PBFT, simple replication) makes the answer instant and confident.*
   For each major choice (consensus protocol, crypto algorithm, storage engine, API style), list alternatives and the deciding factors.

## Done when

- [ ] MVP and hardening phases clearly separated with scope lists — *structured design thinking*
- [ ] Capacity estimation with back-of-envelope math — *demonstrates scale awareness*
- [ ] Hardening roadmap has ≥8 prioritized improvements — *production readiness vision*
- [ ] ≥5 design rationales with alternatives considered — *principled decisions*
- [ ] Document committed to `week-24/day4-system-design-walkthrough.md` — *rehearsed in Day 5*

## Proof

Upload or paste your system design walkthrough document.

**Quick self-test:**

Q: Why separate MVP and hardening in a design interview?
**A: Because it shows you can ship something quickly (MVP) and also think about production readiness (hardening). Starting with the perfect system overwhelms the interview time.**

Q: What's the order of priority for hardening?
**A: Security first (highest blast radius), then reliability (user impact), then scalability (growth). This matches real-world incident severity.**

Q: Why do back-of-envelope capacity estimation?
**A: It proves you think about scale realistically. Even rough estimates (100 req/s × 45ms per request = 4.5 cores) show you can reason about resource requirements.**
