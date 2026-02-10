---
id: w08-part
title: "Signatures & Replay Protection"
order: 8
type: part
---

# Week 08 – Signatures & Replay Protection

Identity and anti-replay are core trust-system primitives.

## 🖼️ Hero Visual

```
  private key          message           signature
  ┌──────────┐      ┌──────────────┐   ┌─────────────────────┐
  │ Ed25519   │─────▶│ canonical    │──▶│ 64-byte Ed25519 sig │
  │ 32 bytes  │ sign │ signing bytes│   └─────────────────────┘
  └──────────┘      └──────────────┘            │
       │                                         ▼
  public key                              verify with public key
  ┌──────────┐                            ──▶ PASS / FAIL
  │ 32 bytes │────────────────────────────┘
  └──────────┘

  envelope = { header, payload, nonce, signature }
  ──▶ nonce prevents replay attacks
```

## Theme

A [hash](../w07/part.md) proves that data has not changed, but it does not say who created it. A [digital signature](https://en.wikipedia.org/wiki/Digital_signature) binds a [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function) to an identity: only the holder of the [private key](https://en.wikipedia.org/wiki/Public-key_cryptography) can produce the [signature](https://en.wikipedia.org/wiki/Digital_signature), and anyone with the matching [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) can verify it. [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) gives fast, compact signatures. But a valid signature can be replayed — an attacker records a signed message and sends it again. A [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) inside the [canonical signing bytes](lessons/03-canonical-signing-bytes.md) stops this. Together, [keypairs](lessons/01-keypair-basics.md), [sign/verify](lessons/02-sign-verify.md), [canonical signing bytes](lessons/03-canonical-signing-bytes.md), [replay protection](lessons/04-replay-protection.md), and a self-describing [envelope format](lessons/05-envelope-format.md) give you the building blocks for [content-addressable stores (W13)](../w13/part.md), [Merkle trees (W14)](../w14/part.md), [credential issuance (W17)](../w17/part.md), and [trust bundles (W19)](../w19/part.md).

## What you build

A signing toolkit in C: [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) keypair generation using [EVP_PKEY_keygen](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html), [sign/verify](lessons/02-sign-verify.md) operations using [EVP_DigestSign](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) and [EVP_DigestVerify](https://www.openssl.org/docs/man3.0/man3/EVP_DigestVerify.html), [canonical signing bytes](lessons/03-canonical-signing-bytes.md) that build on [W07 canonical input](../w07/part.md), [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce)-based [replay protection](lessons/04-replay-protection.md), a self-describing [envelope format](lessons/05-envelope-format.md), and a full [regression harness](lessons/06-regression-harness.md).

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W07 | [Hashing & integrity](../w07/part.md) — canonical input and SHA-256 digests feed into signing bytes |
| → leads to | W13 | [Content-addressable store](../w13/part.md) — CAS uses signatures for author verification |
| → leads to | W14 | [Merkle tree](../w14/part.md) — tree leaves are signed to prove authorship |
| → leads to | W17 | [Credential issuance](../w17/part.md) — credentials are signed documents |
| → leads to | W19 | [Trust bundles](../w19/part.md) — bundles package multiple signatures together |

## Roadmap

| Step | Lesson | What you deliver |
|------|--------|-----------------|
| 0/7 | — | Read this page. Understand the theme. |
| 1/7 | [Keypair Basics](lessons/01-keypair-basics.md) | An `ed25519_keygen()` function that produces a keypair and writes PEM files |
| 2/7 | [Sign & Verify](lessons/02-sign-verify.md) | A `sign()` and `verify()` pair using [EVP_DigestSign](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) / [EVP_DigestVerify](https://www.openssl.org/docs/man3.0/man3/EVP_DigestVerify.html) |
| 3/7 | [Canonical Signing Bytes](lessons/03-canonical-signing-bytes.md) | A `signing_bytes()` function that builds a deterministic byte buffer from structured fields |
| 4/7 | [Replay Protection](lessons/04-replay-protection.md) | A `nonce_store` that rejects any [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) seen before |
| 5/7 | [Envelope Format](lessons/05-envelope-format.md) | An `envelope` struct that bundles header, payload, nonce, and signature |
| 6/7 | [Regression Harness](lessons/06-regression-harness.md) | A harness that tests every function against known vectors and edge cases |
| 7/7 | [Quest](quest.md) | Boss fight — full signing pipeline from keypair to verified envelope |

## Lessons

1. [Keypair Basics](lessons/01-keypair-basics.md)
2. [Sign & Verify](lessons/02-sign-verify.md)
3. [Canonical Signing Bytes](lessons/03-canonical-signing-bytes.md)
4. [Replay Protection](lessons/04-replay-protection.md)
5. [Envelope Format](lessons/05-envelope-format.md)
6. [Regression Harness](lessons/06-regression-harness.md)

## Quest

[W08 Quest – Signing Toolkit Pipeline](quest.md)

## Quiz

[W08 Quiz](quiz.md)
