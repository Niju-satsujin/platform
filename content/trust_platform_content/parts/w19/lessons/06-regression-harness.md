---
id: w19-l06
title: "Regression Harness"
order: 6
type: lesson
duration_min: 35
---

# Regression Harness

## Goal

Build a test harness that exercises the full [trust bundle](01-bundle-spec.md) lifecycle — [serialize](01-bundle-spec.md), [distribute keys](02-key-distribution.md), [package proofs](03-proof-packaging.md), [verify offline](04-offline-flow.md), and [rotate keys](05-expiry-rotation.md) — against a fixed set of [test vectors](https://en.wikipedia.org/wiki/Test_vector) so you catch regressions before they ship.

## What you build

A single test program that:

1. Loads [test vectors](https://en.wikipedia.org/wiki/Test_vector) from a [JSON](https://en.wikipedia.org/wiki/JSON) file. Each vector specifies: bundle bytes ([hex](https://en.wikipedia.org/wiki/Hexadecimal)-encoded), [key ring](02-key-distribution.md) entries, a simulated timestamp for "now", and the expected `enum verify_result`.
2. For each vector, calls `bundle_verify()` from [L04](04-offline-flow.md) and compares the actual result to the expected result.
3. Reports a per-vector pass/fail and a summary line.
4. Exits with code `0` only if every vector passes.

## Why it matters

You built five modules across [L01](01-bundle-spec.md)–[L05](05-expiry-rotation.md). Any change to one module can silently break another. A [regression test](https://en.wikipedia.org/wiki/Regression_testing) suite with fixed inputs and fixed expected outputs catches this. The test vectors act as a contract: as long as they pass, the system behaves the same. [Sigstore](https://github.com/sigstore/protobuf-specs) and [TUF](https://theupdateframework.io/spec/) both maintain conformance test suites for this exact reason.

---

## Training Session

### Warmup

List every failure mode from [L04](04-offline-flow.md)'s `enum verify_result`. For each one, describe the smallest possible test vector that triggers it — just the fields that matter and what makes them wrong.

### Work

#### Do

1. Create `w19/test_vectors.json`.
2. Add at least 10 test vectors:
   - `valid-basic` — a correctly formed bundle. Expected: `VERIFY_OK`.
   - `expired-bundle` — `expires_at` in the past. Expected: `VERIFY_ERR_EXPIRED`.
   - `unknown-key` — [key ID](https://en.wikipedia.org/wiki/Key_identifier) not in the ring. Expected: `VERIFY_ERR_KEY_UNKNOWN`.
   - `expired-key` — key outside validity window at `created_at`. Expected: `VERIFY_ERR_KEY_EXPIRED`.
   - `bad-signature` — one signature byte flipped. Expected: `VERIFY_ERR_SIGNATURE`.
   - `bad-proof` — one sibling hash byte flipped. Expected: `VERIFY_ERR_PROOF`.
   - `anchor-mismatch` — proof root differs from checkpoint root. Expected: `VERIFY_ERR_ANCHOR`.
   - `rotated-key-valid` — bundle signed by old key, verified after rotation, created during overlap. Expected: `VERIFY_OK`.
   - `rotated-key-after-expiry` — bundle signed by old key, but `created_at` is after the old key expired. Expected: `VERIFY_ERR_KEY_EXPIRED`.
   - `truncated-cbor` — [CBOR](https://cbor.io/) bytes cut in half. Expected: `VERIFY_ERR_DESERIALIZE`.
3. Create `w19/regression_harness.c`.
4. Write `load_test_vectors()` — parses `test_vectors.json` into an array of test vector structs.
5. Write `run_test_vector()` — for one vector, decodes the [hex](https://en.wikipedia.org/wiki/Hexadecimal) bundle bytes, builds the [key ring](02-key-distribution.md), calls `bundle_verify()`, and returns pass/fail.
6. Write `main()` — loads vectors, runs each one, prints per-vector results, prints summary, exits `0` or `1`.

#### Test

```bash
gcc -Wall -Wextra -Werror -o regression_harness \
  w19/regression_harness.c w19/offline_verify.c w19/proof_package.c \
  w19/bundle_spec.c w19/key_ring.c -lcbor -lcrypto -ljson-c
./regression_harness w19/test_vectors.json
```

#### Expected

Ten vectors. Each prints `PASS` or `FAIL`. Summary line: `10/10 passed`. Exit code `0`.

### Prove It

Add an 11th vector that you know should fail (e.g., empty bytes). Run again and confirm `11/11 passed`:

```bash
./regression_harness w19/test_vectors.json
```

### Ship It

```bash
git add w19/regression_harness.c w19/test_vectors.json
git commit -m "w19-l06: regression harness with 10+ test vectors"
```

---

## Done when

- The harness loads test vectors from a file — not hard-coded.
- At least 10 vectors covering every `enum verify_result` value.
- Each vector is fully self-contained: bundle bytes, key ring, timestamp, expected result.
- The harness exits `0` only if every vector passes.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Hard-coding test data inside the harness | Vectors [MUST](https://datatracker.ietf.org/doc/html/rfc2119) live in an external file so anyone can add new vectors without changing code. |
| Skipping the "truncated input" vector | Parsers crash on truncated [CBOR](https://cbor.io/) if you never test it. Always include at least one malformed-input vector. |
| Not printing which vector failed | A summary of "1 failed" is useless. Print the vector name and the expected-vs-actual result. |
| Using real wall-clock time | Every vector provides its own `now` timestamp. The harness [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) call `time(NULL)`. |

## Proof

```bash
./regression_harness w19/test_vectors.json
# → [  1/10] valid-basic             expected: VERIFY_OK             actual: VERIFY_OK             PASS
# → [  2/10] expired-bundle          expected: VERIFY_ERR_EXPIRED    actual: VERIFY_ERR_EXPIRED    PASS
# → [  3/10] unknown-key             expected: VERIFY_ERR_KEY_UNKNOWN actual: VERIFY_ERR_KEY_UNKNOWN PASS
# → [  4/10] expired-key             expected: VERIFY_ERR_KEY_EXPIRED actual: VERIFY_ERR_KEY_EXPIRED PASS
# → [  5/10] bad-signature           expected: VERIFY_ERR_SIGNATURE  actual: VERIFY_ERR_SIGNATURE  PASS
# → [  6/10] bad-proof               expected: VERIFY_ERR_PROOF      actual: VERIFY_ERR_PROOF      PASS
# → [  7/10] anchor-mismatch         expected: VERIFY_ERR_ANCHOR     actual: VERIFY_ERR_ANCHOR     PASS
# → [  8/10] rotated-key-valid       expected: VERIFY_OK             actual: VERIFY_OK             PASS
# → [  9/10] rotated-key-after-expiry expected: VERIFY_ERR_KEY_EXPIRED actual: VERIFY_ERR_KEY_EXPIRED PASS
# → [ 10/10] truncated-cbor          expected: VERIFY_ERR_DESERIALIZE actual: VERIFY_ERR_DESERIALIZE PASS
# → SUMMARY: 10/10 passed
echo $?
# → 0
```

## Hero visual

```
  test_vectors.json
  ┌──────────────────────────────────────────┐
  │ { "name": "valid-basic",                 │
  │   "bundle_hex": "a76776...",             │
  │   "key_ring": [ ... ],                   │
  │   "now": 1739180400,                     │
  │   "expected": "VERIFY_OK" }              │
  │ { "name": "expired-bundle", ... }        │
  │ { "name": "bad-signature", ... }         │
  │   ...                                    │
  └──────────────────────────────────────────┘
           │
           ▼  regression_harness
  ┌──────────────────────────────────────────┐
  │ for each vector:                         │
  │   decode hex → bundle bytes              │
  │   build key ring                         │
  │   call bundle_verify(bytes, ring, now)   │
  │   compare actual vs expected             │
  │   print PASS / FAIL                      │
  └──────────────────────────────────────────┘
           │
           ▼
  SUMMARY: 10/10 passed → exit 0
```

## Future Lock

- In [W19 Quest](../quest.md) you will extend this harness to cover the full boss-fight scenario — building, distributing, and verifying bundles end to end.
- In [W20](../../../parts/w20/part.md) you will add [chaos testing](../../../parts/w20/part.md) vectors — random bit flips, network partitions simulated by empty key rings, and clock skew.
- As the project grows, every new feature adds vectors to this file. The harness becomes the system's safety net.
