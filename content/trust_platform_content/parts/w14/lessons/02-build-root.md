---
id: w14-l02
title: "Build Root"
order: 2
type: lesson
duration_min: 40
---

# Build Root

## Goal

Compute the [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview) of a [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) by hashing leaves with [SHA-256](https://en.wikipedia.org/wiki/SHA-2) and combining sibling hashes bottom-up until one hash remains.

## What you build

A function `merkle_build(merkle_node **leaves, size_t count)` that takes an array of leaf nodes (created in [L01](01-tree-model.md)), hashes each leaf's data with [SHA-256](https://en.wikipedia.org/wiki/SHA-2), then pairs siblings and hashes their concatenated digests to produce parent nodes. The process repeats level by level until a single [root node](https://en.wikipedia.org/wiki/Merkle_tree#Overview) remains. The function returns the root.

## Why it matters

The [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview) is the fingerprint of the entire data set. Change one byte in one leaf and the root changes. [Certificate Transparency (RFC 6962)](https://datatracker.ietf.org/doc/html/rfc6962) publishes this root so anyone can verify that a certificate was included. [Bitcoin blocks](https://en.bitcoin.it/wiki/Protocol_documentation#Merkle_Trees) store a [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree) of all transactions in the block header. Without a correct build step, proofs and verification are impossible.

---

## Training Session

### Warmup

Open the [SHA-256 Wikipedia page](https://en.wikipedia.org/wiki/SHA-2). Write down:

1. The output size of [SHA-256](https://en.wikipedia.org/wiki/SHA-2) — 32 bytes (256 bits).
2. What happens when you hash the same input twice — you get the same output ([deterministic](https://en.wikipedia.org/wiki/Deterministic_algorithm)).
3. What happens when you change one bit of input — the output changes completely ([avalanche effect](https://en.wikipedia.org/wiki/Avalanche_effect)).

Recall the [hashing work from W07](../../../parts/w07/part.md). You already know how to call a [SHA-256](https://en.wikipedia.org/wiki/SHA-2) function on a byte buffer.

### Work

#### Do

1. Open `w14/merkle.h`. Add a function declaration for `merkle_node *merkle_build(merkle_node **leaves, size_t count)`.
2. Open `w14/merkle.c`. Implement `merkle_build()`:
   - For each leaf, compute `hash = SHA-256(0x00 ‖ leaf_data)`. The `0x00` prefix marks it as a leaf hash — this follows [RFC 6962 §2.1](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1).
   - If the leaf count is odd, duplicate the last leaf so every node has a sibling. ([Bitcoin](https://en.bitcoin.it/wiki/Protocol_documentation#Merkle_Trees) does this; [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) does not — pick one and document it.)
   - Create a working array of the current level's nodes. Start with the leaves.
   - While the array has more than one node:
     - Pair adjacent nodes. For each pair, create an internal node with `hash = SHA-256(0x01 ‖ left.hash ‖ right.hash)`. The `0x01` prefix marks it as an internal hash.
     - The new internal nodes become the next level's array.
   - Return the single remaining node — the root.
3. Write `w14/build_root_test.c`:
   - Create 4 leaves with known data: `"L0"`, `"L1"`, `"L2"`, `"L3"`.
   - Call `merkle_build()`.
   - Print the [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview) as a hex string.
   - Free the tree.

#### Test

```bash
gcc -Wall -Wextra -Werror -o build_root_test \
  w14/merkle.c w14/build_root_test.c -lcrypto
./build_root_test
```

#### Expected

A 64-character hex string printed to stdout. Running it again produces the same string — the root is [deterministic](https://en.wikipedia.org/wiki/Deterministic_algorithm).

### Prove It

1. Change one byte in leaf `"L0"` to `"X0"`. Rebuild. The root [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be completely different.
2. Run under [Valgrind](https://valgrind.org/docs/manual/manual.html) — zero leaks.

### Ship It

```bash
git add w14/merkle.h w14/merkle.c w14/build_root_test.c
git commit -m "w14-l02: build merkle root with SHA-256 leaf and node hashing"
```

---

## Done when

- `merkle_build()` returns a root node whose `hash` field is a valid 32-byte [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digest.
- The same leaf data always produces the same root hash.
- Changing any leaf changes the root hash.
- Odd leaf counts are handled (duplicated or promoted).
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Hashing the pointer instead of the data | Pass the data buffer and its length to [SHA-256](https://en.wikipedia.org/wiki/SHA-2), not the address of the pointer. |
| Forgetting the domain-separation prefix | Without the `0x00` / `0x01` prefix, a leaf hash could collide with an internal hash. [RFC 6962 §2.1](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1) requires this. |
| Wrong byte order when concatenating hashes | `left.hash ‖ right.hash` means left first, then right. Swapping them changes the root. |
| Not handling a single leaf | A tree with one leaf has a root equal to that leaf's hash. Your loop [MUST](https://datatracker.ietf.org/doc/html/rfc2119) handle this case. |
| Leaking intermediate level arrays | Each level creates a new array. Free the previous level's array after you are done pairing. |

## Proof

```bash
./build_root_test
# → root: a3b1c4f9... (64 hex chars, deterministic)
valgrind --leak-check=full ./build_root_test
# → 0 errors from 0 contexts
```

## Hero visual

```
  Level 0 (leaves):   H(0x00‖"L0")  H(0x00‖"L1")  H(0x00‖"L2")  H(0x00‖"L3")
                           │              │              │              │
                           └──────┬───────┘              └──────┬───────┘
                                  ▼                             ▼
  Level 1 (internal):    H(0x01‖H0‖H1)                 H(0x01‖H2‖H3)
                                  │                             │
                                  └──────────┬──────────────────┘
                                             ▼
  Level 2 (root):               H(0x01‖H01‖H23)  ← root hash
```

## Future Lock

- In [W14 L03](03-generate-inclusion-proof.md) you will walk this built tree to extract the sibling hashes needed for an [inclusion proof](https://en.wikipedia.org/wiki/Merkle_tree).
- In [W14 L05](05-canonicalization-rules.md) you will tighten the build rules so that every implementation produces identical roots for the same input.
- In [W15](../../../parts/w15/part.md) the [transparency log](../../../parts/w15/part.md) will call `merkle_build()` every time new entries are appended.
- In [W16](../../../parts/w16/part.md) a [monitor](../../../parts/w16/part.md) will compare published roots against locally rebuilt roots to detect tampering.
