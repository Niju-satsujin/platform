---
id: w08-l06
title: "Regression Harness"
order: 6
type: lesson
duration_min: 50
---

# Regression Harness

## Goal

Build a single test harness that exercises every function from the signing toolkit — [keypair generation](01-keypair-basics.md), [sign/verify](02-sign-verify.md), [canonical signing bytes](03-canonical-signing-bytes.md), [replay protection](04-replay-protection.md), and [envelope format](05-envelope-format.md) — and exits with code 0 only if all tests pass.

## What you build

A C program `test_harness.c` that runs a battery of tests in sequence: keypair round-trip, sign-then-verify, tamper detection, canonical signing byte determinism, nonce uniqueness, replay rejection, envelope seal-verify, envelope serialize-deserialize, and tampered envelope rejection. Each test prints its name and PASS or FAIL. The harness exits with 0 if every test passed, 1 if any test failed. [Valgrind](https://valgrind.org/docs/manual/manual.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) report zero errors and zero leaks.

## Why it matters

Individual unit tests prove each function works alone. A [regression harness](https://en.wikipedia.org/wiki/Regression_testing) proves they work together and that future changes do not break existing behavior. Every professional cryptographic library — [OpenSSL](https://www.openssl.org/), [libsodium](https://doc.libsodium.org/), [ring](https://briansmith.org/rustdoc/ring/) — ships with a regression suite. Your harness is the foundation for the [quest](../quest.md) and for the larger system tests in [W13](../../w13/part.md), [W14](../../w14/part.md), [W17](../../w17/part.md), and [W19](../../w19/part.md).

---

## Training Session

### Warmup — test coverage review

1. List every function you built in L01 through L05:
   - [ed25519_keygen()](01-keypair-basics.md), [keypair_write_pem()](01-keypair-basics.md), [keypair_read_private()](01-keypair-basics.md), [keypair_read_public()](01-keypair-basics.md).
   - [sign_message()](02-sign-verify.md), [verify_message()](02-sign-verify.md).
   - [signing_bytes()](03-canonical-signing-bytes.md).
   - [nonce_generate()](04-replay-protection.md), [nonce_check_and_record()](04-replay-protection.md).
   - [envelope_seal()](05-envelope-format.md), [envelope_verify()](05-envelope-format.md), [envelope_serialize()](05-envelope-format.md), [envelope_deserialize()](05-envelope-format.md).
2. For each function, write down one "happy path" test and one "failure path" test.
3. Review the [W07 regression harness](../../w07/lessons/06-regression-harness.md) for the test pattern.

### Work — building the harness

#### Do

1. Create `w08/test_harness.c`.
2. Define a helper macro or function `TEST(name, expr)` that prints the test name and `PASS` or `FAIL` based on the expression. Increment a failure counter on `FAIL`.
3. Test group 1 — Keypair:
   - Generate a keypair. Check it is non-NULL.
   - Write to [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) files. Check return is 0.
   - Read private key back. Check non-NULL.
   - Read public key back. Check non-NULL.
4. Test group 2 — Sign/Verify:
   - Sign a test message with the [private key](https://en.wikipedia.org/wiki/Public-key_cryptography). Check return is 0 and [signature](https://en.wikipedia.org/wiki/Digital_signature) length is 64.
   - Verify with the matching [public key](https://en.wikipedia.org/wiki/Public-key_cryptography). Check return is 0.
   - Flip one byte of the [signature](https://en.wikipedia.org/wiki/Digital_signature). Verify. Check return is -1.
   - Generate a second keypair. Verify the original [signature](https://en.wikipedia.org/wiki/Digital_signature) with the wrong [public key](https://en.wikipedia.org/wiki/Public-key_cryptography). Check return is -1.
5. Test group 3 — Canonical Signing Bytes:
   - Create two [signing_input](03-canonical-signing-bytes.md) structs with different whitespace in the action.
   - Call [signing_bytes()](03-canonical-signing-bytes.md) on each. Compare with [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html). They [MUST](https://datatracker.ietf.org/doc/html/rfc2119) match.
   - Create two inputs with different actions. Call [signing_bytes()](03-canonical-signing-bytes.md). They [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) match.
6. Test group 4 — Nonce / Replay:
   - Init a [nonce store](04-replay-protection.md). Generate a [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce). Record it — expect 0.
   - Record the same [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) again — expect -1.
   - Generate a new [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce). Record it — expect 0.
   - Free the store.
7. Test group 5 — Envelope:
   - Fill and seal an [envelope](05-envelope-format.md). Check return is 0.
   - Verify the envelope. Check return is 0.
   - Serialize the envelope to a buffer. Check return is 0.
   - Deserialize the buffer into a new envelope. Check return is 0.
   - Verify the deserialized envelope. Check return is 0.
   - Tamper with one byte of the deserialized payload. Verify. Check return is -1.
8. At the end of `main()`:
   - Print the total number of tests and how many passed.
   - If any test failed, print `SOME TESTS FAILED` and return 1.
   - Otherwise print `ALL PASSED` and return 0.
9. Free all [EVP_PKEY](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html) pointers and [nonce stores](04-replay-protection.md).

#### Test

```bash
gcc -Wall -Wextra -Werror -o test_harness \
  w07/canonical.c w08/keypair.c w08/sign.c w08/signing_bytes.c \
  w08/nonce.c w08/envelope.c w08/test_harness.c -lcrypto
./test_harness
echo "Exit: $?"
```

#### Expected

Every test line prints `PASS`. The final line prints `ALL PASSED`. Exit code is 0.

### Prove — Valgrind clean

1. Run the harness under [Valgrind](https://valgrind.org/docs/manual/manual.html): `valgrind --leak-check=full ./test_harness`.
2. Confirm zero errors and zero leaks.
3. If [Valgrind](https://valgrind.org/docs/manual/manual.html) reports leaks, find the missing [EVP_PKEY_free()](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html), [EVP_MD_CTX_free()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html), or [free()](https://man7.org/linux/man-pages/man3/free.3.html) call and fix it.

### Ship — commit your work

```bash
git add w08/test_harness.c
git commit -m "w08-l06: full regression harness for signing toolkit"
```

---

## Done when

- [ ] The harness tests keypair, sign/verify, canonical signing bytes, nonce/replay, and envelope.
- [ ] Each test prints its name and PASS or FAIL.
- [ ] The harness exits 0 when all tests pass, 1 when any test fails.
- [ ] [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.
- [ ] Compiles with `-Wall -Wextra -Werror -lcrypto`.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not freeing keys between test groups | Every [EVP_PKEY](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html) created in a test [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be freed before the harness exits. |
| Continuing after a test failure without recording it | Always increment the failure counter. The harness [MUST](https://datatracker.ietf.org/doc/html/rfc2119) report the correct total. |
| Hardcoding file paths that conflict between tests | Use unique file names per test or clean up [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) files between groups. |
| Forgetting to free the [nonce store](04-replay-protection.md) | Call `nonce_store_free()` before returning. |

## Proof

```bash
./test_harness
# → [keypair] keygen:           PASS
# → [keypair] write PEM:        PASS
# → [keypair] read private:     PASS
# → [keypair] read public:      PASS
# → [sign] sign message:        PASS
# → [sign] verify valid:        PASS
# → [sign] verify tampered:     PASS
# → [sign] verify wrong key:    PASS
# → [sigbytes] same input:      PASS
# → [sigbytes] diff input:      PASS
# → [nonce] first record:       PASS
# → [nonce] replay detect:      PASS
# → [nonce] new nonce:          PASS
# → [envelope] seal:            PASS
# → [envelope] verify:          PASS
# → [envelope] serialize:       PASS
# → [envelope] deserialize:     PASS
# → [envelope] round-trip:      PASS
# → [envelope] tamper detect:   PASS
# → 19/19 passed
# → ALL PASSED
# → Exit: 0

valgrind --leak-check=full ./test_harness
# → ERROR SUMMARY: 0 errors from 0 contexts
# → All heap blocks were freed -- no leaks are possible
```

## 🖼️ Hero Visual

```
  test_harness
  ┌────────────────────────────────────┐
  │ Group 1: Keypair (4 tests)         │
  │ Group 2: Sign/Verify (4 tests)     │
  │ Group 3: Signing Bytes (2 tests)   │
  │ Group 4: Nonce/Replay (3 tests)    │
  │ Group 5: Envelope (6 tests)        │
  ├────────────────────────────────────┤
  │ Total: 19 tests                    │
  │ Exit: 0 (all passed)              │
  │ Valgrind: 0 errors, 0 leaks       │
  └────────────────────────────────────┘
```

## 🔮 Future Lock

- In the [W08 Quest](../quest.md) you will run this harness as part of the boss fight — it [MUST](https://datatracker.ietf.org/doc/html/rfc2119) pass with zero failures.
- In [W13](../../w13/part.md) the [content-addressable store](../../w13/part.md) harness will import and extend these tests to verify signed content storage.
- In [W14](../../w14/part.md) the [Merkle tree](../../w14/part.md) harness will test that signed leaves verify correctly within the tree.
- In [W17](../../w17/part.md) the [credential issuance](../../w17/part.md) harness will test the full credential lifecycle using your signing toolkit.
- In [W19](../../w19/part.md) the [trust bundle](../../w19/part.md) harness will test cross-issuer verification.
