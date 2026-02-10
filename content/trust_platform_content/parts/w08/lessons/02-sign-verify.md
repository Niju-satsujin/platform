---
id: w08-l02
title: "Sign & Verify"
order: 2
type: lesson
duration_min: 40
---

# Sign & Verify

## Goal

Sign a message with an [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) [private key](https://en.wikipedia.org/wiki/Public-key_cryptography) using [EVP_DigestSign](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) and verify the [signature](https://en.wikipedia.org/wiki/Digital_signature) with the matching [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) using [EVP_DigestVerify](https://www.openssl.org/docs/man3.0/man3/EVP_DigestVerify.html).

## What you build

Two C functions: `sign_message()` takes a [private key](https://en.wikipedia.org/wiki/Public-key_cryptography) and a message and returns a 64-byte [Ed25519 signature](https://en.wikipedia.org/wiki/EdDSA#Ed25519). `verify_message()` takes a [public key](https://en.wikipedia.org/wiki/Public-key_cryptography), the message, and the [signature](https://en.wikipedia.org/wiki/Digital_signature), and returns 0 if valid or -1 if invalid. A test program signs a known message, verifies it, then flips one [signature](https://en.wikipedia.org/wiki/Digital_signature) byte and confirms verification fails.

## Why it matters

Signing is the act that binds identity to data. Without it, anyone can claim to have written anything. [EVP_DigestSign](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) is the [OpenSSL](https://www.openssl.org/) way to sign with any algorithm, including [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519). Learning the correct API pattern — init, sign, verify — is essential because you will reuse it in [envelopes (L05)](05-envelope-format.md), [Merkle leaf signing (W14)](../../w14/part.md), and [credential issuance (W17)](../../w17/part.md).

---

## Training Session

### Warmup — the sign/verify contract

1. Read the [EVP_DigestSign](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) man page. Note the two-call pattern: first call with `NULL` signature buffer to get the length, second call to fill the buffer.
2. Read the [EVP_DigestVerify](https://www.openssl.org/docs/man3.0/man3/EVP_DigestVerify.html) man page. Note it returns 1 for valid, 0 for invalid, and a negative value on error.
3. Write down: why does [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) not need a separate [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function) step? (Answer: [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) hashes internally as defined by [RFC 8032](https://datatracker.ietf.org/doc/html/rfc8032).)

### Work — building sign and verify

#### Do

1. Create `w08/sign.h`. Declare:
   - `int sign_message(EVP_PKEY *priv, const unsigned char *msg, size_t msg_len, unsigned char *sig, size_t *sig_len)`.
   - `int verify_message(EVP_PKEY *pub, const unsigned char *msg, size_t msg_len, const unsigned char *sig, size_t sig_len)`.
2. Create `w08/sign.c`.
3. In `sign_message()`:
   - Create an [EVP_MD_CTX](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) with [EVP_MD_CTX_new()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html).
   - Call [EVP_DigestSignInit()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) with `NULL` for the digest (Ed25519 handles it internally).
   - Call [EVP_DigestSign()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) once with `sig` set to `NULL` to get the required length.
   - Call [EVP_DigestSign()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) again with the actual buffer to produce the [signature](https://en.wikipedia.org/wiki/Digital_signature).
   - Free the context with [EVP_MD_CTX_free()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html).
   - Return 0 on success, -1 on failure.
4. In `verify_message()`:
   - Create an [EVP_MD_CTX](https://www.openssl.org/docs/man3.0/man3/EVP_DigestVerify.html) with [EVP_MD_CTX_new()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestVerify.html).
   - Call [EVP_DigestVerifyInit()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestVerify.html) with `NULL` for the digest.
   - Call [EVP_DigestVerify()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestVerify.html) with the message and [signature](https://en.wikipedia.org/wiki/Digital_signature).
   - Free the context.
   - Return 0 if [EVP_DigestVerify](https://www.openssl.org/docs/man3.0/man3/EVP_DigestVerify.html) returned 1, -1 otherwise.
5. Create `w08/test_sign.c`. In `main()`:
   - Generate a keypair with [ed25519_keygen()](01-keypair-basics.md).
   - Define a test message: `"hello trust system"`.
   - Sign the message with `sign_message()`.
   - Verify the [signature](https://en.wikipedia.org/wiki/Digital_signature) with `verify_message()`. Print PASS or FAIL.
   - Flip one byte of the [signature](https://en.wikipedia.org/wiki/Digital_signature). Verify again — it [MUST](https://datatracker.ietf.org/doc/html/rfc2119) fail. Print PASS or FAIL.
   - Free the keypair.

#### Test

```bash
gcc -Wall -Wextra -Werror -o test_sign \
  w08/keypair.c w08/sign.c w08/test_sign.c -lcrypto
./test_sign
```

#### Expected

First verify prints `verify: PASS`. After flipping a byte, second verify prints `tampered verify: FAIL — signature invalid`. Both results confirm the [sign/verify](https://en.wikipedia.org/wiki/Digital_signature) contract works.

### Prove — wrong key rejection

1. Generate a second keypair.
2. Sign a message with the first [private key](https://en.wikipedia.org/wiki/Public-key_cryptography).
3. Verify with the second [public key](https://en.wikipedia.org/wiki/Public-key_cryptography). It [MUST](https://datatracker.ietf.org/doc/html/rfc2119) fail.
4. This proves that only the matching [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) can verify a [signature](https://en.wikipedia.org/wiki/Digital_signature).

### Ship — commit your work

```bash
git add w08/sign.h w08/sign.c w08/test_sign.c
git commit -m "w08-l02: Ed25519 sign and verify with EVP API"
```

---

## Done when

- [ ] `sign_message()` produces a 64-byte [Ed25519 signature](https://en.wikipedia.org/wiki/EdDSA#Ed25519).
- [ ] `verify_message()` returns 0 for a valid [signature](https://en.wikipedia.org/wiki/Digital_signature).
- [ ] `verify_message()` returns -1 when any byte of the [signature](https://en.wikipedia.org/wiki/Digital_signature) is changed.
- [ ] `verify_message()` returns -1 when the wrong [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) is used.
- [ ] All [EVP_MD_CTX](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) contexts are freed — no leaks.
- [ ] Compiles with `-Wall -Wextra -Werror -lcrypto`.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Passing a [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function) algorithm to [EVP_DigestSignInit()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) | [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) handles hashing internally. Pass `NULL` for the [EVP_MD](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) parameter. |
| Skipping the first call to get [signature](https://en.wikipedia.org/wiki/Digital_signature) length | [EVP_DigestSign()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be called twice: once to query the length, once to sign. |
| Confusing return values | [EVP_DigestVerify](https://www.openssl.org/docs/man3.0/man3/EVP_DigestVerify.html) returns 1 for valid, not 0. Check carefully. |
| Forgetting to free [EVP_MD_CTX](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) | Every [EVP_MD_CTX_new()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a matching [EVP_MD_CTX_free()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html). |

## Proof

```bash
./test_sign
# → sign: OK (64 bytes)
# → verify: PASS
# → tampered verify: FAIL — signature invalid
# → wrong key verify: FAIL — signature invalid
```

## 🖼️ Hero Visual

```
  private key ──┐
                ▼
  message ──▶ EVP_DigestSign() ──▶ 64-byte signature
                                        │
  public key ──┐                        │
               ▼                        ▼
  message ──▶ EVP_DigestVerify() ──▶ 1 (valid) / 0 (invalid)
```

## 🔮 Future Lock

- In [W08 L03](03-canonical-signing-bytes.md) you will learn to build [canonical signing bytes](03-canonical-signing-bytes.md) so the message you sign is deterministic and tamper-evident.
- In [W08 L05](05-envelope-format.md) you will wrap the [signature](https://en.wikipedia.org/wiki/Digital_signature) into a self-describing [envelope](05-envelope-format.md).
- In [W14](../../w14/part.md) each [Merkle tree](../../w14/part.md) leaf will be signed using this `sign_message()` function.
- In [W17](../../w17/part.md) [credential issuance](../../w17/part.md) calls `sign_message()` to produce a [verifiable credential](https://en.wikipedia.org/wiki/Verifiable_credentials).
