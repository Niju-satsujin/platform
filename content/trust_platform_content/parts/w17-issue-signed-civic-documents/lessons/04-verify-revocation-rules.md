---
id: w17-issue-signed-civic-documents-d04-verify-revocation-rules
part: w17-issue-signed-civic-documents
title: "Verify & Revocation Rules"
order: 4
duration_minutes: 120
prereqs: ["w17-issue-signed-civic-documents-d03-issue-workflow"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Verify & Revocation Rules

## Goal

Build a verification engine and a revocation registry so that: (1) any signed civic document can be verified against its issuer's key timeline, and (2) a revoked document or issuer key fails verification even when the cryptographic signature is mathematically valid.

### ✅ Deliverables

1. A `verify()` function that checks signature validity, key-timeline membership, and revocation status.
2. A `RevocationRegistry` that stores revoked document hashes and revoked key IDs with effective timestamps.
3. Verification returns a typed verdict: `VALID`, `INVALID_SIGNATURE`, `KEY_EXPIRED`, `DOCUMENT_REVOKED`, or `ISSUER_REVOKED`.
4. Unit tests for every verdict path, including edge cases at revocation boundaries.
5. Shipped design document: `week-17/day4-verify-revocation-rules.md`.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Valid document + active key → `VALID` | Issue, then verify immediately |
| 2 | Tampered document → `INVALID_SIGNATURE` | Flip byte, verify |
| 3 | Expired key (past overlap) → `KEY_EXPIRED` | Set clock past grace, verify |
| 4 | Revoked document hash → `DOCUMENT_REVOKED` | Add hash to registry, verify |
| 5 | Revoked issuer key → `ISSUER_REVOKED` | Revoke key ID, verify |

## What You're Building Today

You are building the "judge" that every verifier in the CivicTrust network runs. It takes a signed envelope and answers one question: "Should I trust this document right now?" The answer is never a probability — it is one of five discrete verdicts.

### ✅ Deliverables

- `verify.h` / `verify.cpp` — verification engine
- `revocation_registry.h` / `revocation_registry.cpp` — revocation store
- `verdict.h` — typed verdict enum
- `verify_test.cpp` — tests for all five verdict paths

```cpp
// verdict.h
#pragma once

enum class Verdict {
    VALID,
    INVALID_SIGNATURE,
    KEY_EXPIRED,
    DOCUMENT_REVOKED,
    ISSUER_REVOKED
};

const char* verdict_to_string(Verdict v);
```

You **can**:
- Verify any signed envelope and get a deterministic, typed verdict.
- Revoke individual documents or entire issuer keys.

You **cannot yet**:
- Enforce pre-signing policy gates (Day 5).
- Anchor revocation events to a transparency log (Week 18).
- Perform offline verification without network access (Week 19).

## Why This Matters

🔴 **Without revocation rules:**
- A leaked key signs unlimited forged documents until physical key destruction.
- Fraudulent documents remain "valid" forever — no recall mechanism.
- Verifiers must maintain ad-hoc blocklists with no standard format.
- No distinction between "bad signature" and "revoked issuer" — debugging is impossible.

🟢 **With revocation rules:**
- Revoked keys are dead within one registry sync cycle.
- Individual documents can be recalled without revoking the entire issuer.
- Every verifier returns the same typed verdict for the same input.
- Incident response has a clear lever: revoke key or revoke document.

🔗 **Connects:**
- **Week 17 Day 2** (key policy) — key deactivation is soft revocation; hard revocation is today's addition.
- **Week 17 Day 3** (issue workflow) — the `SignedEnvelope` is the input to `verify()`.
- **Week 18 Day 1** (anchoring) — revocation events are anchored for auditability.
- **Week 19 Day 3** (air-gap verification) — offline verifiers carry a revocation registry snapshot.
- **Week 20 Day 4** (key compromise runbook) — runbook's first step adds compromised key here.

🧠 **Mental model: "Credit-Card Stop List"** — When a credit card is stolen, the bank adds it to a stop list. Every terminal checks the stop list before approving a transaction. The revocation registry is your stop list — cryptographic validity alone is not sufficient; the card must also not be cancelled.

## Visual Model

```
┌────────────────── verify(envelope) ──────────────────┐
│                                                       │
│  Step 1: Deserialise envelope                         │
│       │                                               │
│       ▼                                               │
│  Step 2: Check RevocationRegistry                     │
│       ├── doc hash revoked? ──▶ DOCUMENT_REVOKED      │
│       ├── key ID revoked?   ──▶ ISSUER_REVOKED        │
│       │                                               │
│       ▼                                               │
│  Step 3: Resolve key from IssuerKeyPolicy             │
│       ├── no key found?     ──▶ KEY_EXPIRED           │
│       │                                               │
│       ▼                                               │
│  Step 4: EVP_DigestVerify(hash, sig, pubkey)          │
│       ├── verify fails?     ──▶ INVALID_SIGNATURE     │
│       │                                               │
│       ▼                                               │
│  Step 5: All checks pass    ──▶ VALID                 │
└───────────────────────────────────────────────────────┘
```

## Build

File: `week-17/day4-verify-revocation-rules.md`

## Do

### 1. **Define the verdict enum and revocation registry**

> 💡 *WHY: A typed enum prevents stringly-typed errors. A registry with timestamps enables "revoked as of" queries for archival verification.*

Create `verdict.h` with the five verdicts. Create `RevocationRegistry` with two maps: `revoked_documents` (hash → revocation timestamp) and `revoked_keys` (key ID → revocation timestamp).

### 2. **Implement the verification pipeline**

> 💡 *WHY: The order of checks matters — revocation checks must come before signature verification to avoid wasting CPU on revoked documents.*

Write `verify()` in `verify.cpp`. Order: (a) check document hash against revocation registry, (b) check signing key ID against revocation registry, (c) resolve key from `IssuerKeyPolicy`, (d) verify signature. Return the first failing verdict.

### 3. **Implement revocation-aware key resolution**

> 💡 *WHY: A key can be in-timeline (not yet deactivated) but explicitly revoked. Revocation overrides the timeline.*

Before calling `resolve_key()`, check if the `signing_key_id` is in `revoked_keys`. If revoked and the revocation timestamp is ≤ the document's `signed_at`, return `ISSUER_REVOKED`.

### 4. **Write comprehensive verdict tests**

> 💡 *WHY: Every verdict path must have a test. Untested paths become silent failure modes.*

Create a test for each verdict: (a) happy path → `VALID`, (b) flip a byte → `INVALID_SIGNATURE`, (c) advance clock past overlap → `KEY_EXPIRED`, (d) add doc hash to registry → `DOCUMENT_REVOKED`, (e) add key ID to registry → `ISSUER_REVOKED`. Also test: revoke key *after* signing time — document should still be `VALID` because revocation is not retroactive.

### 5. **Document the revocation model**

> 💡 *WHY: Policy decisions (e.g., "is revocation retroactive?") must be written down before they become implicit assumptions.*

Write `week-17/day4-verify-revocation-rules.md` covering: revocation vs. deactivation, retroactivity policy (non-retroactive by default), registry sync protocol, and emergency mass-revocation procedure.

## Done when

- [ ] `verify()` returns `VALID` for a freshly issued, non-revoked envelope — *baseline correctness for all downstream verification*
- [ ] Revoking a document hash causes `verify()` to return `DOCUMENT_REVOKED` — *individual recall is the first incident-response lever*
- [ ] Revoking an issuer key causes `verify()` to return `ISSUER_REVOKED` — *mass recall when a key is compromised, used in Week 20 Day 4*
- [ ] Revocation is non-retroactive — documents signed before the revocation timestamp remain `VALID` — *preserves trust in historical records*
- [ ] Design doc specifies revocation model, sync protocol, and emergency procedures — *Week 20 chaos drills reference this document*

## Proof

Upload `week-17/day4-verify-revocation-rules.md` and a terminal screenshot showing all five verdict tests passing.

### **Quick self-test**

**Q1:** Why check revocation *before* signature verification?
→ **A: Signature verification is CPU-expensive (elliptic-curve math). Revocation checks are hash lookups — O(1). Checking revocation first avoids wasting cycles on documents that are already dead.**

**Q2:** Should revocation be retroactive?
→ **A: No, by default. A document signed at time T with a key revoked at T+1 was valid at signing time. Retroactive revocation would destroy trust in the entire historical archive. Exception: key compromise with proven pre-compromise misuse.**

**Q3:** How does a verifier get the latest revocation registry?
→ **A: In online mode, the verifier pulls from a replicated registry service. In offline mode (Week 19), the verifier uses a bundled snapshot with a freshness timestamp. Stale snapshots are flagged but not hard-rejected in archival mode.**
