---
id: w14-l03
title: "Consistency proofs"
order: 3
duration_minutes: 30
xp: 75
kind: lesson
part: w14
proof:
  type: paste
  instructions: "Paste the output showing a consistency proof generated between two tree sizes, listing the hashes in the proof, with both old and new root hashes printed."
  regex_patterns:
    - "consisten|CONSIST"
    - "old.*root|new.*root"
    - "[0-9a-f]{16,}"
---
# Consistency proofs

## Concept

An inclusion proof proves that a single item is in the tree. A consistency proof proves something bigger: that an older version of the tree is a prefix of a newer version. In other words, the first N items in the new tree are exactly the same as the N items in the old tree. Nobody deleted, changed, or reordered anything — the log only grew.

This matters for append-only logs. Imagine a log that starts with 5 entries and grows to 8 entries. A consistency proof between size 5 and size 8 proves that entries 1-5 are unchanged. Only entries 6, 7, and 8 were added. This is exactly how Certificate Transparency works — browsers check that the certificate log only grows, preventing a log operator from quietly removing a certificate.

The consistency proof contains a small set of hashes from the tree. These hashes are chosen so that a verifier who knows the old root (size 5) and the new root (size 8) can verify that the old tree's structure is preserved in the new tree. The proof size is O(log N), just like inclusion proofs.

The algorithm is more involved than inclusion proofs. You need to find the subtrees in the new tree that correspond to the old tree and provide enough hashes to bridge the gap. The standard algorithm from RFC 6962 (Certificate Transparency) walks the tree to find the "split points" where the old tree's complete subtrees end and the new data begins.

## Task

1. Add a `consistency_proof(size_t old_size, size_t new_size)` method to your `MerkleTree` class
2. The method takes the old tree size (number of leaves in the old version) and the new tree size (current number of leaves)
3. Return a `std::vector<Hash>` containing the hashes needed to prove consistency
4. The algorithm:
   - If `old_size` equals `new_size`, the proof is empty (same tree)
   - If `old_size` is 0, the proof is empty (empty tree is prefix of everything)
   - Otherwise, find the largest power of 2 less than or equal to `old_size` — call it `split`
   - If `split` equals `old_size`, you need to provide hashes from the right side of the new tree
   - If `split` is less than `old_size`, you need hashes from both sides
5. Store the tree in a way that lets you compute subtree hashes for any range of leaves
6. Test: build a tree with 5 items, record the root. Add 3 more items (total 8), get the new root. Generate a consistency proof between size 5 and size 8.

## Hints

- A helper function `hash_range(start, end)` that computes the Merkle root of leaves in a range is very useful
- For `hash_range`, recursively split the range in half, hash each half, and combine
- The consistency proof algorithm from RFC 6962 is the reference. Search for "RFC 6962 consistency proof" if you want the exact algorithm
- A simpler approach for learning: store the full tree, and for the old size, compute what the old root would have been using `hash_range(0, old_size)`. Then provide the hashes that bridge from old subtrees to the new root
- Start with the simplest case: old_size is a power of 2. The left subtree of the new tree contains the entire old tree. The proof is just the right subtree hash
- Then handle the general case: old_size is not a power of 2, so the old tree spans parts of both subtrees
- Test with old_size=4, new_size=8 first (easiest), then old_size=5, new_size=8 (harder)

## Verify

```bash
cd build && cmake .. && make merkle_consistency_test && ./merkle_consistency_test
```

Expected output (your hashes will differ):
```
Tree with 5 items:
  old_root = 3a7f2b...
Tree grown to 8 items:
  new_root = 5b8a1c...
Consistency proof (old=5, new=8):
  hash[0] = c4d5e6...
  hash[1] = f7a8b9...
  hash[2] = 1e2d3c...
Proof size: 3 hashes
```

## Done When

Your `consistency_proof()` method returns the correct hashes for various old and new tree sizes, and the proof size is logarithmic.
