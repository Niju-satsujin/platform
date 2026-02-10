---
id: w07-l05
title: "Streaming Hash"
order: 5
type: lesson
duration_min: 45
---

# Streaming Hash

## Goal

Build a `sha256_stream()` function that hashes a file of any size by reading it in chunks and calling [EVP_DigestUpdate()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestUpdate.html) for each chunk, so you never need to load the entire file into memory.

## What you build

A C function `int sha256_stream(const char *path, unsigned char out[32])` that opens a file with [fopen()](https://man7.org/linux/man-pages/man3/fopen.3.html), reads 4096-byte chunks with [fread()](https://man7.org/linux/man-pages/man3/fread.3.html), feeds each chunk to [EVP_DigestUpdate()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestUpdate.html), and finalises the [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function) with [EVP_DigestFinal()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestFinal.html). The output matches [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html) on the same file.

## Why it matters

Your `sha256()` wrapper from [L02](02-digest-tool-verify.md) takes a pointer and a length — the entire file must be in memory. That works for small strings but fails for a 10 GB database dump. [EVP_DigestUpdate()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestUpdate.html) is designed to be called multiple times on consecutive chunks. The final digest is identical whether you call it once with all the data or a thousand times with 4 KB each. This is how [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html) itself works. In [W13](../../w13/part.md) the [content-addressable store](../../w13/part.md) will hash uploaded files that may be gigabytes in size.

---

## Training Session

### Warmup — prove that chunked hashing works

1. Run `echo -n "helloworld" | sha256sum`. Write down the digest.
2. Now think: is the digest of `"hello" + "world"` fed as two separate [EVP_DigestUpdate()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestUpdate.html) calls the same as one call with `"helloworld"`? Yes — the [Merkle–Damgård construction](https://en.wikipedia.org/wiki/Merkle%E2%80%93Damg%C3%A5rd_construction) guarantees this.
3. This property is what makes streaming possible: you can split the input at any boundary without changing the result.

### Work — building the streaming hasher

#### Do

1. Create `w07/stream_hash.h`. Declare `int sha256_stream(const char *path, unsigned char out[32])`.
2. Create `w07/stream_hash.c`. Include `<stdio.h>` and `<openssl/evp.h>`.
3. Inside `sha256_stream()`:
   - Open the file with [fopen()](https://man7.org/linux/man-pages/man3/fopen.3.html) in `"rb"` mode (binary read). If it fails, return -1.
   - Allocate a context with [EVP_MD_CTX_new()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html).
   - Call [EVP_DigestInit_ex()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) with [EVP_sha256()](https://www.openssl.org/docs/man3.0/man3/EVP_sha256.html).
   - Declare a buffer of 4096 bytes.
   - Loop: call [fread()](https://man7.org/linux/man-pages/man3/fread.3.html) to read up to 4096 bytes. If the return value is greater than 0, call [EVP_DigestUpdate()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestUpdate.html) with the buffer and the number of bytes read. Continue until [fread()](https://man7.org/linux/man-pages/man3/fread.3.html) returns 0.
   - Check [ferror()](https://man7.org/linux/man-pages/man3/ferror.3.html) after the loop. If set, clean up and return -1.
   - Call [EVP_DigestFinal_ex()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestFinal.html) to write the 32-byte digest into `out`.
   - Free the context with [EVP_MD_CTX_free()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html).
   - Close the file with [fclose()](https://man7.org/linux/man-pages/man3/fclose.3.html).
   - Return 0 on success.
4. Create `w07/test_stream_hash.c`. In `main()`:
   - Create a temporary file and write a known string to it.
   - Call `sha256_stream()` on the file.
   - Call [hex_encode()](02-digest-tool-verify.md) and print the result.
   - Compare against the output of `sha256sum` on the same file.
   - Print PASS or FAIL.
5. Add a second test: create a file larger than 4096 bytes (for example, write the same line 1000 times). Hash it with `sha256_stream()` and with [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html). They [MUST](https://datatracker.ietf.org/doc/html/rfc2119) match.

#### Test

```bash
gcc -Wall -Wextra -Werror -o test_stream_hash \
  w07/digest.c w07/stream_hash.c w07/test_stream_hash.c -lcrypto
./test_stream_hash
```

#### Expected

Both the small file and the large file tests print `PASS`. The hex digests match [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html) exactly.

### Prove — resource cleanup

1. Run under [Valgrind](https://valgrind.org/docs/manual/manual.html): `valgrind ./test_stream_hash`.
2. Confirm zero memory leaks and zero errors. Every [fopen()](https://man7.org/linux/man-pages/man3/fopen.3.html) has a matching [fclose()](https://man7.org/linux/man-pages/man3/fclose.3.html), and every [EVP_MD_CTX_new()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) has a matching [EVP_MD_CTX_free()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html).

### Ship — commit your work

```bash
git add w07/stream_hash.h w07/stream_hash.c w07/test_stream_hash.c
git commit -m "w07-l05: streaming SHA-256 for large files"
```

---

## Done when

- [ ] `sha256_stream()` reads the file in 4096-byte chunks.
- [ ] Output matches [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html) for both a small file and a file larger than 4096 bytes.
- [ ] The function returns -1 if [fopen()](https://man7.org/linux/man-pages/man3/fopen.3.html) fails.
- [ ] [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero leaks and zero errors.
- [ ] Compiles with `-Wall -Wextra -Werror -lcrypto`.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Opening the file in text mode (`"r"`) instead of binary (`"rb"`) | Text mode may translate [newlines](https://en.wikipedia.org/wiki/Newline) on some platforms, changing the bytes and the digest. Always use `"rb"`. |
| Not checking [ferror()](https://man7.org/linux/man-pages/man3/ferror.3.html) after the loop | [fread()](https://man7.org/linux/man-pages/man3/fread.3.html) returns 0 for both end-of-file and error. Check [ferror()](https://man7.org/linux/man-pages/man3/ferror.3.html) to tell them apart. |
| Forgetting to [fclose()](https://man7.org/linux/man-pages/man3/fclose.3.html) on error paths | Every [fopen()](https://man7.org/linux/man-pages/man3/fopen.3.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a matching [fclose()](https://man7.org/linux/man-pages/man3/fclose.3.html), even when returning early on error. |
| Using a very small buffer like 64 bytes | 4096 bytes is a good default — it matches the typical OS [page size](https://en.wikipedia.org/wiki/Page_(computer_memory)) and reduces [system call](https://en.wikipedia.org/wiki/System_call) overhead. |

## Proof

```bash
./test_stream_hash
# → small file: PASS (digest matches sha256sum)
# → large file: PASS (digest matches sha256sum)
```

## 🖼️ Hero Visual

```
  large file (e.g. 1 MB)
  ┌──────────────────────────────────────────────────┐
  │ chunk 1    │ chunk 2    │ chunk 3    │ ... │ last │
  │ 4096 bytes │ 4096 bytes │ 4096 bytes │     │ rest │
  └─────┬──────┴─────┬──────┴─────┬──────┴──┬──┴──┬──┘
        │            │            │         │     │
        ▼            ▼            ▼         ▼     ▼
  DigestInit → Update → Update → Update → ... → DigestFinal
                                                    │
                                                    ▼
                                              32-byte digest
                                              (same as sha256sum)
```

## 🔮 Future Lock

- In [W07 L06](06-regression-harness.md) you will add `sha256_stream()` to the regression harness with large-file test vectors.
- In [W13](../../w13/part.md) the [content-addressable store](../../w13/part.md) will use `sha256_stream()` to compute the address of uploaded files without loading them into memory.
- In [W14](../../w14/part.md) when building a [Merkle tree](../../w14/part.md) over many files, each leaf will be computed by `sha256_stream()`.
- In [W15](../../w15/part.md) the [transparency log](../../w15/part.md) will stream-hash large log segments for archival integrity checks.
