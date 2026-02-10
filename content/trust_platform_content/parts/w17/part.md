---
id: w17-part
title: "Verifiable Credentials"
order: 17
type: part
---

# Week 17 – Verifiable Credentials

A [credential](https://www.w3.org/TR/vc-data-model/) is a signed claim. [Issuance](https://www.w3.org/TR/vc-data-model/#lifecycle-details), [revocation](https://en.wikipedia.org/wiki/Certificate_revocation_list), and [verification](https://www.w3.org/TR/vc-data-model/#verification) form a [trust triangle](https://www.w3.org/TR/vc-data-model/#ecosystem-overview).

```
       Issuer
      ╱      ╲
  issue        revoke
    ╱              ╲
Holder ──present──▶ Verifier
   │                   │
   │   credential      │
   │   (signed claim)  │
   └───────────────────┘
         trust triangle
```

## What you build

A [verifiable credential](https://www.w3.org/TR/vc-data-model/) system. You define a [JSON Schema](https://json-schema.org/) for credential documents. You build an [issuance workflow](https://www.w3.org/TR/vc-data-model/#lifecycle-details) that signs claims with [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519). You add a [revocation hook](https://en.wikipedia.org/wiki/Certificate_revocation_list) so issuers can cancel credentials. You [package](https://www.w3.org/TR/vc-data-model/#presentations-0) credentials for transport. You build a [verifier](https://www.w3.org/TR/vc-data-model/#verification) UX that checks the [signature](../w08/part.md), the [schema](https://json-schema.org/), and the [revocation status](https://en.wikipedia.org/wiki/Certificate_revocation_list) in one pass. A [regression harness](lessons/06-regression-harness.md) proves everything works end to end.

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W08 | [Signatures & replay protection](../w08/part.md) – the [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) signing you built is the foundation of credential issuance |
| ← builds on | W13 | [CAS](../w13/part.md) – [content-addressed storage](../w13/part.md) stores credential blobs by hash |
| ← builds on | W14 | [Merkle proofs](../w14/part.md) – [inclusion proofs](../w14/part.md) prove a credential is in the log |
| ← builds on | W15 | [Transparency log](../w15/part.md) – the log records every issuance for public audit |
| → leads to | W19 | [Trust bundles](../w19/part.md) – bundles package credentials with their proofs for distribution |

## Lessons

1. [Document Schema](lessons/01-document-schema.md)
2. [Issuance Workflow](lessons/02-issuance-workflow.md)
3. [Revocation Hook](lessons/03-revocation-hook.md)
4. [Packaging](lessons/04-packaging.md)
5. [Verifier UX](lessons/05-verifier-ux.md)
6. [Regression Harness](lessons/06-regression-harness.md)

## Quest

[W17 Quest – Full Credential System](quest.md)

## Quiz

[W17 Quiz](quiz.md)
