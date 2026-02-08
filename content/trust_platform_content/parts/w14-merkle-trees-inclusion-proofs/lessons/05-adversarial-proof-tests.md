---
id: w14-merkle-trees-inclusion-proofs-d05-adversarial-proof-tests
part: w14-merkle-trees-inclusion-proofs
title: "Adversarial Proof Tests"
order: 5
duration_minutes: 120
prereqs: ["w14-merkle-trees-inclusion-proofs-d04-incremental-merkle-plan"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Adversarial Proof Tests

## Goal

You have a tree builder, proof generator, and verifier. Today you break them.
The invariant under test: **stale root proofs must be explicitly marked
unverifiable**, and every attack vector you can construct must be caught by the
verifier. You build a comprehensive adversarial test suite that exercises
forgery, replay, truncation, and equivocation scenarios.

✅ Deliverables

1. Build a test harness that generates valid proofs, then mutates them systematically.
2. Test stale-root rejection: proof from tree at size N fails against root at size N+1.
3. Test sibling forgery: replace one path hash with a random value.
4. Test index shifting: claim a proof for leaf i is for leaf j.
5. Test domain-separator bypass: swap leaf/node prefixes.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | All 10+ adversarial variants are rejected by verifier | 100 % rejection |
| 2 | Stale root proof returns ROOT_MISMATCH specifically | enum check |
| 3 | Truncated proof returns INVALID_PATH_LENGTH | enum check |
| 4 | Index-shifted proof returns ROOT_MISMATCH | enum check |
| 5 | Test harness logs each attack variant and result | structured output |

## What You're Building Today

An adversarial test framework that programmatically generates valid proofs, then
applies mutations (bit-flip, truncation, field swap, replay) and verifies that the
verifier from Day 3 rejects every one. This is the security validation layer.

✅ Deliverables

- `adversarial_tests.cpp` — test harness with 10+ attack variants.
- `attack_catalog.md` — documentation of each attack and expected rejection.
- `main.cpp` — runner that executes all tests and prints results.
- Structured JSON output of test results.

```cpp
// Quick taste
struct AttackResult {
    std::string name;
    VerifyResult expected;
    VerifyResult actual;
    bool passed;  // passed = verifier correctly rejected
};

std::vector<AttackResult> results = run_adversarial_suite(tree, proofs);
for (const auto& r : results) {
    std::cout << r.name << ": " << (r.passed ? "DEFENDED" : "VULNERABLE") << "\n";
}
```

**Can:**
- Systematically test 10+ attack vectors.
- Produce a machine-parseable vulnerability report.
- Validate that the entire proof pipeline is secure.

**Cannot (yet):**
- Test distributed equivocation (Week 16).
- Test log consistency proofs (Week 15).

## Why This Matters

🔴 **Without adversarial testing**

1. You only know the verifier works for valid proofs—not that it rejects invalid ones.
2. Edge cases (odd tree sizes, single-leaf trees) hide exploitable bugs.
3. Stale-root replays go undetected, allowing attackers to prove historical states as current.
4. Team confidence in the proof system is based on hope, not evidence.

🟢 **With systematic adversarial tests**

1. Every known attack class is tested and documented.
2. Regression tests catch verifier weaknesses introduced by future changes.
3. Stale-root handling is explicit and tested.
4. Security claims are backed by machine-verifiable evidence.

🔗 **Connects to**

1. Day 1 — Tests validate construction rules (domain separators, ordering).
2. Day 2 — Tests target proof format completeness.
3. Day 3 — Verifier is the system under test.
4. Week 15 — Log consistency proofs face analogous adversarial scenarios.
5. Week 16 — Monitor equivocation detection reuses adversarial thinking.

🧠 **Mental model:** A penetration test for cryptographic proofs. You are both
the attacker and the defender. Your job is to find every way to forge, replay, or
truncate a proof—then verify that the fortress holds.

## Visual Model

```
┌────────────────────────────────────────────────────────┐
│            Adversarial Test Matrix                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Valid Proof ──▶ Mutation Engine ──▶ Verify ──▶ Result │
│                                                        │
│  Attack Variants:                                      │
│  ┌────────────────────────┬──────────────────────┐     │
│  │ Attack                 │ Expected Rejection   │     │
│  ├────────────────────────┼──────────────────────┤     │
│  │ Truncated path         │ INVALID_PATH_LENGTH  │     │
│  │ Extended path          │ INVALID_PATH_LENGTH  │     │
│  │ Bit-flipped sibling    │ ROOT_MISMATCH        │     │
│  │ Swapped sides          │ ROOT_MISMATCH        │     │
│  │ Index shift            │ ROOT_MISMATCH        │     │
│  │ Stale root             │ ROOT_MISMATCH        │     │
│  │ Empty leaf hash        │ EMPTY_HASH           │     │
│  │ Index out of bounds    │ INVALID_INDEX        │     │
│  │ Zero tree_size         │ INVALID_INDEX        │     │
│  │ Domain separator swap  │ ROOT_MISMATCH        │     │
│  └────────────────────────┴──────────────────────┘     │
│                                                        │
│  Result: 10/10 DEFENDED  ──▶ ✅ PASS                   │
│  Result:  9/10 DEFENDED  ──▶ ❌ VULNERABLE              │
└────────────────────────────────────────────────────────┘
```

## Build

**File:** `week-14/day5-adversarial-proof-tests/adversarial_tests.h`

```cpp
#pragma once
#include "merkle.h"
#include "proof.h"
#include "verifier.h"
#include <string>
#include <vector>
#include <functional>

struct AttackResult {
    std::string name;
    std::string description;
    VerifyResult expected;
    VerifyResult actual;
    bool defended;
};

class AdversarialSuite {
public:
    AdversarialSuite(const MerkleTree& tree, const std::string& root);

    void register_attack(const std::string& name,
                         const std::string& desc,
                         VerifyResult expected,
                         std::function<InclusionProof()> mutator);

    std::vector<AttackResult> run_all();
    std::string results_json(const std::vector<AttackResult>& results);

private:
    const MerkleTree& tree_;
    std::string root_;
    struct Attack {
        std::string name;
        std::string description;
        VerifyResult expected;
        std::function<InclusionProof()> mutator;
    };
    std::vector<Attack> attacks_;
};
```

**File:** `week-14/day5-adversarial-proof-tests/adversarial_tests.cpp`

```cpp
#include "adversarial_tests.h"

void AdversarialSuite::register_attack(
    const std::string& name, const std::string& desc,
    VerifyResult expected,
    std::function<InclusionProof()> mutator) {
    attacks_.push_back({name, desc, expected, mutator});
}

std::vector<AttackResult> AdversarialSuite::run_all() {
    std::vector<AttackResult> results;
    for (const auto& atk : attacks_) {
        InclusionProof mutated = atk.mutator();
        VerifyResult actual = verify_inclusion(mutated, root_);
        results.push_back({
            atk.name, atk.description, atk.expected, actual,
            actual == atk.expected
        });
    }
    return results;
}

// Example attack registrations:
void register_standard_attacks(AdversarialSuite& suite,
                                const MerkleTree& tree) {
    // Attack 1: Truncated path
    suite.register_attack("truncated_path",
        "Remove last element of proof path",
        VerifyResult::INVALID_PATH_LENGTH,
        [&]() {
            auto proof = tree.prove(0);
            proof.path.pop_back();
            return proof;
        });

    // Attack 2: Bit-flipped sibling
    suite.register_attack("bitflip_sibling",
        "Flip first char of first sibling hash",
        VerifyResult::ROOT_MISMATCH,
        [&]() {
            auto proof = tree.prove(0);
            if (!proof.path.empty())
                proof.path[0].hash[0] ^= 0x01;
            return proof;
        });

    // Attack 3: Index shift
    suite.register_attack("index_shift",
        "Change leaf_index from 0 to 1",
        VerifyResult::ROOT_MISMATCH,
        [&]() {
            auto proof = tree.prove(0);
            proof.leaf_index = 1;
            return proof;
        });

    // Attack 4: Stale root (prove against old tree)
    suite.register_attack("stale_root",
        "Proof from smaller tree verified against larger root",
        VerifyResult::ROOT_MISMATCH,
        [&]() {
            // Proof is valid for old root but not new root
            return tree.prove(0);
        });
}
```

## Do

1. **Build the attack registration framework**
   💡 WHY: A structured framework makes it easy to add new attacks as new
   vulnerabilities are discovered. Each attack is a named, documented mutation.
   - Define `AttackResult` struct with name, expected, actual, defended.
   - Register attacks as lambdas that return mutated proofs.

2. **Implement 10+ attack variants**
   💡 WHY: Each variant targets a different verifier check. Full coverage means
   full confidence. Missing even one variant could hide a real vulnerability.
   - Truncated path, extended path, bit-flipped sibling, swapped sides.
   - Index shift, stale root, empty leaf hash, out-of-bounds index.
   - Zero tree_size, domain separator bypass.

3. **Test stale-root rejection specifically**
   💡 WHY: Stale-root replay is the most practical attack—an old proof is
   replayed after the tree has grown. The verifier must reject it.
   - Build tree with 4 leaves, get proof. Append 4 more leaves. New root.
   - Verify old proof against new root → must fail.

4. **Generate structured test report**
   💡 WHY: Machine-parseable results feed into CI gates. Human-readable names
   and descriptions make the report useful for security audits.
   - JSON output: `[{name, description, expected, actual, defended}, ...]`.
   - Summary: `10/10 DEFENDED` or `9/10 — VULNERABLE: <name>`.

5. **Document the attack catalog**
   💡 WHY: The catalog serves as institutional knowledge—future engineers can
   understand what attacks exist and verify the system defends against them.
   - One paragraph per attack: what it does, why it should be caught, which
     verifier check catches it.
   - Record in `attack_catalog.md`.

## Done when

- [ ] 10+ adversarial variants are all rejected by the verifier — *proves comprehensive defense*
- [ ] Stale root proof is explicitly rejected with ROOT_MISMATCH — *proves freshness checking*
- [ ] Truncated path is caught by INVALID_PATH_LENGTH — *proves structural validation*
- [ ] Test harness produces structured JSON output — *proves automation readiness*
- [ ] Attack catalog documents each variant with rationale — *proves institutional knowledge*

## Proof

Paste or upload:
1. JSON test report showing 10+ attacks, all DEFENDED.
2. Stale-root specific test output with rejection reason.
3. `attack_catalog.md` with at least 10 documented attack variants.

**Quick self-test**

Q: Why is stale-root replay the most practical Merkle attack?
A: Because an attacker does not need to forge anything—they reuse a legitimately generated proof from a previous tree version. If the verifier does not bind proofs to a specific root, old proofs pass indefinitely.

Q: What is the difference between a bit-flip attack and a forgery attack?
A: A bit-flip mutates a single bit in an existing valid proof (easy but random). A forgery attempts to construct a proof from scratch for a leaf not in the tree (hard due to hash preimage resistance).

Q: Why test with both even and odd leaf counts?
A: Odd leaf counts trigger the promotion logic (Day 1). If promotion has a bug, even-leaf-count tests will not catch it—the verifier could pass on even trees and fail on odd ones.
