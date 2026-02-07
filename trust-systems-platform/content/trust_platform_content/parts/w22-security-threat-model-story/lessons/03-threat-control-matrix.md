---
id: w22-security-threat-model-story-d03-threat-control-matrix
part: w22-security-threat-model-story
title: "Threat Control Matrix"
order: 3
duration_minutes: 120
prereqs: ["w22-security-threat-model-story-d02-abuse-cases"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Threat Control Matrix

## Goal

Build a threat-control matrix that maps every high-risk threat to at least one preventive control and one detective control, ensuring defense-in-depth across your trust platform.

### ✅ Deliverables

1. A matrix table mapping threats to preventive and detective controls.
2. Control implementation status tracker (implemented/planned/gap).
3. A defense-in-depth analysis showing layered coverage per trust boundary.
4. A gap analysis identifying threats with insufficient controls.
5. A control effectiveness rating for each implemented control.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Every high-risk threat has ≥1 preventive + ≥1 detective control | Verify both columns filled for high-risk rows |
| 2 | ≥15 controls documented across all threats | Count unique controls |
| 3 | Implementation status tracked for each control | Check status column |
| 4 | Gap analysis identifies ≥2 under-controlled threats | Read gap section |
| 5 | Controls reference specific code, config, or process | Check implementation detail column |

## What You're Building Today

You are building the mapping between "what can go wrong" and "what stops it." The threat-control matrix ensures every threat has layered defenses and makes security gaps visible.

### ✅ Deliverables

- Complete threat-control matrix.
- Gap analysis document.
- Defense-in-depth coverage chart.

```markdown
## Threat-Control Matrix

| Threat ID | Threat                        | Risk | Preventive Control          | Detective Control           | Status      |
|-----------|-------------------------------|------|-----------------------------|-----------------------------|-------------|
| T-01      | Forged attestation injection  | Crit | mTLS + request signing      | Source IP anomaly alert     | Implemented |
| T-02      | Key material exfiltration     | Crit | HSM-backed key storage      | Key access audit log        | Implemented |
| T-03      | Replay attack on verify API   | High | Nonce + timestamp validation| Duplicate request detector  | Planned     |
| T-04      | Raft log tampering            | High | Cryptographic log chaining  | Hash verification on read   | Implemented |
| T-05      | API error info disclosure     | Med  | Sanitized error responses   | Error response scanner      | Gap         |
| T-06      | DDoS on verify endpoint       | High | Rate limiting + circuit brk | Traffic anomaly detection   | Implemented |
| T-07      | Stale attestation served      | High | Freshness SLO + timeout     | Attestation age gauge alert | Implemented |
| T-08      | Unauthorized admin access     | Crit | RBAC + mTLS client certs    | Admin action audit log      | Planned     |
| T-09      | Log tampering / deletion      | High | Append-only log + hash chain| Log integrity verification  | Implemented |
| T-10      | Supply chain dep compromise   | Med  | Dep pinning + SBOM scan     | CVE alert feed              | Planned     |

## Defense-in-Depth: TB-2 (API → Verify Service)
- Layer 1 (Network): mTLS between services, network policies
- Layer 2 (Application): Input validation, request signing
- Layer 3 (Data): Encrypted at rest, key rotation
- Layer 4 (Monitoring): Anomaly detection, audit logging
```

You **can:**
- Reference controls already implemented in Weeks 1-20.
- Use NIST 800-53 or CIS controls as a reference framework.
- Classify controls as preventive, detective, corrective, or compensating.
- Include operational controls (processes, procedures) alongside technical ones.

You **cannot yet:**
- Test control effectiveness (that's Day 5).
- Implement new controls (document what exists vs. what's planned).
- Measure control coverage quantitatively (qualitative assessment first).
- Automate control verification (manual review this iteration).

## Why This Matters

🔴 **Without a threat-control matrix:**
- Security controls are scattered — nobody knows what protects what.
- High-risk threats may have zero controls (invisible gaps).
- Audit questions ("how do you protect X?") require days of research.
- New features bypass security because there's no checklist.

🟢 **With a threat-control matrix:**
- Every threat's defenses are visible in one document.
- Gaps are explicit — you know exactly where to invest.
- Audits and compliance reviews reference a single source of truth.
- Defense-in-depth is demonstrable, not assumed.

🔗 **Connects:**
- **Day 1** (Threat model) → threats feed into the matrix rows.
- **Day 2** (Abuse cases) → detection signals become detective controls.
- **Week 14** (Certificates) → mTLS is a preventive control for TB-2/TB-3.
- **Week 10** (Raft) → cryptographic log chaining is a preventive control.
- **Day 5** (Security test plan) → gaps and controls are tested.

🧠 **Mental model: "The Swiss Cheese Model"** — No single control is perfect; each has holes (like Swiss cheese slices). Defense-in-depth stacks multiple controls so that a hole in one layer is covered by the next. The threat-control matrix ensures you have enough slices at every boundary. In practice, this means every high-risk threat needs both a preventive control (stops the attack from happening) AND a detective control (alerts you if the preventive control fails). The detective control is your safety net — it catches the attacks that slip through prevention.

## Visual Model

```
┌───────────────────────────────────────────────────────┐
│             DEFENSE-IN-DEPTH LAYERS                   │
│                                                       │
│  Threat ──▶ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│             │ Layer 1  │ │ Layer 2  │ │ Layer 3  │     │
│             │ PREVENT  │ │ PREVENT  │ │ DETECT   │     │
│             │ ░░░░░░░░ │ │ ░░░█░░░ │ │ ░░░░░░░░ │     │
│             │ (mTLS)   │ │ (valid.) │ │ (audit)  │     │
│             └─────────┘ └─────────┘ └─────────┘      │
│                                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │          THREAT-CONTROL MATRIX                 │   │
│  │                                                │   │
│  │  Threat    Preventive     Detective    Status  │   │
│  │  ├─ T-01   mTLS+sign     IP anomaly   ✅      │   │
│  │  ├─ T-02   HSM storage   access audit ✅      │   │
│  │  ├─ T-03   nonce+ts      dup detector ⏳      │   │
│  │  ├─ T-04   hash chain    hash verify  ✅      │   │
│  │  └─ T-05   sanitize      resp scanner ❌ GAP  │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  Coverage: 4/5 threats fully controlled               │
│  Action: T-05 needs error sanitization middleware     │
└───────────────────────────────────────────────────────┘
```

### Control Types Reference

| Type | Purpose | Examples |
|------|---------|----------|
| Preventive | Stop attacks before impact | mTLS, input validation, RBAC |
| Detective | Detect attacks in progress or after | Audit logs, anomaly alerts |
| Corrective | Restore to known-good state | Auto-rollback, key rotation |
| Compensating | Alternative when primary fails | Rate limiting when auth degrades |

## Build

File: `week-22/day3-threat-control-matrix.md`

## Do

1. **List all high and critical threats from Day 1 and Day 2**
   > 💡 *WHY: The matrix starts with threats. If you skip this, you'll design controls for risks that don't exist and miss risks that do.*
   Pull every threat rated High or Critical from your STRIDE analysis and abuse cases. Each becomes a row in the matrix.

2. **Map existing controls to threats**
   > 💡 *WHY: You've already built controls in Weeks 1-20. Before adding new ones, document what already protects each threat.*
   For each threat, list controls already implemented: mTLS, input validation, encryption, audit logging, rate limiting, etc. Mark each as "Implemented." Be specific about the control's scope — "mTLS on TB-2" is useful; "encryption" is vague. Reference the source file or config where each control is implemented. This traceability matters because during security reviews, auditors will ask "show me the code that enforces this control" — you need to be able to answer immediately.

3. **Identify gaps where controls are missing**
   > 💡 *WHY: Gaps are the most valuable output of this exercise. A gap means an undefended attack path — this is where breaches happen.*
   Any threat with zero preventive controls or zero detective controls is a gap. Flag it prominently and add it to the gap analysis section.

4. **Design layered defense for each trust boundary**
   > 💡 *WHY: Defense-in-depth means even if one control fails, others catch the attack. Single-layer defense is single-point-of-failure security.*
   For each trust boundary, ensure at least 3 layers: network (mTLS, network policies, firewalls), application (input validation, authentication, authorization), and monitoring (audit logging, anomaly detection, alerting). Document the layering explicitly. A well-defended trust boundary should require an attacker to defeat all three layers simultaneously — making the attack exponentially harder.

5. **Rate control effectiveness and plan remediations**
   > 💡 *WHY: "We have a control" and "our control works" are different statements. Effectiveness ratings drive security testing priorities.*
   Rate each control as Strong/Moderate/Weak based on bypass difficulty. Plan remediations for Weak controls and Gap entries.

## Done when

- [ ] Every high-risk threat has ≥1 preventive + ≥1 detective control — *defense-in-depth verified*
- [ ] Gap analysis identifies under-controlled threats with remediation plan — *prioritizes security work*
- [ ] Defense-in-depth documented per trust boundary — *shows layered security in interviews*
- [ ] Control implementation status tracked (implemented/planned/gap) — *actionable security roadmap*
- [ ] Document committed to `week-22/day3-threat-control-matrix.md` — *referenced by Day 5 test plan*

## Proof

Upload or paste your threat-control matrix and gap analysis.

**Quick self-test:**

Q: Why must every high-risk threat have both preventive AND detective controls?
**A: Preventive controls can fail. Detective controls catch failures and enable response. Without both, you're either unprotected or blind.**

Q: What is the Swiss Cheese model in security?
**A: Each control layer has holes (weaknesses). Stacking multiple layers ensures that holes don't align — an attack must bypass all layers to succeed.**

Q: What should you do when you find a gap in the matrix?
**A: Flag it explicitly, add a remediation plan with owner and timeline, and ensure the gap is covered in the Day 5 security test plan.**
