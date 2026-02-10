---
id: w15-l03
title: "Consistency Proof"
order: 3
type: lesson
duration_min: 50
---

# Consistency Proof

## Goal

Generate and verify a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) between two tree sizes. The proof shows that the smaller [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) is a prefix of the larger one — no entries were changed or removed as the log grew.

## What you build

A `struct consistency_proof` that holds the old tree size, the new tree size, and an array of [SHA-256](https://en.wikipedia.org/wiki/SHA-2) sibling hashes. A `log_consistency_proof()` function that takes the [transparency log](lessons/01-append-only-model.md), an old size, and a new size, then returns the proof — the minimal set of [Merkle](https://en.wikipedia.org/wiki/Merkle_tree) node hashes an auditor needs to link the old [root](https://en.wikipedia.org/wiki/Merkle_tree#Overview) to the new [root](https://en.wikipedia.org/wiki/Merkle_tree#Overview). A `verify_consistency()` function that takes the old [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview), the new [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview), and the proof, then returns pass or fail.

## Why it matters

An [inclusion proof](../w14/lessons/03-generate-inclusion-proof.md) shows that one entry belongs to a tree. A [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) shows that the entire old tree is embedded unchanged inside the new tree. Without consistency proofs, a dishonest log operator could silently remove an entry, rebuild the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree), and publish a new [tree head](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) that still looks valid. [Certificate Transparency](https://datatracker.ietf.org/doc/html/rfc6962) monitors demand a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) every time the tree head changes. [Go SumDB](https://go.dev/ref/mod#checksum-database) clients verify consistency before trusting a new batch. This proof is the core tamper-detection mechanism.

---

## Training Session

### Warmup

Read [RFC 6962 §2.1.2 (Merkle Consistency Proofs)](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2). Write down:

1. What "the old tree is a prefix of the new tree" means in plain words.
2. How many hashes the proof contains for a tree that grew from 4 entries to 8 entries.
3. What the verifier does with those hashes to reconstruct both roots.

Sketch on paper: a 4-leaf tree and a 7-leaf tree. Mark which subtrees are shared and which are new. The shared subtree roots are the consistency proof.

### Work

#### Do

1. Add to `w15/log.h`:
   - `struct consistency_proof` with `uint64_t old_size`, `uint64_t new_size`, `uint8_t (*hashes)[32]` (array of 32-byte hashes), and `size_t proof_len`.
   - `consistency_proof log_consistency_proof(transparency_log *log, uint64_t old_size, uint64_t new_size)`.
   - `int verify_consistency(const uint8_t old_root[32], uint64_t old_size, const uint8_t new_root[32], uint64_t new_size, const consistency_proof *proof)` — returns `1` for pass, `0` for fail.
   - `void consistency_proof_free(consistency_proof *proof)`.
2. In `w15/log.c`, implement `log_consistency_proof()`:
   - Follow the [RFC 6962 §2.1.2](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) algorithm. Walk the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) built from the new tree's leaves. Find the subtree boundaries that correspond to the old size. Collect the node hashes that bridge the old root to the new root.
   - If `old_size == 0`, the proof is empty (an empty tree is trivially a prefix of anything).
   - If `old_size == new_size`, the proof is empty (both roots [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be equal).
3. Implement `verify_consistency()`:
   - Start from the proof hashes. Reconstruct the old [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview) and the new [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview) using the same [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) internal hash rule (`SHA-256(0x01 ‖ left ‖ right)`).
   - Compare the reconstructed roots against the provided old and new roots. Return `1` only if both match.
4. Write `w15/consistency_test.c`:
   - Append `"a"`, `"b"`, `"c"`, `"d"`. Checkpoint (size=4).
   - Append `"e"`, `"f"`, `"g"`. Checkpoint (size=7).
   - Generate a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) from size 4 to size 7.
   - Print the proof hashes and proof length.
   - Verify the proof. Print PASS or FAIL.
   - Tamper test: flip one byte in the old root and verify again. Print PASS or FAIL (should be FAIL).

#### Test

```bash
gcc -Wall -Wextra -Werror -o consistency_test \
  w15/log.c w15/consistency_test.c -lcrypto
./consistency_test
```

#### Expected

```
consistency proof (4 → 7): proof_len=3
hash[0]: <hex>
hash[1]: <hex>
hash[2]: <hex>
verify(4 → 7): PASS
verify(tampered): FAIL
```

No crashes. No memory leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind --leak-check=full ./consistency_test
```

Zero leaks. Zero errors. Verify that the tampered case returns FAIL without crashing.

### Ship It

```bash
git add w15/log.h w15/log.c w15/consistency_test.c
git commit -m "w15-l03: consistency proof generation and verification"
```

---

## Done when

- `log_consistency_proof()` returns the correct sibling hashes for any pair of sizes where `old_size ≤ new_size ≤ log->size`.
- `verify_consistency()` returns `1` for a valid proof and `0` for a tampered proof.
- Empty-to-any and same-to-same proofs are handled (empty proof, both trivially pass).
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero leaks and zero errors.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Confusing [inclusion proofs](../w14/lessons/03-generate-inclusion-proof.md) with [consistency proofs](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) | An inclusion proof shows one leaf belongs to a tree. A consistency proof shows one entire tree is a prefix of another. They collect different sets of hashes. |
| Using the wrong tree-split boundary | The old tree boundary follows the largest power of two less than `old_size`. Splitting at the wrong point collects the wrong hashes. Draw the tree on paper first. |
| Forgetting to reconstruct both roots during verification | The verifier [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reconstruct the old root and the new root from the proof. Checking only one root lets a dishonest log pass half the test. |
| Not handling the degenerate cases | `old_size == 0` and `old_size == new_size` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) return an empty proof and pass verification. |

## Proof

```bash
./consistency_test
# → proof_len, hex hashes, PASS for valid, FAIL for tampered
valgrind --leak-check=full ./consistency_test
# → 0 errors from 0 contexts
```

## Hero visual

```
  OLD TREE (size=4)              NEW TREE (size=7)

       root_old                       root_new
       ╱     ╲                       ╱        ╲
     H01     H23                   H01         H456
     ╱ ╲     ╱ ╲                   ╱ ╲        ╱    ╲
   H0  H1  H2  H3               H0  H1    H45     H6
                                           ╱  ╲     │
                 ▲                        H4   H5   L6
                 │                        │    │
           shared subtree            new entries
           ─────────────
  Consistency proof = [ H456, ... ]
  Verifier rebuilds root_old from left subtree hashes
  Verifier rebuilds root_new from all proof hashes
  Both match → the old tree is a prefix of the new tree
```

## Future Lock

- In [W15 L04](04-audit-client.md) the audit client will fetch two checkpoints and call `verify_consistency()` to detect tampering.
- In [W15 L06](06-regression-harness.md) the [regression harness](06-regression-harness.md) will run consistency proofs across many size pairs and compare against known vectors.
- In [W16](../w16/part.md) a [monitor](../w16/part.md) will demand a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) each time the [signed tree head](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) changes.
- In [W18](../w18/part.md) the [anchoring system](../w18/part.md) will store old and new checkpoints alongside the proof so external verifiers can audit the growth history offline.
