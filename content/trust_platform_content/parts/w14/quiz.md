---
id: w14-quiz
title: "Week 14 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 14 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – Leaf vs internal hash

In [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962), a leaf hash is `SHA-256(0x00 ‖ data)` and an internal hash is `SHA-256(0x01 ‖ left ‖ right)`. Why do they use different prefixes?

- A) To make the hashes shorter
- B) To prevent a [second preimage attack](https://en.wikipedia.org/wiki/Merkle_tree#Second_preimage_attack) — without the prefix, an attacker could forge a leaf that looks like an internal node
- C) Because [SHA-256](https://en.wikipedia.org/wiki/SHA-2) requires a prefix
- D) To make the tree easier to draw

---

### Q2 – Proof size

A [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) has 1 048 576 leaves (2²⁰). How many sibling hashes does an [inclusion proof](lessons/03-generate-inclusion-proof.md) contain?

- A) 1 048 576
- B) 524 288
- C) 20
- D) 32

---

### Q3 – Root change

You have a [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) with 8 leaves. You change one byte in leaf L5. Which nodes in the tree get a new hash?

- A) Only L5
- B) L5 and the root
- C) Every node on the path from L5 to the root — L5, its parent, its grandparent, and the root
- D) Every node in the tree

---

### Q4 – Direction flag

During [verification (L04)](lessons/04-verify-proof.md), the direction flag for a sibling is `0` (left). This means:

- A) The current hash goes first in the concatenation
- B) The sibling hash goes first in the concatenation — `SHA-256(0x01 ‖ sibling ‖ current)`
- C) The sibling is discarded
- D) The hashes are XORed instead of concatenated

---

### Q5 – Odd leaf count (RFC 6962)

Under [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) rules, how does a [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) with 5 leaves handle the split?

- A) Duplicate the last leaf so there are 6
- B) Pad with a zero-hash leaf
- C) Split at the largest power of two less than 5 (which is 4) — left subtree gets 4 leaves, right subtree gets 1 leaf
- D) Drop the extra leaf

---

### Q6 – Bitcoin vs RFC 6962

A [Bitcoin Merkle tree](https://en.bitcoin.it/wiki/Protocol_documentation#Merkle_Trees) with 5 transactions and an [RFC 6962 Merkle tree](https://datatracker.ietf.org/doc/html/rfc6962) with the same 5 entries will produce:

- A) The same root hash
- B) Different root hashes — because [Bitcoin](https://en.bitcoin.it/wiki/Protocol_documentation#Merkle_Trees) duplicates the last leaf and [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) does not
- C) The same root hash only if the data is sorted
- D) An error, because 5 is odd

---

### Q7 – Empty tree

Under [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962), what is the [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview) of an empty [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) (zero leaves)?

- A) All zeros (32 zero bytes)
- B) `SHA-256("")` — the [SHA-256](https://en.wikipedia.org/wiki/SHA-2) hash of the empty string
- C) `NULL` — there is no root
- D) `SHA-256(0x00)`

---

### Q8 – Tampered proof detection

A verifier receives a valid [inclusion proof](lessons/03-generate-inclusion-proof.md), but the attacker flipped one bit in one sibling hash. What happens when the verifier runs [merkle_verify_proof()](lessons/04-verify-proof.md)?

- A) Verification passes — one bit does not matter
- B) Verification fails — the recomputed root will not match the expected root because [SHA-256](https://en.wikipedia.org/wiki/SHA-2) produces a completely different output for any input change
- C) The program crashes
- D) The verifier corrects the bit automatically

---

### Q9 – Short answer: proof contents

List the three pieces of information an [inclusion proof](lessons/03-generate-inclusion-proof.md) contains.

---

### Q10 – Short answer: why log₂

Explain in one or two sentences why an [inclusion proof](lessons/03-generate-inclusion-proof.md) for a tree with N leaves has only log₂(N) sibling hashes, not N hashes.

---

### Q11 – Short answer: canonicalization purpose

What problem does [canonicalization (L05)](lessons/05-canonicalization-rules.md) solve? Why can't two implementations just "hash the same data" and get the same root?

---

### Q12 – Short answer: regression harness value

Why is it important to run the [regression harness (L06)](lessons/06-regression-harness.md) after every change to the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) library?

---

### Q13 – Read the output

A student runs their [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) program and sees:

```
root: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
leaf[0]: 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
proof depth: 0
verify: PASS
```

The tree has only 1 leaf. Is the output correct? Explain why the proof depth is 0.

---

### Q14 – Read the output

A student builds a 4-leaf tree and generates a proof for leaf index 1. They see:

```
root: <hex>
leaf[1]: <hex>
sibling[0]: <hex> (direction: left)
sibling[1]: <hex> (direction: right)
verify: FAIL
```

The root hash is correct (matches the expected value). The leaf hash is correct. But verification fails. Name the most likely cause of the failure.
