---
id: w08-l01
title: "Keypair Basics"
order: 1
type: lesson
duration_min: 35
---

# Keypair Basics

## Goal

Generate an [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) keypair using the [OpenSSL](https://www.openssl.org/) [EVP API](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html) and write both the [private key](https://en.wikipedia.org/wiki/Public-key_cryptography) and [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) to [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) files.

## What you build

A C function `ed25519_keygen()` that calls [EVP_PKEY_keygen](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html) to create an [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) keypair. A helper function `keypair_write_pem()` writes the [private key](https://en.wikipedia.org/wiki/Public-key_cryptography) using [PEM_write_PrivateKey](https://www.openssl.org/docs/man3.0/man3/PEM_write_PrivateKey.html) and the [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) using [PEM_write_PUBKEY](https://www.openssl.org/docs/man3.0/man3/PEM_write_PrivateKey.html). A test program generates a keypair, writes it to disk, reads it back, and confirms the round-trip succeeds.

## Why it matters

Every [digital signature](https://en.wikipedia.org/wiki/Digital_signature) starts with a keypair. The [private key](https://en.wikipedia.org/wiki/Public-key_cryptography) signs, the [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) verifies. If keypair generation is wrong, everything downstream fails: [sign/verify (L02)](02-sign-verify.md), [envelopes (L05)](05-envelope-format.md), [credential issuance (W17)](../../w17/part.md), and [trust bundles (W19)](../../w19/part.md). [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) is the modern choice — 32-byte keys, 64-byte signatures, and no parameter negotiation. [RFC 8032](https://datatracker.ietf.org/doc/html/rfc8032) defines the algorithm.

---

## Training Session

### Warmup — asymmetric cryptography mental model

1. Read the first two paragraphs of [public-key cryptography](https://en.wikipedia.org/wiki/Public-key_cryptography). Write down: what is the relationship between a [private key](https://en.wikipedia.org/wiki/Public-key_cryptography) and a [public key](https://en.wikipedia.org/wiki/Public-key_cryptography)?
2. Read the [Ed25519 section of the EdDSA article](https://en.wikipedia.org/wiki/EdDSA#Ed25519). Note that [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) uses [Curve25519](https://en.wikipedia.org/wiki/Curve25519) and produces 64-byte [signatures](https://en.wikipedia.org/wiki/Digital_signature).
3. Skim the [EVP_PKEY_keygen](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html) man page. Note the three-step pattern: create context, set algorithm, generate key.

### Work — building the keypair generator

#### Do

1. Create `w08/keypair.h`. Declare `EVP_PKEY *ed25519_keygen(void)` — returns a new [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) keypair or `NULL` on failure.
2. Declare `int keypair_write_pem(EVP_PKEY *key, const char *priv_path, const char *pub_path)` — writes both [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) files.
3. Declare `EVP_PKEY *keypair_read_private(const char *path)` — reads a [private key](https://en.wikipedia.org/wiki/Public-key_cryptography) from a [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) file.
4. Declare `EVP_PKEY *keypair_read_public(const char *path)` — reads a [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) from a [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) file.
5. Create `w08/keypair.c`.
6. In `ed25519_keygen()`:
   - Call [EVP_PKEY_Q_keygen()](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html) with `"ED25519"` as the algorithm.
   - If the call returns `NULL`, print an error and return `NULL`.
   - Return the new [EVP_PKEY](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html) pointer.
7. In `keypair_write_pem()`:
   - Open the private key file with [fopen()](https://man7.org/linux/man-pages/man3/fopen.3.html) in write mode.
   - Call [PEM_write_PrivateKey()](https://www.openssl.org/docs/man3.0/man3/PEM_write_PrivateKey.html) with no encryption (pass `NULL` for cipher, password, and callback).
   - Close the file with [fclose()](https://man7.org/linux/man-pages/man3/fclose.3.html).
   - Open the public key file. Call [PEM_write_PUBKEY()](https://www.openssl.org/docs/man3.0/man3/PEM_write_PrivateKey.html). Close the file.
   - Return 0 on success, -1 on any failure.
8. In `keypair_read_private()`:
   - Open the file with [fopen()](https://man7.org/linux/man-pages/man3/fopen.3.html).
   - Call [PEM_read_PrivateKey()](https://www.openssl.org/docs/man3.0/man3/PEM_write_PrivateKey.html) to load the key.
   - Close the file and return the [EVP_PKEY](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html).
9. In `keypair_read_public()`:
   - Open the file and call [PEM_read_PUBKEY()](https://www.openssl.org/docs/man3.0/man3/PEM_write_PrivateKey.html).
   - Close the file and return the [EVP_PKEY](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html).
10. Create `w08/test_keypair.c`. In `main()`:
    - Call `ed25519_keygen()` and check it returns non-NULL.
    - Write the keypair to `/tmp/test_priv.pem` and `/tmp/test_pub.pem`.
    - Read the private key back and check it returns non-NULL.
    - Read the public key back and check it returns non-NULL.
    - Free all [EVP_PKEY](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html) pointers with [EVP_PKEY_free()](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html).
    - Print PASS if all steps succeeded.

#### Test

```bash
gcc -Wall -Wextra -Werror -o test_keypair \
  w08/keypair.c w08/test_keypair.c -lcrypto
./test_keypair
```

#### Expected

Program prints `PASS`. Two [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) files exist at `/tmp/test_priv.pem` and `/tmp/test_pub.pem`. The private key file starts with `-----BEGIN PRIVATE KEY-----`. The public key file starts with `-----BEGIN PUBLIC KEY-----`.

### Prove — key sizes

1. Run `wc -c /tmp/test_priv.pem /tmp/test_pub.pem` and note the file sizes.
2. Use [openssl pkey](https://www.openssl.org/docs/man3.0/man1/openssl-pkey.html) to inspect the key: `openssl pkey -in /tmp/test_priv.pem -text -noout`. Confirm it says `ED25519`.
3. The raw [private key](https://en.wikipedia.org/wiki/Public-key_cryptography) is 32 bytes. The raw [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) is 32 bytes. The [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) files are larger because of [Base64](https://en.wikipedia.org/wiki/Base64) encoding and headers.

### Ship — commit your work

```bash
git add w08/keypair.h w08/keypair.c w08/test_keypair.c
git commit -m "w08-l01: Ed25519 keypair generation and PEM read/write"
```

---

## Done when

- [ ] `ed25519_keygen()` returns a valid [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) keypair.
- [ ] `keypair_write_pem()` writes both [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) files.
- [ ] `keypair_read_private()` and `keypair_read_public()` read the keys back.
- [ ] Round-trip test passes: generate, write, read, confirm.
- [ ] All [EVP_PKEY](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html) pointers are freed — no leaks.
- [ ] Compiles with `-Wall -Wextra -Werror -lcrypto`.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting to call [EVP_PKEY_free()](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html) | Every [EVP_PKEY](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html) from keygen or read [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be freed. |
| Writing the private key with encryption enabled | Pass `NULL` for cipher and password. Encryption is not needed for this toolkit. |
| Using RSA functions instead of EVP | [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) use the [EVP API](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html). The older RSA-specific functions do not support [EdDSA](https://en.wikipedia.org/wiki/EdDSA). |
| Not closing [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) files | Every [fopen()](https://man7.org/linux/man-pages/man3/fopen.3.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a matching [fclose()](https://man7.org/linux/man-pages/man3/fclose.3.html). |

## Proof

```bash
./test_keypair
# → keygen: OK
# → write PEM: OK
# → read private: OK
# → read public: OK
# → PASS

openssl pkey -in /tmp/test_priv.pem -text -noout
# → ED25519 Private-Key:
# → priv: <hex bytes>
# → pub: <hex bytes>
```

## 🖼️ Hero Visual

```
  EVP_PKEY_Q_keygen("ED25519")
          │
          ▼
  ┌─────────────────────┐
  │     EVP_PKEY         │
  │  ┌───────────────┐  │
  │  │ private: 32 B │  │
  │  │ public:  32 B │  │
  │  └───────────────┘  │
  └─────────────────────┘
       │           │
       ▼           ▼
  priv.pem     pub.pem
  (sign)       (verify)
```

## 🔮 Future Lock

- In [W08 L02](02-sign-verify.md) you will use this keypair to [sign](https://en.wikipedia.org/wiki/Digital_signature) and [verify](https://en.wikipedia.org/wiki/Digital_signature) messages.
- In [W13](../../w13/part.md) the [content-addressable store](../../w13/part.md) attaches the author's [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) to every stored object for verification.
- In [W17](../../w17/part.md) [credential issuance](../../w17/part.md) uses the [private key](https://en.wikipedia.org/wiki/Public-key_cryptography) to sign credentials and the [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) to verify them.
- In [W19](../../w19/part.md) [trust bundles](../../w19/part.md) package multiple [public keys](https://en.wikipedia.org/wiki/Public-key_cryptography) so verifiers can check signatures from different issuers.
