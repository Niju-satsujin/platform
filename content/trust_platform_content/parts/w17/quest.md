---
id: w17-quest
title: "Quest – Full Credential System"
order: 7
type: quest
duration_min: 90
---

# Quest – Full Credential System

## Mission

Build a complete [verifiable credential](https://www.w3.org/TR/vc-data-model/) system. An [issuer](https://www.w3.org/TR/vc-data-model/#issuer) validates a [credential document (L01)](lessons/01-document-schema.md) against a [JSON Schema](https://json-schema.org/), signs it with [Ed25519 (L02)](lessons/02-issuance-workflow.md), publishes a [revocation list (L03)](lessons/03-revocation-hook.md), and seals the [credential package (L04)](lessons/04-packaging.md). A [verifier (L05)](lessons/05-verifier-ux.md) opens the package and runs all four checks. The full [regression harness (L06)](lessons/06-regression-harness.md) passes every scenario.

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | [Schema validation (L01)](lessons/01-document-schema.md) rejects documents with missing or empty fields | Harness scenarios 2 and 3 |
| R2 | [Issuance (L02)](lessons/02-issuance-workflow.md) produces a [verifiable credential](https://www.w3.org/TR/vc-data-model/) with a valid [Ed25519 signature](https://en.wikipedia.org/wiki/EdDSA#Ed25519) | `issuer_verify_signature()` returns `1` for every issued credential |
| R3 | `credential_id` is the [SHA-256](https://en.wikipedia.org/wiki/SHA-2) [hex](https://en.wikipedia.org/wiki/Hexadecimal) digest of the [canonical serialization](https://en.wikipedia.org/wiki/Canonicalization) | Two identical documents produce the same ID; different documents produce different IDs |
| R4 | [Revocation (L03)](lessons/03-revocation-hook.md) is [append-only](https://en.wikipedia.org/wiki/Append-only) — once revoked, always revoked | Attempt to remove an entry fails or is not possible via the API |
| R5 | [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) is [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519)-signed. A tampered [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) file is rejected on load | Flip a byte in the saved file, call `revocation_load()`, get `-1` |
| R6 | [Credential package (L04)](lessons/04-packaging.md) includes [CRL URL](https://en.wikipedia.org/wiki/Certificate_revocation_list), [schema version](https://json-schema.org/), and [inclusion proof](../w14/part.md) slot | `package_open()` extracts all three fields correctly |
| R7 | [Verifier (L05)](lessons/05-verifier-ux.md) runs four checks in order: format → schema → signature → revocation | Harness confirms the failing step number matches the expected step |
| R8 | Full [regression harness (L06)](lessons/06-regression-harness.md) passes: 8/8 scenarios | `./test_harness` prints `8/8 passed` |

## Constraints

- C only. No external [JSON](https://en.wikipedia.org/wiki/JSON) or [credential](https://www.w3.org/TR/vc-data-model/) libraries.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) compile with `gcc -Wall -Wextra -Werror -lsodium`.
- [Schema validation](https://json-schema.org/) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) run before [signing](https://en.wikipedia.org/wiki/Digital_signature).
- [Signature verification](https://en.wikipedia.org/wiki/Digital_signature) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) run before [revocation check](https://en.wikipedia.org/wiki/Certificate_revocation_list).
- The [CRL](https://en.wikipedia.org/wiki/Certificate_revocation_list) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) survive a save-and-reload round-trip.
- All [dynamic memory](https://en.wikipedia.org/wiki/C_dynamic_memory_allocation) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be freed. [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero leaks.

## Bonus challenges

| Bonus | Description |
|-------|-------------|
| B1 | Add a [Merkle inclusion proof](../w14/part.md) check as a fifth [verifier](https://www.w3.org/TR/vc-data-model/#verifier) step — verify the credential hash against a known [Merkle root](../w14/part.md) |
| B2 | Store issued [credentials](https://www.w3.org/TR/vc-data-model/) in [CAS (W13)](../w13/part.md) by `credential_id` and retrieve them by hash |
| B3 | Log every issuance to a local [transparency log (W15)](../w15/part.md) and verify the log entry from the [verifier](https://www.w3.org/TR/vc-data-model/#verifier) |
| B4 | Batch issuance — sign 100 [credentials](https://www.w3.org/TR/vc-data-model/) in a loop, revoke 10, and verify all 100 in the harness |

## Verification

```bash
# Build
gcc -Wall -Wextra -Werror -o credential_system \
  w17/credential_schema.c w17/issuer.c w17/revocation.c \
  w17/packaging.c w17/verifier.c w17/credential_main.c -lsodium

gcc -Wall -Wextra -Werror -o test_harness \
  w17/test_harness.c w17/verifier.c w17/packaging.c \
  w17/revocation.c w17/issuer.c w17/credential_schema.c -lsodium

# R1: schema rejects bad input
./credential_system --validate '{"issuer":"alice","subject":"","claim":"test","issued_at":1700000000,"schema_version":1}'
# → INVALID: subject is empty

# R2 + R3: issue and verify
./credential_system --issue --issuer alice --subject bob --claim "passed W16"
# → issued credential_id: abc123...
# → signature: valid

# R4 + R5: revoke and persist
./credential_system --revoke abc123... --reason "key compromised"
./credential_system --check-revoked abc123...
# → REVOKED (reason: key compromised)

# R5: tamper CRL
cp w17/crl.dat w17/crl_backup.dat
printf '\xff' | dd of=w17/crl.dat bs=1 seek=10 conv=notrunc 2>/dev/null
./credential_system --load-crl w17/crl.dat
# → ERROR: CRL signature invalid
mv w17/crl_backup.dat w17/crl.dat

# R8: full harness
./test_harness
# → 8/8 passed

# Memory safety
valgrind --leak-check=full ./test_harness
# → 0 errors from 0 contexts
```

## Ship

```bash
git add w17/
git commit -m "w17 quest: full verifiable credential system with issuance, revocation, packaging, and verification"
```
