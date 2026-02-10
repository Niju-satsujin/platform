---
id: w14-part
title: "Merkle Trees"
order: 14
type: part
---

# Week 14 – Merkle Trees

A [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) lets you prove one leaf belongs to a set without revealing the whole set.

## Hero visual

```
                     root = H(H01 ‖ H23)
                    ╱                     ╲
           H01 = H(H0 ‖ H1)        H23 = H(H2 ‖ H3)
           ╱            ╲            ╱            ╲
     H0 = H(L0)   H1 = H(L1)  H2 = H(L2)   H3 = H(L3)
         │             │            │             │
        L0            L1           L2            L3
      (leaf)        (leaf)       (leaf)        (leaf)
```

## What you build

A [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) library that:

1. Models leaves and internal nodes as a [binary tree](https://en.wikipedia.org/wiki/Binary_tree).
2. Builds the tree bottom-up and computes the [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview) using [SHA-256](https://en.wikipedia.org/wiki/SHA-2).
3. Generates an [inclusion proof](https://en.wikipedia.org/wiki/Merkle_tree#Second_preimage_attack) — the minimal set of sibling hashes a verifier needs.
4. Verifies a proof by recomputing the [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview) from the leaf and the proof path.
5. Applies [canonicalization](https://en.wikipedia.org/wiki/Canonicalization) rules so that every implementation produces the same root for the same input, following [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962).
6. Passes a [regression harness](lessons/06-regression-harness.md) with known test vectors.

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W07 | [Hashing fundamentals](../w07/part.md) — you built [SHA-256](https://en.wikipedia.org/wiki/SHA-2) pipelines that feed leaf hashes into this tree |
| ← builds on | W13 | [Content-addressable store](../w13/part.md) — CAS stores the leaf data; the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) indexes it |
| → leads to | W15 | [Transparency log](../w15/part.md) — the log publishes [Merkle roots](https://en.wikipedia.org/wiki/Merkle_tree) so auditors can verify entries |
| → leads to | W16 | [Monitoring](../w16/part.md) — monitors detect [Merkle](https://en.wikipedia.org/wiki/Merkle_tree) inconsistency when a log misbehaves |
| → leads to | W19 | [Trust bundles](../w19/part.md) — bundles include [Merkle proofs](https://en.wikipedia.org/wiki/Merkle_tree) so clients verify content offline |

## Lessons

1. [Tree Model](lessons/01-tree-model.md)
2. [Build Root](lessons/02-build-root.md)
3. [Generate Inclusion Proof](lessons/03-generate-inclusion-proof.md)
4. [Verify Proof](lessons/04-verify-proof.md)
5. [Canonicalization Rules](lessons/05-canonicalization-rules.md)
6. [Regression Harness](lessons/06-regression-harness.md)

## Quest

[W14 Quest – Full Merkle Tree Library](quest.md)

## Quiz

[W14 Quiz](quiz.md)
