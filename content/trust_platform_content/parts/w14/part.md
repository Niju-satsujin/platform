---
id: w14
title: "Merkle Trees"
order: 14
description: "Build a Merkle tree — a binary tree of hashes that lets you prove any item is included using only a small proof, without downloading the entire dataset."
kind: part_intro
arc: arc-4-transparency
---
# Week 14 — Merkle Trees

## Big Picture

In Week 13 you built content-addressed storage. Every piece of data got a name based on its hash. You can retrieve data by hash and verify it matches. But content-addressed storage answers only one question: "Is this the data I asked for?" It cannot answer: "Is this data part of a larger set?"

This week you build Merkle trees — a data structure that answers exactly that question. A Merkle tree is a binary tree of hashes. The leaves are hashes of your data items. Each internal node is the hash of its two children combined. The single hash at the top — the root — summarizes the entire dataset. If any item changes, the root changes.

The power of a Merkle tree is the inclusion proof. You can prove that a specific item is in the dataset by providing just the sibling hashes along the path from the leaf to the root. That is log2(N) hashes — about 20 hashes for a million items. The verifier does not need the full dataset. They just need the root hash and the proof.

You will also build consistency proofs, which prove that an older version of the tree is a prefix of a newer version. This is how append-only logs work: you prove the log only grows, never shrinks or changes history.

## What you will build

- **Merkle tree construction** — build a binary hash tree from a list of data items
- **Inclusion proofs** — generate a proof that a specific item is in the tree
- **Consistency proofs** — generate a proof that an old tree is a prefix of the new tree
- **Inclusion verification** — verify an inclusion proof against a known root
- **Consistency verification** — verify a consistency proof between two roots
- **Fuzz testing** — random trees, random proofs, verify correctness at scale
- **Benchmarks** — measure construction, proof generation, and verification times

## Schedule

- **Monday** (lessons 1-2): Tree construction and inclusion proofs
- **Tuesday** (lessons 3-4): Consistency proofs and inclusion verification
- **Wednesday** (lessons 5-6): Consistency verification and fuzz testing
- **Thursday** (lessons 7-8): Benchmark and quality gate

## Done when

Merkle tree construction works, inclusion and consistency proofs are generated and verified, fuzz tests pass, benchmarks are recorded, and the v0.14-merkle tag exists.
