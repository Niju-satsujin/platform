---
id: w20-failure-survival-hardening-d04-key-compromise-runbook
part: w20-failure-survival-hardening
title: "Key Compromise Runbook"
order: 4
duration_minutes: 120
prereqs: ["w20-failure-survival-hardening-d03-partition-drill"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Key Compromise Runbook

## Goal

Implement and validate a key-compromise runbook that, when executed, ensures: (1) the compromised key is immediately revoked, (2) no new documents can be signed with the compromised key after the cutoff timestamp, (3) all existing documents signed with the key are re-evaluated against the revocation policy, and (4) a new key is rotated in with zero-overlap (emergency rotation).

### ✅ Deliverables

1. A `KeyCompromiseRunbook` class that orchestrates the full response: detect → revoke → rotate → re-evaluate → report.
2. Revocation enforcement: after the cutoff, `resolve_key()` returns `nullopt` for the compromised key, and `issue()` refuses to sign.
3. Emergency rotation: new key activated with zero overlap (the old key is dead immediately).
4. Re-evaluation scan: all documents signed by the compromised key are flagged for review.
5. Shipped design document: `week-20/day4-key-compromise-runbook.md`.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Compromised key cannot sign after cutoff | Call `issue()` with compromised key after revoke → error |
| 2 | `resolve_key()` returns nullopt for compromised key | Query timeline after revoke → nullopt |
| 3 | New key is active with zero overlap | Check timeline: old deactivated_at = new activated_at |
| 4 | Re-evaluation flags all documents signed by compromised key | Scan returns ≥ 1 flagged document |
| 5 | Runbook report includes all steps with timestamps | Inspect report for all 5 phases |

## What You're Building Today

You are building the "break glass" procedure for the worst-case scenario: an issuer's private key has been compromised. An attacker can forge civic documents. Every second counts. The runbook automates the response so that a human operator can execute it under pressure without forgetting a step.

### ✅ Deliverables

- `key_compromise_runbook.h` / `key_compromise_runbook.cpp` — orchestrator
- `emergency_rotation.cpp` — zero-overlap key rotation
- `document_reevaluator.cpp` — scan and flag affected documents
- `runbook_test.cpp` — end-to-end runbook execution test

```cpp
// key_compromise_runbook.h
#pragma once
#include "issuer_key_policy.h"
#include "revocation_registry.h"
#include <string>
#include <vector>
#include <cstdint>

struct CompromiseReport {
    int64_t     detected_at;
    int64_t     revoked_at;
    int64_t     new_key_activated_at;
    std::string compromised_key_id;
    std::string new_key_id;
    size_t      documents_flagged;
    size_t      documents_still_valid;  // signed before compromise
    bool        all_steps_completed;
};

class KeyCompromiseRunbook {
public:
    KeyCompromiseRunbook(
        IssuerKeyPolicy& policy,
        RevocationRegistry& registry);

    // Execute the full runbook
    CompromiseReport execute(
        const std::string& compromised_key_id,
        int64_t cutoff_timestamp,
        const std::string& new_key_pem);

private:
    // Phase 1: Immediately revoke the compromised key
    void revoke_key(const std::string& key_id, int64_t cutoff);

    // Phase 2: Emergency-rotate to new key (zero overlap)
    void emergency_rotate(const std::string& new_key_pem, int64_t now);

    // Phase 3: Re-evaluate all documents signed by the key
    size_t reevaluate_documents(const std::string& key_id, int64_t cutoff);

    IssuerKeyPolicy&    policy_;
    RevocationRegistry& registry_;
};
```

You **can**:
- Execute a structured key-compromise response in under 60 seconds.
- Guarantee no new signatures from the compromised key after the cutoff.

You **cannot yet**:
- Validate that the system survives a crash *during* the runbook execution (Day 5).
- Automatically detect key compromise (requires external threat intelligence).

## Why This Matters

🔴 **Without a key-compromise runbook:**
- Operators panic and forget steps — the compromised key remains active for hours.
- New documents continue to be signed with the compromised key.
- No systematic re-evaluation — documents forged before detection remain trusted.
- Emergency rotation is improvised — mistakes cause a second outage.

🟢 **With a key-compromise runbook:**
- Response is automated — operator triggers the runbook, steps execute in sequence.
- Compromised key is dead within seconds of detection.
- Zero-overlap rotation ensures no gap where neither key is active.
- Re-evaluation flags all affected documents for manual review.

🔗 **Connects:**
- **Week 17 Day 2** (key policy) — `IssuerKeyPolicy` timeline is modified by the runbook.
- **Week 17 Day 4** (revocation) — `RevocationRegistry` receives the compromised key.
- **Week 18 Day 5** (attack matrix) — `FORGED_LOG` may indicate key compromise.
- **Week 20 Day 1** (chaos matrix) — this runbook is CT-003 from the matrix.
- **Week 20 Day 5** (restore validation) — restore must preserve the revocation state.

🧠 **Mental model: "Fire Extinguisher Protocol"** — When a fire breaks out, you don't design a fire extinguisher — you grab the one already mounted on the wall, follow the PASS technique (Pull, Aim, Squeeze, Sweep), and evacuate. The key-compromise runbook is your fire extinguisher — pre-built, tested, and ready for the emergency.

## Visual Model

```
┌──────────── Key Compromise Runbook ──────────────────────┐
│                                                           │
│  ⚠ ALERT: Key "key-A" compromised                        │
│       │                                                   │
│       ▼                                                   │
│  Phase 1: REVOKE                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  RevocationRegistry.add("key-A", cutoff_ts)        │  │
│  │  IssuerKeyPolicy.deactivate("key-A", cutoff_ts)    │  │
│  │  Result: key-A DEAD after cutoff_ts                 │  │
│  └────────────────────────────────────────────────────┘  │
│       ▼                                                   │
│  Phase 2: EMERGENCY ROTATE                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │  IssuerKeyPolicy.add_key("key-B", activated=now)   │  │
│  │  Overlap window: 0 (emergency)                      │  │
│  │  Result: key-B ACTIVE immediately                   │  │
│  └────────────────────────────────────────────────────┘  │
│       ▼                                                   │
│  Phase 3: RE-EVALUATE                                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Scan all docs signed by "key-A"                    │  │
│  │  Flag docs signed after cutoff → SUSPECT            │  │
│  │  Docs signed before cutoff → VALID (non-retroactive)│  │
│  └────────────────────────────────────────────────────┘  │
│       ▼                                                   │
│  CompromiseReport { revoked, rotated, N flagged }         │
└───────────────────────────────────────────────────────────┘
```

## Build

File: `week-20/day4-key-compromise-runbook.md`

## Do

### 1. **Implement Phase 1: Immediate revocation**

> 💡 *WHY: Every second the compromised key remains active, the attacker can forge documents. Revocation must be the first action — before rotation, before re-evaluation.*

Write `revoke_key()`: add the key ID to the `RevocationRegistry` with the cutoff timestamp. Call `IssuerKeyPolicy::deactivate()` with the same timestamp. After this, `resolve_key()` returns `nullopt` for any timestamp ≥ cutoff.

### 2. **Implement Phase 2: Emergency rotation**

> 💡 *WHY: After revoking the old key, a new key must be available immediately. Zero overlap means the old key is dead and the new key is live at the same instant.*

Write `emergency_rotate()`: create a new `KeySlot` with `activated_at = now` and add it to the timeline. Verify that the gap between old deactivation and new activation is zero. The system should never be in a state where no key is active.

### 3. **Implement Phase 3: Document re-evaluation**

> 💡 *WHY: Documents signed by the compromised key after the compromise point are suspect. They might be legitimate (signed before the attacker gained access) or forged (signed by the attacker). Flagging them enables human review.*

Write `reevaluate_documents()`: query the document store for all envelopes where `signing_key_id == compromised_key_id`. For each, check if `signed_at >= cutoff_timestamp`. If so, flag as `SUSPECT`. If `signed_at < cutoff_timestamp`, keep as `VALID` (non-retroactive policy from Week 17 Day 4).

### 4. **Wire the full runbook and generate the report**

> 💡 *WHY: The report is the audit trail for the incident. It proves every step was executed and records the outcome.*

Implement `execute()`: call Phase 1 → Phase 2 → Phase 3 in sequence. Record timestamps for each phase. Populate `CompromiseReport` with all metrics. Assert `all_steps_completed = true`.

### 5. **Document the runbook procedure**

> 💡 *WHY: The code automates the execution, but the document explains the decisions: why zero overlap, why non-retroactive, what to do with flagged documents.*

Write `week-20/day4-key-compromise-runbook.md` covering: trigger conditions (how compromise is detected), runbook phases with decision rationale, rollback procedure (what if the new key is also compromised?), and communication plan (who is notified at each phase).

## Done when

- [ ] Compromised key cannot sign new documents after the cutoff timestamp — *the core safety guarantee: the forgery window is closed*
- [ ] Emergency rotation activates a new key with zero overlap — *no gap where the system is unable to issue*
- [ ] Documents signed before the cutoff remain VALID (non-retroactive) — *preserves trust in historical records*
- [ ] Documents signed after the cutoff are flagged as SUSPECT — *enables manual review for potential forgeries*
- [ ] Runbook report includes timestamps, key IDs, and document counts — *the audit trail for the incident response*

## Proof

Upload `week-20/day4-key-compromise-runbook.md` and a terminal screenshot showing: the runbook executing all three phases, the compromised key rejected on a post-cutoff `issue()` call, and the report showing flagged documents.

### **Quick self-test**

**Q1:** Why zero overlap instead of the normal 24-72 hour window?
→ **A: In a compromise scenario, the attacker has the old key's private material. Any overlap window gives them that much more time to forge documents. Zero overlap minimises the forgery window to essentially zero.**

**Q2:** Why is revocation non-retroactive even for a compromised key?
→ **A: Retroactive revocation would invalidate every document ever signed by that key — including legitimate ones issued before the compromise. This would cause massive collateral damage. Instead, documents before the cutoff remain valid, and documents after are flagged for review.**

**Q3:** What if the compromise is detected days after it happened?
→ **A: Set the `cutoff_timestamp` to the estimated time of compromise (not the detection time). All documents signed between compromise and detection are flagged as SUSPECT. This requires forensic analysis to estimate the compromise time accurately.**
