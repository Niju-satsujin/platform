---
id: w17-quiz
title: "Week 17 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 17 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – Trust triangle roles

Which three roles make up the [trust triangle](https://www.w3.org/TR/vc-data-model/#ecosystem-overview) in the [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/)?

- A) Client, server, database
- B) [Issuer](https://www.w3.org/TR/vc-data-model/#issuer), [holder](https://www.w3.org/TR/vc-data-model/#holder), [verifier](https://www.w3.org/TR/vc-data-model/#verifier)
- C) Signer, encryptor, decryptor
- D) Publisher, subscriber, broker

---

### Q2 – Schema validation purpose

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) [schema validation (L01)](lessons/01-document-schema.md) run before [signature verification (L02)](lessons/02-issuance-workflow.md)?

- A) Because the [schema](https://json-schema.org/) is needed to compute the [signature](https://en.wikipedia.org/wiki/Digital_signature)
- B) Because [schema validation](https://json-schema.org/) is cheap — it catches garbage before you spend CPU on [Ed25519 verification](https://en.wikipedia.org/wiki/EdDSA#Ed25519)
- C) Because [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) requires a [JSON Schema](https://json-schema.org/) as input
- D) Because the [verifier](https://www.w3.org/TR/vc-data-model/#verifier) does not have the [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) yet

---

### Q3 – Canonical serialization

Why does `serialize_doc()` in [L02](lessons/02-issuance-workflow.md) write fields in a fixed order instead of signing the raw [struct](https://en.cppreference.com/w/c/language/struct) bytes?

- A) Because [structs](https://en.cppreference.com/w/c/language/struct) are too large to sign
- B) Because [struct padding](https://en.wikipedia.org/wiki/Data_structure_alignment) differs across compilers and platforms — the same document would produce different bytes on different machines
- C) Because [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) only accepts strings, not binary
- D) Because the [JSON Schema](https://json-schema.org/) requires a specific byte order

---

### Q4 – Private key in credential

What happens if the [issuer](https://www.w3.org/TR/vc-data-model/#issuer) accidentally stores the [private key](https://en.wikipedia.org/wiki/Public-key_cryptography) inside the [verifiable credential](https://www.w3.org/TR/vc-data-model/)?

- A) Nothing — the [private key](https://en.wikipedia.org/wiki/Public-key_cryptography) is encrypted by [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519)
- B) Anyone who receives the [credential](https://www.w3.org/TR/vc-data-model/) can forge new credentials as that [issuer](https://www.w3.org/TR/vc-data-model/#issuer)
- C) The [signature](https://en.wikipedia.org/wiki/Digital_signature) becomes invalid
- D) The [verifier](https://www.w3.org/TR/vc-data-model/#verifier) rejects the [credential](https://www.w3.org/TR/vc-data-model/) automatically

---

### Q5 – Append-only CRL

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the [Certificate Revocation List (L03)](lessons/03-revocation-hook.md) be [append-only](https://en.wikipedia.org/wiki/Append-only)?

- A) Because [append mode](https://en.cppreference.com/w/c/io/fopen) is faster than write mode
- B) Because removing a revoked entry would make a cancelled [credential](https://www.w3.org/TR/vc-data-model/) appear valid again
- C) Because the [file system](https://en.wikipedia.org/wiki/File_system) does not support deletion
- D) Because [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) cannot sign variable-length lists

---

### Q6 – CRL signature

What attack does signing the [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) with [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) prevent?

- A) An attacker reading the list of revoked [credentials](https://www.w3.org/TR/vc-data-model/)
- B) An attacker adding or removing entries from the [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) to hide a [revocation](https://en.wikipedia.org/wiki/Certificate_revocation_list) or fake one
- C) An attacker guessing the [issuer's](https://www.w3.org/TR/vc-data-model/#issuer) [private key](https://en.wikipedia.org/wiki/Public-key_cryptography)
- D) An attacker slowing down the [verifier](https://www.w3.org/TR/vc-data-model/#verifier)

---

### Q7 – Package format version

Why does the [credential package (L04)](lessons/04-packaging.md) include a `format_version` byte?

- A) To make the package larger
- B) So a [verifier](https://www.w3.org/TR/vc-data-model/#verifier) can detect an unsupported format and reject it cleanly instead of parsing garbage
- C) Because [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) requires a version field
- D) Because [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) signs the version byte

---

### Q8 – Verification order

In the [verifier (L05)](lessons/05-verifier-ux.md), why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the [signature](https://en.wikipedia.org/wiki/Digital_signature) check run before the [revocation](https://en.wikipedia.org/wiki/Certificate_revocation_list) check?

- A) Because the [signature](https://en.wikipedia.org/wiki/Digital_signature) check is faster
- B) Because the `credential_id` comes from the signed bytes — a forged [signature](https://en.wikipedia.org/wiki/Digital_signature) means the `credential_id` could be fake, so checking [revocation](https://en.wikipedia.org/wiki/Certificate_revocation_list) against a fake ID is meaningless
- C) Because the [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) is only available after [signature verification](https://en.wikipedia.org/wiki/Digital_signature)
- D) Because [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) requires running before any IO

---

### Q9 – Credential ID collision (short answer)

Two different [credential documents](https://www.w3.org/TR/vc-data-model/) produce the same `credential_id`. What property of the [hash function](https://en.wikipedia.org/wiki/Cryptographic_hash_function) was broken? What impact does this have on [revocation (L03)](lessons/03-revocation-hook.md)?

---

### Q10 – Revocation without CRL (short answer)

A [verifier](https://www.w3.org/TR/vc-data-model/#verifier) cannot reach the [CRL URL](https://en.wikipedia.org/wiki/Certificate_revocation_list) embedded in the [credential package](lessons/04-packaging.md). Should the [verifier](https://www.w3.org/TR/vc-data-model/#verifier) accept, reject, or defer the [credential](https://www.w3.org/TR/vc-data-model/)? Explain the trade-off between availability and safety.

---

### Q11 – Offline verification (short answer)

A [holder](https://www.w3.org/TR/vc-data-model/#holder) presents a [credential package](lessons/04-packaging.md) in an environment with no network. Which of the four [verifier](https://www.w3.org/TR/vc-data-model/#verifier) checks from [L05](lessons/05-verifier-ux.md) can still run? Which ones cannot? Explain why.

---

### Q12 – Schema evolution (short answer)

The [schema (L01)](lessons/01-document-schema.md) today requires `schema_version = 1`. A new version adds an `expires_at` field. How should the [verifier](https://www.w3.org/TR/vc-data-model/#verifier) handle a [credential](https://www.w3.org/TR/vc-data-model/) with `schema_version = 2` without breaking old [credentials](https://www.w3.org/TR/vc-data-model/) that use version `1`?

---

### Q13 – Read the output (verification report)

A [verifier](https://www.w3.org/TR/vc-data-model/#verifier) prints the following report:

```
[1] format:     PASS (format v1)
[2] schema:     PASS (ok)
[3] signature:  FAIL (Ed25519 invalid)
[4] revocation: SKIP
verdict: REJECTED
```

Why was step 4 skipped? What [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the [holder](https://www.w3.org/TR/vc-data-model/#holder) do to fix this [credential](https://www.w3.org/TR/vc-data-model/)?

---

### Q14 – Read the output (regression harness)

The [regression harness (L06)](lessons/06-regression-harness.md) prints the following:

```
scenario 1 (valid credential):       PASS
scenario 2 (empty subject):          PASS
scenario 3 (zero issued_at):         PASS
scenario 4 (tampered signature):     PASS
scenario 5 (wrong public key):       PASS
scenario 6 (revoked credential):     FAIL — expected REJECTED, got ACCEPTED
scenario 7 (bad format version):     PASS
scenario 8 (CRL round-trip):         FAIL — expected REJECTED, got ACCEPTED
7/8 passed
```

Two scenarios failed. Both involve [revocation](https://en.wikipedia.org/wiki/Certificate_revocation_list). What is the most likely bug? Which module from [L03](lessons/03-revocation-hook.md) should you inspect first?
