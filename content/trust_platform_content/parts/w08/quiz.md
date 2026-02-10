---
id: w08-quiz
title: "Week 08 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 08 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – Ed25519 key sizes

What are the sizes of an [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) private key, public key, and signature?

- A) 64 bytes, 64 bytes, 128 bytes
- B) 32 bytes, 32 bytes, 64 bytes
- C) 256 bits, 256 bits, 256 bits
- D) 16 bytes, 16 bytes, 32 bytes

---

### Q2 – EVP_DigestSign call pattern

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) [EVP_DigestSign()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) be called twice when signing with [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519)?

- A) Because the first call encrypts and the second call signs
- B) Because the first call with a `NULL` buffer returns the required [signature](https://en.wikipedia.org/wiki/Digital_signature) length, and the second call fills the buffer
- C) Because [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) requires two rounds of hashing
- D) Because [OpenSSL](https://www.openssl.org/) needs one call per key

---

### Q3 – EVP_DigestVerify return value

What does [EVP_DigestVerify()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestVerify.html) return when the [signature](https://en.wikipedia.org/wiki/Digital_signature) is valid?

- A) 0
- B) 1
- C) The length of the message
- D) A pointer to the verified data

---

### Q4 – Why no separate digest for Ed25519

Why do you pass `NULL` for the [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function) parameter when calling [EVP_DigestSignInit()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) with [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519)?

- A) Because [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) does not use hashing
- B) Because [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) performs its own internal hashing as defined by [RFC 8032](https://datatracker.ietf.org/doc/html/rfc8032) — you [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) specify an external digest
- C) Because `NULL` means use the default SHA-256
- D) Because only RSA keys need a digest parameter

---

### Q5 – Canonical signing bytes purpose

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) you build [canonical signing bytes](lessons/03-canonical-signing-bytes.md) before signing instead of signing the raw struct?

- A) Because signing raw bytes is slower
- B) Because struct layout includes compiler-dependent padding, so two machines may produce different bytes for the same logical data, causing verification to fail
- C) Because [EVP_DigestSign()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) only accepts canonical input
- D) Because canonical bytes are encrypted

---

### Q6 – Nonce source

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) nonces be generated with [RAND_bytes()](https://www.openssl.org/docs/man3.0/man3/RAND_bytes.html) instead of [rand()](https://man7.org/linux/man-pages/man3/rand.3.html)?

- A) [RAND_bytes()](https://www.openssl.org/docs/man3.0/man3/RAND_bytes.html) is faster
- B) [rand()](https://man7.org/linux/man-pages/man3/rand.3.html) produces [cryptographically predictable](https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator) output — an attacker could guess the next [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) and pre-forge a [replay](https://en.wikipedia.org/wiki/Replay_attack)
- C) [rand()](https://man7.org/linux/man-pages/man3/rand.3.html) only generates 4-byte values
- D) [RAND_bytes()](https://www.openssl.org/docs/man3.0/man3/RAND_bytes.html) is required by the compiler

---

### Q7 – Replay detection mechanism

How does [nonce_check_and_record()](lessons/04-replay-protection.md) detect a [replay attack](https://en.wikipedia.org/wiki/Replay_attack)?

- A) It checks the [signature](https://en.wikipedia.org/wiki/Digital_signature) timestamp
- B) It looks up the [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) in the store — if the [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) is already present, the message is a [replay](https://en.wikipedia.org/wiki/Replay_attack) and the function returns -1
- C) It compares the message length
- D) It contacts a remote [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) server

---

### Q8 – Envelope version byte

Why does the [envelope](lessons/05-envelope-format.md) include a `version` byte?

- A) To encrypt the envelope
- B) So the deserializer knows which field layout to expect, enabling forward-compatible format changes
- C) Because [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) requires a version field
- D) To count how many times the envelope has been verified

---

### Q9 – Short answer: nonce in signing bytes

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) be included in the [canonical signing bytes](lessons/03-canonical-signing-bytes.md) rather than just stored alongside the [signature](https://en.wikipedia.org/wiki/Digital_signature)?

---

### Q10 – Short answer: PEM file identification

You run `cat key.pem` and see `-----BEGIN PRIVATE KEY-----`. Does this file contain the [public key](https://en.wikipedia.org/wiki/Public-key_cryptography), the [private key](https://en.wikipedia.org/wiki/Public-key_cryptography), or both? Explain.

---

### Q11 – Short answer: length prefix ambiguity

Without length prefixes, the [canonical signing bytes](lessons/03-canonical-signing-bytes.md) for `action="ab", payload="cd"` and `action="abc", payload="d"` would be the same concatenation `"abcd"`. Explain how length-prefixed encoding prevents this.

---

### Q12 – Short answer: EVP_PKEY_free

What happens if you call [ed25519_keygen()](lessons/01-keypair-basics.md) ten times in a loop but never call [EVP_PKEY_free()](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html)?

---

### Q13 – Read the output: verify failure

A program prints:

```
sign: OK (64 bytes)
verify (correct key): PASS
verify (wrong key): FAIL — signature invalid
```

Explain why the second verify failed even though the [signature](https://en.wikipedia.org/wiki/Digital_signature) was not modified.

---

### Q14 – Read the output: replay rejected

A program prints:

```
nonce A: record → 0 (accepted)
nonce A: record → -1 (replay detected)
nonce B: record → 0 (accepted)
```

Explain what happened in each line and why the second line returned -1.

---

## Answer Key

| Q | Answer |
|---|--------|
| 1 | B |
| 2 | B |
| 3 | B |
| 4 | B |
| 5 | B |
| 6 | B |
| 7 | B |
| 8 | B |
| 9 | If the [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) is not part of the signed data, an attacker can replace the [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) with a fresh one without invalidating the [signature](https://en.wikipedia.org/wiki/Digital_signature). Including it in the [signing bytes](lessons/03-canonical-signing-bytes.md) means any change to the [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) breaks the [signature](https://en.wikipedia.org/wiki/Digital_signature). |
| 10 | The file contains the [private key](https://en.wikipedia.org/wiki/Public-key_cryptography). The header `-----BEGIN PRIVATE KEY-----` indicates a [PKCS#8](https://en.wikipedia.org/wiki/PKCS_8) private key. For [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519), the [private key](https://en.wikipedia.org/wiki/Public-key_cryptography) encoding includes the [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) internally, so you can derive the [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) from it. But the file is labelled as private. |
| 11 | With length prefixes, the first input encodes as `2:ab2:cd` and the second as `3:abc1:d`. The receiver reads `2` and takes two bytes (`ab`), then reads `2` and takes two bytes (`cd`). For the second input it reads `3` and takes three bytes (`abc`), then reads `1` and takes one byte (`d`). The prefixes make the field boundaries unambiguous. |
| 12 | Ten [EVP_PKEY](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html) structures are allocated by [OpenSSL](https://www.openssl.org/) and never freed. [Valgrind](https://valgrind.org/docs/manual/manual.html) will report memory leaks. Over time, repeated leaks exhaust process memory. |
| 13 | The [signature](https://en.wikipedia.org/wiki/Digital_signature) was produced by the first [private key](https://en.wikipedia.org/wiki/Public-key_cryptography). The second verify used a different [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) that does not correspond to the signing [private key](https://en.wikipedia.org/wiki/Public-key_cryptography). [EVP_DigestVerify()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestVerify.html) checks the mathematical relationship between the [public key](https://en.wikipedia.org/wiki/Public-key_cryptography), the message, and the [signature](https://en.wikipedia.org/wiki/Digital_signature) — a mismatched key causes verification to fail. |
| 14 | Line 1: [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) A was new, so `nonce_check_and_record()` stored it and returned 0. Line 2: the same [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) A was submitted again. The store found it already present and returned -1, detecting a [replay](https://en.wikipedia.org/wiki/Replay_attack). Line 3: [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) B is a different value not seen before, so it was accepted with 0. |
