---
id: w14-quest
title: "Week 14 Boss: Merkle Tree Proofs"
part: w14
kind: boss
proof:
  type: paste
  instructions: "Paste output showing: (1) a Merkle tree built from at least 8 items with the root hash printed, (2) an inclusion proof generated for one item, (3) the inclusion proof verified successfully, (4) a consistency proof generated and verified between two tree sizes."
  regex_patterns:
    - "root|ROOT"
    - "inclusion.*proof|proof.*inclusion|INCLUSION"
    - "verif|PASS|valid"
    - "consisten|CONSIST"
---
# Week 14 Boss: Merkle Tree Proofs

## Goal

Demonstrate a working Merkle tree that can generate and verify both inclusion proofs and consistency proofs.

## Requirements

1. **Tree construction** — build a Merkle tree from a list of data items, print the root hash
2. **Inclusion proof** — generate a proof that a specific leaf is in the tree
3. **Inclusion verification** — verify the proof against the root hash
4. **Consistency proof** — prove that an older tree is a prefix of the newer tree
5. **Consistency verification** — verify the consistency proof between old and new roots
6. **Negative tests** — tampered proofs are rejected
7. **Fuzz tests** — random trees and proofs all verify correctly
8. **Benchmarks** — construction, proof, and verification times recorded
9. **Quality gate** — 7-point checklist, all items PASS

## Verify

```bash
./merkle_demo
```

The demo builds a tree, generates an inclusion proof, verifies it, generates a consistency proof, verifies it, and prints all results.

## Done When

Inclusion and consistency proofs are generated and verified, fuzz tests pass, benchmarks are recorded, and the v0.14-merkle tag exists.
