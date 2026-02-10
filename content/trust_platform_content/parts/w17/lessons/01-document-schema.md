---
id: w17-l01
title: "Document Schema"
order: 1
type: lesson
duration_min: 35
---

# Document Schema

## Goal

Define a [JSON Schema](https://json-schema.org/) that describes the exact shape of a [verifiable credential](https://www.w3.org/TR/vc-data-model/). Every credential your system issues [MUST](https://datatracker.ietf.org/doc/html/rfc2119) pass this schema before signing.

## What you build

A `credential_schema` module that loads a [JSON Schema](https://json-schema.org/) definition and validates a credential document against it. The schema declares required fields: `issuer`, `subject`, `claim`, `issued_at`, and `schema_version`. You write a function that takes a raw [JSON](https://en.wikipedia.org/wiki/JSON) blob and returns pass or fail with a reason string.

## Why it matters

Without a [schema](https://json-schema.org/), any blob of bytes can claim to be a [credential](https://www.w3.org/TR/vc-data-model/). A [verifier](https://www.w3.org/TR/vc-data-model/#verification) would have to guess what fields exist. The [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/) defines a standard structure so issuers, holders, and verifiers all agree on the shape before any [cryptographic](https://en.wikipedia.org/wiki/Cryptography) checks begin. Schema validation is the cheapest gate — it catches garbage before you waste cycles on [signature verification](../../../parts/w08/part.md).

---

## Training Session

### Warmup

Read [JSON Schema — Getting Started](https://json-schema.org/learn/getting-started-step-by-step). Write down:

1. What the `required` keyword does in a [JSON Schema](https://json-schema.org/).
2. How the `type` keyword constrains a field to `"string"` or `"integer"`.
3. What happens when a document has an extra field not listed in the [schema](https://json-schema.org/).

### Work

#### Do

1. Create `w17/credential_schema.h`.
2. Define `struct credential_doc` with fields: `const char *issuer`, `const char *subject`, `const char *claim`, `uint64_t issued_at`, `int schema_version`.
3. Define `struct schema_result` with fields: `int valid`, `const char *reason`.
4. Create `w17/credential_schema.c`.
5. Write `schema_validate(struct credential_doc *doc)` — returns a `struct schema_result`.
   - Check that `issuer` is not `NULL` and not empty.
   - Check that `subject` is not `NULL` and not empty.
   - Check that `claim` is not `NULL` and not empty.
   - Check that `issued_at` is greater than zero.
   - Check that `schema_version` equals `1`. Future versions will extend the [schema](https://json-schema.org/).
   - If any check fails, set `valid = 0` and `reason` to a message naming the failing field.
   - If all checks pass, set `valid = 1` and `reason = "ok"`.
6. Write a `main()` test that creates one valid [credential document](https://www.w3.org/TR/vc-data-model/) and two invalid ones (missing `subject`, wrong `schema_version`). Print the result for each.

#### Test

```bash
gcc -Wall -Wextra -o schema_test w17/credential_schema.c
./schema_test
```

#### Expected

Three lines of output. The first says `VALID`. The second says `INVALID: subject is empty`. The third says `INVALID: unsupported schema_version`.

### Prove It

Run with [AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html):

```bash
gcc -fsanitize=address -Wall -Wextra -o schema_test w17/credential_schema.c
./schema_test
```

Zero errors reported.

### Ship It

```bash
git add w17/credential_schema.h w17/credential_schema.c
git commit -m "w17-l01: credential document schema with validation"
```

---

## Done when

- `schema_validate()` accepts a well-formed [credential document](https://www.w3.org/TR/vc-data-model/).
- A missing or empty `issuer`, `subject`, or `claim` is rejected with a clear reason.
- A zero `issued_at` is rejected.
- An unsupported `schema_version` is rejected.
- [AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html) reports zero errors.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Checking only for `NULL` but not empty string | `""` is not `NULL` but it is still invalid. Check `strlen()` too. |
| Hardcoding `schema_version == 1` without explaining why | Document that version `1` is the only supported version. When version `2` arrives, the function [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be updated. |
| Returning on the first failure without naming the field | The caller needs to know which field failed. Set `reason` to the specific field name. |
| Not validating before signing | [Schema](https://json-schema.org/) validation [MUST](https://datatracker.ietf.org/doc/html/rfc2119) happen before [signing (L02)](02-issuance-workflow.md). A signed invalid document is still invalid. |

## Proof

```bash
./schema_test
# → doc 1: VALID (ok)
# → doc 2: INVALID (subject is empty)
# → doc 3: INVALID (unsupported schema_version)
```

## Hero visual

```
  raw JSON blob
  ┌──────────────────────────┐
  │ issuer: "did:ex:alice"   │
  │ subject: "did:ex:bob"    │
  │ claim: "passed W16"      │──▶ schema_validate() ──▶ VALID ✓
  │ issued_at: 1700000000    │
  │ schema_version: 1        │
  └──────────────────────────┘

  bad JSON blob
  ┌──────────────────────────┐
  │ issuer: "did:ex:alice"   │
  │ subject: ""              │──▶ schema_validate() ──▶ INVALID ✗
  │ claim: "passed W16"      │       reason: "subject is empty"
  │ issued_at: 1700000000    │
  │ schema_version: 1        │
  └──────────────────────────┘
```

## Future Lock

- In [W17 L02](02-issuance-workflow.md) you will feed validated documents into the [issuance workflow](https://www.w3.org/TR/vc-data-model/#lifecycle-details) that signs them with [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519).
- In [W17 L04](04-packaging.md) you will embed the [schema version](https://json-schema.org/) inside the [credential package](https://www.w3.org/TR/vc-data-model/#presentations-0) so the verifier knows which schema to check.
- In [W17 L05](05-verifier-ux.md) the [verifier](https://www.w3.org/TR/vc-data-model/#verification) calls `schema_validate()` as the first step — before checking the [signature](../../../parts/w08/part.md) or [revocation status](https://en.wikipedia.org/wiki/Certificate_revocation_list).
- In [W19](../../../parts/w19/part.md) [trust bundles](../../../parts/w19/part.md) will include the schema definition so verifiers can validate offline.
