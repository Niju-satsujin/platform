---
id: w14-merkle-trees-inclusion-proofs-d01-merkle-construction-rules
part: w14-merkle-trees-inclusion-proofs
title: "Merkle Construction Rules"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Merkle Construction Rules

## Goal

A Merkle tree turns a list of data items into a single root hash that commits to
every item and its position. Today you internalise the construction rules:
**deterministic leaf ordering across nodes**. Two independent builders given the
same ordered leaf set MUST produce the same root hash. You build a binary Merkle
tree from scratch, defining how leaves are hashed, how internal nodes combine
children, and how odd-leaf-count trees are handled.

✅ Deliverables

1. Implement `MerkleTree::build()` that constructs a tree from an ordered list of leaf hashes.
2. Define the leaf hash rule: `H(0x00 || data)` and the node hash rule: `H(0x01 || left || right)`.
3. Handle odd leaf count by promoting the last leaf (not duplicating).
4. Prove two independent builds from the same leaves produce the same root.
5. Prove changing one leaf changes the root hash.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Tree with N leaves has exactly ceil(log₂N)+1 levels | level count check |
| 2 | Same leaves → same root hash across two independent builds | byte-for-byte match |
| 3 | One-leaf change → different root hash | root differs |
| 4 | Leaf prefix `0x00` and node prefix `0x01` prevent second-preimage | test with swapped roles |
| 5 | Odd leaf count handled without hash duplication | tree structure inspection |

## What You're Building Today

A `MerkleTree` class that takes a vector of leaf data, hashes each with a domain
separator, pairs them bottom-up, and stores the full tree in a flat vector for
efficient proof extraction (Day 2).

✅ Deliverables

- `merkle.h` / `merkle.cpp` — tree construction and root access.
- `main.cpp` — CLI: `merkle_build <file1> <file2> ...` prints root hash.
- `CMakeLists.txt` — build file linking OpenSSL.
- Unit tests for determinism and sensitivity.

```cpp
// Quick taste
std::vector<std::string> leaves = {"alpha", "bravo", "charlie", "delta"};
MerkleTree tree(leaves);
std::cout << "root: " << tree.root() << "\n";
// Changing "alpha" to "Alpha" produces a completely different root
```

**Can:**
- Build a tree from any number of leaves.
- Retrieve the root hash in O(1).
- Store the full tree for proof generation.

**Cannot (yet):**
- Generate inclusion proofs (Day 2).
- Verify proofs (Day 3).
- Append leaves incrementally (Day 4).

## Why This Matters

🔴 **Without deterministic construction**

1. Two nodes build trees with different internal orderings—roots diverge even for same data.
2. Proofs generated on one node fail verification on another.
3. Duplicating the last leaf on odd counts creates a collision vector.
4. Missing domain separators allow second-preimage attacks (leaf ↔ node confusion).

🟢 **With strict construction rules**

1. Any builder anywhere produces the same root for the same data—universal agreement.
2. Proofs are portable across nodes.
3. Promote-not-duplicate avoids artificial collisions.
4. Domain separators make the tree structurally unambiguous.

🔗 **Connects to**

1. Week 13 — CAS object IDs become Merkle leaf hashes.
2. Day 2 — Inclusion proof extraction depends on the tree layout built today.
3. Day 3 — Proof verifier re-derives the root using today's hash rules.
4. Week 15 — Transparency log uses a Merkle tree for its append-only structure.
5. Week 16 — Monitors compare Merkle roots to detect equivocation.

🧠 **Mental model:** A tournament bracket. Each game result depends on the two
teams below it. Change one player's score in round 1, and the bracket all the way
to the final changes. The final score IS the Merkle root.

## Visual Model

```
┌───────────────────────────────────────────────────┐
│            Merkle Tree Construction               │
├───────────────────────────────────────────────────┤
│                                                   │
│  Leaves (data items, ordered):                    │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                 │
│  │  L0 │ │  L1 │ │  L2 │ │  L3 │                 │
│  └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘                 │
│     │       │       │       │                     │
│     ▼       ▼       ▼       ▼                     │
│  H(0x00│L0) H(0x00│L1) H(0x00│L2) H(0x00│L3)    │
│     │       │       │       │                     │
│     └───┬───┘       └───┬───┘                     │
│         ▼               ▼                         │
│    H(0x01│h0│h1)   H(0x01│h2│h3)                  │
│         │               │                         │
│         └───────┬───────┘                         │
│                 ▼                                  │
│          ┌─────────────┐                          │
│          │  ROOT HASH  │                          │
│          │ H(0x01│N│N) │                          │
│          └─────────────┘                          │
│                                                   │
│  Domain separators: 0x00 = leaf, 0x01 = node      │
│  Prevents second-preimage attacks                  │
└───────────────────────────────────────────────────┘
```

## Build

**File:** `week-14/day1-merkle-construction-rules/merkle.h`

```cpp
#pragma once
#include <string>
#include <vector>
#include <cstdint>

class MerkleTree {
public:
    // Build tree from ordered leaf data
    explicit MerkleTree(const std::vector<std::string>& leaves);

    // Root hash (hex-encoded SHA-256)
    std::string root() const;

    // Number of leaves
    size_t leaf_count() const { return leaf_count_; }

    // Access internal node by index (0 = first leaf hash)
    const std::string& node(size_t idx) const { return nodes_[idx]; }

    // Total nodes in flat array
    size_t size() const { return nodes_.size(); }

private:
    std::vector<std::string> nodes_;  // flat array, leaves first
    size_t leaf_count_;

    static std::string hash_leaf(const std::string& data);
    static std::string hash_node(const std::string& left,
                                  const std::string& right);
    static std::string sha256_hex(const std::vector<uint8_t>& input);
};
```

**File:** `week-14/day1-merkle-construction-rules/merkle.cpp`

```cpp
#include "merkle.h"
#include <openssl/sha.h>
#include <sstream>
#include <iomanip>
#include <stdexcept>

std::string MerkleTree::sha256_hex(const std::vector<uint8_t>& input) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256(input.data(), input.size(), hash);
    std::ostringstream oss;
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i)
        oss << std::hex << std::setfill('0') << std::setw(2)
            << static_cast<int>(hash[i]);
    return oss.str();
}

std::string MerkleTree::hash_leaf(const std::string& data) {
    std::vector<uint8_t> buf;
    buf.push_back(0x00);  // leaf domain separator
    buf.insert(buf.end(), data.begin(), data.end());
    return sha256_hex(buf);
}

std::string MerkleTree::hash_node(const std::string& left,
                                   const std::string& right) {
    std::vector<uint8_t> buf;
    buf.push_back(0x01);  // node domain separator
    buf.insert(buf.end(), left.begin(), left.end());
    buf.insert(buf.end(), right.begin(), right.end());
    return sha256_hex(buf);
}

MerkleTree::MerkleTree(const std::vector<std::string>& leaves) {
    if (leaves.empty()) throw std::runtime_error("empty leaf set");
    leaf_count_ = leaves.size();

    // Hash leaves
    std::vector<std::string> current;
    for (const auto& leaf : leaves) {
        std::string h = hash_leaf(leaf);
        nodes_.push_back(h);
        current.push_back(h);
    }

    // Build tree bottom-up
    while (current.size() > 1) {
        std::vector<std::string> next;
        for (size_t i = 0; i < current.size(); i += 2) {
            if (i + 1 < current.size()) {
                std::string h = hash_node(current[i], current[i + 1]);
                nodes_.push_back(h);
                next.push_back(h);
            } else {
                // Odd leaf: promote without duplication
                next.push_back(current[i]);
            }
        }
        current = next;
    }
}

std::string MerkleTree::root() const {
    return nodes_.back();
}
```

## Do

1. **Implement leaf hashing with domain separator**
   💡 WHY: The `0x00` prefix distinguishes leaf hashes from internal node hashes.
   Without it, an attacker can construct a valid-looking subtree from leaf data.
   - `hash_leaf(data)` = `SHA256(0x00 || data)`.
   - Verify: `hash_leaf("test") != SHA256("test")`.

2. **Implement internal node hashing**
   💡 WHY: The `0x01` prefix combined with ordered concatenation makes the tree
   structure unambiguous—swapping left/right children changes the hash.
   - `hash_node(left, right)` = `SHA256(0x01 || left || right)`.
   - Verify: `hash_node(A, B) != hash_node(B, A)`.

3. **Build the tree bottom-up**
   💡 WHY: Bottom-up construction with a flat array is cache-friendly and allows
   O(1) index arithmetic for proof extraction.
   - Pair leaves, hash pairs, repeat until one root remains.
   - Handle odd count: promote last node without hashing with itself.

4. **Test determinism**
   💡 WHY: If two builders produce different roots from the same leaves, proofs
   fail across nodes—this is the fundamental Merkle invariant.
   - Build twice from the same leaves → assert same root.
   - Build with leaves reversed → assert different root (order matters).

5. **Test sensitivity (avalanche)**
   💡 WHY: Changing one leaf must change the root; otherwise the tree does not
   commit to all leaves.
   - Change one leaf → rebuild → assert different root.
   - Record root pairs in `proof.txt`.

## Done when

- [ ] Two independent builds from same ordered leaves produce identical root — *proves determinism*
- [ ] Changing one leaf changes the root hash — *proves commitment to all leaves*
- [ ] Domain separators are present (0x00 for leaf, 0x01 for node) — *proves second-preimage resistance*
- [ ] Odd leaf count does not duplicate the last leaf — *proves correct promotion*
- [ ] Tree with 4 leaves has exactly 3 levels — *proves correct structure*

## Proof

Paste or upload:
1. Two root hashes from independent builds of the same leaf set (must match).
2. Two root hashes showing one-leaf change produces different root.
3. Hex dump showing `0x00` prefix in leaf hash input and `0x01` in node hash input.

**Quick self-test**

Q: Why use domain separators (`0x00` for leaves, `0x01` for nodes)?
A: Without them, an attacker could present two leaves whose concatenation equals a valid internal node hash, creating a second preimage—a different tree that produces the same root.

Q: Why promote the odd leaf instead of duplicating it?
A: Duplicating creates an artificial collision—two different trees (one with N leaves, one with N+1 where the last is duplicated) produce the same root, violating unique commitment.

Q: Why does leaf order affect the root hash?
A: Because `hash_node(A, B) != hash_node(B, A)`. If order did not matter, two different data sets with the same elements would produce the same root—destroying positional commitment.
