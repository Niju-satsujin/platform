---
id: w22-security-threat-model-story-d01-threat-model-map
part: w22-security-threat-model-story
title: "Threat Model Map"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Threat Model Map

## Goal

Build a STRIDE-based threat model map that assigns every component in your distributed trust platform an explicit trust boundary, enumerates threats per boundary crossing, and designates a threat owner for each.

### ✅ Deliverables

1. A system decomposition diagram with labeled trust boundaries.
2. A STRIDE threat enumeration table for each boundary crossing.
3. A threat owner assignment matrix linking each threat to a responsible person/team.
4. A data flow diagram (DFD) showing where sensitive data crosses boundaries.
5. An assumptions and out-of-scope document listing what the model does NOT cover.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Every component has an explicit trust boundary | Verify boundary labels in DFD |
| 2 | STRIDE applied to every boundary crossing (≥12 threats) | Count rows in threat table |
| 3 | Each threat has an assigned owner | Check "Owner" column is filled |
| 4 | Data flow diagram shows all sensitive data paths | Cross-reference with architecture |
| 5 | Out-of-scope section explicitly lists ≥3 non-covered areas | Read assumptions doc |

## What You're Building Today

You are building the security foundation for your trust platform — a structured threat model that makes implicit security assumptions explicit. Every trust guarantee your system claims will be systematically challenged using STRIDE.

### ✅ Deliverables

- Complete STRIDE threat model document.
- Trust boundary diagram.
- Threat ownership matrix.

```markdown
## Trust Boundaries

| Boundary ID | Name                    | Components Inside        | External Interfaces     |
|-------------|-------------------------|--------------------------|-------------------------|
| TB-1        | Client → API Gateway    | nginx, rate limiter      | Public internet         |
| TB-2        | API → Verify Service    | verify-svc, key store    | Internal network        |
| TB-3        | Verify → Raft Cluster   | raft nodes, WAL storage  | Internal consensus net  |
| TB-4        | Raft → Attestation      | attest-worker, cert store| Internal + HSM          |

## STRIDE Analysis — TB-1 (Client → API Gateway)

| Threat Type      | Threat Description                        | Risk | Owner     |
|------------------|-------------------------------------------|------|-----------|
| Spoofing         | Attacker impersonates legitimate client   | High | auth-team |
| Tampering        | Request body modified in transit          | Med  | api-team  |
| Repudiation      | Client denies having made a request       | Med  | log-team  |
| Info Disclosure  | API error leaks internal stack traces     | High | api-team  |
| Denial of Service| Flood of verify requests exhausts workers | High | sre-team  |
| Elevation        | Unauthenticated user accesses admin API   | Crit | auth-team |
```

You **can:**
- Use your Week 1-20 architecture as the decomposition input.
- Reference industry STRIDE resources and OWASP guidelines.
- Include both technical and operational threats (e.g., key ceremony failures).
- Use DREAD scoring (Damage, Reproducibility, Exploitability, Affected users, Discoverability) for risk ranking.

You **cannot yet:**
- Define mitigations (that's Day 3 threat-control matrix).
- Write abuse cases (that's Day 2).
- Test security controls (that's Day 5).
- Implement new security controls (document gaps first, implement later).

## Why This Matters

🔴 **Without a threat model:**
- Security is reactive — you discover vulnerabilities in production.
- Trust boundaries are implicit — nobody knows where encryption ends.
- No clear ownership — security bugs sit in limbo.
- Interview answers lack structured security reasoning.

🟢 **With a threat model:**
- Every component's trust assumptions are documented and reviewable.
- New features get threat-modeled before code is written.
- Threat ownership enables accountability and prioritization.
- You can articulate security architecture confidently in interviews.

🔗 **Connects:**
- **Week 14** (Certificates) → trust boundary between CA and verification.
- **Week 10** (Raft) → consensus network is a critical trust boundary.
- **Week 21** (SLOs) → SLO alerts feed into threat detection signals.
- **Day 3** (Threat-control matrix) → threats get matched to controls.
- **Week 23** (Architecture diagram) → trust boundaries appear in diagrams.

🧠 **Mental model: "Trust Boundaries are Firewalls for Assumptions"** — A trust boundary is where one component stops trusting another's input. Every boundary crossing is a potential attack surface. If you can't draw the boundary, you can't defend it. The most dangerous boundaries are the implicit ones — where developers assume "this internal service would never send malicious data." Making every boundary explicit forces you to validate inputs at every crossing, not just at the edge.

## Visual Model

```
┌─────────────────────────────────────────────────────────┐
│                  TRUST BOUNDARY MAP                      │
│                                                          │
│   INTERNET (untrusted)                                   │
│       │                                                  │
│       ▼  ─── TB-1 ────────────────────────────           │
│   ┌──────────┐                                           │
│   │  API GW  │  rate limit, TLS termination              │
│   └────┬─────┘                                           │
│        │  ─── TB-2 ──────────────────────────            │
│        ▼                                                 │
│   ┌──────────┐    ┌──────────┐                           │
│   │ Verify   │◄──▶│ Key Store│  mTLS + RBAC              │
│   │ Service  │    └──────────┘                           │
│   └────┬─────┘                                           │
│        │  ─── TB-3 ──────────────────────────            │
│        ▼                                                 │
│   ┌──────────────────┐                                   │
│   │   Raft Cluster   │  encrypted consensus channel      │
│   │ ┌───┐ ┌───┐ ┌───┐│                                   │
│   │ │ N1│ │ N2│ │ N3││                                   │
│   │ └───┘ └───┘ └───┘│                                   │
│   └────────┬─────────┘                                   │
│            │  ─── TB-4 ──────────────────────            │
│            ▼                                             │
│   ┌──────────────┐                                       │
│   │ Attestation  │  HSM-backed signing                   │
│   │ Worker       │                                       │
│   └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

## Build

File: `week-22/day1-threat-model-map.md`

## Do

1. **Decompose your system into components and trust boundaries**
   > 💡 *WHY: You cannot threat-model a monolith. Decomposition reveals the interfaces where attacks occur.*
   Draw your architecture as a data flow diagram. Identify every point where data crosses a network, process, or privilege boundary. Label each boundary (TB-1, TB-2, etc.).

2. **Enumerate STRIDE threats for each boundary crossing**
   > 💡 *WHY: STRIDE is a structured mnemonic that prevents you from forgetting threat categories. Without it, you'll focus on injection and miss repudiation.*
   For each trust boundary, walk through all six STRIDE categories. Ask: "Can an attacker Spoof/Tamper/Repudiate/Disclose/Deny/Elevate at this crossing?" Use a systematic approach: create one row per STRIDE category per boundary crossing. For your 4 trust boundaries, this produces up to 24 potential threats (4 boundaries × 6 categories). Not all will be relevant — mark inapplicable ones as "N/A" with a brief justification rather than silently skipping them.

3. **Assign risk ratings (Critical/High/Medium/Low)**
   > 💡 *WHY: Not all threats are equal. Risk ratings drive prioritization — Critical threats get immediate controls, Low threats go to the backlog.*
   Use impact × likelihood as a rough guide. Anything that compromises signing keys or attestation integrity is Critical.

4. **Assign threat owners**
   > 💡 *WHY: Unowned threats never get fixed. Every threat needs a name (or team) who is accountable for mitigation.*
   Map each threat to the team that owns the component at that boundary. If ownership is unclear, that's a finding.

5. **Document assumptions and out-of-scope items**
   > 💡 *WHY: A threat model that claims to cover everything covers nothing. Explicit exclusions prevent false confidence.*
   List at least 3 things your model does NOT cover (e.g., physical access to servers, social engineering attacks on team members, supply-chain attacks beyond direct dependencies). For each exclusion, briefly explain why it's out of scope (e.g., "physical access is out of scope because we assume cloud provider controls for datacenter security"). Also document key assumptions: "we assume the OS kernel is not compromised," "we assume TLS 1.3 implementations are correct." These assumptions become the starting point for a future, deeper threat model.

## Done when

- [ ] All components have explicit trust boundary assignments — *used in Day 3 control matrix*
- [ ] ≥12 STRIDE threats enumerated across all boundaries — *feeds Day 2 abuse cases*
- [ ] Every threat has an assigned owner — *enables accountability in Week 24 review*
- [ ] DFD shows all sensitive data flows — *referenced in Week 23 architecture diagram*
- [ ] Document committed to `week-22/day1-threat-model-map.md` — *foundation for all Week 22 work*

## Proof

Upload or paste your STRIDE threat model map document.

**Quick self-test:**

Q: What does STRIDE stand for?
**A: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege.**

Q: Why does every component need an explicit trust boundary?
**A: Because implicit boundaries mean implicit assumptions — and implicit assumptions are where security vulnerabilities hide.**

Q: What makes a threat "Critical" vs "High"?
**A: Critical threats compromise core trust guarantees (key material, attestation integrity). High threats impact availability or confidentiality but don't break trust primitives.**
