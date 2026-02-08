---
id: w15-transparency-log-d05-verifier-workflow
part: w15-transparency-log
title: "Verifier Workflow"
order: 5
duration_minutes: 120
prereqs: ["w15-transparency-log-d04-checkpoint-signature-schema"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Verifier Workflow

## Goal

You have all the pieces: append-only log, inclusion proofs, consistency proofs,
and signed checkpoints. Today you wire them into a **complete client verifier
workflow** that maintains cached state and processes new proofs. The invariant:
**reject any proof that lacks checkpoint continuity from the client's cached
state**. A verifier that accepts proofs without continuity is vulnerable to
log forking.

✅ Deliverables

1. Implement a `Verifier` class that caches the last-seen signed checkpoint.
2. Implement the full verification flow: check signature → consistency → inclusion.
3. Reject proofs whose checkpoint is not consistency-provable from cached state.
4. Update cached state only after all checks pass.
5. Build a CLI: `tlog client verify <bundle.json>` with persistent state.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Fresh verifier accepts first signed bundle | OK |
| 2 | Verifier with cached state demands consistency proof | rejects without it |
| 3 | Valid consistency + inclusion → state advances | cached checkpoint updates |
| 4 | Stale checkpoint (regression) is rejected | sequence check fails |
| 5 | Forked log is detected by consistency failure | ROOT_MISMATCH |

## What You're Building Today

A `Verifier` state machine that progresses through four stages: signature check,
consistency check, inclusion check, state update. If any stage fails, the entire
verification is rejected and the cached state remains unchanged. This is the
client's trust boundary.

✅ Deliverables

- `client_verifier.h` / `client_verifier.cpp` — verifier state machine.
- `verifier_state.json` — persistent cached checkpoint.
- `main.cpp` — CLI with persistent state across invocations.
- `test_workflow.cpp` — end-to-end scenario tests.

```cpp
// Quick taste
Verifier verifier("verifier_state.json", trusted_keys);
auto result = verifier.verify(bundle, consistency_proof);
// result == VerifierResult::OK → state advanced
// result == VerifierResult::CONSISTENCY_FAILED → log fork detected
```

**Can:**
- Verify proofs with checkpoint continuity.
- Detect log forking and regression.
- Persist state across process restarts.

**Cannot (yet):**
- Gossip verification results to other monitors (Week 16).
- Handle key rotation during verification.

## Why This Matters

🔴 **Without checkpoint continuity**

1. Attacker presents two different logs to two different clients—neither detects the fork.
2. Client accepts a proof anchored to a checkpoint it has never seen before—no trust chain.
3. Regression attack: attacker serves an older checkpoint with fewer entries.
4. No persistent state means every verification starts from scratch—no cumulative trust.

🟢 **With full verifier workflow**

1. Every new checkpoint must be consistency-proven from the last cached one—no gaps.
2. Fork detection is automatic—inconsistent histories fail the consistency check.
3. Regression is caught by monotonic sequence enforcement.
4. Persistent cache builds cumulative trust across sessions.

🔗 **Connects to**

1. Day 1 — Verifier trusts the log's append-only contract through consistency proofs.
2. Day 2 — Inclusion bundles are the primary input to the verifier.
3. Day 3 — Consistency proofs bridge cached state to new checkpoints.
4. Day 4 — Signature verification is the first gate in the workflow.
5. Week 16 — Monitors run this workflow and share results via gossip.

🧠 **Mental model:** A blockchain light client. It does not store the full chain
but keeps the latest block header. Each new block must link to the previous one
(consistency). Each transaction must be in the block (inclusion). The header is
signed by the miners (checkpoint signature). No link → no trust.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│              Client Verifier Workflow                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Input: InclusionBundle + ConsistencyProof                │
│                    │                                      │
│                    ▼                                      │
│  ┌─────────────────────────────────┐                      │
│  │ STAGE 1: Verify checkpoint sig  │                      │
│  │ Ed25519(pk, canonical, sig)?    │──▶ FAIL → REJECT     │
│  └────────────────┬────────────────┘                      │
│                   ▼                                       │
│  ┌─────────────────────────────────┐                      │
│  │ STAGE 2: Check sequence mono    │                      │
│  │ new.seq > cached.seq?           │──▶ FAIL → REJECT     │
│  └────────────────┬────────────────┘                      │
│                   ▼                                       │
│  ┌─────────────────────────────────┐                      │
│  │ STAGE 3: Verify consistency     │                      │
│  │ prove(cached → new checkpoint)  │──▶ FAIL → REJECT     │
│  └────────────────┬────────────────┘    (FORK DETECTED)   │
│                   ▼                                       │
│  ┌─────────────────────────────────┐                      │
│  │ STAGE 4: Verify inclusion       │                      │
│  │ prove(entry ∈ new checkpoint)   │──▶ FAIL → REJECT     │
│  └────────────────┬────────────────┘                      │
│                   ▼                                       │
│  ┌─────────────────────────────────┐                      │
│  │ STAGE 5: Update cached state    │                      │
│  │ cached = new checkpoint         │                      │
│  │ persist to verifier_state.json  │                      │
│  └─────────────────────────────────┘                      │
│                   ▼                                       │
│             ┌──────────┐                                  │
│             │ ACCEPTED │                                  │
│             └──────────┘                                  │
└──────────────────────────────────────────────────────────┘
```

## Build

**File:** `week-15/day5-verifier-workflow/client_verifier.h`

```cpp
#pragma once
#include "signed_checkpoint.h"
#include "bundle.h"
#include "consistency.h"
#include <string>
#include <optional>
#include <filesystem>

enum class VerifierResult {
    OK,
    SIGNATURE_INVALID,
    SEQUENCE_REGRESSION,
    CONSISTENCY_FAILED,
    INCLUSION_FAILED,
    STATE_CORRUPT,
};

class Verifier {
public:
    Verifier(const std::filesystem::path& state_path,
             const CheckpointVerifier& sig_verifier);

    // Full verification: signature → consistency → inclusion → state update
    VerifierResult verify(const InclusionBundle& bundle,
                          const SignedCheckpoint& signed_cp,
                          const std::optional<ConsistencyProof>& consistency);

    // Current cached checkpoint (nullopt if fresh)
    std::optional<SignedCheckpoint> cached() const { return cached_; }

private:
    std::filesystem::path state_path_;
    const CheckpointVerifier& sig_verifier_;
    std::optional<SignedCheckpoint> cached_;

    void load_state();
    void save_state();
};
```

**File:** `week-15/day5-verifier-workflow/client_verifier.cpp`

```cpp
#include "client_verifier.h"
#include <fstream>

Verifier::Verifier(const std::filesystem::path& state_path,
                   const CheckpointVerifier& sig_verifier)
    : state_path_(state_path), sig_verifier_(sig_verifier) {
    load_state();
}

VerifierResult Verifier::verify(
    const InclusionBundle& bundle,
    const SignedCheckpoint& signed_cp,
    const std::optional<ConsistencyProof>& consistency) {
    // STAGE 1: Verify checkpoint signature
    if (!sig_verifier_.verify(signed_cp))
        return VerifierResult::SIGNATURE_INVALID;

    // STAGE 2: Monotonic sequence
    if (cached_.has_value()) {
        if (signed_cp.sequence <= cached_->sequence)
            return VerifierResult::SEQUENCE_REGRESSION;

        // STAGE 3: Consistency proof required
        if (!consistency.has_value())
            return VerifierResult::CONSISTENCY_FAILED;

        auto cr = verify_consistency(
            consistency.value(), cached_->root, signed_cp.root);
        if (cr != ConsistencyResult::OK)
            return VerifierResult::CONSISTENCY_FAILED;
    }

    // STAGE 4: Inclusion proof
    auto br = verify_bundle(bundle);
    if (br != BundleVerifyResult::OK)
        return VerifierResult::INCLUSION_FAILED;

    // STAGE 5: Update cached state
    cached_ = signed_cp;
    save_state();

    return VerifierResult::OK;
}
```

## Do

1. **Implement state persistence**
   💡 WHY: Without persistent state, the verifier restarts from zero every time
   and cannot detect fork or regression across sessions.
   - Save `SignedCheckpoint` to `verifier_state.json` on successful verify.
   - Load on startup. If file is missing, start fresh (no cached state).

2. **Implement signature check (Stage 1)**
   💡 WHY: An unsigned or incorrectly signed checkpoint could be forged. This
   is the first and cheapest check—fail here before doing expensive proofs.
   - Delegate to `CheckpointVerifier::verify()` from Day 4.

3. **Implement consistency check (Stage 3)**
   💡 WHY: Consistency bridges the cached checkpoint to the new one. Without
   it, the verifier has no evidence that the new state extends the old one.
   - Required only when cached state exists.
   - If consistency proof is missing when cached exists → reject.
   - Delegate to `verify_consistency()` from Day 3.

4. **Implement state update (Stage 5)**
   💡 WHY: The cached state advances ONLY after all checks pass. If you update
   before checking, a failed verification leaves the verifier in a bad state.
   - Update `cached_` to the new signed checkpoint.
   - Persist to disk immediately.

5. **Test end-to-end scenarios**
   💡 WHY: The workflow is a state machine. Testing individual stages is
   necessary but not sufficient—test the full sequence.
   - Fresh verifier: first bundle accepted, state saved.
   - Second bundle: consistency required and verified, state advances.
   - Forked log: consistency fails, state does NOT advance.
   - Regression: old sequence rejected, state does NOT advance.

## Done when

- [ ] Fresh verifier accepts first signed bundle and persists state — *proves bootstrap*
- [ ] Second verification requires consistency proof — *proves continuity enforcement*
- [ ] Forked log is detected by consistency failure — *proves fork detection*
- [ ] Sequence regression is rejected — *proves monotonicity*
- [ ] State updates only on full success — *proves atomic state transitions*

## Proof

Paste or upload:
1. Verification log showing 3 sequential bundles accepted with state advancing.
2. Fork detection output showing consistency failure.
3. `cat verifier_state.json` showing persisted signed checkpoint.

**Quick self-test**

Q: Why update cached state only after ALL checks pass?
A: If state is updated after signature check but before consistency check, a consistency failure leaves the verifier pointing to an unverified checkpoint. Future consistency proofs would start from a bad base.

Q: What should a client do when the verifier returns CONSISTENCY_FAILED?
A: This is strong evidence of log misbehaviour (fork or rollback). The client should alert the operator, refuse to trust the log, and potentially report to a monitor (Week 16).

Q: Why is the consistency proof optional for the first verification?
A: A fresh verifier has no cached state to be consistent with. The first verification bootstraps trust by accepting the signed checkpoint as the initial anchor point.
