---
id: w14-l03
title: "Generate Inclusion Proof"
order: 3
type: lesson
duration_min: 45
---

# Generate Inclusion Proof

## Goal

Given a [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) and a leaf index, collect the minimal set of sibling hashes that lets a verifier recompute the [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview) without seeing any other leaf data.

## What you build

A function `merkle_proof *merkle_generate_proof(merkle_node *root, size_t leaf_index, size_t leaf_count)` that returns a [proof](https://en.wikipedia.org/wiki/Merkle_tree) structure. The proof contains:

- The leaf hash.
- An ordered list of sibling hashes from the leaf level up to the root.
- A direction flag for each sibling — left or right — so the verifier knows the concatenation order.

## Why it matters

The whole point of a [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) is this proof. A server with millions of entries can prove that one entry exists by sending only log₂(N) hashes. [Certificate Transparency (RFC 6962)](https://datatracker.ietf.org/doc/html/rfc6962) uses this to let browsers verify that a certificate was logged without downloading the entire log. [Bitcoin SPV clients](https://en.bitcoin.it/wiki/Protocol_documentation#Merkle_Trees) use this to verify transactions without downloading every block. The proof is small — for a tree with 1 million leaves, the proof is only 20 hashes (20 × 32 = 640 bytes).

---

## Training Session

### Warmup

Draw a [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) with 8 leaves on paper. Pick leaf L2. Trace the path from L2 to the root. At each level, circle the sibling you need — the node that is not on the path but shares the same parent. Count the siblings — you should get 3 (log₂(8) = 3).

Write down the order of siblings from bottom to top. This is the [inclusion proof](https://en.wikipedia.org/wiki/Merkle_tree) for L2.

### Work

#### Do

1. Define `struct merkle_proof` in `w14/merkle.h`:
   - `uint8_t leaf_hash[32]` — the hash of the target leaf.
   - `size_t depth` — how many sibling hashes are in the proof.
   - `uint8_t (*siblings)[32]` — array of sibling hashes, one per level.
   - `uint8_t *directions` — array of flags. `0` means the sibling is on the left; `1` means it is on the right.
2. Write `merkle_proof *merkle_generate_proof(merkle_node *root, size_t leaf_index, size_t leaf_count)` in `w14/merkle.c`:
   - Start at the root. Use the leaf index and the tree size to navigate down to the target leaf. At each level, determine whether the target is in the left or right subtree.
   - As you navigate, record the sibling hash and its direction.
   - When you reach the leaf, set `leaf_hash`.
   - Return the populated `merkle_proof`.
3. Write `void merkle_proof_free(merkle_proof *proof)` — free the arrays and the struct.
4. Write `w14/proof_gen_test.c`:
   - Build a tree with 4 leaves: `"L0"`, `"L1"`, `"L2"`, `"L3"`.
   - Generate the proof for leaf index 2 (`"L2"`).
   - Print the proof: leaf hash, each sibling hash, each direction.
   - Free the proof and tree.

#### Test

```bash
gcc -Wall -Wextra -Werror -o proof_gen_test \
  w14/merkle.c w14/proof_gen_test.c -lcrypto
./proof_gen_test
```

#### Expected

```
leaf:    <hex hash of L2>
sibling: <hex hash of L3> (direction: right)
sibling: <hex hash of H01> (direction: left)
depth:   2
```

Two sibling hashes (log₂(4) = 2). Directions match the tree layout.

### Prove It

1. Generate proofs for every leaf index (0–3). Each proof [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have exactly 2 sibling hashes.
2. Run under [Valgrind](https://valgrind.org/docs/manual/manual.html) — zero leaks.

### Ship It

```bash
git add w14/merkle.h w14/merkle.c w14/proof_gen_test.c
git commit -m "w14-l03: generate merkle inclusion proof with sibling hashes and directions"
```

---

## Done when

- `merkle_generate_proof()` returns a proof with exactly ⌈log₂(N)⌉ sibling hashes.
- Each sibling hash and direction is correct when compared to a hand-drawn tree.
- Proof generation works for every valid leaf index (0 to N−1).
- Invalid leaf indices (>= N) return `NULL` or an error.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Recording the path node instead of the sibling | At each level you record the node that is NOT on the path — the sibling. |
| Wrong direction flag | If the target leaf is in the left subtree, the sibling is on the right (direction = 1). Double-check on paper. |
| Off-by-one on leaf index | Leaf indices are 0-based. If you use 1-based indexing, every proof is wrong. |
| Not handling odd-sized levels | When a level has an odd number of nodes, the last node has no sibling. Promote it or duplicate it — match the same rule you used in [L02](02-build-root.md). |
| Forgetting to free the proof | Every `merkle_generate_proof()` call allocates. The caller [MUST](https://datatracker.ietf.org/doc/html/rfc2119) call `merkle_proof_free()`. |

## Proof

```bash
./proof_gen_test
# → leaf hash, 2 sibling hashes with directions, depth = 2
valgrind --leak-check=full ./proof_gen_test
# → 0 errors from 0 contexts
```

## Hero visual

```
  Target: L2 (index 2)

                         root
                        ╱    ╲
                   H01          H23         ← record H01 (direction: left)
                  ╱   ╲       ╱   ╲
                H0    H1    H2    H3        ← record H3 (direction: right)
                             │
                            L2  ← target

  Proof = [ (H3, right), (H01, left) ]      ← bottom to top
  Depth = 2
```

## Future Lock

- In [W14 L04](04-verify-proof.md) you will take this proof and recompute the root hash to verify it matches.
- In [W14 L05](05-canonicalization-rules.md) you will make sure the direction encoding is unambiguous across implementations.
- In [W15](../../../parts/w15/part.md) the [transparency log](../../../parts/w15/part.md) will serve these proofs over an API to auditors and browsers.
- In [W19](../../../parts/w19/part.md) the [trust bundle](../../../parts/w19/part.md) will embed proofs so clients can verify content without contacting the log.
