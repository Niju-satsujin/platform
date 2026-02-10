---
id: w07-l02
title: "Digest & Tool Verify"
order: 2
type: lesson
duration_min: 40
---

# Digest & Tool Verify

## Goal

Build a `sha256()` wrapper using [OpenSSL EVP](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) and verify that its output matches the [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html) command-line tool byte-for-byte.

## What you build

A C function `int sha256(const unsigned char *data, size_t len, unsigned char out[32])` that computes a [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digest using [EVP_DigestInit()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html), [EVP_DigestUpdate()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestUpdate.html), and [EVP_DigestFinal()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestFinal.html). A test program hashes a known string, prints the hex digest, and compares it against the output of [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html).

## Why it matters

A [hash function](https://en.wikipedia.org/wiki/Cryptographic_hash_function) is only useful if you can prove its output is correct. The fastest way to prove it is to compare against an independent tool. [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html) ships with every Linux system and is widely trusted. If your wrapper disagrees with [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html), your wrapper is wrong. This same digest becomes the input to [digital signatures in W08](../../w08/part.md) — a wrong digest means a wrong signature.

---

## Training Session

### Warmup — understand the EVP API

1. Read the DESCRIPTION section of [EVP_DigestInit()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html). Write down the three steps: init, update, final.
2. Read the RETURN VALUES section. Note that every [EVP](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) call returns 1 on success and 0 on failure.
3. Run `echo -n "hello" | sha256sum` in your terminal. Write down the 64-character hex string. That is the [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digest of the five bytes `h`, `e`, `l`, `l`, `o`.

### Work — building the sha256 wrapper

#### Do

1. Create `w07/digest.h`. Declare `int sha256(const unsigned char *data, size_t len, unsigned char out[32])`.
2. Create `w07/digest.c`. Include `<openssl/evp.h>`.
3. Inside `sha256()`:
   - Call [EVP_MD_CTX_new()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) to allocate a context. If it returns NULL, return -1.
   - Call [EVP_DigestInit_ex()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) with [EVP_sha256()](https://www.openssl.org/docs/man3.0/man3/EVP_sha256.html). Check the return value.
   - Call [EVP_DigestUpdate()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestUpdate.html) with `data` and `len`. Check the return value.
   - Call [EVP_DigestFinal_ex()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestFinal.html) to write the 32-byte digest into `out`. Check the return value.
   - Call [EVP_MD_CTX_free()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) to release the context.
   - Return 0 on success.
4. Create a helper function `void hex_encode(const unsigned char *bin, size_t len, char *hex)` that converts each byte to two lowercase hex characters using [sprintf()](https://man7.org/linux/man-pages/man3/sprintf.3.html) with `"%02x"`.
5. Create `w07/test_digest.c`. In `main()`:
   - First, run [canonical()](01-canonical-input.md) on the test string to normalise it.
   - Call `sha256()` on the canonical output.
   - Call `hex_encode()` and print the 64-character hex string.
   - Print the expected digest from [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html).
   - Compare the two strings with [strcmp()](https://man7.org/linux/man-pages/man3/strcmp.3.html) and print PASS or FAIL.

#### Test

```bash
gcc -Wall -Wextra -Werror -o test_digest \
  w07/canonical.c w07/digest.c w07/test_digest.c -lcrypto
./test_digest
```

#### Expected

The hex string printed by your program matches the output of `echo -n "hello" | sha256sum` exactly. The program prints `PASS`.

### Prove — cross-check with a file

1. Write the canonical string to a temporary file with `echo -n "hello" > /tmp/test_hash.txt`.
2. Run `sha256sum /tmp/test_hash.txt`.
3. Your program's output [MUST](https://datatracker.ietf.org/doc/html/rfc2119) match this digest. If it does not, your [canonical()](01-canonical-input.md) function or your `sha256()` wrapper has a bug.

### Ship — commit your work

```bash
git add w07/digest.h w07/digest.c w07/test_digest.c
git commit -m "w07-l02: SHA-256 digest wrapper verified against sha256sum"
```

---

## Done when

- [ ] `sha256()` returns a 32-byte [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function) using [EVP_DigestInit()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html), [EVP_DigestUpdate()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestUpdate.html), [EVP_DigestFinal()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestFinal.html).
- [ ] Every [EVP](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) return value is checked.
- [ ] `hex_encode()` produces lowercase hex.
- [ ] Output matches [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html) for at least two different inputs.
- [ ] Compiles with `-Wall -Wextra -Werror -lcrypto`.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting to call [EVP_MD_CTX_free()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) | Every [EVP_MD_CTX_new()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a matching free — even on error paths. |
| Using deprecated `SHA256()` one-shot function | Use the [EVP API](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html). The old API is removed in [OpenSSL 3.0](https://www.openssl.org/docs/man3.0/man7/migration_guide.html). |
| Printing hex with uppercase `%02X` | Use `%02x` for lowercase. [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html) uses lowercase. |
| Hashing raw input instead of [canonical](01-canonical-input.md) input | Always call [canonical()](01-canonical-input.md) first. Raw input gives a different digest on different platforms. |

## Proof

```bash
./test_digest
# → computed: 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
# → expected: 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
# → PASS
```

## 🖼️ Hero Visual

```
  canonical bytes         EVP pipeline                   32-byte digest
  ┌───────────┐     ┌────────────────────┐      ┌─────────────────────────┐
  │ 68 65 6c  │     │ EVP_DigestInit()   │      │ 2c f2 4d ba 5f b0 a3 0e │
  │ 6c 6f     │────▶│ EVP_DigestUpdate() │─────▶│ 26 e8 3b 2a c5 b9 e2 9e │
  │ ("hello") │     │ EVP_DigestFinal()  │      │ ... (32 bytes total)    │
  └───────────┘     └────────────────────┘      └─────────────────────────┘
                                                          │
                                                          ▼
                                                  sha256sum agrees ✓
```

## 🔮 Future Lock

- In [W07 L03](03-proof-record-format.md) you will embed this digest inside a [proof record](03-proof-record-format.md) alongside the algorithm name and a timestamp.
- In [W07 L05](05-streaming-hash.md) you will replace the single [EVP_DigestUpdate()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestUpdate.html) call with a loop that reads chunks, enabling hashing of files larger than memory.
- In [W08](../../w08/part.md) a [digital signature](../../w08/part.md) will sign this 32-byte digest — not the original data.
- In [W14](../../w14/part.md) [Merkle tree](../../w14/part.md) nodes will call `sha256()` on the concatenation of two child digests.
