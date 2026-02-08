---
id: w22-security-threat-model-story-d02-abuse-cases
part: w22-security-threat-model-story
title: "Abuse Cases"
order: 2
duration_minutes: 120
prereqs: ["w22-security-threat-model-story-d01-threat-model-map"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Abuse Cases

## Goal

Write the top 10 abuse cases for your trust platform, each describing a realistic attack scenario with attacker motivation, attack vector, detection signal, and response action.

### ✅ Deliverables

1. Ten abuse case narratives in structured format (Attacker/Goal/Vector/Impact/Detection/Response).
2. A risk-ranked priority list ordering abuse cases by severity.
3. Detection signal specifications for each abuse case.
4. Response playbooks (1-page each) for the top 3 abuse cases.
5. A mapping from abuse cases back to Day 1 STRIDE threats.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Exactly 10 abuse cases documented | Count entries |
| 2 | Each includes detection signal + response action | Verify both fields filled per case |
| 3 | Top 3 have full response playbooks | Check playbook sections exist |
| 4 | Risk ranking uses consistent methodology | Verify scoring formula documented |
| 5 | Each abuse case maps to ≥1 STRIDE threat from Day 1 | Cross-reference threat IDs |

## What You're Building Today

You are translating abstract threats into concrete attack narratives. Abuse cases tell the story of *how* an attacker exploits your system, making threats tangible and testable.

### ✅ Deliverables

- Ten structured abuse cases.
- Risk-ranked priority list.
- Response playbooks for top 3.

```markdown
## Abuse Case #1: Forged Attestation Injection

**Attacker:** Malicious insider with network access to attestation pipeline
**Goal:** Inject a forged attestation to grant trust to a compromised binary
**Vector:** Bypass API gateway → directly POST to attestation-worker internal endpoint
**Impact:** CRITICAL — compromised binary receives valid trust attestation
**Detection Signal:**
  - Attestation requests from non-gateway source IPs
  - trust_attestation_source_anomaly counter > 0
  - Audit log shows attestation without matching verify request
**Response Action:**
  1. Immediately revoke the suspicious attestation
  2. Block source IP at network level
  3. Trigger full attestation audit for past 24 hours
  4. Page security-oncall + trust-team lead
**STRIDE Mapping:** Spoofing (TB-4), Tampering (TB-4)
```

You **can:**
- Reference real-world attack patterns from MITRE ATT&CK.
- Include both external and insider threat actors.
- Vary attacker skill levels (script kiddie to nation-state).
- Reference CVE databases for known vulnerability patterns.

You **cannot yet:**
- Map controls to these cases (that's Day 3).
- Write automated tests (that's Day 5).
- Validate detection signals against real traffic (spec-first).
- Implement response automation (playbooks are manual-first).

## Why This Matters

🔴 **Without abuse cases:**
- Threats remain abstract — teams don't know *how* attacks happen.
- Detection logic is guesswork — you alert on symptoms, not causes.
- Incident response is improvised during active breaches.
- Security reviews focus on code quality, not attack scenarios.

🟢 **With abuse cases:**
- Every high-risk threat has a concrete "how the attack works" narrative.
- Detection signals are designed to catch specific attack patterns.
- Response playbooks cut MTTR during real incidents.
- Security testing targets realistic attack scenarios.

🔗 **Connects:**
- **Day 1** (Threat model) → abuse cases operationalize STRIDE threats.
- **Day 3** (Control matrix) → each abuse case gets preventive + detective controls.
- **Week 21** (Alert rules) → detection signals become alert conditions.
- **Day 5** (Security test plan) → abuse cases become test scenarios.
- **Week 24** (Interview) → "tell me about a security decision" answer.

🧠 **Mental model: "Think Like the Attacker"** — For every trust guarantee your system makes, an abuse case asks: "How would I break this promise if I were motivated, skilled, and had 6 months?" The best security engineers aren't the ones who build walls — they're the ones who can think around them.

## Visual Model

```
┌─────────────────────────────────────────────────────┐
│              ABUSE CASE ANATOMY                      │
│                                                      │
│  ┌──────────┐                                        │
│  │ ATTACKER │  motivation + capability               │
│  └────┬─────┘                                        │
│       │                                              │
│       ▼                                              │
│  ┌──────────┐    ┌──────────┐                        │
│  │  VECTOR  │───▶│  TARGET  │  trust boundary        │
│  │ (how)    │    │ (what)   │  crossing              │
│  └──────────┘    └────┬─────┘                        │
│                       │                              │
│            ┌──────────┴──────────┐                   │
│            ▼                     ▼                    │
│     ┌─────────────┐      ┌─────────────┐             │
│     │   IMPACT    │      │  DETECTION  │             │
│     │ (damage)    │      │  (signal)   │             │
│     └─────────────┘      └──────┬──────┘             │
│                                 │                    │
│                                 ▼                    │
│                          ┌─────────────┐             │
│                          │  RESPONSE   │             │
│                          │ (playbook)  │             │
│                          └─────────────┘             │
│                                                      │
│  Priority = Impact × Likelihood ÷ Detection Ease     │
└─────────────────────────────────────────────────────┘
```

## Build

File: `week-22/day2-abuse-cases.md`

## Do

1. **Select the top 10 threats from your Day 1 STRIDE analysis**
   > 💡 *WHY: Not every threat deserves an abuse case. Focus on the ones rated Critical or High — those are where real damage occurs.*
   Sort your Day 1 threats by risk rating. Pick the top 10 and create a stub for each abuse case.

2. **Write the attacker narrative for each abuse case**
   > 💡 *WHY: A named attacker with motivation makes the threat visceral. "Malicious insider" is more actionable than "unauthorized access."*
   For each case, define: who is the attacker, what do they want, what access do they have, and what is their skill level.

3. **Define the attack vector step-by-step**
   > 💡 *WHY: The vector turns a theoretical threat into a reproducible attack path. If you can't describe the steps, you can't test for it.*
   Write 3-5 concrete steps the attacker takes. Include which trust boundary they cross and what tools they might use. Be specific: "Attacker uses Burp Suite to intercept the API request between TB-1 and TB-2, modifies the payload hash, and forwards to verify-service." Vague vectors like "attacker gains access" are useless for testing. Each step should reference a specific component, protocol, or API endpoint from your architecture.

4. **Specify detection signals and monitoring hooks**
   > 💡 *WHY: Abuse cases without detection signals are academic exercises. The detection signal is what makes the abuse case operationally useful.*
   For each case, name the specific metric, log pattern, or anomaly that would reveal the attack. Reference Day 2 metrics where applicable. Detection signals should be concrete: "trust_attestation_source_anomaly counter increments when attestation requests arrive from non-gateway source IPs" not "monitor for unusual activity." Include both real-time signals (metrics/alerts) and forensic signals (audit log patterns) — real-time catches attacks in progress; forensic detects attacks after the fact.

5. **Write response playbooks for the top 3**
   > 💡 *WHY: The top 3 abuse cases are your most likely security incidents. Pre-written playbooks cut response time from hours to minutes.*
   For each of the top 3 by risk, write a 1-page playbook: immediate actions (contain the blast radius within 5 minutes), investigation steps (determine scope and root cause), communication plan (who to notify: security team, management, potentially affected users), and post-incident review trigger. Include rollback procedures and evidence preservation steps — you need to collect forensic data before cleaning up the compromise.

## Done when

- [ ] 10 abuse cases documented with all 6 fields filled — *comprehensive attack surface coverage*
- [ ] Risk ranking applied and top 3 identified — *drives security investment priority*
- [ ] Detection signals reference specific metrics or log patterns — *feeds Day 5 security tests*
- [ ] Top 3 playbooks written with step-by-step response — *ready for incident response*
- [ ] Document committed to `week-22/day2-abuse-cases.md` — *referenced by Day 3 control matrix*

## Proof

Upload or paste your abuse cases document.

**Quick self-test:**

Q: Why include detection signals in abuse cases?
**A: Because a threat you can't detect is a threat you can't respond to. Detection signals bridge the gap between threat modeling and operational security.**

Q: What makes a good attacker narrative?
**A: It names the actor type (insider/external), motivation (financial/ideological), skill level, and initial access — making the scenario concrete and testable.**

Q: How do you prioritize which abuse cases get full playbooks?
**A: By risk rank (impact × likelihood). The top 3 get playbooks because they represent the most likely and damaging scenarios.**
