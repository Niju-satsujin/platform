---
id: w08-quest
title: "Quest – Signing Toolkit Pipeline"
order: 7
type: quest
duration_min: 90
---

# Quest – Signing Toolkit Pipeline

## Mission

Build a complete signing pipeline. Your program generates an [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) keypair, reads a message from a file, builds [canonical signing bytes](lessons/03-canonical-signing-bytes.md), generates a [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce), seals the message into an [envelope](lessons/05-envelope-format.md), serializes the envelope to disk, reads it back, verifies it, and then attempts a [replay](https://en.wikipedia.org/wiki/Replay_attack) of the same [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) to confirm it is rejected. The full [regression harness](lessons/06-regression-harness.md) must pass with zero failures.

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | [Ed25519 keypair](lessons/01-keypair-basics.md): keygen produces a valid keypair, [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) round-trip succeeds | Write keypair to [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail), read back, confirm `openssl pkey -text` shows `ED25519` |
| R2 | [Sign/verify](lessons/02-sign-verify.md): signature is 64 bytes, verify passes with correct key, fails with wrong key | Sign a message, verify with matching [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) → PASS, verify with different key → FAIL |
| R3 | [Canonical signing bytes](lessons/03-canonical-signing-bytes.md): same logical input with different whitespace produces identical bytes | Feed `"  Submit "` and `"submit"` — [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html) returns 0 |
| R4 | [Nonce generation](lessons/04-replay-protection.md): 16 bytes of randomness from [RAND_bytes()](https://www.openssl.org/docs/man3.0/man3/RAND_bytes.html), two nonces are different | Generate two nonces, [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html) returns non-zero |
| R5 | [Replay detection](lessons/04-replay-protection.md): second submission of the same [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) is rejected | `nonce_check_and_record()` returns 0 first time, -1 second time |
| R6 | [Envelope seal](lessons/05-envelope-format.md): builds [signing bytes](lessons/03-canonical-signing-bytes.md), signs, stores [signature](https://en.wikipedia.org/wiki/Digital_signature) in envelope | `envelope_seal()` returns 0 |
| R7 | [Envelope verify](lessons/05-envelope-format.md): re-builds [signing bytes](lessons/03-canonical-signing-bytes.md), checks [signature](https://en.wikipedia.org/wiki/Digital_signature), detects tampering | `envelope_verify()` returns 0 for clean envelope, -1 after one payload byte is flipped |
| R8 | [Envelope round-trip](lessons/05-envelope-format.md): serialize to buffer, deserialize, verify the deserialized copy | Deserialized envelope passes `envelope_verify()` |
| R9 | [Regression harness](lessons/06-regression-harness.md): all tests pass with exit code 0 | `./test_harness && echo OK` prints `OK` |
| R10 | Zero [Valgrind](https://valgrind.org/docs/manual/manual.html) errors | `valgrind ./signing_pipeline input.txt` reports 0 errors, 0 leaks |

## Constraints

- C only. No external crypto libraries besides [OpenSSL](https://www.openssl.org/).
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) compile with `gcc -Wall -Wextra -Werror -lcrypto`.
- Every [EVP_PKEY](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be freed with [EVP_PKEY_free()](https://www.openssl.org/docs/man3.0/man3/EVP_PKEY_keygen.html).
- Every [EVP_MD_CTX](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be freed with [EVP_MD_CTX_free()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestSign.html).
- Every [fopen()](https://man7.org/linux/man-pages/man3/fopen.3.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a matching [fclose()](https://man7.org/linux/man-pages/man3/fclose.3.html).
- All [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) and [signature](https://en.wikipedia.org/wiki/Digital_signature) comparisons [MUST](https://datatracker.ietf.org/doc/html/rfc2119) use [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html), not [strcmp()](https://man7.org/linux/man-pages/man3/strcmp.3.html).
- The [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be included in the [signing bytes](lessons/03-canonical-signing-bytes.md).

## Graded objectives

| Grade | Criteria |
|-------|----------|
| **Pass** | R1–R5 met: keypair works, sign/verify works, canonical bytes are deterministic, nonce generation and replay detection work |
| **Merit** | R6–R8 also met: envelope seal, verify, and serialize/deserialize round-trip all work |
| **Distinction** | R9–R10 also met: full regression harness passes, zero Valgrind errors |

## Bonus challenges

| Bonus | Description |
|-------|-------------|
| B1 | Add a `--verify` flag: `./signing_pipeline --verify envelope.bin pub.pem` reads a saved envelope and verifies it against a [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) |
| B2 | Add a `--batch` flag: `./signing_pipeline --batch dir/` reads every file in a directory, seals each into an envelope, and writes them to an output directory |
| B3 | Print a timing report: how many microseconds each phase (keygen, sign, verify, seal, serialize) took, using [clock_gettime()](https://man7.org/linux/man-pages/man3/clock_gettime.3.html) |
| B4 | Add [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) expiry: nonces older than 60 seconds are purged from the store to prevent unbounded growth |

## Verification

```bash
# Build the pipeline
gcc -Wall -Wextra -Werror -o signing_pipeline \
  w07/canonical.c w08/keypair.c w08/sign.c w08/signing_bytes.c \
  w08/nonce.c w08/envelope.c w08/signing_pipeline.c -lcrypto

# Build the regression harness
gcc -Wall -Wextra -Werror -o test_harness \
  w07/canonical.c w08/keypair.c w08/sign.c w08/signing_bytes.c \
  w08/nonce.c w08/envelope.c w08/test_harness.c -lcrypto

# R1: keypair
./signing_pipeline /tmp/message.txt
openssl pkey -in /tmp/w08_priv.pem -text -noout
# → ED25519 Private-Key

# R2: sign/verify
# (handled inside the pipeline — prints PASS/FAIL)

# R3: canonical signing bytes
# Feed "  Submit " and "submit" — both produce identical signing bytes

# R4 + R5: nonce + replay
# First submission → accepted
# Replay same nonce → rejected

# R6 + R7 + R8: envelope
# Seal, verify, serialize, deserialize, verify, tamper, verify
# All printed inside the pipeline

# R9: regression harness
./test_harness
echo "Exit: $?"
# → ALL PASSED
# → Exit: 0

# R10: valgrind
valgrind --leak-check=full ./signing_pipeline /tmp/message.txt
# → 0 errors, 0 leaks
```
