---
id: w14-merkle-trees-inclusion-proofs-d02-inclusion-proof-format
part: w14-merkle-trees-inclusion-proofs
title: "Inclusion Proof Format"
order: 2
duration_minutes: 120
prereqs: ["w14-merkle-trees-inclusion-proofs-d01-merkle-construction-rules"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Inclusion Proof Format

## Goal

A Merkle root commits to all leaves, but proving a specific leaf is included
requires an **inclusion proof**: the minimal set of sibling hashes needed to
recompute the root. Today you define and implement the proof format. The key
invariant: **every proof includes the leaf index, tree size, and exactly
ceil(log₂N) sibling hashes**.

✅ Deliverables

1. Define an `InclusionProof` struct with leaf index, tree size, leaf hash, and sibling path.
2. Implement `MerkleTree::prove(leaf_index)` that extracts the proof path.
3. Serialise the proof to JSON with deterministic field order.
4. Prove that a valid proof recomputes to the known root hash.
5. Prove that a proof for a different leaf does NOT verify against the same root.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Proof contains exactly ceil(log₂N) sibling hashes | count check |
| 2 | Proof includes leaf_index and tree_size | field presence |
| 3 | Recomputed root from proof matches actual root | byte-for-byte |
| 4 | Proof for wrong leaf index fails verification | root mismatch |
| 5 | Proof JSON is parseable and round-trips cleanly | `jq .` + re-parse |

## What You're Building Today

You extend yesterday's `MerkleTree` with a `prove()` method that, given a leaf
index, walks up the tree collecting the sibling at each level. The output is a
self-contained `InclusionProof` struct that a verifier can check without the full
tree.

✅ Deliverables

- Updated `merkle.h` / `merkle.cpp` — add `prove()` method.
- `proof.h` / `proof.cpp` — `InclusionProof` struct and JSON serialisation.
- `main.cpp` — CLI: `merkle_prove <leaf_index> <file1> <file2> ...`.
- Unit tests for correct sibling extraction.

```cpp
// Quick taste
MerkleTree tree(leaves);
InclusionProof proof = tree.prove(2);  // prove leaf at index 2
std::cout << proof.to_json() << "\n";
// {"leaf_index":2,"tree_size":4,"leaf_hash":"ab..","path":[{"hash":"cd..","side":"left"},...]}
```

**Can:**
- Generate a proof for any leaf in O(log N).
- Serialise proofs for transmission.
- Verify proofs independently of the full tree.

**Cannot (yet):**
- Validate proofs with fail-closed security (Day 3).
- Handle incremental tree growth (Day 4).

## Why This Matters

🔴 **Without structured proofs**

1. Verifiers must download the entire tree to check one leaf—O(N) bandwidth.
2. Missing tree_size means the verifier cannot validate the proof path length.
3. Missing leaf_index means the verifier cannot determine left/right at each level.
4. Non-deterministic JSON breaks proof caching and comparison.

🟢 **With standardised proof format**

1. Proof size is O(log N)—a tree of 1 billion leaves needs only ~30 hashes.
2. Self-contained proofs travel across networks without additional context.
3. Verifier can independently recompute the root and compare.
4. Deterministic serialisation enables content-addressed proof caching.

🔗 **Connects to**

1. Day 1 — Proof extraction depends on the tree layout built yesterday.
2. Day 3 — Proof verifier consumes the `InclusionProof` struct defined today.
3. Day 5 — Adversarial tests target malformed proofs.
4. Week 15 — Transparency log inclusion proofs use this exact format.
5. Week 16 — Monitors exchange proofs during gossip.

🧠 **Mental model:** GPS directions from your house to city hall. You do not need
the entire city map—just the turns at each intersection. The proof is those
turns: at each tree level, you need only the sibling hash and which side it is on.

## Visual Model

```
┌────────────────────────────────────────────────────┐
│          Inclusion Proof Extraction                │
├────────────────────────────────────────────────────┤
│                                                    │
│  Tree (4 leaves):                                  │
│                                                    │
│              ┌──────┐                              │
│              │ ROOT │                              │
│              └──┬───┘                              │
│            ┌────┴────┐                             │
│         ┌──┴──┐   ┌──┴──┐                          │
│         │ N01 │   │ N23 │ ◄── sibling[1]           │
│         └──┬──┘   └──┬──┘                          │
│         ┌──┴──┐   ┌──┴──┐                          │
│       ┌─┴─┐┌─┴─┐┌─┴─┐┌─┴─┐                        │
│       │L0 ││L1 ││L2 ││L3 │                        │
│       └───┘└───┘└───┘└───┘                         │
│              ▲      ▲                              │
│              │      target = L2                    │
│              sibling[0] = L3                       │
│                                                    │
│  Proof for L2:                                     │
│  ┌───────────────────────────────────────┐         │
│  │ leaf_index: 2                         │         │
│  │ tree_size:  4                         │         │
│  │ leaf_hash:  H(0x00 || L2)            │         │
│  │ path: [                               │         │
│  │   {hash: H(L3), side: "right"},       │         │
│  │   {hash: H(N01), side: "left"}        │         │
│  │ ]                                     │         │
│  └───────────────────────────────────────┘         │
└────────────────────────────────────────────────────┘
```

## Build

**File:** `week-14/day2-inclusion-proof-format/proof.h`

```cpp
#pragma once
#include <string>
#include <vector>

struct ProofStep {
    std::string hash;
    std::string side;  // "left" or "right" — position of the sibling
};

struct InclusionProof {
    size_t leaf_index;
    size_t tree_size;
    std::string leaf_hash;
    std::vector<ProofStep> path;

    std::string to_json() const;
    static InclusionProof from_json(const std::string& json);
};
```

**File:** `week-14/day2-inclusion-proof-format/merkle.cpp` (prove method)

```cpp
InclusionProof MerkleTree::prove(size_t leaf_index) const {
    if (leaf_index >= leaf_count_)
        throw std::out_of_range("leaf index out of bounds");

    InclusionProof proof;
    proof.leaf_index = leaf_index;
    proof.tree_size = leaf_count_;
    proof.leaf_hash = nodes_[leaf_index];

    size_t idx = leaf_index;
    size_t level_size = leaf_count_;
    size_t offset = 0;

    while (level_size > 1) {
        size_t sibling;
        std::string side;
        if (idx % 2 == 0) {
            sibling = idx + 1;
            side = "right";
        } else {
            sibling = idx - 1;
            side = "left";
        }

        if (sibling < level_size) {
            proof.path.push_back({nodes_[offset + sibling], side});
        }
        // Move up: next level starts after current level in flat array
        offset += level_size;
        idx /= 2;
        level_size = (level_size + 1) / 2;
    }
    return proof;
}
```

**File:** `week-14/day2-inclusion-proof-format/proof.cpp` (serialisation)

```cpp
#include "proof.h"
#include <sstream>

std::string InclusionProof::to_json() const {
    std::ostringstream oss;
    oss << "{\"leaf_index\":" << leaf_index
        << ",\"tree_size\":" << tree_size
        << ",\"leaf_hash\":\"" << leaf_hash << "\""
        << ",\"path\":[";
    for (size_t i = 0; i < path.size(); ++i) {
        if (i > 0) oss << ",";
        oss << "{\"hash\":\"" << path[i].hash
            << "\",\"side\":\"" << path[i].side << "\"}";
    }
    oss << "]}";
    return oss.str();
}
```

## Do

1. **Define the `InclusionProof` struct**
   💡 WHY: A self-contained proof must carry all context the verifier needs:
   which leaf, how big the tree was, and the sibling path. Missing any field
   forces the verifier to guess.
   - Fields: `leaf_index`, `tree_size`, `leaf_hash`, `path[]`.
   - `path` entries: `{hash, side}`.

2. **Implement `MerkleTree::prove()`**
   💡 WHY: The proof is extracted by walking from the target leaf to the root,
   collecting the sibling hash at each level. The side tells the verifier
   whether to place the sibling on the left or right when re-hashing.
   - Start at `leaf_index`, find sibling, record hash and side.
   - Move up: `idx /= 2`, repeat until root.

3. **Serialise to JSON**
   💡 WHY: JSON is human-readable and widely supported. Deterministic field
   order enables content-addressing the proof itself.
   - Fixed field order: `leaf_index`, `tree_size`, `leaf_hash`, `path`.
   - No optional fields—all are required.

4. **Verify proof recomputes root**
   💡 WHY: The proof is only valid if re-hashing along the path produces the
   known root. This is the moment of truth for the entire construction.
   - Walk the path: at each step, combine current hash with sibling based on side.
   - Compare final hash to `tree.root()`.

5. **Test negative cases**
   💡 WHY: A proof system that never fails is not a proof system. Negative
   tests confirm the verifier actually checks things.
   - Generate proof for leaf 2, try to verify as if it were leaf 3 → must fail.
   - Truncate the path → must fail.
   - Record outputs in `proof.txt`.

## Done when

- [ ] Proof contains exactly ceil(log₂N) sibling hashes — *proves minimal path*
- [ ] Recomputed root from proof matches actual root — *proves correctness*
- [ ] Proof for wrong leaf index fails verification — *proves binding*
- [ ] JSON round-trips cleanly (serialise → parse → serialise = identical) — *proves serialisation*
- [ ] Proof includes `leaf_index` and `tree_size` — *proves self-containment*

## Proof

Paste or upload:
1. JSON inclusion proof for a leaf in a 8-leaf tree.
2. Root hash recomputed from proof matching `tree.root()`.
3. Negative test output showing wrong-index proof fails.

**Quick self-test**

Q: Why does the proof include `tree_size`?
A: Without tree_size, the verifier cannot validate that the proof path length is correct. An attacker could provide a shorter path against a smaller claimed tree.

Q: Why must each `ProofStep` include the side ("left" or "right")?
A: `H(A || B) != H(B || A)`. The verifier must know whether the sibling goes on the left or right to reproduce the correct parent hash.

Q: What is the proof size for a tree with 1 million leaves?
A: ceil(log₂(1,000,000)) = 20 hashes. Each SHA-256 hash is 32 bytes, so the proof is ~640 bytes plus metadata—trivial compared to transmitting the full tree.
