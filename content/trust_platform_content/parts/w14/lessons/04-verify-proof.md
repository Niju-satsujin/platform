---
id: w14-l04
title: "Verify Proof"
order: 4
type: lesson
duration_min: 40
---

# Verify Proof

## Goal

Given a leaf hash, an [inclusion proof](lessons/03-generate-inclusion-proof.md), and an expected [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview), recompute the root from the proof and check that it matches. No tree required — just the proof.

## What you build

A function `int merkle_verify_proof(const merkle_proof *proof, const uint8_t expected_root[32])` that:

1. Starts with the leaf hash from the proof.
2. Walks the sibling list from bottom to top. At each step, concatenates the current hash with the sibling hash in the correct order (using the direction flag) and hashes the result with [SHA-256](https://en.wikipedia.org/wiki/SHA-2).
3. After processing all siblings, compares the computed hash to `expected_root`.
4. Returns `1` if they match, `0` if they do not.

## Why it matters

Verification is the verifier's only job. The verifier does not need the full tree, does not need every leaf, and does not need to trust the server. It only needs the proof and the published [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview). This is how [Certificate Transparency auditors (RFC 6962)](https://datatracker.ietf.org/doc/html/rfc6962) check that a certificate was logged. This is how [Bitcoin SPV wallets](https://en.bitcoin.it/wiki/Protocol_documentation#Merkle_Trees) confirm a transaction without downloading the entire blockchain. If verification fails, something was tampered with.

---

## Training Session

### Warmup

Take the proof you generated in [L03](03-generate-inclusion-proof.md) for leaf L2 in a 4-leaf tree. On paper, walk the verification:

1. Start with `current = H(0x00 ‖ "L2")`.
2. First sibling is H3 (direction: right). Compute `current = H(0x01 ‖ current ‖ H3)`.
3. Second sibling is H01 (direction: left). Compute `current = H(0x01 ‖ H01 ‖ current)`.
4. Compare `current` to the known root hash.

Notice: direction "left" means the sibling goes first in the concatenation. Direction "right" means the sibling goes second.

### Work

#### Do

1. Add `int merkle_verify_proof(const merkle_proof *proof, const uint8_t expected_root[32])` to `w14/merkle.h`.
2. Implement it in `w14/merkle.c`:
   - Set `current_hash = proof->leaf_hash`.
   - For each level `i` from `0` to `proof->depth - 1`:
     - If `proof->directions[i] == 0` (sibling is left): compute `current_hash = SHA-256(0x01 ‖ sibling[i] ‖ current_hash)`.
     - If `proof->directions[i] == 1` (sibling is right): compute `current_hash = SHA-256(0x01 ‖ current_hash ‖ sibling[i])`.
   - Compare `current_hash` to `expected_root` using [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html). Return `1` if equal, `0` otherwise.
3. Write `w14/verify_test.c`:
   - Build a 4-leaf tree. Get the root hash.
   - Generate a proof for leaf index 2.
   - Verify the proof against the root hash — expect success.
   - Tamper with one byte of the leaf hash. Verify again — expect failure.
   - Tamper with one byte of the root hash. Verify again — expect failure.

#### Test

```bash
gcc -Wall -Wextra -Werror -o verify_test \
  w14/merkle.c w14/verify_test.c -lcrypto
./verify_test
```

#### Expected

```
verify(valid proof, correct root): PASS
verify(tampered leaf, correct root): FAIL
verify(valid proof, tampered root): FAIL
```

### Prove It

Generate and verify proofs for all 4 leaf indices (0–3). All [MUST](https://datatracker.ietf.org/doc/html/rfc2119) pass. Tamper with each and confirm failure.

### Ship It

```bash
git add w14/merkle.h w14/merkle.c w14/verify_test.c
git commit -m "w14-l04: verify merkle inclusion proof by recomputing root"
```

---

## Done when

- `merkle_verify_proof()` returns `1` for a valid proof against the correct root.
- It returns `0` when any byte of the proof or expected root is altered.
- It handles proofs of any depth (tested with 4-leaf and 8-leaf trees).
- The verifier does NOT need access to the tree — only the proof struct and the expected root.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero leaks and zero errors.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Swapping concatenation order | Direction `0` (sibling is left) means sibling goes first: `H(0x01 ‖ sibling ‖ current)`. Direction `1` means sibling goes second. Swapping produces a wrong root. |
| Using `==` instead of [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html) for hash comparison | `==` compares pointer addresses, not byte contents. Use `memcmp(a, b, 32) == 0`. |
| Forgetting the `0x01` prefix on internal hashes | The verifier [MUST](https://datatracker.ietf.org/doc/html/rfc2119) use the same [domain-separation](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1) prefix as the builder. Without it, the hashes will not match. |
| Accepting a proof with depth 0 as valid | A depth-0 proof means the leaf IS the root. Only valid for a single-leaf tree. Guard this edge case. |
| Not testing tampered proofs | Verifying only valid proofs proves nothing. Always test that tampered inputs are rejected. |

## Proof

```bash
./verify_test
# → 3 lines: PASS, FAIL, FAIL
valgrind --leak-check=full ./verify_test
# → 0 errors from 0 contexts
```

## Hero visual

```
  Verifier receives:
    leaf_hash:    H2 = SHA-256(0x00 ‖ "L2")
    siblings:     [ H3, H01 ]
    directions:   [ right, left ]
    expected_root: R

  Step 1:  current = H2
  Step 2:  current = SHA-256(0x01 ‖ current ‖ H3)    → H23
  Step 3:  current = SHA-256(0x01 ‖ H01 ‖ current)   → R'

  Compare: R' == R ?
    YES → proof is valid, L2 is in the tree
    NO  → proof is invalid, something was tampered
```

## Future Lock

- In [W14 L05](05-canonicalization-rules.md) you will ensure the direction encoding and hash prefixes are identical across all implementations — so any verifier can check any prover's proof.
- In [W14 L06](06-regression-harness.md) you will run verification against known [test vectors](https://en.wikipedia.org/wiki/Test_vector) to catch regressions.
- In [W15](../../../parts/w15/part.md) the [transparency log](../../../parts/w15/part.md) API will accept a leaf hash and return a proof; the client calls `merkle_verify_proof()` to check it.
- In [W16](../../../parts/w16/part.md) the [monitor](../../../parts/w16/part.md) will verify proofs continuously to detect a misbehaving log.
