---
id: w14-merkle-trees-inclusion-proofs-d03-proof-verifier-rules
part: w14-merkle-trees-inclusion-proofs
title: "Proof Verifier Rules"
order: 3
duration_minutes: 120
prereqs: ["w14-merkle-trees-inclusion-proofs-d02-inclusion-proof-format"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Proof Verifier Rules

## Goal

A proof is worthless if the verifier is lenient. Today you build a **fail-closed**
inclusion proof verifier: any malformed, truncated, or inconsistent proof element
causes immediate rejection. The invariant: **the verifier accepts only structurally
complete proofs that recompute exactly to the expected root hash**.

✅ Deliverables

1. Implement `verify_inclusion()` that takes a proof, expected root, and returns bool.
2. Reject proofs with wrong path length (must equal ceil(log₂(tree_size))).
3. Reject proofs where leaf_index ≥ tree_size.
4. Reject proofs with empty or missing hash fields.
5. Build a test suite covering 8+ negative cases.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Valid proof returns true | 100 % on valid proofs |
| 2 | Truncated path returns false | caught before root comparison |
| 3 | Out-of-bounds leaf_index returns false | immediate rejection |
| 4 | Empty hash in path returns false | caught at step validation |
| 5 | Bit-flipped sibling hash returns false | root mismatch detected |

## What You're Building Today

A standalone `verify_inclusion()` function that takes an `InclusionProof` and an
expected root hash. It validates structural integrity first (path length, index
bounds, non-empty hashes), then walks the path recomputing hashes bottom-up. If
every check passes and the final hash matches the expected root, it returns true.
Any failure → immediate false, no partial acceptance.

✅ Deliverables

- `verifier.h` / `verifier.cpp` — verification logic.
- `main.cpp` — CLI: `merkle_verify <proof.json> <expected_root>`.
- `test_verifier.cpp` — 8+ negative test cases.
- Documentation of each rejection reason.

```cpp
// Quick taste
InclusionProof proof = InclusionProof::from_json(json_str);
bool ok = verify_inclusion(proof, expected_root);
if (!ok) {
    std::cerr << "REJECTED: proof verification failed\n";
    return 1;
}
```

**Can:**
- Verify any inclusion proof without the full tree.
- Reject 8+ categories of malformed proofs.
- Provide clear rejection reasons for debugging.

**Cannot (yet):**
- Verify consistency proofs (Week 15).
- Handle proofs from incrementally-grown trees (Day 4).

## Why This Matters

🔴 **Without fail-closed verification**

1. A truncated proof silently passes—attacker can forge "proofs" with fewer hashes.
2. An out-of-bounds leaf_index causes undefined behaviour or false acceptance.
3. Empty hash fields produce garbage parent hashes that may accidentally match.
4. A lenient verifier gives a false sense of security—worse than no verifier.

🟢 **With strict verification**

1. Every proof element is validated before use—no garbage in, no garbage out.
2. Structural checks are O(1) and catch most attacks before the expensive hash walk.
3. Clear rejection reasons enable debugging without leaking security information.
4. Fail-closed means the default answer is REJECT—safety by default.

🔗 **Connects to**

1. Day 2 — Verifier consumes the `InclusionProof` format defined yesterday.
2. Day 4 — Incremental tree proofs must still pass today's verifier.
3. Day 5 — Adversarial tests specifically target today's rejection logic.
4. Week 15 — Transparency log verifier extends this with consistency checks.
5. Week 16 — Monitors use this verifier to validate gossip proofs.

🧠 **Mental model:** An airport security checkpoint. Every bag goes through the
scanner. A bag missing its tag → rejected. A bag with wrong dimensions → rejected.
Only bags that pass ALL checks get through. One failure = no boarding.

## Visual Model

```
┌────────────────────────────────────────────────────────┐
│              Proof Verifier Pipeline                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Input: InclusionProof + expected_root                 │
│               │                                        │
│               ▼                                        │
│  ┌────────────────────────┐                            │
│  │ CHECK 1: leaf_index    │──▶ index ≥ tree_size?      │
│  │          < tree_size?  │    YES → REJECT            │
│  └────────────┬───────────┘                            │
│               ▼                                        │
│  ┌────────────────────────┐                            │
│  │ CHECK 2: path.size()   │──▶ wrong length?           │
│  │  == ceil(log₂(size))?  │    YES → REJECT            │
│  └────────────┬───────────┘                            │
│               ▼                                        │
│  ┌────────────────────────┐                            │
│  │ CHECK 3: all hashes    │──▶ any empty/malformed?    │
│  │          non-empty?    │    YES → REJECT            │
│  └────────────┬───────────┘                            │
│               ▼                                        │
│  ┌────────────────────────┐                            │
│  │ CHECK 4: walk path,    │──▶ recomputed != expected? │
│  │  recompute root        │    YES → REJECT            │
│  └────────────┬───────────┘                            │
│               ▼                                        │
│        ┌──────────┐                                    │
│        │ ACCEPTED │                                    │
│        └──────────┘                                    │
└────────────────────────────────────────────────────────┘
```

## Build

**File:** `week-14/day3-proof-verifier-rules/verifier.h`

```cpp
#pragma once
#include "proof.h"
#include "merkle.h"
#include <string>

enum class VerifyResult {
    OK,
    INVALID_INDEX,
    INVALID_PATH_LENGTH,
    EMPTY_HASH,
    ROOT_MISMATCH,
    MALFORMED_SIDE,
};

// Fail-closed: returns OK only if ALL checks pass
VerifyResult verify_inclusion(const InclusionProof& proof,
                               const std::string& expected_root);

// Human-readable reason
std::string verify_reason(VerifyResult r);
```

**File:** `week-14/day3-proof-verifier-rules/verifier.cpp`

```cpp
#include "verifier.h"
#include <cmath>

static size_t expected_path_length(size_t tree_size) {
    if (tree_size <= 1) return 0;
    return static_cast<size_t>(std::ceil(std::log2(tree_size)));
}

VerifyResult verify_inclusion(const InclusionProof& proof,
                               const std::string& expected_root) {
    // CHECK 1: index bounds
    if (proof.leaf_index >= proof.tree_size)
        return VerifyResult::INVALID_INDEX;

    // CHECK 2: path length
    size_t exp_len = expected_path_length(proof.tree_size);
    if (proof.path.size() != exp_len)
        return VerifyResult::INVALID_PATH_LENGTH;

    // CHECK 3: non-empty hashes
    if (proof.leaf_hash.empty())
        return VerifyResult::EMPTY_HASH;
    for (const auto& step : proof.path) {
        if (step.hash.empty())
            return VerifyResult::EMPTY_HASH;
        if (step.side != "left" && step.side != "right")
            return VerifyResult::MALFORMED_SIDE;
    }

    // CHECK 4: recompute root
    std::string current = proof.leaf_hash;
    for (const auto& step : proof.path) {
        if (step.side == "left") {
            current = MerkleTree::hash_node(step.hash, current);
        } else {
            current = MerkleTree::hash_node(current, step.hash);
        }
    }

    if (current != expected_root)
        return VerifyResult::ROOT_MISMATCH;

    return VerifyResult::OK;
}

std::string verify_reason(VerifyResult r) {
    switch (r) {
        case VerifyResult::OK: return "valid";
        case VerifyResult::INVALID_INDEX: return "leaf_index >= tree_size";
        case VerifyResult::INVALID_PATH_LENGTH: return "wrong path length";
        case VerifyResult::EMPTY_HASH: return "empty hash in proof";
        case VerifyResult::ROOT_MISMATCH: return "recomputed root != expected";
        case VerifyResult::MALFORMED_SIDE: return "side must be left or right";
    }
    return "unknown";
}
```

## Do

1. **Implement structural checks (index, path length)**
   💡 WHY: These are O(1) checks that catch the most common malformed proofs
   before doing any expensive hashing. Fail early, fail cheap.
   - `leaf_index >= tree_size` → reject.
   - `path.size() != ceil(log₂(tree_size))` → reject.

2. **Implement hash field validation**
   💡 WHY: Empty or malformed hashes would produce garbage parent hashes. In
   rare cases, garbage could accidentally match the expected root.
   - Check `leaf_hash` is non-empty and valid hex.
   - Check each `path[i].hash` is non-empty.
   - Check each `path[i].side` is exactly `"left"` or `"right"`.

3. **Implement root recomputation**
   💡 WHY: This is the cryptographic core—the verifier re-derives the root using
   the same `hash_node()` rules as the builder.
   - Walk path from leaf to root, combining current hash with sibling.
   - Side determines order: `"left"` → sibling is left child.

4. **Build test suite (8+ negative cases)**
   💡 WHY: A verifier that is only tested with valid proofs is untested. The
   negative cases ARE the security guarantees.
   - Truncated path, extended path, swapped side, empty hash, index out of
     bounds, wrong leaf hash, bit-flipped sibling, tree_size = 0.

5. **Build CLI wrapper**
   💡 WHY: A CLI verifier can be scripted into CI pipelines and monitoring
   systems, making verification a routine operation.
   - Read proof JSON from stdin or file.
   - Accept expected root as argument.
   - Exit 0 on OK, exit 1 on failure with reason to stderr.

## Done when

- [ ] Valid proofs return OK — *proves correct acceptance*
- [ ] Truncated path is rejected before root comparison — *proves structural validation*
- [ ] Out-of-bounds leaf_index is rejected immediately — *proves bounds checking*
- [ ] Bit-flipped sibling hash causes root mismatch rejection — *proves hash integrity*
- [ ] 8+ negative test cases all return the correct rejection reason — *proves fail-closed behaviour*

## Proof

Paste or upload:
1. Test output showing all 8+ negative cases with rejection reasons.
2. One positive verification showing OK result.
3. CLI output: `echo $?` showing exit 0 for valid, exit 1 for invalid.

**Quick self-test**

Q: Why validate structural fields before doing the hash walk?
A: Structural checks are O(1) and catch obvious malformation. If you skip them and go straight to hashing, you might process a 1000-element path for a 4-leaf tree—wasting CPU and potentially enabling DoS.

Q: What happens if the verifier accepts a proof with wrong path length?
A: An attacker can provide fewer sibling hashes, making it exponentially easier to find a collision. Shorter path = weaker security.

Q: Why return an enum instead of just bool?
A: The enum tells the caller WHY the proof failed, which is essential for debugging legitimate failures vs. detecting attacks. A bare `false` provides no diagnostic information.
