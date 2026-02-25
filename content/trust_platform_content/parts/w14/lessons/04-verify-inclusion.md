---
id: w14-l04
title: "Verify inclusion proofs"
order: 4
duration_minutes: 25
xp: 50
kind: lesson
part: w14
proof:
  type: paste
  instructions: "Paste the output showing: (1) a valid inclusion proof verified as PASS, (2) a tampered proof verified as FAIL."
  regex_patterns:
    - "PASS|valid|verified|true"
    - "FAIL|invalid|rejected|false"
---
# Verify inclusion proofs

## Concept

Generating a proof is one side of the coin. Verifying it is the other. The verifier has four things: the leaf hash (the item they want to check), the proof (a list of sibling hashes with directions), the leaf index, and the expected root hash. They do not have the full tree. They do not have any other leaves. Just these four things.

Verification works by recomputing the path from the leaf to the root. Start with the leaf hash. Look at the first proof element. If the sibling is on the left, compute `hash(sibling + current)`. If the sibling is on the right, compute `hash(current + sibling)`. That gives you the parent hash. Take the next proof element and repeat. After processing all proof elements, you have a computed root hash. If it matches the expected root hash, the proof is valid. The leaf is in the tree.

This is powerful because the verifier does minimal work. They compute `log2(N)` hashes. They do not download the dataset. They do not trust the prover — they verify mathematically. If the prover lies about any sibling hash, the computed root will not match. The only way to produce a valid proof is to have the actual data in the actual tree.

## Task

1. Write a standalone function `bool verify_inclusion(const Hash& leaf_hash, const std::vector<ProofElement>& proof, size_t leaf_index, const Hash& expected_root)`
2. This function should NOT be a method on `MerkleTree` — it should work without access to the tree. A verifier does not have the tree
3. Start with the leaf hash. Walk through each proof element. At each step, combine the current hash with the sibling hash in the correct order based on the direction
4. After processing all proof elements, compare the computed root to the expected root
5. Return `true` if they match, `false` otherwise
6. Write tests:
   - Build a tree, generate a proof for leaf 3, verify it — should return `true`
   - Build a tree, generate a proof for leaf 3, change one hash in the proof, verify it — should return `false`
   - Build a tree, generate a proof for leaf 3, verify it against a different root — should return `false`
   - Build a tree with 1 item, verify the inclusion proof (should be empty proof, leaf hash equals root)

## Hints

- The verification loop is short: about 5-10 lines of code
- Use the leaf index to determine the expected direction at each level: if `index` is even at level `k`, the sibling should be on the right; if odd, on the left. You can double-check this against the direction stored in the proof
- Shift the index right by 1 at each level: `index >>= 1`
- For the tampered proof test, flip one byte in the first sibling hash — the verification should fail
- For the wrong root test, use the root of a different tree (change one leaf and rebuild)
- Make sure you handle the edge case of an empty proof (tree with 1 leaf) — the leaf hash itself should equal the root

## Verify

```bash
cd build && cmake .. && make verify_inclusion_test && ./verify_inclusion_test
```

Expected output:
```
Test 1 — valid proof:       PASS
Test 2 — tampered proof:    FAIL (expected)
Test 3 — wrong root:        FAIL (expected)
Test 4 — single leaf tree:  PASS
All tests passed.
```

## Done When

`verify_inclusion()` correctly accepts valid proofs and rejects tampered proofs, wrong roots, and wrong leaf indices.
