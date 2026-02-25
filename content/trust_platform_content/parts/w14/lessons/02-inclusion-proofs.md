---
id: w14-l02
title: "Inclusion proofs"
order: 2
duration_minutes: 30
xp: 75
kind: lesson
part: w14
proof:
  type: paste
  instructions: "Paste the output showing an inclusion proof generated for a specific leaf, listing the sibling hashes and their positions (left/right), with the proof size printed."
  regex_patterns:
    - "inclusion.*proof|proof.*leaf|sibling"
    - "left|right|L|R"
    - "[0-9a-f]{16,}"
---
# Inclusion proofs

## Concept

An inclusion proof — also called an audit proof — answers the question: "Is this specific item in the dataset?" The proof is small. For a tree with a million leaves, the proof is about 20 hashes. The verifier does not need to download the entire dataset to check.

Here is how it works. Suppose you have a tree with 8 leaves and you want to prove that leaf 3 is in the tree. Start at leaf 3. Its sibling is leaf 2 (they share the same parent). Include the hash of leaf 2 in the proof. Move up to the parent. The parent's sibling is the other branch. Include that sibling's hash. Keep going up to the root. At each level, you include the hash of the node you do not already have — the sibling on the path from your leaf to the root.

The proof is a list of (hash, direction) pairs. The direction tells the verifier whether the sibling is on the left or the right. This matters because `hash(A + B)` is different from `hash(B + A)`. If the sibling is on the left, the verifier computes `hash(sibling + current)`. If the sibling is on the right, the verifier computes `hash(current + sibling)`.

The proof size is exactly the height of the tree, which is `ceil(log2(N))`. For 8 leaves, that is 3 hashes. For 1024 leaves, that is 10 hashes. For 1,000,000 leaves, that is 20 hashes. This logarithmic scaling is what makes Merkle trees practical for very large datasets.

## Task

1. Add an `inclusion_proof(size_t leaf_index)` method to your `MerkleTree` class
2. The method returns a `std::vector` of proof elements, where each element contains a hash and a direction (left or right)
3. Define a small struct for the proof element: `struct ProofElement { Hash hash; enum Side { LEFT, RIGHT } side; };`
4. Walk from the leaf up to the root. At each level, find the sibling node. Record its hash and whether it is on the left or right of the current node
5. Return the list of proof elements from leaf to root
6. Handle edge cases: leaf index out of bounds (throw or return empty), tree with one leaf (proof is empty — the leaf is the root)
7. Write a test that builds a tree with 8 items, generates an inclusion proof for leaf 3, and prints each proof element

## Hints

- If you used a flat array layout, the sibling of node at index `i` is at index `i ^ 1` (XOR with 1 flips the last bit, toggling between left and right child)
- The parent of node at index `i` is at index `(i - 1) / 2` if root is at index 0, or `i / 2` if using 1-based indexing
- If you stored levels as separate vectors, the sibling of node `j` at level `k` is at index `j ^ 1` at the same level
- The direction depends on whether the leaf index at each level is even (sibling is on the right) or odd (sibling is on the left)
- After computing the sibling, move to the parent level and repeat
- For a tree with odd nodes at some level, the promoted node has no sibling — skip that level in the proof (or handle it based on your promotion strategy)
- Test with a small tree (4 or 8 leaves) where you can manually verify the proof

## Verify

```bash
cd build && cmake .. && make merkle_proof_test && ./merkle_proof_test
```

Expected output (your hashes will differ):
```
Tree with 8 items, root = 5b8a1c...
Inclusion proof for leaf 3:
  level 0: sibling = a1b2c3... (LEFT)
  level 1: sibling = d4e5f6... (RIGHT)
  level 2: sibling = 789abc... (LEFT)
Proof size: 3 hashes (expected: 3 for 8 leaves)
```

## Done When

Your `inclusion_proof()` method returns the correct sibling hashes and directions for any valid leaf index, and the proof size equals the tree height.
