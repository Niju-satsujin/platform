---
id: w18-transparency-log-anchoring-d05-anchoring-attack-matrix
part: w18-transparency-log-anchoring
title: "Anchoring Attack Matrix"
order: 5
duration_minutes: 120
prereqs: ["w18-transparency-log-anchoring-d04-receipt-freshness-policy"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3, 7, 21, 60]
---

# Anchoring Attack Matrix

## Goal

Days 1–4 built the happy path: anchor, bundle, verify, enforce freshness. But attackers do not follow happy paths. Today you build a systematic attack matrix that categorizes every way an anchoring receipt can fail, maps each failure to a named attack class, and wires detection into the verifier. The three primary attack classes are `not_anchored` (never submitted to the log), `tampered` (proof doesn't match the checkpoint), and `stale` (checkpoint is too old). Every verification failure must land in exactly one category.

✅ Deliverables

- An `AttackClass` enum: `NotAnchored`, `Tampered`, `Stale`, `Valid`
- A `classify_failure()` function that maps verification failures to attack classes
- A test matrix covering all attack × verification-step combinations
- An audit log entry struct recording classified failures
- A markdown spec shipped as `week-18/day5-anchoring-attack-matrix.md`

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Missing inclusion proof → `NotAnchored` | Empty proof hashes triggers correct class |
| 2 | Corrupted proof hash → `Tampered` | Flip one byte in proof, assert `Tampered` |
| 3 | Old checkpoint → `Stale` | Set timestamp to 30 days ago, assert `Stale` |
| 4 | Valid bundle → `Valid` | Full valid bundle returns `Valid` |
| 5 | Every failure maps to exactly one class | No `Unknown` or ambiguous classifications |

## What You're Building Today

You are building the threat classification layer that sits on top of the verifier from Day 3 and the freshness policy from Day 4. Instead of returning a generic `Unverified`, the classifier examines which step failed and why, then maps it to a named attack class. This transforms opaque verification failures into actionable security intelligence that operators and monitors can respond to.

✅ Deliverables

- `AttackClass` enum with four categories
- `classify_failure()` mapping `VerificationResult` to `AttackClass`
- `AuditEntry` struct for logging classified events
- Full test matrix covering 12+ attack scenarios

```cpp
#include <string>
#include <cstdint>
#include <vector>

enum class AttackClass {
    Valid,         // All checks passed
    NotAnchored,   // Document was never submitted to the log
    Tampered,      // Proof or signature does not match
    Stale          // Checkpoint is beyond freshness window
};

struct AuditEntry {
    uint64_t     timestamp_unix;
    std::string  document_hash;
    AttackClass  classification;
    std::string  failed_step;
    std::string  reason;
    std::string  bundle_version;
};

AttackClass classify_failure(const VerificationResult& result);
AuditEntry  create_audit_entry(const ReceiptBundle& bundle,
                               const VerificationResult& result);
```

You **can:**
- Classify every verification failure into a named attack category
- Generate structured audit log entries for security monitoring
- Distinguish between accidental failures and likely attacks

You **cannot yet:**
- Aggregate attack classifications across multiple documents (W19)
- Trigger automated incident response based on classification (W20)
- Correlate attacks with specific log operator compromise events (W22)

## Why This Matters

🔴 Without an attack matrix:
- All verification failures look the same — "invalid" tells operators nothing
- Incident response cannot prioritize: a stale receipt and a forged proof get the same alarm
- Pattern detection is impossible without categorical data
- Post-mortem analysis lacks vocabulary to describe what happened

🟢 With an attack matrix:
- Every failure has a name, a category, and a response playbook
- Operators see trends: "20% of receipts classified as Stale" triggers key rotation review
- `Tampered` alerts can escalate immediately while `Stale` alerts can queue for batch review
- Audit logs become queryable: "show all NotAnchored events in the last 7 days"

🔗 Connects:
- **W15 (Transparency Log):** `NotAnchored` means the document was never added to the log
- **W16 (Monitoring):** Monitors consume `AuditEntry` records to detect equivocation patterns
- **W17 (Signed Documents):** `Tampered` may indicate issuer key compromise
- **W18 Day 3:** `classify_failure` consumes `VerificationResult` from the verifier
- **W18 Day 4:** `Stale` classification reuses `FreshnessStatus` from the freshness policy

🧠 Mental model: "Medical Triage"
The attack matrix is triage in an emergency room. Every patient (failed receipt) gets a color tag: green (Valid), yellow (Stale — needs re-anchoring), orange (NotAnchored — investigate), red (Tampered — active threat). Triage doesn't fix the patient — it routes them to the right response team.

## Visual Model

```
┌──────────────────────────────────────────────────────┐
│              ANCHORING ATTACK MATRIX                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ReceiptBundle ──▶ AnchorVerifier ──▶ Result         │
│                                          │           │
│                              ┌───────────┴────────┐  │
│                              ▼                    ▼  │
│                          Verified             Failed │
│                              │                    │  │
│                              ▼                    ▼  │
│                        ┌──────────┐    classify_failure()
│                        │  Valid   │          │        │
│                        └──────────┘    ┌─────┼─────┐ │
│                                        ▼     ▼     ▼ │
│  ┌─────────────┐  ┌───────────┐  ┌──────────────┐   │
│  │NotAnchored  │  │ Tampered  │  │    Stale     │   │
│  │             │  │           │  │              │   │
│  │ empty proof │  │ bad proof │  │ old checkpoint│   │
│  │ no leaf     │  │ bad sig   │  │ past window  │   │
│  │ missing CP  │  │ hash flip │  │ clock skew   │   │
│  └──────┬──────┘  └─────┬─────┘  └──────┬───────┘   │
│         ▼               ▼               ▼            │
│     ┌──────────────────────────────────────────┐     │
│     │              AuditEntry                  │     │
│     │  timestamp | hash | class | step | reason│     │
│     └──────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────┘
```

## Build

File: `week-18/day5-anchoring-attack-matrix.md`

## Do

1. **Implement classify_failure()**

   > 💡 *WHY: A single classification function ensures consistency. If different code paths classify the same failure differently, audit logs become unreliable and incident response makes wrong decisions.*

   Map `VerificationResult.failed_step` and `reason` to `AttackClass`:

   ```cpp
   AttackClass classify_failure(const VerificationResult& result) {
       if (result.status == VerifyStatus::Verified)
           return AttackClass::Valid;

       if (result.failed_step == "freshness")
           return AttackClass::Stale;

       if (result.failed_step == "inclusion" &&
           result.reason.find("empty") != std::string::npos)
           return AttackClass::NotAnchored;

       if (result.failed_step == "checkpoint" ||
           result.failed_step == "inclusion" ||
           result.failed_step == "hash" ||
           result.failed_step == "issuer")
           return AttackClass::Tampered;

       return AttackClass::Tampered;  // conservative default
   }
   ```

2. **Build the AuditEntry struct and factory function**

   > 💡 *WHY: Structured audit entries enable querying, aggregation, and pattern detection. Free-form log messages are human-readable but machine-unfriendly — you cannot count "all Tampered events last Tuesday" from unstructured text.*

   Implement `create_audit_entry()` to populate all fields from the bundle and verification result:

   ```cpp
   AuditEntry create_audit_entry(const ReceiptBundle& bundle,
                                  const VerificationResult& result) {
       return AuditEntry{
           .timestamp_unix  = static_cast<uint64_t>(std::time(nullptr)),
           .document_hash   = bundle.document_hash,
           .classification  = classify_failure(result),
           .failed_step     = result.failed_step,
           .reason          = result.reason,
           .bundle_version  = bundle.bundle_version
       };
   }
   ```

3. **Build the comprehensive test matrix**

   > 💡 *WHY: The test matrix is the specification. If a failure mode is not tested, it is not classified — and unclassified failures become security blind spots. Every cell in the matrix must have a test.*

   Implement tests for each row in this matrix:

   | # | Attack scenario | Mutation | Expected class |
   |---|-----------------|----------|----------------|
   | 1 | Never anchored — empty proof | Clear `proof_hashes` | `NotAnchored` |
   | 2 | Never anchored — zero leaf index + empty proof | Set both | `NotAnchored` |
   | 3 | Tampered — corrupted proof hash | Flip byte in `proof_hashes[0]` | `Tampered` |
   | 4 | Tampered — wrong root hash | Replace `root_hash` | `Tampered` |
   | 5 | Tampered — forged checkpoint sig | Randomize `checkpoint_signature` | `Tampered` |
   | 6 | Tampered — wrong issuer sig | Swap `issuer_signature` | `Tampered` |
   | 7 | Tampered — document hash mismatch | Change `document_hash` | `Tampered` |
   | 8 | Stale — old checkpoint | Set `timestamp_unix` to 30 days ago | `Stale` |
   | 9 | Stale — clock skew | Set `timestamp_unix` to future + 1 hour | `Stale` |
   | 10 | Valid — all correct | No mutation | `Valid` |

4. **Implement audit log serialization**

   > 💡 *WHY: Audit entries must be stored durably and queried later. A JSON-lines format (one JSON object per line) enables simple append-only storage and line-by-line parsing for analysis tools.*

   Serialize `AuditEntry` to JSON-lines format (one JSON object per line, appended to `audit.jsonl`). Use `attack_class_to_string()` mapping `Valid→"valid"`, `NotAnchored→"not_anchored"`, `Tampered→"tampered"`, `Stale→"stale"`. Call `j.dump()` with no indent for single-line output.

5. **Write the end-to-end classify-and-log integration test**

   > 💡 *WHY: The integration test proves the full pipeline: verify → classify → log. Unit tests on classify_failure alone cannot catch bugs where the verifier returns an unexpected failed_step string that the classifier doesn't handle.*

   Create a test that: (a) constructs a valid bundle, (b) corrupts `proof_hashes[0]` with `^= 0xFF`, (c) runs `verifier.verify()`, (d) calls `create_audit_entry()`, (e) asserts `classification == Tampered` and `failed_step == "inclusion"`, (f) serializes to JSON-line and re-parses to confirm `"tampered"` string.

## Done when

- [ ] `classify_failure()` maps every `VerificationResult` to exactly one `AttackClass` — *consumed by W16 monitors for pattern detection*
- [ ] `AuditEntry` struct captures classification, step, and reason — *stored in append-only audit log for compliance*
- [ ] Test matrix covers all 10 attack scenarios without gaps — *serves as the living specification for the classifier*
- [ ] Audit entries serialize to JSON-lines for durable storage — *queried by incident response dashboards in W20*
- [ ] Spec file `week-18/day5-anchoring-attack-matrix.md` documents all attack classes — *shared with security team as threat reference*

## Proof

Upload your completed `week-18/day5-anchoring-attack-matrix.md` spec and paste your `classify_failure()` implementation with the full test matrix results.

**Quick self-test**

1. Q: Why is `NotAnchored` a separate category from `Tampered`?
   **A: `NotAnchored` means the document was never submitted to the log — the issuer skipped anchoring entirely. `Tampered` means the document was submitted but the proof was altered after the fact. The response is different: `NotAnchored` requires re-issuance and anchoring, while `Tampered` triggers a forensic investigation into who altered the proof.**

2. Q: What attack class does a future-dated checkpoint receive?
   **A: `Stale`, because the freshness policy rejects it with `FreshnessStatus::ClockSkew`, and `classify_failure()` maps all freshness failures to `Stale`. The name is slightly misleading for clock skew, but the response is the same: reject and demand a fresh receipt.**

3. Q: Why use JSON-lines format for audit logs instead of a database?
   **A: JSON-lines is append-only, human-readable, and works on air-gapped systems without database infrastructure. Each line is independently parseable, so a corrupted line doesn't break the entire log. For production systems, the JSON-lines file feeds into a database for querying, but the file is the durable source of truth.**
