---
id: w14-l05
title: "Canonicalization Rules"
order: 5
type: lesson
duration_min: 45
---

# Canonicalization Rules

## Goal

Define and enforce [canonicalization](https://en.wikipedia.org/wiki/Canonicalization) rules so that every implementation — yours, a teammate's, a third-party auditor's — produces the exact same [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview) for the same input data.

## What you build

A set of rules baked into your [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) library, plus a test suite that compares your output against hand-computed [test vectors](https://en.wikipedia.org/wiki/Test_vector). The rules cover:

1. [Domain-separation prefixes](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1) — `0x00` for leaves, `0x01` for internal nodes.
2. Hash algorithm — [SHA-256](https://en.wikipedia.org/wiki/SHA-2) only.
3. Concatenation order — always left ‖ right.
4. Odd-leaf handling — how to handle a level with an odd number of nodes.
5. Empty tree — what the root hash of an empty input [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be.

## Why it matters

Two implementations that disagree on any of these rules will produce different roots for the same data. A verifier using one set of rules will reject proofs from a builder using different rules. [Certificate Transparency (RFC 6962)](https://datatracker.ietf.org/doc/html/rfc6962) specifies these rules precisely so that any CT log and any CT auditor can interoperate. [Bitcoin](https://en.bitcoin.it/wiki/Protocol_documentation#Merkle_Trees) uses a different set of rules (duplicate the last leaf when odd). You must choose one rule set and enforce it everywhere.

---

## Training Session

### Warmup

Read [RFC 6962 §2.1 — Merkle Hash Trees](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1). Write down the five rules it defines:

1. Hash of an empty list.
2. Hash of a single entry (leaf).
3. Hash of a list with more than one entry (recursive split).
4. The `0x00` leaf prefix.
5. The `0x01` node prefix.

Compare this to the [Bitcoin Merkle tree rule](https://en.bitcoin.it/wiki/Protocol_documentation#Merkle_Trees) for odd leaves. Note the difference: [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) does NOT duplicate the last leaf; [Bitcoin](https://en.bitcoin.it/wiki/Protocol_documentation#Merkle_Trees) does.

### Work

#### Do

1. Create `w14/canon.h`. Define a constant or enum that declares which rule set your library follows — `MERKLE_CANON_RFC6962` or `MERKLE_CANON_BITCOIN`. Document the choice in a comment.
2. Update `merkle_build()` in `w14/merkle.c` to enforce these rules:
   - **Rule 1**: Empty input → root hash is [SHA-256](https://en.wikipedia.org/wiki/SHA-2) of the empty string (`SHA-256("")`).
   - **Rule 2**: Single leaf → root hash is `SHA-256(0x00 ‖ leaf_data)`.
   - **Rule 3**: Multiple leaves → recursive split at `k`, the largest power of two less than `count`. Left subtree gets leaves `[0, k)`. Right subtree gets leaves `[k, count)`.
   - **Rule 4**: Leaf hash uses `0x00` prefix.
   - **Rule 5**: Internal hash uses `0x01` prefix.
3. Update `merkle_generate_proof()` and `merkle_verify_proof()` to match.
4. Write `w14/canon_test.c`:
   - Test the empty tree. Print the root hash. Compare to `SHA-256("")`.
   - Test a single leaf `"data"`. Print the root hash. Compare to `SHA-256(0x00 ‖ "data")`.
   - Test 3 leaves: `"a"`, `"b"`, `"c"`. Under [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) rules, the split is at `k=2` — left subtree has 2 leaves, right subtree has 1 leaf. No duplication.
   - Print all root hashes. Verify they match hand-computed values.

#### Test

```bash
gcc -Wall -Wextra -Werror -o canon_test \
  w14/merkle.c w14/canon_test.c -lcrypto
./canon_test
```

#### Expected

```
empty tree root:  e3b0c44298fc...  (SHA-256 of "")
single leaf root: <hex>            (SHA-256 of 0x00 ‖ "data")
3-leaf root:      <hex>            (matches hand computation)
all canonicalization tests passed
```

### Prove It

1. Compute the expected hashes by hand (or with a one-line [openssl](https://man7.org/linux/man-pages/man1/openssl.1.html) command) and hard-code them as [test vectors](https://en.wikipedia.org/wiki/Test_vector) in `canon_test.c`.
2. The test [MUST](https://datatracker.ietf.org/doc/html/rfc2119) fail if any hash is wrong.

### Ship It

```bash
git add w14/canon.h w14/merkle.c w14/canon_test.c
git commit -m "w14-l05: enforce RFC 6962 canonicalization rules with test vectors"
```

---

## Done when

- Your library follows one documented rule set ([RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) or [Bitcoin](https://en.bitcoin.it/wiki/Protocol_documentation#Merkle_Trees)).
- Empty input, single leaf, even leaf count, and odd leaf count all produce correct roots.
- [Test vectors](https://en.wikipedia.org/wiki/Test_vector) are hard-coded and checked automatically.
- `merkle_verify_proof()` still passes for all cases after the canonicalization changes.
- A teammate could implement the same rules in a different language and get the same root hashes.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Mixing RFC 6962 and Bitcoin rules | Pick one. Document it. Never duplicate the last leaf if you follow [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962). |
| Wrong split point for odd leaf counts | [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) splits at the largest power of two less than N, not at N/2. These differ when N is not a power of two. |
| Forgetting the empty-tree case | An empty tree still has a root hash — it is `SHA-256("")`. Not handling this causes a [null pointer dereference](https://en.wikipedia.org/wiki/Null_pointer#Null_dereferencing). |
| Hard-coding test vectors with wrong endianness | [SHA-256](https://en.wikipedia.org/wiki/SHA-2) output is big-endian. Print and compare in the same byte order. |
| Not testing round-trip (build → proof → verify) after rule changes | Every canonicalization change can break proof generation or verification. Run the full pipeline after every change. |

## Proof

```bash
./canon_test
# → empty root matches, single leaf matches, 3-leaf matches
# → "all canonicalization tests passed"
```

## Hero visual

```
  RFC 6962 split for 5 leaves:

  k = 4 (largest power of 2 < 5)

       ┌────────────────── root ──────────────────┐
       │                                           │
   left subtree (4 leaves)                right subtree (1 leaf)
   ┌─────────┬─────────┐                      │
  L0  L1    L2  L3                            L4
   split at k=2   split at k=2            (single leaf)

  Bitcoin split for 5 leaves:

       ┌────────────────── root ──────────────────┐
       │                                           │
   ┌─────────┬─────────┐                ┌─────────┬─────────┐
  L0  L1    L2  L3                     L4  L4 (duplicated!)

  Different rules → different roots → incompatible proofs
```

## Future Lock

- In [W14 L06](06-regression-harness.md) you will run your test vectors as part of the [regression harness](06-regression-harness.md) so canonicalization never silently breaks.
- In [W15](../../../parts/w15/part.md) the [transparency log](../../../parts/w15/part.md) will declare which canonicalization rule set it uses in its metadata, so auditors know how to verify.
- In [W16](../../../parts/w16/part.md) the [monitor](../../../parts/w16/part.md) will reject proofs that do not match the declared rule set.
- In [W19](../../../parts/w19/part.md) the [trust bundle](../../../parts/w19/part.md) will include the canonicalization rule identifier so offline verifiers use the correct algorithm.
