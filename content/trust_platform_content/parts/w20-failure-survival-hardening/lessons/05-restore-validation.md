---
id: w20-failure-survival-hardening-d05-restore-validation
part: w20-failure-survival-hardening
title: "Restore Validation"
order: 5
duration_minutes: 120
prereqs: ["w20-failure-survival-hardening-d04-key-compromise-runbook"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Restore Validation

## Goal

Build a restore-validation system that proves a restored CivicTrust cluster is continuous with the last valid checkpoint. After a full restore from backup, the system must verify that: (1) the restored state matches the checkpoint hash, (2) all stored documents re-verify successfully, (3) the revocation registry is intact, and (4) new operations can resume from the restored state without gaps.

### ✅ Deliverables

1. A `RestoreValidator` class that checks checkpoint continuity, document integrity, registry completeness, and operational readiness.
2. A checkpoint-hash verification step that compares the restored state hash to the known-good checkpoint hash.
3. A full re-verification pass that batch-verifies all stored documents using the restored keys and registry.
4. An operational-readiness test that issues and anchors a new document on the restored cluster.
5. Shipped design document: `week-20/day5-restore-validation.md`.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Restored state hash matches checkpoint hash | Compute hash of restored state, compare |
| 2 | All stored documents re-verify as VALID or REVOKED | Batch-verify, assert no INVALID_SIGNATURE |
| 3 | Revocation registry contains all pre-restore entries | Count entries, compare to checkpoint metadata |
| 4 | New document issuance succeeds on restored cluster | Submit new doc → SignedEnvelope returned |
| 5 | New anchoring succeeds on restored cluster | Anchor new doc → InclusionProof received |

## What You're Building Today

You are building the "proof of resurrection." After a catastrophic failure — total cluster loss, disk corruption, ransomware — you restore from the last checkpoint. But how do you know the restore is correct? Today you build the validation suite that proves the restored system is the same system that existed before the failure, with no data loss, no corruption, and full operational capability.

### ✅ Deliverables

- `restore_validator.h` / `restore_validator.cpp` — validation orchestrator
- `checkpoint_verifier.cpp` — state-hash comparison
- `document_reverifier.cpp` — batch re-verification of stored documents
- `readiness_test.cpp` — operational smoke test

```cpp
// restore_validator.h
#pragma once
#include "batch_verifier.h"
#include <string>
#include <vector>
#include <cstdint>
#include <array>

struct CheckpointInfo {
    uint64_t                   checkpoint_number;
    int64_t                    checkpoint_ts;
    std::array<uint8_t,32>     state_hash;
    size_t                     document_count;
    size_t                     revocation_count;
};

struct RestoreReport {
    // Phase 1: Checkpoint continuity
    bool        checkpoint_hash_matches;
    uint64_t    restored_checkpoint_number;

    // Phase 2: Document re-verification
    size_t      documents_verified;
    size_t      documents_valid;
    size_t      documents_revoked;   // expected, not a failure
    size_t      documents_invalid;   // must be 0

    // Phase 3: Registry integrity
    bool        revocation_registry_intact;
    size_t      revocations_restored;

    // Phase 4: Operational readiness
    bool        new_issuance_succeeded;
    bool        new_anchoring_succeeded;

    bool        overall_passed;
};

class RestoreValidator {
public:
    RestoreValidator(
        const CheckpointInfo& expected_checkpoint,
        const std::vector<OfflineBundle>& stored_documents);

    RestoreReport validate(
        const std::string& cluster_endpoint,
        int64_t local_clock_epoch);

private:
    CheckpointInfo                expected_;
    std::vector<OfflineBundle>    documents_;
};
```

You **can**:
- Prove a restored cluster is continuous with the last valid checkpoint.
- Detect any data corruption, missing documents, or registry gaps.

You **cannot yet**:
- Automatically fix a failed restore (requires manual intervention).
- Validate partial restores (today's validation requires a full restore).

## Why This Matters

🔴 **Without restore validation:**
- You restore from backup and *assume* it's correct — trust without verification.
- A corrupted backup silently becomes the new truth — undetectable data loss.
- Missing revocation entries mean revoked keys are accidentally reactivated.
- Operational readiness is unknown — the first real request discovers the restore is broken.

🟢 **With restore validation:**
- The restored state is cryptographically verified against the known checkpoint hash.
- Every stored document is re-verified — corruption is detected immediately.
- Revocation registry completeness is confirmed — no revoked keys are accidentally alive.
- Operational readiness is proven — a new document is issued and anchored before declaring recovery complete.

🔗 **Connects:**
- **Week 12** (consensus checkpoints) — the checkpoint hash is the restore's anchor point.
- **Week 17 Day 4** (revocation) — revocation registry must survive the restore.
- **Week 18 Day 3** (anchor verifier) — re-verification uses the anchor verifier sequence.
- **Week 19 Day 5** (batch verifier) — batch re-verification of all stored documents.
- **Week 20 Day 2** (node crash) — crash drill proves single-node recovery; today proves full-cluster recovery.

🧠 **Mental model: "Transplant Verification"** — After an organ transplant, doctors don't just close the patient up — they run tests to verify the new organ is functioning, connected, and compatible. The restore validator is your post-transplant test suite: verify the checkpoint (organ identity), re-verify documents (organ function), check the registry (immune compatibility), and test readiness (patient walks).

## Visual Model

```
┌──────────── Restore Validation ──────────────────────────┐
│                                                           │
│  Phase 1: Checkpoint Continuity                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  compute_state_hash(restored_cluster)              │  │
│  │  compare to expected_checkpoint.state_hash         │  │
│  │  ├── match    ──▶ ✓ checkpoint verified            │  │
│  │  └── mismatch ──▶ ✗ RESTORE FAILED                │  │
│  └────────────────────────────────────────────────────┘  │
│       ▼                                                   │
│  Phase 2: Document Re-verification                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │  BatchVerifier.verify_batch(all_stored_documents)  │  │
│  │  Expected: VALID + REVOKED only (no INVALID)       │  │
│  └────────────────────────────────────────────────────┘  │
│       ▼                                                   │
│  Phase 3: Registry Integrity                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │  count(revocation_entries) == expected_count        │  │
│  │  key_timeline entries match checkpoint metadata     │  │
│  └────────────────────────────────────────────────────┘  │
│       ▼                                                   │
│  Phase 4: Operational Readiness                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  issue(new_document) ──▶ SignedEnvelope ✓           │  │
│  │  anchor(envelope)    ──▶ InclusionProof ✓          │  │
│  └────────────────────────────────────────────────────┘  │
│       ▼                                                   │
│  RestoreReport { overall_passed: true }                   │
└───────────────────────────────────────────────────────────┘
```

## Build

File: `week-20/day5-restore-validation.md`

## Do

### 1. **Implement Phase 1: Checkpoint continuity**

> 💡 *WHY: The checkpoint hash is the fingerprint of the system state at a known-good point. If the restored state doesn't match, everything downstream is suspect.*

Compute the state hash of the restored cluster: hash the commit log, the revocation registry, and the key timeline. Compare to `expected_checkpoint.state_hash`. If they differ, abort immediately — the restore is corrupted.

### 2. **Implement Phase 2: Document re-verification**

> 💡 *WHY: A matching checkpoint hash proves the data is bit-identical to the backup. Re-verification proves the data is *semantically* valid — signatures verify, proofs check out, keys resolve.*

Use the `BatchVerifier` from Week 19 Day 5 to re-verify all stored documents. Expected verdicts: `VALID` (active documents) and `REVOKED` (previously revoked documents). Any `INVALID_SIGNATURE` or `INVALID_PROOF` indicates corruption that the checkpoint hash didn't catch (e.g., correct bytes but wrong key loaded).

### 3. **Implement Phase 3: Registry integrity**

> 💡 *WHY: A restored system with a missing revocation entry means a revoked key is accidentally alive again. This is a security regression — the key compromise from Day 4 is undone.*

Count revocation entries in the restored registry. Compare to the count in the checkpoint metadata. If any entries are missing, the restore is incomplete. Also verify that the key timeline contains all expected key slots.

### 4. **Implement Phase 4: Operational readiness**

> 💡 *WHY: Phases 1-3 prove the data is correct. Phase 4 proves the system is *functional* — it can issue and anchor new documents. A correct but non-functional restore is not a recovery.*

Issue a new test document to the restored cluster. Verify it returns a `SignedEnvelope`. Anchor the envelope. Verify it returns an `InclusionProof`. If either fails, the restore is data-correct but operationally broken.

### 5. **Document the restore validation procedure**

> 💡 *WHY: The procedure is the playbook for the worst day of your operational life. It must be clear enough for a stressed operator at 3 AM.*

Write `week-20/day5-restore-validation.md` covering: restore prerequisites (backup availability, checkpoint hash record), validation phases with pass/fail criteria, failure modes (what to do if Phase 2 finds invalid documents), and the sign-off process (who approves the restore as complete).

## Done when

- [ ] Restored state hash matches the expected checkpoint hash — *cryptographic proof of data continuity*
- [ ] All stored documents re-verify as VALID or REVOKED (zero INVALID) — *semantic integrity of the document store*
- [ ] Revocation registry entry count matches the checkpoint metadata — *no accidentally-reactivated revoked keys*
- [ ] New document issuance and anchoring succeed on the restored cluster — *operational readiness proven*
- [ ] Design doc covers the full restore-validation procedure with failure handling — *the 3 AM playbook for catastrophic recovery*

## Proof

Upload `week-20/day5-restore-validation.md` and a terminal screenshot showing: the `RestoreReport` with checkpoint match, re-verification summary (X valid, Y revoked, 0 invalid), registry match, and successful new issuance + anchoring.

### **Quick self-test**

**Q1:** Why re-verify documents if the checkpoint hash already matches?
→ **A: The checkpoint hash proves bit-identical data. Re-verification proves semantic validity — that the keys, signatures, and proofs still work together. A bit-perfect restore with a corrupted OpenSSL configuration would pass Phase 1 but fail Phase 2.**

**Q2:** What if Phase 2 finds some INVALID documents?
→ **A: This indicates corruption that the checkpoint hash didn't catch (unlikely) or a configuration error (e.g., wrong key loaded). Abort the restore, investigate the root cause, and restore from an earlier checkpoint.**

**Q3:** Why test new issuance as part of restore validation?
→ **A: Data correctness ≠ operational readiness. The system might have correct data but a broken consensus layer, a misconfigured key, or a disconnected log. Issuing and anchoring a new document is the ultimate smoke test — it exercises every component end-to-end.**
