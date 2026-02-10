---
id: w17-l06
title: "Regression Harness"
order: 6
type: lesson
duration_min: 40
---

# Regression Harness

## Goal

Build an end-to-end [regression harness](https://en.wikipedia.org/wiki/Regression_testing) that exercises every code path in the [credential system](../../../parts/w17/part.md) — [schema validation (L01)](01-document-schema.md), [issuance (L02)](02-issuance-workflow.md), [revocation (L03)](03-revocation-hook.md), [packaging (L04)](04-packaging.md), and [verification (L05)](05-verifier-ux.md) — in a single automated run.

## What you build

A `test_harness` program that runs eight test scenarios, checks the result of each, and prints a summary. Every scenario creates a [credential](https://www.w3.org/TR/vc-data-model/), pushes it through the full pipeline, and compares the [verification report](05-verifier-ux.md) to the expected outcome. The harness is deterministic — no random inputs, no network calls.

## Why it matters

You now have five modules. Each one was tested in isolation. But bugs hide at the boundaries — a [schema](https://json-schema.org/) that passes alone might fail after [packaging](04-packaging.md) changes a field. A [revocation](https://en.wikipedia.org/wiki/Certificate_revocation_list) that works in memory might break after [save and reload](03-revocation-hook.md). A [regression harness](https://en.wikipedia.org/wiki/Regression_testing) catches these integration bugs every time you change any module. It is the same idea as the harness in [W16 L06](../../../parts/w16/lessons/06-regression-harness.md), now applied to [credentials](https://www.w3.org/TR/vc-data-model/).

---

## Training Session

### Warmup

List the eight scenarios that cover the critical paths:

1. Valid [credential](https://www.w3.org/TR/vc-data-model/) — all checks pass.
2. Empty [subject](https://www.w3.org/TR/vc-data-model/#subject) — [schema](https://json-schema.org/) rejects.
3. Zero `issued_at` — [schema](https://json-schema.org/) rejects.
4. Tampered [signature](https://en.wikipedia.org/wiki/Digital_signature) — [signature check](02-issuance-workflow.md) rejects.
5. Wrong [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) — [signature check](02-issuance-workflow.md) rejects.
6. [Revoked](https://en.wikipedia.org/wiki/Certificate_revocation_list) [credential](https://www.w3.org/TR/vc-data-model/) — [revocation check](03-revocation-hook.md) rejects.
7. Bad `format_version` — [package open](04-packaging.md) rejects.
8. [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) save, reload, then verify — persistence round-trip.

### Work

#### Do

1. Create `w17/test_harness.c`.
2. Define a helper `run_scenario(const char *name, int expected_accepted)` that runs one scenario and returns `1` if the actual verdict matches `expected_accepted`, `0` otherwise.
3. Implement each of the eight scenarios listed in the Warmup.
4. For scenario 1: create a valid [credential document](01-document-schema.md), issue it with [Ed25519 (L02)](02-issuance-workflow.md), seal it into a [package (L04)](04-packaging.md), and verify. Expect `ACCEPTED`.
5. For scenario 2: create a [credential document](01-document-schema.md) with an empty `subject`, issue, package, verify. Expect `REJECTED` at schema step.
6. For scenario 3: create a [credential document](01-document-schema.md) with `issued_at = 0`, issue, package, verify. Expect `REJECTED` at schema step.
7. For scenario 4: issue a valid [credential](https://www.w3.org/TR/vc-data-model/), flip one byte in the [signature](https://en.wikipedia.org/wiki/Digital_signature), package, verify. Expect `REJECTED` at signature step.
8. For scenario 5: issue a valid [credential](https://www.w3.org/TR/vc-data-model/), replace the [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) with a different key, package, verify. Expect `REJECTED` at signature step.
9. For scenario 6: issue a valid [credential](https://www.w3.org/TR/vc-data-model/), revoke it using [L03](03-revocation-hook.md), package, verify. Expect `REJECTED` at revocation step.
10. For scenario 7: issue a valid [credential](https://www.w3.org/TR/vc-data-model/), seal the package, then set `format_version = 99`, verify. Expect `REJECTED` at format step.
11. For scenario 8: issue, revoke, save [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) to disk, reload [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) into a fresh list, verify against the reloaded list. Expect `REJECTED` at revocation step.
12. Print a summary: `N/8 passed`.

#### Test

```bash
gcc -Wall -Wextra -o test_harness \
  w17/test_harness.c w17/verifier.c w17/packaging.c \
  w17/revocation.c w17/issuer.c w17/credential_schema.c -lsodium
./test_harness
```

#### Expected

```
scenario 1 (valid credential):       PASS
scenario 2 (empty subject):          PASS
scenario 3 (zero issued_at):         PASS
scenario 4 (tampered signature):     PASS
scenario 5 (wrong public key):       PASS
scenario 6 (revoked credential):     PASS
scenario 7 (bad format version):     PASS
scenario 8 (CRL round-trip):         PASS
8/8 passed
```

### Prove It

Run with [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind --leak-check=full ./test_harness
```

Zero errors, zero leaks.

### Ship It

```bash
git add w17/test_harness.c
git commit -m "w17-l06: regression harness covering 8 credential scenarios"
```

---

## Done when

- All eight scenarios pass.
- Each scenario tests a different failure mode or success path.
- The harness is deterministic — runs the same way every time.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors.
- Adding or changing any module and re-running the harness catches regressions.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not checking which step failed, only the final verdict | The harness [MUST](https://datatracker.ietf.org/doc/html/rfc2119) verify that the correct step caused the rejection, not just that rejection happened. |
| Skipping the [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) round-trip scenario | In-memory tests pass but disk persistence can break. Always test save-and-reload. |
| Using random keys for each run | Random inputs make failures hard to reproduce. Use a fixed [seed](https://en.wikipedia.org/wiki/Random_seed) or hardcoded test keys. |
| Not freeing the [revocation list](https://en.wikipedia.org/wiki/Certificate_revocation_list) between scenarios | Leftover entries from one scenario leak into the next. Initialize a fresh list per scenario. |

## Proof

```bash
./test_harness
# → scenario 1 (valid credential):       PASS
# → scenario 2 (empty subject):          PASS
# → scenario 3 (zero issued_at):         PASS
# → scenario 4 (tampered signature):     PASS
# → scenario 5 (wrong public key):       PASS
# → scenario 6 (revoked credential):     PASS
# → scenario 7 (bad format version):     PASS
# → scenario 8 (CRL round-trip):         PASS
# → 8/8 passed
```

## Hero visual

```
  test_harness
  ┌──────────────────────────────────────────┐
  │ scenario 1: valid         ──▶ ACCEPTED ✓ │
  │ scenario 2: bad schema    ──▶ REJECTED ✓ │
  │ scenario 3: zero time     ──▶ REJECTED ✓ │
  │ scenario 4: bad sig       ──▶ REJECTED ✓ │
  │ scenario 5: wrong key     ──▶ REJECTED ✓ │
  │ scenario 6: revoked       ──▶ REJECTED ✓ │
  │ scenario 7: bad format    ──▶ REJECTED ✓ │
  │ scenario 8: CRL reload    ──▶ REJECTED ✓ │
  ├──────────────────────────────────────────┤
  │                 8/8 passed               │
  └──────────────────────────────────────────┘
```

## Future Lock

- In the [W17 Quest](../quest.md) you will extend this harness to cover the full integrated system with additional edge cases.
- In [W19](../../../parts/w19/part.md) you will add scenarios that verify [trust bundles](../../../parts/w19/part.md) containing multiple [credential packages](https://www.w3.org/TR/vc-data-model/#presentations-0).
- In [W20](../../../parts/w20/part.md) [chaos drills](../../../parts/w20/part.md) will inject faults — corrupted [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) files, truncated packages, flipped signature bits — and verify the system rejects them.
- In [W14](../../../parts/w14/part.md) you can add a ninth scenario: a [credential](https://www.w3.org/TR/vc-data-model/) with a valid [inclusion proof](../../../parts/w14/part.md) and one with a forged proof.
