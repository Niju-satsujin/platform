---
id: w17-issue-signed-civic-documents-d03-issue-workflow
part: w17-issue-signed-civic-documents
title: "Issue Workflow"
order: 3
duration_minutes: 120
prereqs: ["w17-issue-signed-civic-documents-d02-issuer-key-policy"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Issue Workflow

## Goal

Implement the end-to-end issuance workflow that takes a validated `CivicDocument`, signs it with the currently active issuer key, and produces an immutable signed envelope. Once the signature is applied, the document content must be frozen — any mutation invalidates the signature.

### ✅ Deliverables

1. A `SignedEnvelope` struct wrapping the canonical document bytes, the signature, and the signing key ID.
2. An `issue()` function that resolves the active key, signs the canonical hash, and returns the envelope.
3. An immutability guard — attempting to modify the document after signing returns an error.
4. Round-trip tests: issue → serialise envelope → deserialise → verify signature.
5. Shipped design document: `week-17/day3-issue-workflow.md`.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | `SignedEnvelope` contains document bytes, signature, and key ID | Inspect struct after `issue()` call |
| 2 | Signature verifies against the canonical hash | `EVP_DigestVerify` returns 1 |
| 3 | Modifying document bytes post-sign fails verification | Flip one byte, re-verify → failure |
| 4 | `issue()` rejects if no active key exists | Call with empty timeline → error |
| 5 | Round-trip serialisation preserves all envelope fields | Deserialise and compare field-by-field |

## What You're Building Today

You are building the signing ceremony — the moment a civic document becomes an official, tamper-evident record. This is the digital equivalent of a notary pressing their seal into wax.

### ✅ Deliverables

- `signed_envelope.h` — envelope struct definition
- `issue_workflow.cpp` — orchestration: validate → resolve key → sign → freeze
- `envelope_serde.cpp` — serialise/deserialise the signed envelope
- `issue_test.cpp` — round-trip and tamper-detection tests

```cpp
// signed_envelope.h
#pragma once
#include "civic_document.h"
#include <vector>
#include <string>

struct SignedEnvelope {
    std::vector<uint8_t> canonical_bytes;   // frozen document
    std::vector<uint8_t> signature;         // Ed25519 or ECDSA
    std::string          signing_key_id;    // references key timeline
    int64_t              signed_at;         // epoch seconds
};

// Returns envelope or error string
std::variant<SignedEnvelope, std::string>
issue(const CivicDocument& doc, class IssuerKeyPolicy& policy);
```

You **can**:
- Issue a signed civic document with a tamper-evident envelope.
- Detect any post-signature modification of the document content.

You **cannot yet**:
- Revoke a document or issuer key (Day 4).
- Enforce policy gates before signing (Day 5).
- Anchor the signed envelope to a transparency log (Week 18).

## Why This Matters

🔴 **Without an issue workflow:**
- Signing is ad-hoc — different issuers produce incompatible envelopes.
- No immutability guarantee — content can be silently altered after signing.
- Key selection is manual and error-prone — operators pick the wrong key.
- No audit trail of when the signature was applied.

🟢 **With an issue workflow:**
- Every issuer follows the same ceremony: validate → resolve → sign → freeze.
- Immutability is enforced structurally — canonical bytes are sealed at sign time.
- Key resolution is automatic — the policy engine picks the correct key.
- `signed_at` timestamp creates an auditable issuance timeline.

🔗 **Connects:**
- **Week 17 Day 1** (document schema) — canonical bytes come from `canonical_serialise()`.
- **Week 17 Day 2** (key policy) — `resolve_key()` selects the signing key.
- **Week 17 Day 4** (revocation) — revocation checks reference the `signing_key_id`.
- **Week 18 Day 1** (anchoring) — the signed envelope is the input to the anchoring workflow.
- **Week 19 Day 2** (offline bundle) — the envelope is packaged for offline verification.

🧠 **Mental model: "Wax Seal on a Letter"** — Once the wax seal is pressed, breaking the seal to change the letter is visible to everyone. The `SignedEnvelope` is your wax seal: the canonical bytes are the letter, and the signature is the impression. Crack it open, and the signature no longer matches.

## Visual Model

```
┌──────────────────────────────────────────────┐
│              Issue Workflow                   │
│                                              │
│  CivicDocument                               │
│       │                                      │
│       ▼                                      │
│  canonical_serialise() ──▶ canonical_bytes   │
│       │                                      │
│       ▼                                      │
│  canonical_hash() ──▶ hash [32 bytes]        │
│       │                                      │
│       ▼                                      │
│  IssuerKeyPolicy::resolve_key(now)           │
│       │                                      │
│       ▼                                      │
│  sign(hash, private_key) ──▶ signature       │
│       │                                      │
│       ▼                                      │
│  ┌─── SignedEnvelope ────────────────────┐   │
│  │ canonical_bytes  (frozen, immutable)  │   │
│  │ signature        (Ed25519 / ECDSA)    │   │
│  │ signing_key_id   (timeline ref)       │   │
│  │ signed_at        (epoch seconds)      │   │
│  └───────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

## Build

File: `week-17/day3-issue-workflow.md`

## Do

### 1. **Define the SignedEnvelope struct**

> 💡 *WHY: A well-typed envelope prevents partial construction — every field must be populated or the struct doesn't compile.*

Create `signed_envelope.h`. Store `canonical_bytes` as `std::vector<uint8_t>` (not a reference to the original document — the bytes must be self-contained). Include `signing_key_id` so verifiers can look up the public key.

### 2. **Implement the issue() orchestrator**

> 💡 *WHY: Centralising the workflow in one function ensures the validate→resolve→sign→freeze sequence cannot be skipped or reordered.*

Write `issue()` in `issue_workflow.cpp`. Steps: (a) call `canonical_serialise(doc)` to get bytes, (b) call `canonical_hash(bytes)` to get the digest, (c) call `policy.resolve_key(now)` — if `nullopt`, return error, (d) sign the digest with the resolved private key, (e) construct and return `SignedEnvelope`.

### 3. **Implement envelope serialisation**

> 💡 *WHY: The envelope must be storable and transmittable. A deterministic wire format lets any node reconstruct and verify it.*

Write `serialise_envelope()` and `deserialise_envelope()`. Use length-prefixed fields in the same style as the document canonical form. Include a 4-byte magic header (`0x43495645` — "CIVE") for format detection.

### 4. **Write tamper-detection tests**

> 💡 *WHY: If a single flipped bit goes undetected, the entire signing system is theatre.*

Issue a document. Serialise the envelope. Flip one byte in `canonical_bytes`. Deserialise. Call `EVP_DigestVerify` — it must fail. Also test: truncate `signature` by one byte — must fail. Replace `signing_key_id` with a different key — must fail.

### 5. **Document the issuance ceremony**

> 💡 *WHY: Human operators perform the ceremony in production. The document is their runbook.*

Write `week-17/day3-issue-workflow.md` covering: pre-conditions (document validated, key healthy), ceremony steps, post-conditions (envelope stored, receipt pending), and failure modes (key unavailable, signing timeout, hash mismatch).

## Done when

- [ ] `issue()` produces a valid `SignedEnvelope` with signature verifiable against the canonical hash — *this envelope is the primary input to Week 18 anchoring*
- [ ] Modifying any byte of `canonical_bytes` after signing causes verification to fail — *immutability is the core trust guarantee for all downstream verifiers*
- [ ] `issue()` returns a clear error when no active key is available — *prevents unsigned documents from entering the pipeline*
- [ ] Envelope round-trips through serialise/deserialise without data loss — *Week 19 offline bundles depend on lossless envelope serialisation*
- [ ] Design doc describes the full ceremony with pre-conditions and failure modes — *operations teams reference this during Week 20 chaos drills*

## Proof

Upload `week-17/day3-issue-workflow.md` and a terminal screenshot showing the round-trip test (issue → serialise → flip byte → verify fails) passing.

### **Quick self-test**

**Q1:** Why store `canonical_bytes` in the envelope instead of the original `CivicDocument` struct?
→ **A: The signature covers the canonical byte representation, not the in-memory struct. Storing the bytes ensures the verifier hashes exactly what was signed, with no re-serialisation ambiguity.**

**Q2:** What if `resolve_key()` returns a key that was valid one second ago but just deactivated?
→ **A: The overlap window from Day 2 handles this. The issue workflow uses `now` as the timestamp, so if the key is within the grace period, issuance proceeds. If past grace, `issue()` returns an error and the operator must retry with the new key.**

**Q3:** Why include a magic header in the envelope wire format?
→ **A: Magic bytes allow format detection without parsing. A verifier can reject non-envelope data immediately, before allocating memory for deserialisation — important for DoS resistance.**
