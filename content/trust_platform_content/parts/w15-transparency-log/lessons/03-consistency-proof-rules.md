---
id: w15-transparency-log-d03-consistency-proof-rules
part: w15-transparency-log
title: "Consistency Proof Rules"
order: 3
duration_minutes: 120
prereqs: ["w15-transparency-log-d02-inclusion-api-bundle"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Consistency Proof Rules

## Goal

Inclusion proofs verify a single entry. But how does a client know the log has not
been silently rewritten since their last check? **Consistency proofs** answer this:
they prove that an older checkpoint is a prefix of the current checkpoint. The
invariant: **any new checkpoint must be consistency-provable from any previous
checkpoint**. If a log server cannot produce a consistency proof, it is evidence
of tampering or equivocation.

✅ Deliverables

1. Define a `ConsistencyProof` struct: old_size, new_size, path of sibling hashes.
2. Implement `TransparencyLog::prove_consistency(old_size, new_size)`.
3. Implement `verify_consistency(proof, old_root, new_root)`.
4. Prove that a legitimately-grown log always produces valid consistency proofs.
5. Prove that a forked log (different entry at position N) fails consistency.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Consistency proof between sizes N and M (N < M) verifies | OK for all N < M ≤ 100 |
| 2 | Proof from size 1 to size N verifies | OK for N up to 100 |
| 3 | Forked log fails consistency (replace entry, re-derive root) | ROOT_MISMATCH |
| 4 | old_size > new_size is rejected immediately | INVALID_SIZES |
| 5 | old_size == new_size returns empty path and verifies trivially | OK with path.size() == 0 |

## What You're Building Today

A consistency proof generator and verifier. The generator walks the Merkle tree
structure identifying subtrees that are shared between the old and new tree
versions. The verifier re-derives both the old and new roots from the proof path
and compares.

✅ Deliverables

- `consistency.h` / `consistency.cpp` — proof generation and verification.
- Updated `log.h` / `log.cpp` — `prove_consistency()` method.
- `main.cpp` — CLI: `tlog consistency <old_size> <new_size>`.
- `test_consistency.cpp` — positive, negative, and fork tests.

```cpp
// Quick taste
auto proof = log.prove_consistency(5, 10);
bool ok = verify_consistency(proof, old_root, new_root);
// ok == true if log[0..5] is a prefix of log[0..10]
```

**Can:**
- Prove any old checkpoint is consistent with any newer checkpoint.
- Detect log forking or silent rewrite.
- Verify consistency without downloading any entries.

**Cannot (yet):**
- Sign checkpoints cryptographically (Day 4).
- Orchestrate full verification workflow (Day 5).

## Why This Matters

🔴 **Without consistency proofs**

1. A log server can present different histories to different clients (equivocation).
2. Clients must re-download and re-verify the entire log on every check.
3. Silent entry deletion goes undetected—the client sees a valid root but different history.
4. No formal mechanism to detect log forking or rollback.

🟢 **With consistency proofs**

1. Client with old checkpoint can verify the new log is an extension, not a rewrite.
2. O(log N) proof size—no need to re-download entries.
3. Fork detection is automatic—inconsistent logs cannot produce valid proofs.
4. Establishes a monotonic trust chain across checkpoints.

🔗 **Connects to**

1. Day 1 — Consistency proofs reference the append-only log entries.
2. Day 2 — Inclusion bundles provide checkpoints that consistency proofs bridge.
3. Day 4 — Signed checkpoints make consistency proofs non-repudiable.
4. Day 5 — Verifier workflow uses consistency to advance cached state.
5. Week 16 — Monitors use consistency proofs to detect equivocation.

🧠 **Mental model:** A construction project diary. Each week the foreman signs
off on progress. A consistency proof is showing that last week's signed pages
are still intact in this week's diary—the new pages only extend the book, never
alter the old ones.

## Visual Model

```
┌──────────────────────────────────────────────────────┐
│           Consistency Proof Structure                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Old tree (size 4):     New tree (size 7):           │
│                                                      │
│       ┌──R₄──┐              ┌────R₇────┐            │
│     ┌─┴─┐ ┌─┴─┐          ┌─┴─┐      ┌─┴─┐          │
│     N01  N23            N01  N23   N45  L6           │
│    ┌┴┐  ┌┴┐            ┌┴┐  ┌┴┐  ┌┴┐               │
│    L0 L1 L2 L3         L0 L1 L2 L3 L4 L5            │
│                                                      │
│  Shared subtree: N01, N23 (same in both trees)       │
│                                                      │
│  Consistency proof (old=4, new=7):                   │
│  ┌──────────────────────────────────────┐            │
│  │ old_size: 4, new_size: 7             │            │
│  │ path: [                              │            │
│  │   hash(N45),    ← new subtree        │            │
│  │   hash(L6)      ← new leaf           │            │
│  │ ]                                    │            │
│  └──────────────────────────────────────┘            │
│                                                      │
│  Verify: rebuild R₄ from shared parts               │
│          rebuild R₇ from shared + proof path         │
│          compare both to expected roots              │
└──────────────────────────────────────────────────────┘
```

## Build

**File:** `week-15/day3-consistency-proof-rules/consistency.h`

```cpp
#pragma once
#include <string>
#include <vector>
#include <cstdint>

struct ConsistencyProof {
    uint64_t old_size;
    uint64_t new_size;
    std::vector<std::string> path;  // sibling hashes

    std::string to_json() const;
    static ConsistencyProof from_json(const std::string& json);
};

enum class ConsistencyResult {
    OK,
    INVALID_SIZES,        // old_size > new_size or zero
    INVALID_PATH_LENGTH,
    OLD_ROOT_MISMATCH,
    NEW_ROOT_MISMATCH,
};

ConsistencyResult verify_consistency(
    const ConsistencyProof& proof,
    const std::string& old_root,
    const std::string& new_root);

std::string consistency_reason(ConsistencyResult r);
```

**File:** `week-15/day3-consistency-proof-rules/consistency.cpp`

```cpp
#include "consistency.h"
#include "merkle.h"
#include <cmath>

ConsistencyResult verify_consistency(
    const ConsistencyProof& proof,
    const std::string& old_root,
    const std::string& new_root) {
    // CHECK 1: size sanity
    if (proof.old_size == 0 || proof.old_size > proof.new_size)
        return ConsistencyResult::INVALID_SIZES;

    // CHECK 2: trivial case
    if (proof.old_size == proof.new_size) {
        if (old_root != new_root) return ConsistencyResult::NEW_ROOT_MISMATCH;
        return ConsistencyResult::OK;
    }

    // CHECK 3: walk the proof path
    // The verifier reconstructs both old_root and new_root
    // from the shared subtree hashes and the consistency path.
    //
    // Implementation follows RFC 6962 §2.1.2 algorithm:
    // - Decompose old_size into complete subtrees
    // - Verify their combination yields old_root
    // - Extend with proof path hashes to yield new_root
    //
    // (Full implementation left as exercise — the structure
    //  and verification checks are the focus today)

    // Placeholder for the full algorithm:
    std::string recomputed_old = old_root;  // replaced by actual computation
    std::string recomputed_new = new_root;  // replaced by actual computation

    if (recomputed_old != old_root)
        return ConsistencyResult::OLD_ROOT_MISMATCH;
    if (recomputed_new != new_root)
        return ConsistencyResult::NEW_ROOT_MISMATCH;

    return ConsistencyResult::OK;
}
```

## Do

1. **Define ConsistencyProof struct**
   💡 WHY: The struct captures the minimal information needed: old size, new
   size, and the path of hashes that bridges them. Self-contained for transport.
   - Fields: `old_size`, `new_size`, `path[]`.
   - JSON serialisation with deterministic order.

2. **Implement proof generation**
   💡 WHY: The generator must identify which subtrees are shared between old and
   new trees, and provide only the new hashes the verifier needs.
   - Decompose old_size into complete subtree sizes (binary decomposition).
   - For each subtree boundary, emit the sibling hash from the new tree.

3. **Implement proof verification (RFC 6962 algorithm)**
   💡 WHY: The verifier reconstructs BOTH old_root and new_root from the proof.
   Matching both proves the new tree is an extension of the old one.
   - Reconstruct old_root from the shared subtree hashes in the proof.
   - Extend with additional hashes to reconstruct new_root.
   - Compare both to expected values.

4. **Test legitimate growth**
   💡 WHY: For every pair (old, new) where old < new, a legitimately grown log
   must produce a valid consistency proof. Any failure is a bug.
   - Loop: for old in [1..50], for new in [old+1..50], verify consistency.

5. **Test forked log detection**
   💡 WHY: This is the critical security test—if someone replaces an entry and
   re-derives the root, the consistency proof must fail.
   - Build log with 10 entries. Record root at size 5.
   - Replace entry 3 and rebuild. New root differs.
   - `prove_consistency(5, 10)` against the old root → MISMATCH.

## Done when

- [ ] Consistency proof between any valid (old, new) pair verifies — *proves monotonic extension*
- [ ] Forked log fails consistency check — *proves fork detection*
- [ ] old_size > new_size is rejected immediately — *proves size validation*
- [ ] old_size == new_size returns trivially OK — *proves edge case handling*
- [ ] Proof size is O(log N) — *proves efficiency*

## Proof

Paste or upload:
1. Output of consistency verification for 10 pairs of (old, new) sizes.
2. Forked-log test showing consistency failure.
3. Proof size (number of hashes) for various N values.

**Quick self-test**

Q: What is the difference between an inclusion proof and a consistency proof?
A: An inclusion proof shows a specific entry is in the tree at a given root. A consistency proof shows that one root is a prefix-extension of another—the old tree is embedded in the new tree.

Q: Why does the verifier need to reconstruct BOTH old and new roots?
A: Reconstructing only the new root would not verify that the old tree is preserved. Reconstructing both proves the new tree contains the old tree as a prefix.

Q: How does a consistency proof detect a forked log?
A: A fork means at least one old entry was changed. Changed entries produce different subtree hashes. The verifier recomputing the old root from the proof path will get a hash that does not match the expected old root.
