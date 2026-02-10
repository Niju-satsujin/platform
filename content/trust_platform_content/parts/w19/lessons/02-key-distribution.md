---
id: w19-l02
title: "Key Distribution"
order: 2
type: lesson
duration_min: 40
---

# Key Distribution

## Goal

Embed [public keys](https://en.wikipedia.org/wiki/Public-key_cryptography) and [trust anchor](../../../parts/w18/part.md) material into the [trust bundle](lessons/01-bundle-spec.md) so the [verifier](https://www.w3.org/TR/vc-data-model/#dfn-verifier) never needs to call the network to fetch a key.

## What you build

A [key ring](https://en.wikipedia.org/wiki/Keyring_(cryptography)) module that stores a set of trusted [public keys](https://en.wikipedia.org/wiki/Public-key_cryptography) indexed by [key ID](https://en.wikipedia.org/wiki/Key_identifier). The [bundle builder](01-bundle-spec.md) looks up the current signing key, embeds it in the bundle, and records which [key ID](https://en.wikipedia.org/wiki/Key_identifier) was used. The [offline verifier](04-offline-flow.md) loads its own copy of the [key ring](https://en.wikipedia.org/wiki/Keyring_(cryptography)) from a local file — not from a server — and uses it to validate the [signature](../../../parts/w08/part.md) inside the bundle.

## Why it matters

[Offline verification](https://en.wikipedia.org/wiki/Offline) only works if the verifier already has the right [public key](https://en.wikipedia.org/wiki/Public-key_cryptography). If the key is not in the bundle and not in the local [key ring](https://en.wikipedia.org/wiki/Keyring_(cryptography)), verification fails or — worse — the verifier silently skips the check. The [TUF specification](https://theupdateframework.io/spec/) solves this with [root metadata](https://theupdateframework.io/spec/) that lists every trusted key. You follow the same idea: distribute keys ahead of time, embed them in bundles, and verify against the local ring.

---

## Training Session

### Warmup

Read section 4.3 ("The Root Role") of the [TUF specification](https://theupdateframework.io/spec/). Write down:

1. How [TUF](https://theupdateframework.io/spec/) lists trusted keys in [root metadata](https://theupdateframework.io/spec/).
2. How a client decides whether to trust a key it has never seen before.

### Work

#### Do

1. Create `w19/key_ring.h`.
2. Define `struct key_entry` with:
   - `key_id` — a [null-terminated](https://en.wikipedia.org/wiki/Null-terminated_string) string identifier.
   - `public_key` — raw [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) bytes.
   - `public_key_len` — length.
   - `valid_from` — [Unix timestamp](https://en.wikipedia.org/wiki/Unix_time) when this key becomes active.
   - `valid_until` — [Unix timestamp](https://en.wikipedia.org/wiki/Unix_time) when this key expires.
3. Define `struct key_ring` with an array of `struct key_entry` and a `count`.
4. Create `w19/key_ring.c`.
5. Write `key_ring_load()` — reads a [CBOR](https://cbor.io/)-encoded key ring file from disk into a `struct key_ring`.
6. Write `key_ring_save()` — writes a `struct key_ring` to disk as [CBOR](https://cbor.io/).
7. Write `key_ring_lookup()` — given a [key ID](https://en.wikipedia.org/wiki/Key_identifier), returns the matching `struct key_entry *` or `NULL`.
8. Write `key_ring_is_valid()` — given a `struct key_entry *` and a [Unix timestamp](https://en.wikipedia.org/wiki/Unix_time), returns `1` if the key is within its validity window, `0` otherwise.
9. Update `bundle_serialize()` from [L01](01-bundle-spec.md) to call `key_ring_lookup()` and embed the [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) bytes and [key ID](https://en.wikipedia.org/wiki/Key_identifier) into the bundle.
10. Write a `main()` test: create a key ring with two keys, save it, load it back, look up each key by [key ID](https://en.wikipedia.org/wiki/Key_identifier), and confirm validity checks work for past, present, and future timestamps.

#### Test

```bash
gcc -Wall -Wextra -Werror -o key_ring_test w19/key_ring.c w19/bundle_spec.c -lcbor
./key_ring_test
```

#### Expected

Lookup returns the correct key for each [key ID](https://en.wikipedia.org/wiki/Key_identifier). Validity check returns `1` for a current timestamp and `0` for an expired or not-yet-active timestamp. Program prints `PASS` and exits `0`.

### Prove It

Hex-dump the saved key ring file and confirm you see two [CBOR](https://cbor.io/) entries:

```bash
xxd w19/test_keyring.cbor | head -20
```

### Ship It

```bash
git add w19/key_ring.h w19/key_ring.c
git commit -m "w19-l02: key ring with CBOR persistence and validity window"
```

---

## Done when

- `key_ring_load()` and `key_ring_save()` round-trip without data loss.
- `key_ring_lookup()` returns the correct key or `NULL` for unknown IDs.
- `key_ring_is_valid()` correctly rejects expired and not-yet-active keys.
- The [bundle builder](01-bundle-spec.md) embeds the key automatically during serialization.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Distributing keys by fetching from a server at verify time | That is an online call. The whole point of the [trust bundle](01-bundle-spec.md) is [offline verification](04-offline-flow.md). Distribute keys ahead of time. |
| Trusting any key found inside the bundle without cross-checking | The verifier [MUST](https://datatracker.ietf.org/doc/html/rfc2119) check the embedded key against its local [key ring](https://en.wikipedia.org/wiki/Keyring_(cryptography)). A bundle can contain a forged key. |
| Ignoring the validity window | A key that expired yesterday [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) verify a bundle created today. Always check `valid_from` and `valid_until`. |
| Using key bytes as the identifier | Key bytes can be long and awkward. Use a short [key ID](https://en.wikipedia.org/wiki/Key_identifier) — a [hash](../../../parts/w13/part.md) of the public key works well. |

## Proof

```bash
./key_ring_test
# → PASS: key lookup and validity checks
echo $?
# → 0
```

## Hero visual

```
  Key Ring (local file)
  ┌─────────────────────────────────────────────┐
  │ key_id: "issuer-2026-01"                    │
  │ public_key: [ ... 32 bytes ... ]            │
  │ valid_from: 2026-01-01  valid_until: 2026-07│
  ├─────────────────────────────────────────────┤
  │ key_id: "issuer-2026-02"                    │
  │ public_key: [ ... 32 bytes ... ]            │
  │ valid_from: 2026-06-01  valid_until: 2026-12│
  └─────────────────────────────────────────────┘
           │
           │  key_ring_lookup("issuer-2026-02")
           ▼
  ┌─────────────────────────────────────────────┐
  │ Embed in trust bundle → signature verified  │
  │ against this key at verify time             │
  └─────────────────────────────────────────────┘
```

## Future Lock

- In [W19 L03](03-proof-packaging.md) you will package the [Merkle proof](../../../parts/w14/part.md) alongside the key-bearing bundle.
- In [W19 L05](05-expiry-rotation.md) you will handle [key rotation](https://en.wikipedia.org/wiki/Key_rotation) — adding new keys to the ring without invalidating bundles signed by the old key while it was still valid.
- In [W20](../../../parts/w20/part.md) you will test what happens when a verifier's [key ring](https://en.wikipedia.org/wiki/Keyring_(cryptography)) is stale and does not contain the signing key.
