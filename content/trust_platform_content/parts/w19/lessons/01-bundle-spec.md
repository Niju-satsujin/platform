---
id: w19-l01
title: "Bundle Spec"
order: 1
type: lesson
duration_min: 45
---

# Bundle Spec

## Goal

Define the exact fields a [trust bundle](https://github.com/sigstore/protobuf-specs) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) contain so that any [verifier](https://www.w3.org/TR/vc-data-model/#dfn-verifier) can check a [credential](../../../parts/w17/part.md) without making a single network call.

## What you build

A [CBOR](https://cbor.io/)-encoded [trust bundle](https://github.com/sigstore/protobuf-specs) schema. The schema lists every required field: the [credential payload](../../../parts/w17/part.md), the [digital signature](../../../parts/w08/part.md), the [Merkle inclusion proof](../../../parts/w14/part.md), the [anchor checkpoint](../../../parts/w18/part.md), the [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) of the issuer, and [metadata](https://en.wikipedia.org/wiki/Metadata) (version, creation time, expiry). You write a function that serializes a bundle to [CBOR](https://cbor.io/) bytes and a function that deserializes bytes back to a bundle struct.

## Why it matters

Without a clear [specification](https://theupdateframework.io/spec/), every team invents its own format. Fields get forgotten — maybe the [Merkle proof](../../../parts/w14/part.md) is missing, or the [key ID](https://en.wikipedia.org/wiki/Key_identifier) is absent. The [verifier](https://www.w3.org/TR/vc-data-model/#dfn-verifier) then has to call the network to fetch the missing piece, destroying the [offline](https://en.wikipedia.org/wiki/Offline) guarantee. A strict spec enforced at build time prevents this. [Sigstore's bundle format](https://github.com/sigstore/protobuf-specs) and the [TUF specification](https://theupdateframework.io/spec/) both exist because ad-hoc packaging fails in production.

---

## Training Session

### Warmup

Read the "Bundle" message in the [Sigstore protobuf-specs](https://github.com/sigstore/protobuf-specs). Write down every top-level field. Then read section 4.3 of the [TUF specification](https://theupdateframework.io/spec/) and note which metadata fields [TUF](https://theupdateframework.io/spec/) requires on every signed object.

### Work

#### Do

1. Create `w19/bundle_spec.h`.
2. Define a `struct trust_bundle` with these fields:
   - `version` — integer, currently `1`.
   - `created_at` — [Unix timestamp](https://en.wikipedia.org/wiki/Unix_time) of bundle creation.
   - `expires_at` — [Unix timestamp](https://en.wikipedia.org/wiki/Unix_time) after which the bundle [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) be accepted.
   - `credential` — the raw [credential](../../../parts/w17/part.md) bytes.
   - `credential_len` — length of the credential.
   - `signature` — the [digital signature](../../../parts/w08/part.md) over the credential.
   - `signature_len` — length of the signature.
   - `merkle_proof` — serialized [Merkle inclusion proof](../../../parts/w14/part.md).
   - `merkle_proof_len` — length of the proof.
   - `anchor_checkpoint` — the [anchor checkpoint](../../../parts/w18/part.md) bytes.
   - `anchor_checkpoint_len` — length of the checkpoint.
   - `key_id` — identifier of the [signing key](../../../parts/w08/part.md).
   - `public_key` — the issuer's [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) bytes.
   - `public_key_len` — length of the public key.
3. Create `w19/bundle_spec.c`.
4. Write `bundle_serialize()` — takes a `struct trust_bundle *` and writes [CBOR](https://cbor.io/) bytes to an output buffer. Use a [CBOR map](https://cbor.io/) with string keys matching each field name.
5. Write `bundle_deserialize()` — takes [CBOR](https://cbor.io/) bytes and populates a `struct trust_bundle *`. Return an error code if any required field is missing.
6. Write a `main()` test: create a bundle with dummy data, serialize it, deserialize it, and compare every field to the original.

#### Test

```bash
gcc -Wall -Wextra -Werror -o bundle_spec_test w19/bundle_spec.c -lcbor
./bundle_spec_test
```

#### Expected

All fields round-trip without loss. The program prints `PASS: all fields match` and exits with code `0`.

### Prove It

Run the test. Confirm the output. Then hex-dump the serialized bytes and verify you can see the [CBOR](https://cbor.io/) map structure:

```bash
./bundle_spec_test | xxd | head -20
```

### Ship It

```bash
git add w19/bundle_spec.h w19/bundle_spec.c
git commit -m "w19-l01: trust bundle spec with CBOR serialize/deserialize"
```

---

## Done when

- `struct trust_bundle` contains every field listed above — no optional fields.
- `bundle_serialize()` produces valid [CBOR](https://cbor.io/) bytes.
- `bundle_deserialize()` rejects input that is missing any required field.
- Round-trip test passes: serialize then deserialize produces identical data.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Making fields optional | Every field is required. A bundle missing its [Merkle proof](../../../parts/w14/part.md) forces a network call — that breaks [offline verification](lessons/04-offline-flow.md). |
| Forgetting length fields | [CBOR](https://cbor.io/) byte strings need explicit lengths. Without them, deserialize reads past the end. |
| Hard-coding version as a constant instead of a field | The version lives inside the bundle so older verifiers can detect bundles they cannot parse. |
| Skipping expiry | A bundle without `expires_at` is valid forever. That means a stolen [key](../../../parts/w08/part.md) can never be revoked in practice. |

## Proof

```bash
./bundle_spec_test
# → PASS: all fields match
echo $?
# → 0
```

## Hero visual

```
  struct trust_bundle
  ┌──────────────────────────────────────────────┐
  │ version: 1                                   │
  │ created_at: 1739180400                       │
  │ expires_at: 1741858800                       │
  │ credential: [ ... bytes ... ]                │
  │ signature:  [ ... bytes ... ]                │
  │ merkle_proof: [ ... bytes ... ]              │
  │ anchor_checkpoint: [ ... bytes ... ]         │
  │ key_id: "issuer-key-2026-02"                 │
  │ public_key: [ ... bytes ... ]                │
  └──────────────────────────────────────────────┘
           │
           ▼  bundle_serialize()
  ┌──────────────────────────────────────────────┐
  │ CBOR map { "version": 1, "created_at": ..., │
  │            "credential": h'...', ... }       │
  └──────────────────────────────────────────────┘
           │
           ▼  bundle_deserialize()
  ┌──────────────────────────────────────────────┐
  │ struct trust_bundle (identical to original)  │
  └──────────────────────────────────────────────┘
```

## Future Lock

- In [W19 L02](02-key-distribution.md) you will embed [public keys](https://en.wikipedia.org/wiki/Public-key_cryptography) and [trust anchors](../../../parts/w18/part.md) directly into the bundle so the verifier never fetches keys from the network.
- In [W19 L03](03-proof-packaging.md) you will pack real [Merkle proofs](../../../parts/w14/part.md) and [CAS references](../../../parts/w13/part.md) into this bundle format.
- In [W19 L04](04-offline-flow.md) you will write the [offline verifier](04-offline-flow.md) that consumes these bundles.
- In [W20](../../../parts/w20/part.md) you will run [chaos tests](../../../parts/w20/part.md) that corrupt individual bundle fields and confirm the verifier rejects them.
