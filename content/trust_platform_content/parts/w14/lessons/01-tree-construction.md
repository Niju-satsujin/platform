---
id: w14-l01
title: "Merkle tree construction"
order: 1
duration_minutes: 30
xp: 50
kind: lesson
part: w14
proof:
  type: paste
  instructions: "Paste the output showing a Merkle tree built from at least 4 items, with the root hash printed, and a test showing the root changes when any leaf changes."
  regex_patterns:
    - "root|ROOT"
    - "[0-9a-f]{16,}"
    - "change|differ|mismatch|!=|not equal"
---
# Merkle tree construction

## Concept

A Merkle tree is a binary tree where every node stores a hash. The leaves are hashes of your data items. Each internal node is the hash of its two children concatenated together. The single node at the very top is the root, and its hash summarizes the entire dataset.

Think of it like this in C terms. You have an array of N data items. First you hash each item — those are your N leaves. Then you pair them up: take leaf 0 and leaf 1, concatenate their hashes, and hash the result. That gives you a parent node. Do the same for leaf 2 and leaf 3, and so on. Now you have N/2 nodes on the next level. Repeat the process: pair them up, hash each pair, get N/4 nodes. Keep going until you have one node left — the root.

If N is not a power of two, the standard approach is to promote the unpaired node to the next level as-is. For example, if you have 5 leaves, the first 4 pair into 2 parents, and the 5th leaf gets promoted. Then those 3 nodes combine (2 pair, 1 promotes) until you reach the root.

The key property is this: if you change even one byte of one data item, its leaf hash changes, which changes its parent hash, which changes the grandparent, all the way up to the root. So the root hash is a fingerprint of the entire dataset. If two people have the same root hash, they have exactly the same data.

## Task

1. Create a `MerkleTree` class in a header/source file pair (e.g., `merkle_tree.h` and `merkle_tree.cpp`)
2. The constructor takes a `std::vector<std::string>` (the data items)
3. Build the tree bottom-up: hash each item to create the leaves, then pair and hash up to the root
4. Store the tree nodes in a flat `std::vector<Hash>` — you can use an array-based binary tree layout where the root is at index 0 or at the end, whichever you prefer
5. Handle the case where the number of leaves is not a power of two — promote the odd node
6. Expose a `root_hash()` method that returns the root hash as a hex string
7. Write a test program that builds a tree from 4 items, prints the root hash, changes one item, rebuilds, and shows the root changed

## Hints

- Reuse the SHA-256 hash function you built in Week 5 (or your content-addressed storage hash from Week 13)
- For the flat array layout, one approach: store leaves at the bottom and build upward. Another approach: use a `std::vector` and push nodes level by level
- A simpler approach is to store each level as a separate `std::vector<Hash>`, then build the next level from pairs
- When concatenating two hashes to make a parent, concatenate the raw bytes (not the hex strings) — this matches how real Merkle trees work
- `hash(left_child_hash + right_child_hash)` where `+` means byte concatenation
- For an odd number of nodes at any level, the last node has no sibling — promote it to the next level unchanged, or duplicate it (both approaches are used in practice; choose one and be consistent)
- Test with known inputs so you can verify the root hash is deterministic — same inputs always produce the same root

## Verify

```bash
cd build && cmake .. && make merkle_tree_test && ./merkle_tree_test
```

Expected output (your hashes will differ):
```
Tree with 4 items:
  root_hash = a3f2b7c9...
Changed item 2:
  root_hash = 7e1d4f08...
Root hashes differ: PASS
```

## Done When

Your `MerkleTree` class builds a tree from a list of items, returns a deterministic root hash, and the root hash changes when any leaf changes.
