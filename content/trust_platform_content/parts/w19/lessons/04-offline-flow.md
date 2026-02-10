---
id: w19-l04
title: "Offline Flow"
order: 4
type: lesson
duration_min: 50
---

# Offline Flow

## Goal

Build the complete [offline verification](https://en.wikipedia.org/wiki/Offline) pipeline: receive a [trust bundle](01-bundle-spec.md), unpack it, run every check, and produce a clear accept-or-reject verdict — all without any network call.

## What you build

A `bundle_verify()` function that takes [CBOR](https://cbor.io/) bytes and a local [key ring](02-key-distribution.md) as inputs and returns a [verification result](https://www.w3.org/TR/vc-data-model/#verification). The function runs these steps in order:

1. **Deserialize** — call `bundle_deserialize()` from [L01](01-bundle-spec.md). Reject if any field is missing.
2. **Check expiry** — compare `expires_at` against the current [Unix timestamp](https://en.wikipedia.org/wiki/Unix_time). Reject if the bundle has expired.
3. **Key lookup** — find the [key ID](https://en.wikipedia.org/wiki/Key_identifier) in the local [key ring](02-key-distribution.md). Reject if the key is unknown.
4. **Key validity** — call `key_ring_is_valid()` from [L02](02-key-distribution.md). Reject if the key is outside its validity window.
5. **Signature check** — verify the [digital signature](../../../parts/w08/part.md) over the credential bytes using the [public key](https://en.wikipedia.org/wiki/Public-key_cryptography). Reject if the signature is invalid.
6. **Merkle proof** — call `proof_package_verify()` from [L03](03-proof-packaging.md). Reject if the proof does not recompute to the expected root.
7. **Anchor match** — compare the proof's [root hash](https://en.wikipedia.org/wiki/Merkle_tree) against the [anchor checkpoint](../../../parts/w18/part.md) embedded in the bundle. Reject if they differ.
8. **Accept** — all checks passed; return success.

## Why it matters

Each check from [L01](01-bundle-spec.md) through [L03](03-proof-packaging.md) was built in isolation. This lesson wires them into a single pipeline. The order matters — if you check the [signature](../../../parts/w08/part.md) before looking up the [key](https://en.wikipedia.org/wiki/Public-key_cryptography), you have no key to verify with. If you skip the [anchor](../../../parts/w18/part.md) comparison, a valid proof against a rogue tree passes. Real-world systems like [Sigstore verification](https://github.com/sigstore/protobuf-specs) run exactly this kind of ordered pipeline.

---

## Training Session

### Warmup

List all the reasons a [trust bundle](01-bundle-spec.md) might be rejected. Write each one as a single sentence:

1. Malformed [CBOR](https://cbor.io/) — cannot deserialize.
2. Expired bundle — `expires_at` is in the past.
3. Unknown [key ID](https://en.wikipedia.org/wiki/Key_identifier) — not in local [key ring](02-key-distribution.md).
4. Expired [key](https://en.wikipedia.org/wiki/Public-key_cryptography) — outside validity window.
5. Bad [signature](../../../parts/w08/part.md) — does not match credential bytes.
6. Bad [Merkle proof](../../../parts/w14/part.md) — root hash does not recompute.
7. [Anchor](../../../parts/w18/part.md) mismatch — proof root differs from checkpoint root.

### Work

#### Do

1. Create `w19/offline_verify.h`.
2. Define an `enum verify_result` with values: `VERIFY_OK`, `VERIFY_ERR_DESERIALIZE`, `VERIFY_ERR_EXPIRED`, `VERIFY_ERR_KEY_UNKNOWN`, `VERIFY_ERR_KEY_EXPIRED`, `VERIFY_ERR_SIGNATURE`, `VERIFY_ERR_PROOF`, `VERIFY_ERR_ANCHOR`.
3. Create `w19/offline_verify.c`.
4. Write `bundle_verify()`:
   - Accepts `const uint8_t *bundle_bytes`, `size_t bundle_len`, `const struct key_ring *ring`, and `time_t now`.
   - Runs the 7 checks in the order listed above.
   - Returns the first failing `enum verify_result`, or `VERIFY_OK` if all pass.
5. Write `verify_result_to_string()` — returns a human-readable [null-terminated string](https://en.wikipedia.org/wiki/Null-terminated_string) for each enum value.
6. Write a `main()` test with these scenarios:
   - A valid bundle → `VERIFY_OK`.
   - A bundle with a flipped signature byte → `VERIFY_ERR_SIGNATURE`.
   - A bundle with `expires_at` set to yesterday → `VERIFY_ERR_EXPIRED`.
   - A bundle with an unknown [key ID](https://en.wikipedia.org/wiki/Key_identifier) → `VERIFY_ERR_KEY_UNKNOWN`.
   - A bundle with a corrupted [Merkle proof](../../../parts/w14/part.md) sibling → `VERIFY_ERR_PROOF`.
   - A bundle with a mismatched [anchor checkpoint](../../../parts/w18/part.md) root → `VERIFY_ERR_ANCHOR`.

#### Test

```bash
gcc -Wall -Wextra -Werror -o offline_verify_test \
  w19/offline_verify.c w19/proof_package.c w19/bundle_spec.c w19/key_ring.c \
  -lcbor -lcrypto
./offline_verify_test
```

#### Expected

Six test cases. Each prints the scenario name, the expected result, and the actual result. All six match. Program prints `PASS: 6/6 scenarios` and exits `0`.

### Prove It

Run with [AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html) to confirm no out-of-bounds reads on malformed input:

```bash
gcc -fsanitize=address -Wall -Wextra -Werror -o offline_verify_asan \
  w19/offline_verify.c w19/proof_package.c w19/bundle_spec.c w19/key_ring.c \
  -lcbor -lcrypto
./offline_verify_asan
```

Zero sanitizer errors.

### Ship It

```bash
git add w19/offline_verify.h w19/offline_verify.c
git commit -m "w19-l04: full offline verification pipeline"
```

---

## Done when

- `bundle_verify()` runs all 7 checks in the correct order.
- Each failure mode returns the correct `enum verify_result`.
- All 6 test scenarios pass.
- No network calls anywhere in the verify path.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Checking the [signature](../../../parts/w08/part.md) before resolving the [key](https://en.wikipedia.org/wiki/Public-key_cryptography) | You need the key to check the signature. Look up and validate the key first. |
| Returning a generic "FAIL" instead of a specific error | Each failure mode needs its own code. The caller must know *why* verification failed — not just that it failed. |
| Skipping the [anchor](../../../parts/w18/part.md) comparison | A valid [Merkle proof](../../../parts/w14/part.md) against a rogue tree passes. The anchor root anchors the proof to a publicly committed tree. |
| Using `time(NULL)` inside `bundle_verify()` | Pass `now` as a parameter so tests can control the clock. Hard-coding the system clock makes expiry tests flaky. |

## Proof

```bash
./offline_verify_test
# → scenario: valid bundle         → expected: VERIFY_OK             → actual: VERIFY_OK             PASS
# → scenario: bad signature        → expected: VERIFY_ERR_SIGNATURE  → actual: VERIFY_ERR_SIGNATURE  PASS
# → scenario: expired bundle       → expected: VERIFY_ERR_EXPIRED    → actual: VERIFY_ERR_EXPIRED    PASS
# → scenario: unknown key          → expected: VERIFY_ERR_KEY_UNKNOWN→ actual: VERIFY_ERR_KEY_UNKNOWN PASS
# → scenario: bad Merkle proof     → expected: VERIFY_ERR_PROOF      → actual: VERIFY_ERR_PROOF      PASS
# → scenario: anchor mismatch      → expected: VERIFY_ERR_ANCHOR     → actual: VERIFY_ERR_ANCHOR     PASS
# → PASS: 6/6 scenarios
```

## Hero visual

```
  bundle_verify(bytes, ring, now)
  ┌────────────────────────────────────────────────────────┐
  │ 1. deserialize(bytes)           → ERR_DESERIALIZE?     │
  │ 2. check expires_at vs now      → ERR_EXPIRED?         │
  │ 3. key_ring_lookup(key_id)      → ERR_KEY_UNKNOWN?     │
  │ 4. key_ring_is_valid(key, now)  → ERR_KEY_EXPIRED?     │
  │ 5. verify_signature(cred, sig,  → ERR_SIGNATURE?       │
  │         public_key)                                     │
  │ 6. proof_package_verify(proof)  → ERR_PROOF?           │
  │ 7. compare root vs anchor       → ERR_ANCHOR?          │
  │ 8. ────────────────────────────→ VERIFY_OK ✓           │
  └────────────────────────────────────────────────────────┘
          No network calls. All data from the bundle + local key ring.
```

## Future Lock

- In [W19 L05](05-expiry-rotation.md) you will extend this pipeline to handle [key rotation](https://en.wikipedia.org/wiki/Key_rotation) — when the signing key changes, old bundles still verify if the old key was valid at bundle creation time.
- In [W19 L06](06-regression-harness.md) you will run the full pipeline against a suite of known-good and known-bad bundles.
- In [W20](../../../parts/w20/part.md) you will simulate network failures and confirm the verifier works identically whether the network is up or down.
