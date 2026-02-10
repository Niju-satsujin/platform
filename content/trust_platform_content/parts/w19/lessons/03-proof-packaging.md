---
id: w19-l03
title: "Proof Packaging"
order: 3
type: lesson
duration_min: 45
---

# Proof Packaging

## Goal

Pack a [Merkle inclusion proof](../../../parts/w14/part.md) and its [CAS blob reference](../../../parts/w13/part.md) into the [trust bundle](01-bundle-spec.md) so the [verifier](https://www.w3.org/TR/vc-data-model/#dfn-verifier) can reconstruct the [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree) and confirm the [credential](../../../parts/w17/part.md) was logged.

## What you build

A proof-packaging module. It takes a [leaf hash](https://en.wikipedia.org/wiki/Merkle_tree) (the [content address](../../../parts/w13/part.md) of the credential), a list of [sibling hashes](https://en.wikipedia.org/wiki/Merkle_tree) forming the [inclusion proof](../../../parts/w14/part.md), the [tree size](https://en.wikipedia.org/wiki/Merkle_tree), and the expected [root hash](https://en.wikipedia.org/wiki/Merkle_tree). It serializes them into a [CBOR](https://cbor.io/) byte string that fits inside the `merkle_proof` field of the [trust bundle](01-bundle-spec.md). A companion function deserializes the proof bytes and verifies the [inclusion proof](../../../parts/w14/part.md) by recomputing hashes from leaf to root.

## Why it matters

A [credential](../../../parts/w17/part.md) alone proves the issuer signed a claim. But it does not prove the claim was recorded in a public [transparency log](../../../parts/w14/part.md). An [inclusion proof](../../../parts/w14/part.md) proves that. Without it, a verifier must contact the log server — an online call. By packaging the proof inside the bundle, the verifier can check [log inclusion](../../../parts/w14/part.md) locally, using only the [root hash](https://en.wikipedia.org/wiki/Merkle_tree) from the [anchor checkpoint](../../../parts/w18/part.md) already in the bundle.

---

## Training Session

### Warmup

Revisit your [Merkle proof verifier from W14](../../../parts/w14/part.md). Write down the exact inputs it needs:

1. The [leaf hash](https://en.wikipedia.org/wiki/Merkle_tree).
2. The ordered list of [sibling hashes](https://en.wikipedia.org/wiki/Merkle_tree).
3. The [leaf index](https://en.wikipedia.org/wiki/Merkle_tree).
4. The [tree size](https://en.wikipedia.org/wiki/Merkle_tree).
5. The expected [root hash](https://en.wikipedia.org/wiki/Merkle_tree).

### Work

#### Do

1. Create `w19/proof_package.h`.
2. Define `struct merkle_proof_package` with:
   - `leaf_hash` — 32-byte [SHA-256](https://en.wikipedia.org/wiki/SHA-2) hash.
   - `leaf_index` — the position of the leaf in the [Merkle tree](../../../parts/w14/part.md).
   - `tree_size` — the total number of leaves at the time the proof was generated.
   - `sibling_hashes` — array of 32-byte hashes.
   - `sibling_count` — number of siblings.
   - `root_hash` — expected 32-byte [root hash](https://en.wikipedia.org/wiki/Merkle_tree).
3. Create `w19/proof_package.c`.
4. Write `proof_package_serialize()` — takes a `struct merkle_proof_package *` and writes [CBOR](https://cbor.io/) bytes. The sibling hashes go into a [CBOR array](https://cbor.io/) of [byte strings](https://cbor.io/).
5. Write `proof_package_deserialize()` — parses [CBOR](https://cbor.io/) bytes back into the struct. Return an error if any field is missing.
6. Write `proof_package_verify()` — recomputes the [root hash](https://en.wikipedia.org/wiki/Merkle_tree) from the [leaf hash](https://en.wikipedia.org/wiki/Merkle_tree) and [sibling hashes](https://en.wikipedia.org/wiki/Merkle_tree) using the same algorithm from [W14](../../../parts/w14/part.md). Returns `1` if the computed root matches `root_hash`, `0` otherwise.
7. Integrate: update `bundle_serialize()` from [L01](01-bundle-spec.md) to call `proof_package_serialize()` and store the result in the `merkle_proof` field.
8. Write a `main()` test: build a small [Merkle tree](../../../parts/w14/part.md) with 8 leaves, generate an [inclusion proof](../../../parts/w14/part.md) for one leaf, package it, serialize the full bundle, deserialize, and verify the proof.

#### Test

```bash
gcc -Wall -Wextra -Werror -o proof_pkg_test \
  w19/proof_package.c w19/bundle_spec.c w19/key_ring.c -lcbor -lcrypto
./proof_pkg_test
```

#### Expected

Proof verification succeeds. Program prints `PASS: Merkle proof verified from bundle` and exits `0`. Flip one sibling hash byte and confirm verification fails.

### Prove It

Print the sibling hashes and computed root during verification:

```bash
./proof_pkg_test --verbose
```

Confirm the computed root matches the expected root exactly.

### Ship It

```bash
git add w19/proof_package.h w19/proof_package.c
git commit -m "w19-l03: Merkle proof packaging into trust bundle"
```

---

## Done when

- `proof_package_serialize()` and `proof_package_deserialize()` round-trip without loss.
- `proof_package_verify()` returns `1` for a valid proof and `0` for a tampered proof.
- The proof bytes are embedded in the [trust bundle](01-bundle-spec.md) `merkle_proof` field.
- A modified sibling hash causes verification to fail.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Storing sibling hashes in the wrong order | The order [MUST](https://datatracker.ietf.org/doc/html/rfc2119) match the path from leaf to root. Reverse the order and the recomputed [root hash](https://en.wikipedia.org/wiki/Merkle_tree) will differ. |
| Omitting `tree_size` or `leaf_index` | Without these, the verifier cannot determine left-vs-right at each level of the [Merkle tree](../../../parts/w14/part.md). |
| Using a different [hash function](https://en.wikipedia.org/wiki/Cryptographic_hash_function) than the tree | If the tree uses [SHA-256](https://en.wikipedia.org/wiki/SHA-2), the proof verifier [MUST](https://datatracker.ietf.org/doc/html/rfc2119) also use [SHA-256](https://en.wikipedia.org/wiki/SHA-2). |
| Not checking root against the [anchor checkpoint](../../../parts/w18/part.md) | The proof is only meaningful if the root matches the anchored root. This check happens in [L04](04-offline-flow.md). |

## Proof

```bash
./proof_pkg_test
# → PASS: Merkle proof verified from bundle
echo $?
# → 0
```

## Hero visual

```
  Merkle Tree (8 leaves)            Inclusion Proof for Leaf 5
       R                            ┌─────────────────────────┐
      / \                           │ leaf_hash: H(leaf5)     │
     /   \                          │ leaf_index: 5           │
    A     B                         │ tree_size: 8            │
   / \   / \                        │ siblings: [H4, A, D']  │
  C   D E   F                       │ root_hash: R            │
 /\ /\ /\ /\                       └─────────────────────────┘
 0 1 2 3 4 5 6 7                              │
           ▲                                  ▼ serialize
           │                        ┌─────────────────────────┐
      credential                    │ CBOR bytes → bundle     │
      lives here                    │ merkle_proof field      │
                                    └─────────────────────────┘
```

## Future Lock

- In [W19 L04](04-offline-flow.md) you will verify this proof as part of the full [offline verification flow](04-offline-flow.md), cross-checking the root against the [anchor checkpoint](../../../parts/w18/part.md).
- In [W19 L06](06-regression-harness.md) you will test proof packaging with known test vectors — fixed trees, fixed proofs, fixed expected roots.
- In [W20](../../../parts/w20/part.md) you will run [chaos tests](../../../parts/w20/part.md) that truncate proof bytes mid-stream and confirm the verifier rejects gracefully.
