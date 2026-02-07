---
id: w15-transparency-log-d02-inclusion-api-bundle
part: w15-transparency-log
title: "Inclusion API Bundle"
order: 2
duration_minutes: 120
prereqs: ["w15-transparency-log-d01-log-append-contract"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Inclusion API Bundle

## Goal

Yesterday you built an append-only log. Today you add **inclusion proofs** so
any client can verify that a specific entry exists in the log. The core invariant:
**every proof response must reference a signed checkpoint** (tree size + root hash).
A proof without a checkpoint is unanchored—the client cannot know which version
of the log the proof applies to.

✅ Deliverables

1. Implement `TransparencyLog::prove_inclusion(seq)` returning a bundled proof.
2. Define an `InclusionBundle` that includes the proof + checkpoint (size, root).
3. Implement client-side verification: verify proof against the checkpoint root.
4. Reject any bundle where the checkpoint is missing or malformed.
5. Build a CLI: `tlog prove <seq>` / `tlog verify <bundle.json>`.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Bundle includes `InclusionProof` + `Checkpoint` | both fields present |
| 2 | Proof verifies against the checkpoint's root hash | verify returns OK |
| 3 | Bundle with missing checkpoint is rejected by verifier | rejected before proof walk |
| 4 | Bundle with mismatched checkpoint root is rejected | ROOT_MISMATCH |
| 5 | CLI round-trip: prove → verify succeeds for every entry | 100 % |

## What You're Building Today

An `InclusionBundle` struct that pairs a Merkle inclusion proof (Week 14) with a
checkpoint (log size + Merkle root). The log server generates bundles; clients
verify them using only the checkpoint and proof—no need to download the log.

✅ Deliverables

- `bundle.h` / `bundle.cpp` — `InclusionBundle` and `Checkpoint` structs.
- Updated `log.h` / `log.cpp` — `prove_inclusion()` method.
- `main.cpp` — CLI with `prove` and `verify` subcommands.
- `test_bundle.cpp` — positive and negative verification tests.

```cpp
// Quick taste
auto bundle = log.prove_inclusion(3);
// bundle.checkpoint = {size: 10, root: "ab12..."}
// bundle.proof = {leaf_index: 3, tree_size: 10, ...}
bool ok = verify_bundle(bundle);
```

**Can:**
- Prove any entry's inclusion in O(log N).
- Verify offline with only the bundle.
- Reject unanchored or stale proofs.

**Cannot (yet):**
- Prove consistency between two checkpoints (Day 3).
- Sign the checkpoint cryptographically (Day 4).

## Why This Matters

🔴 **Without checkpoint-anchored proofs**

1. A proof can be replayed against any tree version—stale proofs look valid.
2. Client has no way to know WHICH log state the proof refers to.
3. An attacker can serve proofs from a forked log without detection.
4. No binding between proof and log state means no accountability.

🟢 **With bundled checkpoint proofs**

1. Every proof is anchored to a specific log size and root—no ambiguity.
2. Clients can compare checkpoints to detect log regression or forking.
3. Checkpoint becomes the unit of trust—sign it (Day 4) and all proofs under it are trusted.
4. Verifier rejects any proof that does not match its checkpoint.

🔗 **Connects to**

1. Day 1 — Bundle references entries stored by the append contract.
2. Day 3 — Consistency proofs link two checkpoints together.
3. Day 4 — Checkpoint signature schema adds cryptographic signing to the checkpoint.
4. Day 5 — Verifier workflow orchestrates bundle verification end-to-end.
5. Week 16 — Monitors exchange bundles during gossip.

🧠 **Mental model:** A receipt from a store. The receipt (proof) tells you what
you bought, but it also has the store name, date, and register number
(checkpoint). Without that context, anyone could forge a receipt. The checkpoint
anchors the proof in reality.

## Visual Model

```
┌────────────────────────────────────────────────────┐
│            Inclusion API Bundle                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  Client request: "prove entry #3 is in the log"   │
│                      │                             │
│                      ▼                             │
│  ┌───────────────────────────────────┐             │
│  │  TransparencyLog::prove_inclusion │             │
│  │  1. Get current checkpoint        │             │
│  │  2. Generate Merkle proof for #3  │             │
│  │  3. Bundle = {proof, checkpoint}  │             │
│  └───────────────┬───────────────────┘             │
│                  ▼                                 │
│  ┌───────────────────────────────────┐             │
│  │         InclusionBundle           │             │
│  │  ┌─────────────────────────┐      │             │
│  │  │  Checkpoint             │      │             │
│  │  │  ├─ size: 10            │      │             │
│  │  │  └─ root: "ab12..."     │      │             │
│  │  ├─────────────────────────┤      │             │
│  │  │  InclusionProof         │      │             │
│  │  │  ├─ leaf_index: 3       │      │             │
│  │  │  ├─ tree_size: 10       │      │             │
│  │  │  ├─ leaf_hash: "cd34.." │      │             │
│  │  │  └─ path: [...]         │      │             │
│  │  └─────────────────────────┘      │             │
│  └───────────────────────────────────┘             │
│                  │                                 │
│                  ▼  Client-side verify              │
│  proof.tree_size == checkpoint.size? ✓             │
│  verify_inclusion(proof, checkpoint.root)? ✓       │
└────────────────────────────────────────────────────┘
```

## Build

**File:** `week-15/day2-inclusion-api-bundle/bundle.h`

```cpp
#pragma once
#include "proof.h"
#include <string>
#include <cstdint>

struct Checkpoint {
    uint64_t size;
    std::string root;

    std::string to_json() const;
    static Checkpoint from_json(const std::string& json);
};

struct InclusionBundle {
    Checkpoint checkpoint;
    InclusionProof proof;

    std::string to_json() const;
    static InclusionBundle from_json(const std::string& json);
};

enum class BundleVerifyResult {
    OK,
    MISSING_CHECKPOINT,
    SIZE_MISMATCH,          // proof.tree_size != checkpoint.size
    PROOF_INVALID,          // underlying inclusion proof failed
};

BundleVerifyResult verify_bundle(const InclusionBundle& bundle);
std::string bundle_verify_reason(BundleVerifyResult r);
```

**File:** `week-15/day2-inclusion-api-bundle/bundle.cpp`

```cpp
#include "bundle.h"
#include "verifier.h"

BundleVerifyResult verify_bundle(const InclusionBundle& bundle) {
    // CHECK 1: checkpoint present
    if (bundle.checkpoint.root.empty() || bundle.checkpoint.size == 0)
        return BundleVerifyResult::MISSING_CHECKPOINT;

    // CHECK 2: proof tree_size matches checkpoint size
    if (bundle.proof.tree_size != bundle.checkpoint.size)
        return BundleVerifyResult::SIZE_MISMATCH;

    // CHECK 3: verify inclusion proof against checkpoint root
    VerifyResult vr = verify_inclusion(bundle.proof, bundle.checkpoint.root);
    if (vr != VerifyResult::OK)
        return BundleVerifyResult::PROOF_INVALID;

    return BundleVerifyResult::OK;
}
```

**Log integration (added to `log.cpp`):**

```cpp
InclusionBundle TransparencyLog::prove_inclusion(uint64_t seq) const {
    if (seq >= next_seq_)
        throw std::out_of_range("sequence not in log");

    Checkpoint cp{next_seq_, tree_.root()};
    InclusionProof proof = tree_.prove(seq);

    return InclusionBundle{cp, proof};
}
```

## Do

1. **Define Checkpoint struct**
   💡 WHY: The checkpoint is the anchor point. Without it, a proof floats in
   space—verifiable against nothing.
   - Fields: `size` (uint64_t), `root` (hex string).
   - JSON serialisation with deterministic field order.

2. **Define InclusionBundle struct**
   💡 WHY: Bundling proof + checkpoint ensures the client receives everything
   needed for verification in a single response.
   - Wraps `Checkpoint` + `InclusionProof`.
   - JSON serialisation nesting both objects.

3. **Implement `prove_inclusion()` on TransparencyLog**
   💡 WHY: The log is the authority on its own state. It provides the checkpoint
   at the moment of proof generation, binding proof to state.
   - Create checkpoint from current `size()` and `root()`.
   - Generate proof from internal Merkle tree.

4. **Implement `verify_bundle()`**
   💡 WHY: Client-side verification is the security boundary. The client trusts
   nothing from the server except what it can re-derive.
   - Check checkpoint is non-empty.
   - Check `proof.tree_size == checkpoint.size`.
   - Delegate to `verify_inclusion()` with `checkpoint.root`.

5. **Test positive and negative cases**
   💡 WHY: A bundle verifier that never fails is broken. Negative tests prove
   the security checks actually trigger.
   - Valid bundle → OK.
   - Missing checkpoint → MISSING_CHECKPOINT.
   - Mismatched size → SIZE_MISMATCH.
   - Tampered proof → PROOF_INVALID.

## Done when

- [ ] Bundle includes both proof and checkpoint — *proves completeness*
- [ ] Valid bundle verifies successfully — *proves correct acceptance*
- [ ] Bundle with missing checkpoint is rejected — *proves checkpoint requirement*
- [ ] Bundle with mismatched size is rejected — *proves binding*
- [ ] CLI `prove` then `verify` round-trips for every entry — *proves end-to-end*

## Proof

Paste or upload:
1. JSON bundle showing checkpoint + proof for a specific entry.
2. Verification output showing OK for valid bundle.
3. Verification output showing rejection for tampered bundle.

**Quick self-test**

Q: Why must `proof.tree_size` equal `checkpoint.size`?
A: If they differ, the proof was generated against a different tree state than the checkpoint represents. The proof could be valid for an old tree but invalid for the current one—this mismatch must be caught.

Q: Why bundle the proof with the checkpoint instead of sending them separately?
A: Separate transmission allows mix-and-match attacks—an attacker pairs a valid proof from tree v1 with a checkpoint from tree v2. Bundling makes the pairing explicit and atomic.

Q: What happens if the server generates a proof but then another entry is appended before sending?
A: The checkpoint in the bundle reflects the tree state at proof generation time. The proof is valid for that checkpoint. The client can later request a consistency proof to verify the newer checkpoint.
