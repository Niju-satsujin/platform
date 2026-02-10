---
id: w19-quest
title: "Quest – Full Offline Trust Bundle Verifier"
order: 7
type: quest
duration_min: 90
---

# Quest – Full Offline Trust Bundle Verifier

## Mission

Build a complete [offline verification](https://en.wikipedia.org/wiki/Offline) system. An issuer creates a [credential](../../../parts/w17/part.md), signs it, logs it in a [Merkle tree](../../../parts/w14/part.md), [anchors](../../../parts/w18/part.md) the tree, and packages everything into a [trust bundle](lessons/01-bundle-spec.md). A verifier receives the bundle with no network access and runs the full verification pipeline. The system handles [key rotation](lessons/05-expiry-rotation.md) and rejects every class of invalid bundle.

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | [Bundle spec (L01)](lessons/01-bundle-spec.md): all required fields present, [CBOR](https://cbor.io/)-encoded, round-trip serialize/deserialize | `./quest_test --check=roundtrip` passes |
| R2 | [Key distribution (L02)](lessons/02-key-distribution.md): [key ring](lessons/02-key-distribution.md) loaded from local file, lookup by [key ID](https://en.wikipedia.org/wiki/Key_identifier) works | `./quest_test --check=keyring` passes |
| R3 | [Proof packaging (L03)](lessons/03-proof-packaging.md): [Merkle inclusion proof](../../../parts/w14/part.md) serialized inside bundle, verifies against [root hash](https://en.wikipedia.org/wiki/Merkle_tree) | `./quest_test --check=proof` passes |
| R4 | [Offline flow (L04)](lessons/04-offline-flow.md): `bundle_verify()` runs all 7 checks, returns correct `enum verify_result` for each failure mode | `./quest_test --check=verify` passes with 6+ scenarios |
| R5 | [Expiry & rotation (L05)](lessons/05-expiry-rotation.md): old key verifies bundles created during its validity window; expired key rejects bundles created after expiry | `./quest_test --check=rotation` passes with 4 scenarios |
| R6 | [Regression harness (L06)](lessons/06-regression-harness.md): 10+ test vectors loaded from file, all pass | `./regression_harness w19/test_vectors.json` exits `0` |
| R7 | No network calls in the verify path | `strace -e connect ./quest_test --check=verify` shows zero [connect()](https://man7.org/linux/man-pages/man2/connect.2.html) calls |
| R8 | End-to-end: build a bundle from scratch (create credential, sign, build tree, generate proof, anchor, package, serialize) and verify it offline | `./quest_test --check=e2e` passes |

## Constraints

- C only. No external verification libraries.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) compile with `gcc -Wall -Wextra -Werror`.
- All [CBOR](https://cbor.io/) encoding uses a single library — no mixing formats.
- Every `malloc()` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a matching `free()`. Run under [Valgrind](https://valgrind.org/docs/manual/manual.html) with zero leaks.
- The verifier [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) open any [socket](https://man7.org/linux/man-pages/man2/socket.2.html) or call any network function.
- Test vectors [MUST](https://datatracker.ietf.org/doc/html/rfc2119) live in an external file, not hard-coded.

## Bonus challenges

| Bonus | Description |
|-------|-------------|
| B1 | Add a `bundle_to_json()` function that pretty-prints the bundle as human-readable [JSON](https://en.wikipedia.org/wiki/JSON) for debugging |
| B2 | Support [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) and [ECDSA P-256](https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm) signatures in the same bundle format — the verifier picks the algorithm based on the [key ID](https://en.wikipedia.org/wiki/Key_identifier) |
| B3 | Add a `--batch` mode that verifies multiple bundles from a directory and reports a summary |
| B4 | Implement [COSE Sign1](https://datatracker.ietf.org/doc/html/rfc8152) wrapping around the bundle instead of a raw [signature](../../../parts/w08/part.md) |

## Verification

```bash
# Build
gcc -Wall -Wextra -Werror -o quest_test \
  w19/quest_test.c w19/offline_verify.c w19/proof_package.c \
  w19/bundle_spec.c w19/key_ring.c -lcbor -lcrypto -ljson-c

# R1: round-trip
./quest_test --check=roundtrip
# → PASS: bundle round-trip

# R2: key ring
./quest_test --check=keyring
# → PASS: key ring lookup

# R3: proof
./quest_test --check=proof
# → PASS: Merkle proof in bundle

# R4: verify pipeline
./quest_test --check=verify
# → PASS: 6/6 verification scenarios

# R5: rotation
./quest_test --check=rotation
# → PASS: 4/4 rotation scenarios

# R6: regression harness
./regression_harness w19/test_vectors.json
# → SUMMARY: 10/10 passed

# R7: no network calls
strace -e connect ./quest_test --check=verify 2>&1 | grep -c connect
# → 0

# R8: end-to-end
./quest_test --check=e2e
# → PASS: end-to-end bundle build and offline verify

# Memory check
valgrind --leak-check=full ./quest_test --check=e2e
# → All heap blocks were freed -- no leaks are possible
```

## Ship

```bash
git add w19/
git commit -m "w19 quest: full offline trust bundle verifier"
```
