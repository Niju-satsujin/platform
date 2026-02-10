---
id: w17-l04
title: "Packaging"
order: 4
type: lesson
duration_min: 40
---

# Packaging

## Goal

Build a [credential package](https://www.w3.org/TR/vc-data-model/#presentations-0) that wraps a [verifiable credential](https://www.w3.org/TR/vc-data-model/) with all the metadata a [verifier](https://www.w3.org/TR/vc-data-model/#verifier) needs to check it in one pass — [schema version](https://json-schema.org/), [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) location, and an optional [inclusion proof](../../../parts/w14/part.md).

## What you build

A `packaging` module that creates a `struct credential_package`. The package contains the [verifiable credential](https://www.w3.org/TR/vc-data-model/) from [L02](02-issuance-workflow.md), the [schema version](01-document-schema.md), a [CRL URL](https://en.wikipedia.org/wiki/Certificate_revocation_list) string, an optional [Merkle inclusion proof](../../../parts/w14/part.md) (hash path and tree size), and a format version byte. You write `package_seal()` to build the package and `package_open()` to parse it back into its parts.

## Why it matters

A raw [verifiable credential](https://www.w3.org/TR/vc-data-model/) is not enough. The [verifier](https://www.w3.org/TR/vc-data-model/#verifier) needs to know which [schema](https://json-schema.org/) to validate against, where to fetch the [revocation list](https://en.wikipedia.org/wiki/Certificate_revocation_list), and whether an [inclusion proof](../../../parts/w14/part.md) is available. Without packaging, the verifier must discover this information out of band. The [W3C model](https://www.w3.org/TR/vc-data-model/#presentations-0) calls this a [verifiable presentation](https://www.w3.org/TR/vc-data-model/#presentations-0) — a self-contained envelope that carries everything needed for [verification](https://www.w3.org/TR/vc-data-model/#verification). In [W19](../../../parts/w19/part.md) you will bundle multiple packages into a [trust bundle](../../../parts/w19/part.md).

---

## Training Session

### Warmup

Read [W3C VC Data Model — Presentations](https://www.w3.org/TR/vc-data-model/#presentations-0). Write down:

1. Why a [holder](https://www.w3.org/TR/vc-data-model/#holder) wraps credentials in a [presentation](https://www.w3.org/TR/vc-data-model/#presentations-0) before sending to a [verifier](https://www.w3.org/TR/vc-data-model/#verifier).
2. What metadata the [presentation](https://www.w3.org/TR/vc-data-model/#presentations-0) adds beyond the raw [credential](https://www.w3.org/TR/vc-data-model/).

### Work

#### Do

1. Create `w17/packaging.h`.
2. Define `struct credential_package` with fields:
   - `uint8_t format_version` — set to `1`.
   - `struct verifiable_credential vc` — from [L02](02-issuance-workflow.md).
   - `int schema_version` — copied from the [credential document](01-document-schema.md).
   - `char crl_url[256]` — a [URL](https://en.wikipedia.org/wiki/URL) pointing to the [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) file from [L03](03-revocation-hook.md).
   - `uint8_t inclusion_proof[32 * 32]` — space for up to 32 [hash](https://en.wikipedia.org/wiki/Cryptographic_hash_function) siblings in a [Merkle path](../../../parts/w14/part.md).
   - `int proof_depth` — number of siblings. `0` means no [inclusion proof](../../../parts/w14/part.md) is attached.
   - `uint64_t tree_size` — the [Merkle tree](../../../parts/w14/part.md) size at the time of issuance.
3. Create `w17/packaging.c`.
4. Write `package_seal(struct verifiable_credential *vc, const char *crl_url, uint8_t *proof_hashes, int proof_depth, uint64_t tree_size, struct credential_package *pkg)`:
   - Copy the [verifiable credential](https://www.w3.org/TR/vc-data-model/) into `pkg`.
   - Set `format_version = 1`, `schema_version` from `vc->doc.schema_version`.
   - Copy `crl_url`. Check length — [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) exceed 255 bytes.
   - Copy the [inclusion proof](../../../parts/w14/part.md) hashes if `proof_depth > 0`.
   - Return `0` on success, `-1` on error.
5. Write `package_open(struct credential_package *pkg, struct verifiable_credential *vc, char *crl_url, size_t crl_url_size)`:
   - Validate `format_version == 1`. Return `-1` if not.
   - Copy the [verifiable credential](https://www.w3.org/TR/vc-data-model/) out.
   - Copy the [CRL URL](https://en.wikipedia.org/wiki/Certificate_revocation_list) out.
   - Return `0` on success.
6. Write a `main()` test: issue a [credential (L02)](02-issuance-workflow.md), seal it into a package with a [CRL URL](https://en.wikipedia.org/wiki/Certificate_revocation_list) and a fake [inclusion proof](../../../parts/w14/part.md), open the package, and verify that all fields match.

#### Test

```bash
gcc -Wall -Wextra -o package_test w17/packaging.c w17/issuer.c w17/credential_schema.c -lsodium
./package_test
```

#### Expected

Output shows `package sealed`, `package opened`, `credential_id matches`, `crl_url matches`, `proof_depth matches`.

### Prove It

Run with [AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html):

```bash
gcc -fsanitize=address -Wall -Wextra -o package_test w17/packaging.c w17/issuer.c w17/credential_schema.c -lsodium
./package_test
```

Zero errors.

### Ship It

```bash
git add w17/packaging.h w17/packaging.c
git commit -m "w17-l04: credential packaging with CRL reference and inclusion proof slot"
```

---

## Done when

- `package_seal()` creates a complete [credential package](https://www.w3.org/TR/vc-data-model/#presentations-0).
- `package_open()` extracts the [verifiable credential](https://www.w3.org/TR/vc-data-model/) and metadata.
- A [CRL URL](https://en.wikipedia.org/wiki/Certificate_revocation_list) longer than 255 bytes is rejected.
- An unknown `format_version` is rejected.
- [AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html) reports zero errors.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not checking `crl_url` length before [strcpy](https://en.cppreference.com/w/c/string/byte/strcpy) | Use `strncpy` or check `strlen()` first. A [buffer overflow](https://en.wikipedia.org/wiki/Buffer_overflow) here is a security bug. |
| Omitting `format_version` | The verifier [MUST](https://datatracker.ietf.org/doc/html/rfc2119) know the package format. Without a version byte, future changes break old verifiers. |
| Setting `proof_depth` but not copying the hashes | A non-zero `proof_depth` with empty hashes means the [verifier](https://www.w3.org/TR/vc-data-model/#verifier) tries to verify a [Merkle proof](../../../parts/w14/part.md) from garbage bytes. |
| Hardcoding the [CRL URL](https://en.wikipedia.org/wiki/Certificate_revocation_list) | Different issuers publish [CRLs](https://en.wikipedia.org/wiki/Certificate_revocation_list) at different locations. The URL [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be a parameter. |

## Proof

```bash
./package_test
# → package sealed (format v1, crl=https://example.com/crl, proof_depth=3)
# → package opened
# → credential_id: matches ✓
# → crl_url: matches ✓
# → proof_depth: 3 ✓
```

## Hero visual

```
  credential_package (sealed envelope)
  ┌──────────────────────────────────────────┐
  │ format_version: 1                         │
  │ ┌──────────────────────────────────────┐  │
  │ │ verifiable_credential                 │  │
  │ │  doc: { issuer, subject, claim, ... } │  │
  │ │  signature: Ed25519(...)              │  │
  │ │  public_key: [32 bytes]               │  │
  │ │  credential_id: "abc123..."           │  │
  │ └──────────────────────────────────────┘  │
  │ schema_version: 1                         │
  │ crl_url: "https://example.com/crl"        │
  │ inclusion_proof: [h0, h1, h2]             │
  │ proof_depth: 3                            │
  │ tree_size: 4096                           │
  └──────────────────────────────────────────┘
```

## Future Lock

- In [W17 L05](05-verifier-ux.md) the [verifier](https://www.w3.org/TR/vc-data-model/#verifier) calls `package_open()` as the entry point and then runs [schema](01-document-schema.md), [signature](02-issuance-workflow.md), and [revocation](03-revocation-hook.md) checks using the extracted fields.
- In [W14](../../../parts/w14/part.md) you will verify the `inclusion_proof` against a known [Merkle root](../../../parts/w14/part.md) to prove the credential was recorded in the [transparency log (W15)](../../../parts/w15/part.md).
- In [W19](../../../parts/w19/part.md) [trust bundles](../../../parts/w19/part.md) will collect multiple [credential packages](https://www.w3.org/TR/vc-data-model/#presentations-0) into a single distributable archive.
- In [W13](../../../parts/w13/part.md) the sealed package can be stored in [CAS](../../../parts/w13/part.md) by its [content hash](../../../parts/w13/part.md) for deduplicated retrieval.
