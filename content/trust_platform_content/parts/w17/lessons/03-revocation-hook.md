---
id: w17-l03
title: "Revocation Hook"
order: 3
type: lesson
duration_min: 40
---

# Revocation Hook

## Goal

Build a [revocation](https://en.wikipedia.org/wiki/Certificate_revocation_list) system that lets an [issuer](https://www.w3.org/TR/vc-data-model/#issuer) cancel a [credential](https://www.w3.org/TR/vc-data-model/) after [issuance](02-issuance-workflow.md). A [verifier](https://www.w3.org/TR/vc-data-model/#verifier) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) check [revocation status](https://en.wikipedia.org/wiki/Certificate_revocation_list) before accepting any [credential](https://www.w3.org/TR/vc-data-model/).

## What you build

A `revocation` module that maintains a [Certificate Revocation List (CRL)](https://en.wikipedia.org/wiki/Certificate_revocation_list) — an [append-only](https://en.wikipedia.org/wiki/Append-only) file of revoked `credential_id` values. You write `revocation_revoke()` to add an ID to the list, `revocation_is_revoked()` to check a single ID, and `revocation_load()` to read the list from disk. The [issuer](https://www.w3.org/TR/vc-data-model/#issuer) signs the [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) so verifiers know the list was not tampered with.

## Why it matters

A [credential](https://www.w3.org/TR/vc-data-model/) might be valid at issuance but need cancellation later — the [subject](https://www.w3.org/TR/vc-data-model/#subject) lost their qualification, the [key](https://en.wikipedia.org/wiki/Public-key_cryptography) was compromised, or the claim was issued by mistake. Without [revocation](https://en.wikipedia.org/wiki/Certificate_revocation_list), a signed [credential](https://www.w3.org/TR/vc-data-model/) lives forever. The [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) pattern is the same one used in [X.509 PKI](https://en.wikipedia.org/wiki/X.509) and [Certificate Transparency](https://datatracker.ietf.org/doc/html/rfc6962). It is simple, auditable, and works offline once the list is fetched.

---

## Training Session

### Warmup

Read the [Wikipedia article on Certificate Revocation Lists](https://en.wikipedia.org/wiki/Certificate_revocation_list). Write down:

1. What a [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) contains — a list of revoked [certificate](https://en.wikipedia.org/wiki/Public_key_certificate) serial numbers.
2. Why the [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be signed — to prevent an attacker from removing entries.
3. The difference between a [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) and [OCSP](https://en.wikipedia.org/wiki/Online_Certificate_Status_Protocol) — batch list vs. online query.

### Work

#### Do

1. Create `w17/revocation.h`.
2. Define `struct revocation_entry` with fields: `char credential_id[65]`, `uint64_t revoked_at`, `const char *reason`.
3. Define `struct revocation_list` with fields: `struct revocation_entry *entries`, `size_t count`, `size_t capacity`, `uint8_t signature[64]`, `uint8_t public_key[32]`.
4. Create `w17/revocation.c`.
5. Write `revocation_init(struct revocation_list *rl, size_t capacity)` — allocate the entries array and zero the counters.
6. Write `revocation_revoke(struct revocation_list *rl, const char *credential_id, uint64_t revoked_at, const char *reason)` — append a new entry. Return `-1` if the list is full. The list [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be [append-only](https://en.wikipedia.org/wiki/Append-only) — never remove an entry.
7. Write `revocation_is_revoked(struct revocation_list *rl, const char *credential_id)` — scan the list. Return `1` if found, `0` if not.
8. Write `revocation_save(struct revocation_list *rl, const char *path, uint8_t *private_key)` — serialize the list to a file in [append mode](https://en.cppreference.com/w/c/io/fopen), sign the serialized bytes with [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519), and write the [signature](https://en.wikipedia.org/wiki/Digital_signature) at the end.
9. Write `revocation_load(struct revocation_list *rl, const char *path)` — read the file, verify the [signature](https://en.wikipedia.org/wiki/Digital_signature), and populate the list. Return `-1` if the [signature](https://en.wikipedia.org/wiki/Digital_signature) is invalid.
10. Write a `main()` test: issue two [credentials (L02)](02-issuance-workflow.md), revoke one, check both for [revocation status](https://en.wikipedia.org/wiki/Certificate_revocation_list), save the [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list), reload it, and check again.

#### Test

```bash
gcc -Wall -Wextra -o revoke_test w17/revocation.c w17/issuer.c w17/credential_schema.c -lsodium
./revoke_test
```

#### Expected

Four lines. `cred-A: not revoked`, `cred-B: revoked`, then after reload: `cred-A: not revoked`, `cred-B: revoked`.

### Prove It

Run with [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind --leak-check=full ./revoke_test
```

Zero errors, zero leaks. All allocated memory is freed.

### Ship It

```bash
git add w17/revocation.h w17/revocation.c
git commit -m "w17-l03: revocation list with signed CRL and append-only storage"
```

---

## Done when

- `revocation_revoke()` adds an entry to the [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list).
- `revocation_is_revoked()` returns `1` for a revoked [credential](https://www.w3.org/TR/vc-data-model/) and `0` for a valid one.
- The [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) file is signed. A tampered file is rejected on load.
- The list is [append-only](https://en.wikipedia.org/wiki/Append-only) — once revoked, always revoked.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Allowing removal of entries from the [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) | A [revocation](https://en.wikipedia.org/wiki/Certificate_revocation_list) is permanent. The list [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be [append-only](https://en.wikipedia.org/wiki/Append-only). |
| Not signing the [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) | An unsigned list can be tampered with. An attacker could remove a revoked ID and make a bad [credential](https://www.w3.org/TR/vc-data-model/) look valid. |
| Linear scan on every check | For this lesson, a linear scan is fine. In production, use a [hash set](https://en.wikipedia.org/wiki/Hash_table) or [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter). |
| Not recording a `reason` and `revoked_at` | Auditors need to know when and why a [credential](https://www.w3.org/TR/vc-data-model/) was revoked. Always store both fields. |

## Proof

```bash
./revoke_test
# → cred-A: not revoked
# → cred-B: revoked (reason: key compromised, at 1700000500)
# → [reload from disk]
# → cred-A: not revoked
# → cred-B: revoked (reason: key compromised, at 1700000500)
```

## Hero visual

```
  Issuer                       CRL (append-only)
  ┌────────────────┐          ┌──────────────────────────────────┐
  │ revoke(cred-B) │────────▶ │ entry 0: cred-B | key compromised│
  │                │          │ entry 1: cred-D | expired claim   │
  └────────────────┘          │ ...                               │
                              │ signature: Ed25519(issuer_key)    │
  Verifier                    └──────────────────────────────────┘
  ┌────────────────┐                      │
  │ is_revoked(X)? │◀─────── load + verify signature
  └────────────────┘
```

## Future Lock

- In [W17 L04](04-packaging.md) the [credential package](https://www.w3.org/TR/vc-data-model/#presentations-0) will include a [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) reference so the verifier knows where to fetch the latest list.
- In [W17 L05](05-verifier-ux.md) the [verifier](https://www.w3.org/TR/vc-data-model/#verifier) calls `revocation_is_revoked()` as the final gate before accepting a [credential](https://www.w3.org/TR/vc-data-model/).
- In [W14](../../../parts/w14/part.md) you can build a [Merkle tree](../../../parts/w14/part.md) over the [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) entries so verifiers can get [inclusion proofs](../../../parts/w14/part.md) for individual revocations.
- In [W15](../../../parts/w15/part.md) the [transparency log](../../../parts/w15/part.md) can record [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) updates so revocations are publicly auditable.
