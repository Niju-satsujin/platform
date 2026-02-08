---
id: w14-merkle-trees-inclusion-proofs-d04-incremental-merkle-plan
part: w14-merkle-trees-inclusion-proofs
title: "Incremental Merkle Plan"
order: 4
duration_minutes: 120
prereqs: ["w14-merkle-trees-inclusion-proofs-d03-proof-verifier-rules"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Incremental Merkle Plan

## Goal

Rebuilding the entire Merkle tree on every append is O(N)—unacceptable for a
growing log. Today you implement an incremental Merkle tree where appending a
leaf updates only O(log N) nodes. The invariant: **append must not recompute
the entire tree**. You maintain a set of "frozen" subtree roots and merge them
on append, producing the same root as a full rebuild.

✅ Deliverables

1. Implement `IncrementalMerkle` that maintains a compact state of O(log N) hashes.
2. Implement `append(leaf)` that updates only the necessary path.
3. Prove that the incremental root matches a full rebuild root for the same leaves.
4. Benchmark: incremental append is O(log N), full rebuild is O(N).
5. Implement `frozen_subtrees()` that exposes the compact state for serialisation.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Incremental root matches full-rebuild root for 1-1000 leaves | 100 % match |
| 2 | Append touches ≤ ceil(log₂N) + 1 nodes | counter check |
| 3 | Compact state has ≤ ceil(log₂N) entries | size check |
| 4 | Serialise + deserialise state → append continues correctly | round-trip test |
| 5 | Benchmark shows O(log N) vs O(N) scaling | timing ratio |

## What You're Building Today

An `IncrementalMerkle` class that stores only the right-edge "peaks" of the
complete binary subtrees. On append, it merges peaks bottom-up, exactly like
binary addition carrying. The result is equivalent to a full tree but requires
only O(log N) storage and O(log N) work per append.

✅ Deliverables

- `incremental_merkle.h` / `incremental_merkle.cpp` — incremental tree.
- `main.cpp` — CLI: `merkle_append <leaf_data>` (appends to persistent state).
- `bench.cpp` — benchmark comparing incremental vs full rebuild.
- `test_equivalence.cpp` — fuzz test comparing roots.

```cpp
// Quick taste
IncrementalMerkle imt;
for (const auto& leaf : leaves) {
    imt.append(leaf);
}
// imt.root() == MerkleTree(leaves).root()  ← guaranteed
```

**Can:**
- Append leaves in O(log N) time and space.
- Serialise compact state for checkpoint/resume.
- Produce identical roots to full-rebuild trees.

**Cannot (yet):**
- Generate proofs for historical tree sizes (needs snapshotting).
- Detect adversarial appends (Day 5).

## Why This Matters

🔴 **Without incremental append**

1. Every new log entry triggers an O(N) full rebuild—1M entries = 1M hashes per append.
2. Latency grows linearly with log size, making real-time systems impossible.
3. Memory usage requires loading all leaves for every root update.
4. Checkpointing requires serialising the entire tree.

🟢 **With incremental Merkle**

1. Append is O(log N)—1M entries costs ~20 hashes per append.
2. Compact state is O(log N)—only frozen subtree peaks are stored.
3. State serialisation is tiny—fits in a single cache line.
4. Consistent with full-rebuild roots—no trust trade-off.

🔗 **Connects to**

1. Day 1 — Uses the same `hash_leaf()` and `hash_node()` construction rules.
2. Day 2 — Inclusion proofs can be generated from the incremental state.
3. Day 3 — Verifier works identically—roots are bit-compatible.
4. Week 15 — Transparency log uses incremental Merkle for efficient append.
5. Week 16 — Monitors track incremental roots for real-time equivocation checks.

🧠 **Mental model:** Binary addition. The peaks are like the 1-bits in a binary
number. Appending a leaf is like adding 1: carry propagates through consecutive
1-bits, merging peaks. The number of peaks equals the number of 1-bits in the
leaf count—O(log N) at most.

## Visual Model

```
┌─────────────────────────────────────────────────────┐
│          Incremental Merkle: Binary Peaks            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  After 5 appends (binary: 101):                     │
│                                                     │
│  Peak[2]        Peak[0]                             │
│  (4-leaf        (1-leaf                             │
│   subtree)       subtree)                           │
│      ┌──┴──┐       │                               │
│    ┌─┴─┐┌─┴─┐    ┌─┴─┐                             │
│    │   ││   │    │   │                              │
│   L0 L1 L2 L3   L4                                 │
│                                                     │
│  State: [peak_at_height_2, -, peak_at_height_0]     │
│                                                     │
│  Append L5 (binary: 101 + 1 = 110):                 │
│                                                     │
│  1. Hash L5 as leaf                                 │
│  2. Merge with Peak[0] → new height-1 subtree      │
│  3. No Peak[1] exists → store as Peak[1]            │
│                                                     │
│  New state: [peak_at_height_2, peak_at_height_1, -] │
│                                                     │
│  Root = hash(peak_2, peak_1)                        │
│       = hash of all 6 leaves                        │
└─────────────────────────────────────────────────────┘
```

## Build

**File:** `week-14/day4-incremental-merkle-plan/incremental_merkle.h`

```cpp
#pragma once
#include <string>
#include <vector>
#include <optional>

class IncrementalMerkle {
public:
    IncrementalMerkle() = default;

    // Append a new leaf (raw data, will be hash_leaf'd)
    void append(const std::string& leaf_data);

    // Current root hash
    std::string root() const;

    // Number of leaves appended so far
    size_t size() const { return size_; }

    // Compact state: frozen subtree peaks (for serialisation)
    std::vector<std::optional<std::string>> peaks() const { return peaks_; }

    // Restore from serialised state
    static IncrementalMerkle from_peaks(
        const std::vector<std::optional<std::string>>& peaks, size_t size);

private:
    std::vector<std::optional<std::string>> peaks_;  // peaks_[h] = subtree root at height h
    size_t size_ = 0;

    static std::string hash_leaf(const std::string& data);
    static std::string hash_node(const std::string& left,
                                  const std::string& right);
};
```

**File:** `week-14/day4-incremental-merkle-plan/incremental_merkle.cpp`

```cpp
#include "incremental_merkle.h"
#include <openssl/sha.h>
#include <sstream>
#include <iomanip>
#include <stdexcept>

// hash_leaf and hash_node identical to MerkleTree (Day 1)

void IncrementalMerkle::append(const std::string& leaf_data) {
    std::string hash = hash_leaf(leaf_data);
    size_t h = 0;

    // Carry propagation: merge with existing peaks
    while (h < peaks_.size() && peaks_[h].has_value()) {
        hash = hash_node(peaks_[h].value(), hash);
        peaks_[h] = std::nullopt;  // consumed
        h++;
    }

    // Store the new peak
    if (h >= peaks_.size()) peaks_.resize(h + 1);
    peaks_[h] = hash;
    size_++;
}

std::string IncrementalMerkle::root() const {
    if (size_ == 0) throw std::runtime_error("empty tree");

    std::optional<std::string> running;
    for (const auto& peak : peaks_) {
        if (!peak.has_value()) continue;
        if (!running.has_value()) {
            running = peak.value();
        } else {
            running = hash_node(peak.value(), running.value());
        }
    }
    return running.value();
}
```

## Do

1. **Implement peak-based state**
   💡 WHY: Peaks represent complete binary subtrees at each power-of-two height.
   This is the minimal state needed to compute the root and continue appending.
   - `peaks_[h]` = root of a 2^h-leaf subtree, or nullopt if absent.
   - The set of occupied heights corresponds to 1-bits in the leaf count.

2. **Implement append with carry propagation**
   💡 WHY: Carry propagation is the key insight—it mirrors binary increment.
   Each merge consumes a peak and produces a taller one, touching O(log N) nodes.
   - Hash the new leaf, then while a peak exists at the current height, merge.
   - Place the result at the next empty height.

3. **Implement root computation from peaks**
   💡 WHY: The root is computed by folding peaks right-to-left, matching the
   structure of a full tree. This must produce the same root as `MerkleTree`.
   - Iterate peaks from lowest to highest, combining with `hash_node()`.
   - A single peak = the root itself.

4. **Test equivalence with full rebuild**
   💡 WHY: The incremental tree is only useful if it produces the same root as
   a full rebuild. Any divergence means proofs will fail.
   - For N in [1..100], build both ways, assert roots match.
   - Bonus: fuzz with random leaf data.

5. **Benchmark O(log N) vs O(N)**
   💡 WHY: The whole point of incremental Merkle is performance. If it is not
   measurably faster, the complexity is not justified.
   - Time 10,000 incremental appends vs 10,000 full rebuilds.
   - Plot or print the ratio.
   - Record in `proof.txt`.

## Done when

- [ ] Incremental root matches full-rebuild root for 1-1000 leaves — *proves correctness*
- [ ] Append touches ≤ ceil(log₂N) + 1 nodes — *proves O(log N) complexity*
- [ ] Compact state has ≤ ceil(log₂N) entries — *proves O(log N) space*
- [ ] Serialise + deserialise state → continued appends produce correct root — *proves persistence*
- [ ] Benchmark shows 10x+ speedup over full rebuild at 10K leaves — *proves practical benefit*

## Proof

Paste or upload:
1. Output of equivalence test showing 100+ matching roots.
2. Node-touch counter output showing ≤ 20 for a 1M-leaf tree.
3. Benchmark output showing incremental vs full-rebuild timing.

**Quick self-test**

Q: Why does the peak set mirror binary representation of the leaf count?
A: Each peak represents a complete subtree of size 2^h. The leaf count N can be decomposed as a sum of powers of two (its binary representation), and each 1-bit corresponds to an existing peak.

Q: What is the worst-case number of merges on a single append?
A: O(log N)—when all current peaks exist (all 1-bits), the carry propagates through all of them. This is rare (like carrying through all digits when incrementing 111...1 in binary).

Q: Why fold peaks right-to-left when computing the root?
A: The rightmost (lowest-height) peak represents the most recently appended leaves. Folding right-to-left places newer leaves as right children, matching the structure of a tree built by sequential left-to-right insertion.
