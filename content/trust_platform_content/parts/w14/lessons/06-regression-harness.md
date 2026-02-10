---
id: w14-l06
title: "Regression Harness"
order: 6
type: lesson
duration_min: 50
---

# Regression Harness

## Goal

Build a test harness that runs every [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) operation — [build](02-build-root.md), [proof generation](03-generate-inclusion-proof.md), [verification](04-verify-proof.md) — against known [test vectors](https://en.wikipedia.org/wiki/Test_vector) and catches regressions automatically.

## What you build

A test program `w14/merkle_harness.c` that:

1. Builds trees with 0, 1, 2, 4, 5, 8, and 100 leaves.
2. Checks each root against a hard-coded expected hash.
3. Generates an [inclusion proof](lessons/03-generate-inclusion-proof.md) for every leaf in every tree.
4. Verifies every proof against the root.
5. Tampers with one byte in each proof and confirms verification fails.
6. Prints `PASS` or `FAIL` for each test. Exits `0` on all pass, `1` on any failure.

## Why it matters

Every change to the [tree model (L01)](01-tree-model.md), [build logic (L02)](02-build-root.md), [proof generation (L03)](03-generate-inclusion-proof.md), [verification (L04)](04-verify-proof.md), or [canonicalization rules (L05)](05-canonicalization-rules.md) can silently break something. A regression harness catches this before the bug reaches the [transparency log (W15)](../../../parts/w15/part.md) or the [trust bundle (W19)](../../../parts/w19/part.md). Running it after every commit is the safety net that lets you refactor with confidence.

---

## Training Session

### Warmup

List every function in your [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) library:

1. `merkle_new_leaf()` — [L01](01-tree-model.md).
2. `merkle_new_internal()` — [L01](01-tree-model.md).
3. `merkle_free()` — [L01](01-tree-model.md).
4. `merkle_build()` — [L02](02-build-root.md).
5. `merkle_generate_proof()` — [L03](03-generate-inclusion-proof.md).
6. `merkle_proof_free()` — [L03](03-generate-inclusion-proof.md).
7. `merkle_verify_proof()` — [L04](04-verify-proof.md).

For each function, write down one thing that could go wrong. That is your test case list.

### Work

#### Do

1. Create `w14/merkle_harness.c`.
2. Define test vectors. For each tree size, compute the expected root hash using your library once (verified by hand or with [openssl](https://man7.org/linux/man-pages/man1/openssl.1.html)) and hard-code it as a byte array.
3. Write a `run_test(const char *name, int (*fn)(void))` helper that prints `PASS: <name>` or `FAIL: <name>` and tracks the overall result.
4. Write test functions:
   - `test_empty_tree()` — build with 0 leaves, check root matches `SHA-256("")`.
   - `test_single_leaf()` — build with 1 leaf, check root.
   - `test_power_of_two()` — build with 2, 4, 8 leaves, check roots.
   - `test_non_power_of_two()` — build with 5 leaves, check root. This exercises the [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) split rule from [L05](05-canonicalization-rules.md).
   - `test_large_tree()` — build with 100 leaves, check root.
   - `test_proof_valid()` — for a 4-leaf tree, generate and verify a proof for each leaf.
   - `test_proof_tampered_leaf()` — flip one byte in the leaf hash, verify returns `0`.
   - `test_proof_tampered_sibling()` — flip one byte in a sibling hash, verify returns `0`.
   - `test_proof_tampered_root()` — verify against a wrong root, returns `0`.
   - `test_proof_wrong_direction()` — swap a direction flag, verify returns `0`.
5. In `main()`, run all tests. Print a summary. Return `0` if all pass, `1` if any fail.

#### Test

```bash
gcc -Wall -Wextra -Werror -o merkle_harness \
  w14/merkle.c w14/merkle_harness.c -lcrypto
./merkle_harness
```

#### Expected

```
PASS: empty_tree
PASS: single_leaf
PASS: power_of_two
PASS: non_power_of_two
PASS: large_tree
PASS: proof_valid
PASS: proof_tampered_leaf
PASS: proof_tampered_sibling
PASS: proof_tampered_root
PASS: proof_wrong_direction
--- 10/10 tests passed ---
```

### Prove It

1. Run under [Valgrind](https://valgrind.org/docs/manual/manual.html) — zero leaks, zero errors.
2. Deliberately break one rule in `merkle_build()` (e.g., remove the `0x00` prefix). Run the harness. At least one test [MUST](https://datatracker.ietf.org/doc/html/rfc2119) fail. Revert the change.

### Ship It

```bash
git add w14/merkle_harness.c
git commit -m "w14-l06: regression harness with test vectors for all merkle operations"
```

---

## Done when

- The harness covers build, proof generation, verification, and tamper detection.
- At least 10 named tests run.
- All tests pass on a correct implementation.
- At least one test fails if any [canonicalization rule (L05)](05-canonicalization-rules.md) is changed.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero leaks and zero errors.
- The harness exits `0` on all pass, `1` on any failure — suitable for CI.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| No test vectors — only "does it crash?" | Hard-code expected hashes. A harness that does not check values catches nothing. |
| Testing only valid proofs | You [MUST](https://datatracker.ietf.org/doc/html/rfc2119) test tampered inputs — leaf, sibling, root, direction. A verifier that accepts everything is broken. |
| Leaking memory in test functions | Every tree built in a test [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be freed. Run under [Valgrind](https://valgrind.org/docs/manual/manual.html) to confirm. |
| Not testing odd leaf counts | Power-of-two trees are easy. Odd counts exercise the [split rule](05-canonicalization-rules.md). Always test both. |
| Hard-coding wrong test vectors | Compute expected values with a separate tool (e.g., [openssl dgst](https://man7.org/linux/man-pages/man1/openssl.1.html)) and double-check before committing. |

## Proof

```bash
./merkle_harness
# → 10/10 tests passed
valgrind --leak-check=full ./merkle_harness
# → 0 errors from 0 contexts
```

## Hero visual

```
  merkle_harness
       │
       ├── test_empty_tree ─────────────── root == SHA-256("") ?        → PASS
       ├── test_single_leaf ────────────── root == SHA-256(0x00‖data) ? → PASS
       ├── test_power_of_two ───────────── roots match test vectors ?   → PASS
       ├── test_non_power_of_two ───────── 5-leaf root correct ?        → PASS
       ├── test_large_tree ─────────────── 100-leaf root correct ?      → PASS
       ├── test_proof_valid ────────────── verify(proof, root) == 1 ?   → PASS
       ├── test_proof_tampered_leaf ────── verify(bad_leaf, root) == 0? → PASS
       ├── test_proof_tampered_sibling ─── verify(bad_sib, root) == 0?  → PASS
       ├── test_proof_tampered_root ────── verify(proof, bad_root)==0?  → PASS
       └── test_proof_wrong_direction ──── verify(bad_dir, root) == 0?  → PASS

       10/10 → exit 0
```

## Future Lock

- In [W15](../../../parts/w15/part.md) you will extend this harness to test the [transparency log](../../../parts/w15/part.md) API — build a tree via the log, fetch a proof, and verify it end-to-end.
- In [W16](../../../parts/w16/part.md) you will add consistency-proof tests — given two roots from different tree sizes, verify the log only appended entries and never changed old ones.
- In [W19](../../../parts/w19/part.md) you will test [trust bundle](../../../parts/w19/part.md) round-trips — serialize a proof, deserialize it in a different process, and verify it still passes.
