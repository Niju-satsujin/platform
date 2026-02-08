---
id: w24-final-interview-prep-publication-d01-dist-sys-qa
part: w24-final-interview-prep-publication
title: "Distributed Systems Q&A"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Distributed Systems Q&A

## Goal

Prepare comprehensive answers to the 15 most common distributed systems interview questions, each grounded in a concrete example from your trust platform project.

### ✅ Deliverables

1. A Q&A document with 15 distributed systems questions and structured answers.
2. Each answer includes one concrete project example with component names and metrics.
3. A "gotcha" section per question listing common wrong answers and why they're wrong.
4. A difficulty rating (L1/L2/L3) for interview preparation prioritization.
5. A quick-reference cheat sheet with one-line answer summaries.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | ≥15 questions with full answers | Count entries |
| 2 | Each answer includes a concrete project example | Verify "Project Example" section per answer |
| 3 | Gotcha section lists ≥2 wrong answers per question | Check gotcha entries |
| 4 | Difficulty ratings cover L1, L2, and L3 | Verify distribution |
| 5 | Cheat sheet has one-line summary per question | Count summary rows |

## What You're Building Today

You are building your distributed systems interview playbook. Every answer is anchored to your project — not textbook theory. When an interviewer asks "explain the CAP theorem," you don't recite Wikipedia; you explain how CAP influenced your Raft implementation's consistency choice.

### ✅ Deliverables

- 15 Q&A entries with project-grounded answers.
- Gotcha lists for common mistakes.
- Cheat sheet for quick review.

```markdown
## Q1: Explain the CAP theorem and how it applies to your project.
**Difficulty:** L1 (foundational)

**Answer:**
The CAP theorem states that a distributed system can provide at most
two of three guarantees: Consistency, Availability, and Partition tolerance.
Since network partitions are inevitable, the real choice is between
consistency and availability during a partition.

**Project Example:**
In my trust platform, I chose consistency over availability (CP) for
the Raft consensus cluster. When a network partition isolates the leader,
the minority partition cannot accept new attestations — it returns an
error rather than risk split-brain inconsistency. This is correct for a
trust system because an inconsistent attestation is worse than a
temporarily unavailable one. The verify service, however, is AP for
read-only operations using cached attestation data with a 60-second
freshness SLO.

**Gotcha — Common wrong answers:**
- ❌ "You have to pick two of three at design time" — Wrong. The choice
  is made per-operation and can differ for reads vs. writes.
- ❌ "CAP means you can't have consistency and availability" — Wrong.
  Outside of partitions, you can have both. CAP only constrains
  behavior during partitions.
```

You **can:**
- Reference any component or decision from Weeks 1-23.
- Include diagrams or pseudocode in answers where helpful.

You **cannot yet:**
- Practice verbal delivery (that's rehearsal, after writing).
- Get mock interview feedback (pair practice recommended).

## Why This Matters

🔴 **Without prepared Q&A:**
- Interview answers are generic: "CAP says pick two" → no depth.
- No project examples → interviewer can't distinguish you from a textbook.
- Common gotchas trap you into wrong answers under pressure.
- You forget key distributed systems concepts when nervous.

🟢 **With prepared Q&A:**
- Every answer cites your project: "In my Raft cluster, I chose CP because..." → credible.
- Gotcha awareness prevents common traps.
- Difficulty ratings let you prioritize study time.
- Cheat sheet enables 15-minute pre-interview review.

🔗 **Connects:**
- **Week 10** (Raft) → consensus questions answered with implementation details.
- **Week 5** (Networking) → network partition questions grounded in TCP experience.
- **Week 21** (SLOs) → availability questions reference concrete SLO data.
- **Week 14** (Certificates) → consistency questions cite cryptographic verification.
- **Day 2** (Trust Q&A) → security-specific questions handled separately.

🧠 **Mental model: "Theory + Project = Conviction"** — Interviewers hear textbook CAP answers all day. What makes yours memorable is the bridge to practice: "Here's the theory, and here's exactly how I applied it in my system, with this specific tradeoff and this metric to prove it worked."

## Visual Model

```
┌────────────────────────────────────────────────────────┐
│          INTERVIEW ANSWER STRUCTURE                     │
│                                                         │
│  ┌──────────────────────────┐                           │
│  │  THEORY (30 sec)         │  Define the concept       │
│  │  "CAP theorem states..." │  correctly and concisely  │
│  └───────────┬──────────────┘                           │
│              ▼                                          │
│  ┌──────────────────────────┐                           │
│  │  PROJECT EXAMPLE (45 sec)│  Concrete: "In my Raft    │
│  │  "In my trust platform..."│  cluster, I chose CP..."  │
│  └───────────┬──────────────┘                           │
│              ▼                                          │
│  ┌──────────────────────────┐                           │
│  │  TRADEOFF (30 sec)       │  "I sacrificed availability│
│  │  "This means that..."    │  because inconsistent      │
│  └───────────┬──────────────┘  attestation = trust breach"│
│              ▼                                          │
│  ┌──────────────────────────┐                           │
│  │  METRIC (15 sec)         │  "99.9% availability SLO  │
│  │  "The result was..."     │  over 30 days with 0      │
│  └──────────────────────────┘  inconsistencies"          │
│                                                         │
│  QUESTION COVERAGE MAP:                                 │
│  L1 (5 Qs): CAP, consensus, replication, partitions,   │
│             leader election                             │
│  L2 (6 Qs): linearizability, vector clocks, CRDTs,     │
│             exactly-once, idempotency, back-pressure    │
│  L3 (4 Qs): Byzantine fault tolerance, Jepsen testing,  │
│             formal verification, CALM theorem           │
└────────────────────────────────────────────────────────┘
```

## Build

File: `week-24/day1-dist-sys-qa.md`

## Do

1. **List the 15 most common distributed systems interview questions**
   > 💡 *WHY: Preparation beats improvisation. These 15 questions cover 90% of distributed systems interview conversations.*
   Source from: DDIA (Kleppmann), system design interview books, and Glassdoor. Categorize by difficulty (L1: foundational, L2: intermediate, L3: advanced).

2. **Write structured answers with the Theory→Project→Tradeoff→Metric format**
   > 💡 *WHY: This format prevents rambling. Theory shows knowledge, project example shows practice, tradeoff shows judgment, metric shows impact.*
   For each question, limit your answer to 2 minutes when spoken aloud. Time yourself reading each answer.

3. **Add concrete project examples to every answer**
   > 💡 *WHY: Project examples are your differentiator. "I chose CP for my Raft cluster" is infinitely more credible than "you should choose CP for consistency-critical systems."*
   Name specific components (verify-service, raft-cluster), specific metrics (2.3s election time, 99.9% SLO), and specific decisions.

4. **Document gotchas — common wrong answers**
   > 💡 *WHY: Knowing what NOT to say is as important as knowing what to say. Gotchas prevent you from falling into traps under pressure.*
   For each question, list ≥2 common wrong answers with brief explanations of why they're wrong. Sources for common misconceptions: distributed systems subreddits, Stack Overflow accepted answers that are actually incorrect, and interview prep sites that oversimplify. For example, the common claim "Raft guarantees availability" is wrong — Raft sacrifices availability during partitions to maintain consistency. Documenting these traps inoculates you against them.

5. **Create the cheat sheet for quick pre-interview review**
   > 💡 *WHY: You won't re-read 15 full answers in the 10 minutes before an interview. The cheat sheet gives you one-line memory joggers.*
   One row per question: question summary, one-line answer, project reference, key metric.

## Done when

- [ ] 15 Q&A entries with Theory/Project/Tradeoff/Metric structure — *comprehensive interview prep*
- [ ] Every answer has a concrete project example — *differentiates from textbook answers*
- [ ] Gotcha sections prevent common wrong answers — *avoids interview traps*
- [ ] Cheat sheet fits on one page — *10-minute pre-interview review*
- [ ] Document committed to `week-24/day1-dist-sys-qa.md` — *foundation for Days 2-5*

## Proof

Upload or paste your Q&A document and cheat sheet.

**Quick self-test:**

Q: Why include project examples in every interview answer?
**A: Because project examples prove you've applied the theory. Interviewers hear textbook answers daily — a real example with metrics is what makes you memorable.**

Q: What is the Theory→Project→Tradeoff→Metric answer format?
**A: Start with the concept (30s), bridge to your project (45s), explain the tradeoff (30s), and land on a metric (15s). Total: ~2 minutes.**

Q: Why document "gotcha" wrong answers?
**A: Because under pressure, you may default to a common-but-wrong answer. Knowing the traps in advance prevents falling into them.**
