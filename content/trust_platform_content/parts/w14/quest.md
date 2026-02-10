---
id: w14-quest
title: "Quest – Full Merkle Tree Library"
order: 7
type: quest
duration_min: 90
---

# Quest – Full Merkle Tree Library

## Mission

Build a complete [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) library. It reads leaf data from stdin (one entry per line), constructs a [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree), prints the [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview), generates an [inclusion proof](lessons/03-generate-inclusion-proof.md) for a requested leaf index, prints the proof, verifies it, and prints the result. Everything follows [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) [canonicalization rules (L05)](lessons/05-canonicalization-rules.md).

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | [Tree model (L01)](lessons/01-tree-model.md): leaf and internal nodes use `struct merkle_node` with correct child pointers | Build a tree with 4 leaves, walk it, confirm 7 nodes (4 leaf + 3 internal) |
| R2 | [Build root (L02)](lessons/02-build-root.md): `merkle_build()` returns the correct [SHA-256](https://en.wikipedia.org/wiki/SHA-2) root hash using `0x00`/`0x01` [domain-separation prefixes](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1) | Root matches hard-coded [test vector](https://en.wikipedia.org/wiki/Test_vector) for `["a","b","c","d"]` |
| R3 | [Inclusion proof (L03)](lessons/03-generate-inclusion-proof.md): `merkle_generate_proof()` returns ⌈log₂(N)⌉ sibling hashes with correct directions | Proof for leaf 2 in a 4-leaf tree has depth 2 |
| R4 | [Verify proof (L04)](lessons/04-verify-proof.md): `merkle_verify_proof()` returns `1` for valid proofs and `0` for tampered proofs | Valid proof passes; flipped byte in leaf hash fails |
| R5 | [Canonicalization (L05)](lessons/05-canonicalization-rules.md): empty tree, single leaf, and odd leaf counts follow [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) split rules | 5-leaf root matches hand-computed value; no leaf duplication |
| R6 | [Regression harness (L06)](lessons/06-regression-harness.md) passes with 10+ named tests, including tamper detection | `./merkle_harness` exits `0` |
| R7 | CLI reads leaves from stdin, prints root, generates and verifies proof for a given index | `echo -e "a\nb\nc\nd" \| ./merkle_cli 2` prints root, proof, and `VERIFIED` |
| R8 | Zero memory leaks | `valgrind --leak-check=full ./merkle_cli ...` reports 0 leaks |

## Constraints

- C only. You [MAY](https://datatracker.ietf.org/doc/html/rfc2119) use [OpenSSL libcrypto](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) for [SHA-256](https://en.wikipedia.org/wiki/SHA-2). No other external libraries.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) compile with `gcc -Wall -Wextra -Werror -o merkle_cli w14/*.c -lcrypto`.
- All allocated memory [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be freed — every tree, every proof.
- Leaf data [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) be printed or logged. The proof reveals only hashes, never raw data.
- Follow [RFC 6962 §2.1](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1) canonicalization. Document any deviation.

## Bonus challenges

| Bonus | Description |
|-------|-------------|
| B1 | Support [consistency proofs](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) — given two tree sizes, prove the smaller tree is a prefix of the larger one |
| B2 | Serialize proofs to JSON — leaf hash, siblings, directions — so a verifier in another language can consume them |
| B3 | Build an incremental append mode — add one leaf at a time and update the root without rebuilding the entire tree |
| B4 | Benchmark build + proof + verify for 1 000, 10 000, and 100 000 leaves. Print time and proof size. |

## Verification

```bash
# Build
gcc -Wall -Wextra -Werror -o merkle_cli \
  w14/merkle.c w14/merkle_cli.c -lcrypto

# R2: root hash
echo -e "a\nb\nc\nd" | ./merkle_cli root
# → <64-char hex root hash>

# R3 + R4: proof generation and verification
echo -e "a\nb\nc\nd" | ./merkle_cli prove 2
# → root: <hex>
# → leaf[2]: <hex>
# → sibling[0]: <hex> (right)
# → sibling[1]: <hex> (left)
# → VERIFIED

# R5: odd leaf count
echo -e "a\nb\nc" | ./merkle_cli root
# → <hex root for 3 leaves, RFC 6962 split>

# R5: empty input
echo -n "" | ./merkle_cli root
# → e3b0c44298fc... (SHA-256 of "")

# R6: regression harness
gcc -Wall -Wextra -Werror -o merkle_harness \
  w14/merkle.c w14/merkle_harness.c -lcrypto
./merkle_harness
# → 10/10 tests passed

# R8: memory check
echo -e "a\nb\nc\nd" | valgrind --leak-check=full ./merkle_cli prove 2
# → 0 leaks
```

## Ship

```bash
git add w14/
git commit -m "w14 quest: full merkle tree library with CLI, proofs, and regression harness"
```
