---
id: w24-final-interview-prep-publication-d02-trust-qa
part: w24-final-interview-prep-publication
title: "Trust Architecture Q&A"
order: 2
duration_minutes: 120
prereqs: ["w24-final-interview-prep-publication-d01-dist-sys-qa"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Trust Architecture Q&A

## Goal

Prepare answers to trust and security architecture interview questions, each including one honest "limitation" answer per security claim, demonstrating the intellectual honesty that distinguishes senior engineers.

### ✅ Deliverables

1. A Q&A document with 12 trust/security architecture questions and answers.
2. Each answer includes one "limitation" — what your system does NOT protect against.
3. A trust guarantee evidence table linking claims to code, tests, and metrics.
4. A "What I'd do differently" section showing growth mindset.
5. A comparison table: your approach vs. industry alternatives.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | ≥12 trust/security questions with full answers | Count entries |
| 2 | Each includes one explicit limitation statement | Find "Limitation" per answer |
| 3 | Trust guarantee evidence table has ≥5 rows | Count evidence rows |
| 4 | "What I'd do differently" covers ≥3 areas | Count items |
| 5 | Comparison table includes ≥3 alternative approaches | Count alternatives |

## What You're Building Today

You are preparing for the hardest interview questions: the ones about security, trust, and "what could go wrong." The key insight is that admitting limitations is a strength, not a weakness. Interviewers test whether you understand the boundaries of your own system.

### ✅ Deliverables

- 12 trust architecture Q&A entries.
- Limitation statements for every security claim.
- Evidence table and comparison analysis.

```markdown
## Q1: How does your system ensure attestation integrity?

**Answer:**
Attestation integrity is maintained through a three-layer approach:
(1) Ed25519 signatures on every attestation using HSM-backed keys,
(2) Raft consensus ensuring all nodes agree on attestation state before
committing, and (3) cryptographic hash chaining in the Raft log preventing
retroactive tampering.

**Project Evidence:**
- Ed25519 signing: `week-14/sign-service/src/signer.cpp`
- Raft consensus: `week-10/raft/src/consensus.cpp`
- Hash chaining: `week-10/raft/src/log.cpp`, line 142

**Limitation:**
This design does NOT protect against a compromised HSM. If the hardware
security module itself is backdoored or physically tampered with, all
attestations signed by that HSM must be considered suspect. Mitigation
would require multi-party signing (threshold signatures) across multiple
HSMs from different vendors — a tradeoff I chose not to make due to
complexity and latency impact.

**What I'd do differently:**
In a production system with higher security requirements, I would
implement threshold signing (t-of-n) across geographically distributed
HSMs, accepting the latency cost for stronger key compromise resilience.
```

You **can:**
- Reference Week 22 threat model for limitation analysis.
- Be candid about what you'd improve — this shows maturity.
- Include industry comparisons (your approach vs. alternatives like TEE, MPC, or threshold signatures).
- Use the "Claim → Evidence → Limitation" format for consistency.

You **cannot yet:**
- Implement the improvements (this is reflection, not coding).
- Get interviewer feedback (practice with peers after writing).
- Test against real adversaries (document theoretical limitations from threat model).

## Why This Matters

🔴 **Without limitation awareness:**
- You claim "our system is secure" → interviewer probes → you have no answer.
- Overconfidence in security claims signals inexperience.
- You miss the opportunity to show depth of understanding.
- "What would you improve?" gets an empty answer.

🟢 **With limitation awareness:**
- "Here's what it protects, and here's what it doesn't" → trust + credibility.
- Honest limitations show you understand the threat landscape.
- "What I'd do differently" demonstrates growth mindset.
- Comparison with alternatives shows you evaluated industry approaches.

🔗 **Connects:**
- **Week 22** (Threat model) → limitations map to unmitigated threats.
- **Week 14** (Certificates) → cryptographic trust questions answered here.
- **Week 10** (Raft) → consensus integrity questions answered here.
- **Day 1** (Dist sys Q&A) → complements with security-specific depth.
- **Week 23** (Stories) → limitation stories show self-awareness.

🧠 **Mental model: "Honest Limitations Build Trust"** — In interviews, saying "I don't know" or "my system doesn't handle X" is a superpower, not a weakness. It shows you understand the problem space beyond what you built. The interviewer already knows your system has limitations — the question is whether YOU know them.

## Visual Model

```
┌────────────────────────────────────────────────────────┐
│         TRUST ARCHITECTURE ANSWER MODEL                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │           YOUR SECURITY CLAIM                   │    │
│  │  "Attestation integrity is guaranteed by..."    │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │                               │
│         ┌───────────────┼───────────────┐               │
│         ▼               ▼               ▼               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  EVIDENCE   │ │ LIMITATION  │ │  IMPROVE    │       │
│  │  (code +    │ │ (what it    │ │  (what I'd  │       │
│  │   tests +   │ │  does NOT   │ │   do next   │       │
│  │   metrics)  │ │  protect)   │ │   time)     │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                         │
│  COMPARISON TABLE:                                      │
│  ┌──────────────┬───────────┬───────────┬────────────┐  │
│  │ Approach     │ Strength  │ Weakness  │ Your choice│  │
│  ├──────────────┼───────────┼───────────┼────────────┤  │
│  │ Single HSM   │ Simple    │ SPOF      │ ✅ Current │  │
│  │ Threshold    │ No SPOF   │ Latency   │ Future     │  │
│  │ TEE-based    │ Isolated  │ Side-chan. │ Evaluated  │  │
│  └──────────────┴───────────┴───────────┴────────────┘  │
└────────────────────────────────────────────────────────┘
```

## Build

File: `week-24/day2-trust-qa.md`

## Do

1. **List 12 trust/security architecture interview questions**
   > 💡 *WHY: These questions test whether you understand security beyond "I used encryption." They probe system-level trust reasoning.*
   Include: attestation integrity, key management, certificate trust chains, threat modeling, zero-trust principles, supply-chain security, secret rotation, audit logging, consensus security, access control, and incident response.

2. **Write answers with the Claim→Evidence→Limitation format**
   > 💡 *WHY: This format shows you can defend a security claim (evidence) while acknowledging its boundaries (limitation). Both are required for credibility.*
   For each question, state your claim, cite evidence (file, test, metric), and then explicitly state what your system does NOT protect against.

3. **Add one honest limitation per security claim**
   > 💡 *WHY: Interviewers probe for overconfidence. Preemptively stating limitations shows you've thought deeply about your threat model.*
   For each limitation, explain: (1) what's not protected, (2) what the attack scenario would be, and (3) what mitigation you'd implement given more time.

4. **Build the trust guarantee evidence table**
   > 💡 *WHY: Evidence turns "I did security" into "here's the code, test, and metric that proves it." This table is your security resume.*
   For each guarantee, link to: source file, test file, and runtime metric. This should cross-reference your Week 22 threat-control matrix. Create columns: Guarantee, Mechanism, Source File, Test File, Runtime Metric, and Week Built. This table is the single most powerful artifact for security interviews — it demonstrates that every claim is verifiable and traceable to code.

5. **Write the "What I'd do differently" and comparison sections**
   > 💡 *WHY: "What would you improve?" is asked in every interview. Pre-written answers with alternatives show you've evaluated the landscape.*
   List ≥3 things you'd change. For each, name the alternative approach and the tradeoff that led to your current choice.

## Done when

- [ ] 12 trust/security Q&A entries with Claim/Evidence/Limitation — *complete security interview prep*
- [ ] Every claim has an explicit limitation statement — *shows intellectual honesty*
- [ ] Evidence table links guarantees to code, tests, and metrics — *verifiable claims*
- [ ] "What I'd do differently" covers ≥3 areas — *demonstrates growth mindset*
- [ ] Document committed to `week-24/day2-trust-qa.md` — *pairs with Day 1 dist-sys Q&A*

## Proof

Upload or paste your trust Q&A document and evidence table.

**Quick self-test:**

Q: Why is admitting limitations a strength in interviews?
**A: Because it demonstrates you understand the problem space beyond what you built. Overconfidence signals inexperience; honest limitations signal depth.**

Q: What makes a security claim credible?
**A: Evidence: source code implementing the control, a test proving it works, and a runtime metric showing it holds in production.**

Q: What's the format for a strong "What I'd do differently" answer?
**A: Name the limitation, describe the alternative approach, explain the tradeoff that led to your current choice, and state what you'd prioritize given more time.**
