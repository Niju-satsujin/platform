---
id: w17-l02
title: "Issuance Workflow"
order: 2
type: lesson
duration_min: 45
---

# Issuance Workflow

## Goal

Build an [issuance workflow](https://www.w3.org/TR/vc-data-model/#lifecycle-details) that takes a validated [credential document](https://www.w3.org/TR/vc-data-model/), signs it with [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519), and produces a [verifiable credential](https://www.w3.org/TR/vc-data-model/) ready for storage and transport.

## What you build

An `issuer` module that accepts a `struct credential_doc` from [L01](01-document-schema.md), serializes it to a canonical byte string, signs the bytes with an [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) private key, and produces a `struct verifiable_credential` that bundles the original document with the [signature](../../../parts/w08/part.md) and the issuer's [public key](https://en.wikipedia.org/wiki/Public-key_cryptography). You also write `issuer_verify_signature()` so any party can check the [signature](../../../parts/w08/part.md) without contacting the issuer.

## Why it matters

A [credential](https://www.w3.org/TR/vc-data-model/) without a [signature](https://en.wikipedia.org/wiki/Digital_signature) is just a claim anyone could have typed. The [signature](https://en.wikipedia.org/wiki/Digital_signature) binds the claim to the issuer's [key](https://en.wikipedia.org/wiki/Public-key_cryptography). [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) is the same [algorithm](https://en.wikipedia.org/wiki/Algorithm) you used in [W08](../../../parts/w08/part.md) for [replay protection](../../../parts/w08/part.md). Now you apply it to a structured document instead of a raw message. The [W3C data model](https://www.w3.org/TR/vc-data-model/) calls this step [issuance](https://www.w3.org/TR/vc-data-model/#lifecycle-details) — the moment a claim becomes a [verifiable credential](https://www.w3.org/TR/vc-data-model/).

---

## Training Session

### Warmup

Read [W3C VC Data Model — Lifecycle Details](https://www.w3.org/TR/vc-data-model/#lifecycle-details). Write down:

1. The three roles in the [trust triangle](https://www.w3.org/TR/vc-data-model/#ecosystem-overview): [issuer](https://www.w3.org/TR/vc-data-model/#issuer), [holder](https://www.w3.org/TR/vc-data-model/#holder), [verifier](https://www.w3.org/TR/vc-data-model/#verifier).
2. What makes a [credential](https://www.w3.org/TR/vc-data-model/) "verifiable" — the [digital signature](https://en.wikipedia.org/wiki/Digital_signature).

### Work

#### Do

1. Create `w17/issuer.h`.
2. Define `struct verifiable_credential` with fields:
   - `struct credential_doc doc` — the original document from [L01](01-document-schema.md).
   - `uint8_t signature[64]` — the [Ed25519 signature](https://en.wikipedia.org/wiki/EdDSA#Ed25519).
   - `uint8_t public_key[32]` — the issuer's [public key](https://en.wikipedia.org/wiki/Public-key_cryptography).
   - `char credential_id[65]` — a [hex](https://en.wikipedia.org/wiki/Hexadecimal)-encoded [hash](https://en.wikipedia.org/wiki/Cryptographic_hash_function) of the signed bytes, used as a unique identifier.
3. Create `w17/issuer.c`.
4. Write `serialize_doc(struct credential_doc *doc, uint8_t *buf, size_t *len)` — write the document fields into `buf` in a fixed order. This is the [canonical form](https://en.wikipedia.org/wiki/Canonicalization) that gets signed. Order: `schema_version`, `issuer`, `subject`, `claim`, `issued_at`.
5. Write `issuer_sign(struct credential_doc *doc, uint8_t *private_key, struct verifiable_credential *vc)` — call `serialize_doc()`, then sign the bytes with [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519). Copy the document, [signature](https://en.wikipedia.org/wiki/Digital_signature), and [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) into `vc`. Compute `credential_id` as the [SHA-256](https://en.wikipedia.org/wiki/SHA-2) [hash](https://en.wikipedia.org/wiki/Cryptographic_hash_function) of the signed bytes, [hex](https://en.wikipedia.org/wiki/Hexadecimal)-encoded.
6. Write `issuer_verify_signature(struct verifiable_credential *vc)` — re-serialize the document, verify the [Ed25519 signature](https://en.wikipedia.org/wiki/EdDSA#Ed25519) against the embedded [public key](https://en.wikipedia.org/wiki/Public-key_cryptography). Return `1` if valid, `0` if not.
7. Write a `main()` test: generate an [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) key pair, create a valid [credential document](01-document-schema.md), issue it, verify the [signature](https://en.wikipedia.org/wiki/Digital_signature), then flip one byte in the [signature](https://en.wikipedia.org/wiki/Digital_signature) and verify again.

#### Test

```bash
gcc -Wall -Wextra -o issuer_test w17/issuer.c w17/credential_schema.c -lsodium
./issuer_test
```

#### Expected

Two lines. The first says `signature valid`. The second says `signature invalid (tampered)`.

### Prove It

Run with [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind --leak-check=full ./issuer_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w17/issuer.h w17/issuer.c
git commit -m "w17-l02: issuance workflow with Ed25519 signing and verification"
```

---

## Done when

- `issuer_sign()` produces a [verifiable credential](https://www.w3.org/TR/vc-data-model/) with a valid [Ed25519 signature](https://en.wikipedia.org/wiki/EdDSA#Ed25519).
- `issuer_verify_signature()` returns `1` for an untampered [credential](https://www.w3.org/TR/vc-data-model/) and `0` for a tampered one.
- `credential_id` is unique per credential — two different documents produce different IDs.
- [Schema validation (L01)](01-document-schema.md) runs before signing. An invalid document [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) be signed.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Signing the struct bytes directly instead of a [canonical form](https://en.wikipedia.org/wiki/Canonicalization) | Struct padding differs across compilers. Serialize fields in a fixed order into a byte buffer. |
| Not validating the document before signing | Call `schema_validate()` from [L01](01-document-schema.md) first. A signed invalid document is still invalid. |
| Embedding the [private key](https://en.wikipedia.org/wiki/Public-key_cryptography) in the [verifiable credential](https://www.w3.org/TR/vc-data-model/) | Only the [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) goes into the credential. The [private key](https://en.wikipedia.org/wiki/Public-key_cryptography) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) stay with the [issuer](https://www.w3.org/TR/vc-data-model/#issuer). |
| Using a random `credential_id` instead of a [hash](https://en.wikipedia.org/wiki/Cryptographic_hash_function) | A [hash](https://en.wikipedia.org/wiki/Cryptographic_hash_function)-based ID is deterministic. The same document always gets the same ID. This matters for [revocation (L03)](03-revocation-hook.md) and [CAS storage (W13)](../../../parts/w13/part.md). |

## Proof

```bash
./issuer_test
# → credential abc123de... issued — signature valid
# → credential abc123de... tampered — signature invalid
```

## Hero visual

```
  credential_doc              issuer_sign()                verifiable_credential
  ┌─────────────────┐        ┌──────────────┐            ┌─────────────────────┐
  │ issuer           │        │ serialize     │            │ doc (original)      │
  │ subject          │──────▶ │ sign(Ed25519) │──────────▶ │ signature (64 B)    │
  │ claim            │        │ hash(SHA-256) │            │ public_key (32 B)   │
  │ issued_at        │        └──────────────┘            │ credential_id (hex) │
  │ schema_version   │          private_key               └─────────────────────┘
  └─────────────────┘
```

## Future Lock

- In [W17 L03](03-revocation-hook.md) you will use `credential_id` to revoke a credential after issuance.
- In [W17 L04](04-packaging.md) you will wrap the [verifiable credential](https://www.w3.org/TR/vc-data-model/) into a transport [package](https://www.w3.org/TR/vc-data-model/#presentations-0) with metadata.
- In [W13](../../../parts/w13/part.md) the [CAS](../../../parts/w13/part.md) stores the [verifiable credential](https://www.w3.org/TR/vc-data-model/) blob by its [content hash](../../../parts/w13/part.md), which matches `credential_id`.
- In [W15](../../../parts/w15/part.md) the [transparency log](../../../parts/w15/part.md) records each `credential_id` so anyone can audit the issuance history.
