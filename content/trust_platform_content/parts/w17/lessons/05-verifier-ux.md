---
id: w17-l05
title: "Verifier UX"
order: 5
type: lesson
duration_min: 50
---

# Verifier UX

## Goal

Build a [verifier](https://www.w3.org/TR/vc-data-model/#verifier) that takes a [credential package](04-packaging.md), runs every check in the correct order, and returns a clear pass-or-fail result with a reason for each step.

## What you build

A `verifier` module with a single entry point: `verify_credential(struct credential_package *pkg, struct revocation_list *rl)`. It runs four checks in order: [format version](04-packaging.md), [schema validation (L01)](01-document-schema.md), [signature verification (L02)](02-issuance-workflow.md), and [revocation check (L03)](03-revocation-hook.md). Each check produces a step result. The function returns a `struct verification_report` with the outcome of every step and a final verdict.

## Why it matters

A [verifier](https://www.w3.org/TR/vc-data-model/#verifier) that only checks the [signature](https://en.wikipedia.org/wiki/Digital_signature) is not enough. A [credential](https://www.w3.org/TR/vc-data-model/) can have a valid [signature](https://en.wikipedia.org/wiki/Digital_signature) but be [revoked](https://en.wikipedia.org/wiki/Certificate_revocation_list). It can pass [revocation](https://en.wikipedia.org/wiki/Certificate_revocation_list) but fail [schema validation](https://json-schema.org/). The check order matters — run the cheapest check first ([schema](https://json-schema.org/)), then the [signature](https://en.wikipedia.org/wiki/Digital_signature) (CPU-bound), then [revocation](https://en.wikipedia.org/wiki/Certificate_revocation_list) (may need IO). A clear, step-by-step report lets the [holder](https://www.w3.org/TR/vc-data-model/#holder) understand exactly why their [credential](https://www.w3.org/TR/vc-data-model/) was rejected.

---

## Training Session

### Warmup

Read [W3C VC Data Model — Verification](https://www.w3.org/TR/vc-data-model/#verification). Write down:

1. The difference between [verification](https://www.w3.org/TR/vc-data-model/#verification) (checking the proof) and [validation](https://www.w3.org/TR/vc-data-model/#validation) (checking the content).
2. Why a [verifier](https://www.w3.org/TR/vc-data-model/#verifier) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) check both.

### Work

#### Do

1. Create `w17/verifier.h`.
2. Define `enum check_status` with values: `CHECK_PASS`, `CHECK_FAIL`, `CHECK_SKIP`.
3. Define `struct check_step` with fields: `const char *name`, `enum check_status status`, `const char *detail`.
4. Define `struct verification_report` with fields: `struct check_step steps[4]`, `int step_count`, `int accepted`.
5. Create `w17/verifier.c`.
6. Write `verify_credential(struct credential_package *pkg, struct revocation_list *rl)`:
   - **Step 1 — Format**: Call `package_open()` from [L04](04-packaging.md). If `format_version` is unsupported, fail this step and skip all remaining steps.
   - **Step 2 — Schema**: Call `schema_validate()` from [L01](01-document-schema.md) on the extracted [credential document](https://www.w3.org/TR/vc-data-model/). If it fails, skip remaining steps.
   - **Step 3 — Signature**: Call `issuer_verify_signature()` from [L02](02-issuance-workflow.md). If the [signature](https://en.wikipedia.org/wiki/Digital_signature) is invalid, skip remaining steps.
   - **Step 4 — Revocation**: Call `revocation_is_revoked()` from [L03](03-revocation-hook.md) with the `credential_id`. If revoked, fail this step.
   - Set `accepted = 1` only if all four steps pass.
   - Return the `struct verification_report`.
7. Write `print_report(struct verification_report *report)` — print each step's name, status, and detail. Print the final verdict.
8. Write a `main()` test with four scenarios:
   - A valid [credential](https://www.w3.org/TR/vc-data-model/) that passes all checks.
   - A [credential](https://www.w3.org/TR/vc-data-model/) with a bad [schema](https://json-schema.org/) (empty subject).
   - A [credential](https://www.w3.org/TR/vc-data-model/) with a tampered [signature](https://en.wikipedia.org/wiki/Digital_signature).
   - A valid [credential](https://www.w3.org/TR/vc-data-model/) that has been [revoked](https://en.wikipedia.org/wiki/Certificate_revocation_list).

#### Test

```bash
gcc -Wall -Wextra -o verifier_test w17/verifier.c w17/packaging.c w17/revocation.c w17/issuer.c w17/credential_schema.c -lsodium
./verifier_test
```

#### Expected

Four reports. The first shows all steps `PASS` and verdict `ACCEPTED`. The second fails at step 2 (schema) and shows `REJECTED`. The third fails at step 3 (signature) and shows `REJECTED`. The fourth fails at step 4 (revoked) and shows `REJECTED`.

### Prove It

Run with [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind --leak-check=full ./verifier_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w17/verifier.h w17/verifier.c
git commit -m "w17-l05: verifier with four-step check pipeline and detailed report"
```

---

## Done when

- `verify_credential()` runs all four checks in order.
- A failure at any step skips the remaining steps.
- The [verification report](https://www.w3.org/TR/vc-data-model/#verification) shows the status and detail of every step.
- All four test scenarios produce the correct verdict.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Continuing checks after a failure | A failed [signature](https://en.wikipedia.org/wiki/Digital_signature) means the document may be forged. Do not run the [revocation check](https://en.wikipedia.org/wiki/Certificate_revocation_list) on a forged document. Skip remaining steps. |
| Only reporting the final verdict without step details | The [holder](https://www.w3.org/TR/vc-data-model/#holder) needs to know which step failed. A report saying just "REJECTED" is not actionable. |
| Checking [revocation](https://en.wikipedia.org/wiki/Certificate_revocation_list) before [signature](https://en.wikipedia.org/wiki/Digital_signature) | The `credential_id` comes from the [signature](https://en.wikipedia.org/wiki/Digital_signature) step. If the [signature](https://en.wikipedia.org/wiki/Digital_signature) is forged, the `credential_id` could be fake. Always verify the [signature](https://en.wikipedia.org/wiki/Digital_signature) first. |
| Accepting a [credential](https://www.w3.org/TR/vc-data-model/) with `CHECK_SKIP` steps | `CHECK_SKIP` means the check was not run. Only accept when all four steps are `CHECK_PASS`. |

## Proof

```bash
./verifier_test
# → === Scenario 1: valid credential ===
# → [1] format:     PASS (format v1)
# → [2] schema:     PASS (ok)
# → [3] signature:  PASS (Ed25519 valid)
# → [4] revocation: PASS (not revoked)
# → verdict: ACCEPTED
# →
# → === Scenario 2: bad schema ===
# → [1] format:     PASS (format v1)
# → [2] schema:     FAIL (subject is empty)
# → [3] signature:  SKIP
# → [4] revocation: SKIP
# → verdict: REJECTED
# →
# → === Scenario 3: tampered signature ===
# → [1] format:     PASS (format v1)
# → [2] schema:     PASS (ok)
# → [3] signature:  FAIL (Ed25519 invalid)
# → [4] revocation: SKIP
# → verdict: REJECTED
# →
# → === Scenario 4: revoked credential ===
# → [1] format:     PASS (format v1)
# → [2] schema:     PASS (ok)
# → [3] signature:  PASS (Ed25519 valid)
# → [4] revocation: FAIL (revoked: key compromised)
# → verdict: REJECTED
```

## Hero visual

```
  credential_package
        │
        ▼
  ┌─────────────┐   FAIL ──▶ REJECTED
  │ 1. format   │
  └──────┬──────┘
         │ PASS
         ▼
  ┌─────────────┐   FAIL ──▶ REJECTED
  │ 2. schema   │
  └──────┬──────┘
         │ PASS
         ▼
  ┌─────────────┐   FAIL ──▶ REJECTED
  │ 3. signature│
  └──────┬──────┘
         │ PASS
         ▼
  ┌─────────────┐   FAIL ──▶ REJECTED
  │ 4. revoked? │
  └──────┬──────┘
         │ PASS
         ▼
      ACCEPTED ✓
```

## Future Lock

- In [W17 L06](06-regression-harness.md) you will build a [regression harness](06-regression-harness.md) that tests the full [verification pipeline](https://www.w3.org/TR/vc-data-model/#verification) across many scenarios.
- In [W14](../../../parts/w14/part.md) you can add a fifth check step: verify the [Merkle inclusion proof](../../../parts/w14/part.md) if `proof_depth > 0`.
- In [W19](../../../parts/w19/part.md) the [verifier](https://www.w3.org/TR/vc-data-model/#verifier) will process [trust bundles](../../../parts/w19/part.md) containing multiple [credential packages](https://www.w3.org/TR/vc-data-model/#presentations-0) and verify each one.
- In [W15](../../../parts/w15/part.md) the [transparency log](../../../parts/w15/part.md) gives the verifier an additional signal: if a `credential_id` was never logged, the [credential](https://www.w3.org/TR/vc-data-model/) is suspicious.
