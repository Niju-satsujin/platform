---
id: w19-part
title: "Trust Bundles & Offline Verification"
order: 19
type: part
---

# Week 19 – Trust Bundles & Offline Verification

A [trust bundle](https://github.com/sigstore/protobuf-specs) packages all proofs a [verifier](https://www.w3.org/TR/vc-data-model/#dfn-verifier) needs so [verification](https://www.w3.org/TR/vc-data-model/#verification) works [offline](https://en.wikipedia.org/wiki/Offline), with no network calls.

## Hero visual

```
  Issuer / Log                         Bundle Builder                        Offline Verifier
     │                                      │                                      │
     │── credential ───────────────────────▶│                                      │
     │── Merkle inclusion proof ──────────▶│                                      │
     │── anchor checkpoint ───────────────▶│                                      │
     │── signing key + expiry ────────────▶│                                      │
     │                                      │                                      │
     │                                      │── pack into CBOR bundle ──────┐      │
     │                                      │◀─────────────────────────────┘      │
     │                                      │                                      │
     │                                      │── distribute bundle ────────────────▶│
     │                                      │                                      │
     │                                      │                             unpack bundle
     │                                      │                             verify signature
     │                                      │                             verify Merkle proof
     │                                      │                             check key expiry
     │                                      │                             ✓ trusted offline
```

## What you build

A [trust bundle](https://github.com/sigstore/protobuf-specs) system that:

1. Defines a strict [bundle specification](lessons/01-bundle-spec.md) — listing every field a verifier needs, encoded in [CBOR](https://cbor.io/).
2. Handles [key distribution](lessons/02-key-distribution.md) — embedding [public keys](../w08/part.md) and [trust anchors](../w18/part.md) so the verifier never fetches them at runtime.
3. Packages [Merkle inclusion proofs](lessons/03-proof-packaging.md) from the [transparency log (W14)](../w14/part.md) alongside the [credential (W17)](../w17/part.md) into a single portable artifact.
4. Implements the full [offline verification flow](lessons/04-offline-flow.md) — unpack, check [signature](../w08/part.md), replay [Merkle proof](../w14/part.md), validate [anchor](../w18/part.md), accept or reject.
5. Enforces [key expiry and rotation](lessons/05-expiry-rotation.md) — expired keys reject bundles, and rotation adds new keys without breaking old bundles still within their validity window.
6. Runs a [regression harness](lessons/06-regression-harness.md) that tests the full bundle lifecycle against known test vectors.

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W08 | [Signatures](../w08/part.md) – signing keys that protect bundle integrity |
| ← builds on | W13 | [CAS](../w13/part.md) – content-addressed blob references inside the bundle |
| ← builds on | W14 | [Merkle trees](../w14/part.md) – inclusion proofs packaged into the bundle |
| ← builds on | W17 | [Verifiable credentials](../w17/part.md) – the credentials being bundled |
| ← builds on | W18 | [Anchoring](../w18/part.md) – anchor checkpoints included in bundles |
| → leads to | W20 | [Chaos testing](../w20/part.md) – offline scenarios stress-tested under failure |

## Lessons

1. [Bundle Spec](lessons/01-bundle-spec.md)
2. [Key Distribution](lessons/02-key-distribution.md)
3. [Proof Packaging](lessons/03-proof-packaging.md)
4. [Offline Flow](lessons/04-offline-flow.md)
5. [Expiry & Rotation](lessons/05-expiry-rotation.md)
6. [Regression Harness](lessons/06-regression-harness.md)

## Quest

[W19 Quest – Full Offline Trust Bundle Verifier](quest.md)

## Quiz

[W19 Quiz](quiz.md)
