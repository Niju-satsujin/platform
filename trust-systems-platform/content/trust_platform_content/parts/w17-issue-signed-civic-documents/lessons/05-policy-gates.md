---
id: w17-issue-signed-civic-documents-d05-policy-gates
part: w17-issue-signed-civic-documents
title: "Policy Gates"
order: 5
duration_minutes: 120
prereqs: ["w17-issue-signed-civic-documents-d04-verify-revocation-rules"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Policy Gates

## Goal

Build a pre-signing policy gate system that evaluates a set of configurable rules against a `CivicDocument` *before* the signing ceremony begins. If any gate fails, the document is rejected — no signature is produced. Policy validation occurs before signing, never after.

### ✅ Deliverables

1. A `PolicyGate` interface with a `evaluate(doc) → pass/fail + reason` method.
2. At least four concrete gates: schema version check, expiration range check, issuer authorization check, and payload size limit.
3. A `PolicyEngine` that runs all registered gates and produces a composite verdict.
4. Integration with the issue workflow — `issue()` calls the policy engine before signing.
5. Shipped design document: `week-17/day5-policy-gates.md`.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Schema version gate rejects version 0 | Submit doc with `schema_version=0` → blocked |
| 2 | Expiration gate rejects documents expiring > 10 years out | Set `expiration_ts` to 11 years → blocked |
| 3 | Issuer authorization gate rejects unknown issuers | Use issuer ID not in allowlist → blocked |
| 4 | All gates pass → signing proceeds | Submit valid doc → `SignedEnvelope` returned |
| 5 | Policy engine reports which gate failed | Error message includes gate name and reason |

## What You're Building Today

You are building the bouncer at the door of the signing ceremony. No document gets signed unless it passes every policy gate. This prevents garbage-in from becoming cryptographically-blessed garbage-out.

### ✅ Deliverables

- `policy_gate.h` — interface definition
- `builtin_gates.cpp` — four concrete gate implementations
- `policy_engine.h` / `policy_engine.cpp` — composite evaluator
- `policy_test.cpp` — tests for each gate and the composite engine

```cpp
// policy_gate.h
#pragma once
#include "civic_document.h"
#include <string>
#include <memory>
#include <vector>

struct GateResult {
    bool        passed;
    std::string gate_name;
    std::string reason;  // empty if passed
};

class PolicyGate {
public:
    virtual ~PolicyGate() = default;
    virtual GateResult evaluate(const CivicDocument& doc) const = 0;
};

class PolicyEngine {
public:
    void register_gate(std::unique_ptr<PolicyGate> gate);
    std::vector<GateResult> evaluate_all(const CivicDocument& doc) const;
    bool all_passed(const CivicDocument& doc) const;
private:
    std::vector<std::unique_ptr<PolicyGate>> gates_;
};
```

You **can**:
- Block invalid documents from ever being signed.
- Get a detailed report of which gates passed and which failed.

You **cannot yet**:
- Anchor policy decisions to a transparency log (Week 18).
- Enforce policy in offline mode (Week 19).
- Dynamically update policies at runtime without restart (future enhancement).

## Why This Matters

🔴 **Without policy gates:**
- Malformed documents get signed — verifiers waste time on obviously invalid envelopes.
- An issuer can sign documents with 100-year expirations, creating long-lived forgery targets.
- Unauthorized entities can invoke the signing ceremony if they have key access.
- No audit trail of *why* a document was or wasn't signed.

🟢 **With policy gates:**
- Only structurally and semantically valid documents reach the signing ceremony.
- Expiration bounds, issuer allowlists, and size limits are enforced uniformly.
- Every rejected document produces a typed, auditable rejection reason.
- New policies are added by implementing one interface — no core code changes.

🔗 **Connects:**
- **Week 15** (trust policy engine) — generic policy framework; today's gates are civic-document-specific.
- **Week 17 Day 1** (document schema) — schema version gate references the schema spec.
- **Week 17 Day 3** (issue workflow) — `issue()` calls `policy_engine.all_passed()` before signing.
- **Week 18 Day 1** (anchoring) — anchoring receipt includes policy-engine verdict hash.
- **Week 20 Day 1** (chaos matrix) — chaos tests inject documents that should be policy-rejected.

🧠 **Mental model: "Airport Security Checkpoint"** — Before you board (signing), you pass through multiple screening gates: ID check, metal detector, bag scan, boarding-pass scan. Fail any one, and you don't board. The plane (signed envelope) only carries passengers who passed all gates.

## Visual Model

```
┌───────────────── Policy Engine ──────────────────┐
│                                                   │
│  CivicDocument ──▶ ┌─────────────────────┐       │
│                    │  Gate: SchemaVersion │──pass──┤
│                    └─────────────────────┘       │
│                    ┌─────────────────────┐       │
│                    │  Gate: Expiration    │──pass──┤
│                    └─────────────────────┘       │
│                    ┌─────────────────────┐       │
│                    │  Gate: IssuerAuth   │──FAIL──┤
│                    └─────────────────────┘       │
│                    ┌─────────────────────┐       │
│                    │  Gate: PayloadSize  │──pass──┤
│                    └─────────────────────┘       │
│                                                   │
│  Composite: BLOCKED (IssuerAuth: unknown issuer)  │
│  ──▶ Signing ceremony NOT invoked                 │
└───────────────────────────────────────────────────┘
```

## Build

File: `week-17/day5-policy-gates.md`

## Do

### 1. **Define the PolicyGate interface**

> 💡 *WHY: A virtual interface lets you add new gates without modifying the engine. Open for extension, closed for modification.*

Create `policy_gate.h` with the `PolicyGate` base class and `GateResult` struct. Every gate returns a named, reason-bearing result — not just a bool.

### 2. **Implement four built-in gates**

> 💡 *WHY: These four represent the minimum viable policy set. Each addresses a distinct class of invalid document.*

Implement in `builtin_gates.cpp`: (a) `SchemaVersionGate` — rejects `schema_version < 1`, (b) `ExpirationRangeGate` — rejects expiration > configurable max (default 10 years), (c) `IssuerAuthorizationGate` — rejects issuer IDs not in a provided allowlist, (d) `PayloadSizeGate` — rejects payload hash if companion payload exceeds configurable max bytes.

### 3. **Build the PolicyEngine composite**

> 💡 *WHY: Running all gates (not short-circuiting) gives operators a complete diagnostic. Short-circuiting hides secondary issues.*

Implement `evaluate_all()` — iterate all registered gates, collect results. Implement `all_passed()` — returns true only if every `GateResult::passed` is true.

### 4. **Integrate with the issue workflow**

> 💡 *WHY: Policy enforcement must be mandatory, not optional. Integrating into `issue()` makes it impossible to skip.*

Modify `issue()` from Day 3: before calling `resolve_key()`, call `policy_engine.all_passed(doc)`. If any gate fails, return the composite error — never produce a signature. Write an integration test that attempts to sign a policy-violating document and asserts no envelope is produced.

### 5. **Document the policy framework**

> 💡 *WHY: Future gate authors need a clear contract: what inputs they receive, what outputs they must produce, and how to register their gate.*

Write `week-17/day5-policy-gates.md` covering: gate interface contract, built-in gate specifications, how to add a custom gate, policy engine execution order (all gates, no short-circuit), and how policy verdicts are logged for audit.

## Done when

- [ ] All four built-in gates correctly accept valid documents and reject their respective violations — *these gates protect the signing ceremony from garbage input*
- [ ] `PolicyEngine` runs all gates and produces a composite diagnostic — *no gate failure is hidden, aiding operator debugging*
- [ ] `issue()` refuses to sign when any gate fails — *policy enforcement is mandatory, not advisory*
- [ ] Error messages include the gate name and a human-readable reason — *Week 20 chaos tests parse these for automated validation*
- [ ] Design doc describes interface contract, built-in gates, and custom-gate authoring guide — *future teams extend the policy set without modifying core code*

## Proof

Upload `week-17/day5-policy-gates.md` and a terminal screenshot showing: (1) a valid document passing all gates and being signed, and (2) an invalid document blocked by at least two different gates.

### **Quick self-test**

**Q1:** Why run all gates instead of short-circuiting on the first failure?
→ **A: Operators need the full diagnostic. If a document fails three gates, showing only the first forces them to fix-and-retry three times. Running all gates gives the complete picture in one attempt.**

**Q2:** Can a gate modify the document?
→ **A: No. Gates receive a `const CivicDocument&`. They are pure validators — they observe but never mutate. Mutation before signing would break the canonical-hash chain from Day 1.**

**Q3:** What if two gates conflict (one requires a field, another forbids it)?
→ **A: This is a configuration error caught at gate-registration time. The `PolicyEngine` should validate that no two gates have contradictory requirements by checking gate metadata tags. In practice, this is enforced by code review of the gate set.**
