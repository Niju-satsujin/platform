---
id: w07-quiz
title: "Week 07 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 07 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – Why canonicalise

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) input be [canonicalised](https://en.wikipedia.org/wiki/Canonicalization) before computing a [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digest?

- A) To make the input shorter
- B) So that logically identical data always produces the same bytes, giving the same [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function) on every platform
- C) Because [SHA-256](https://en.wikipedia.org/wiki/SHA-2) cannot handle uppercase letters
- D) To encrypt the input before hashing

---

### Q2 – CR LF handling

What does [canonical()](lessons/01-canonical-input.md) do when it sees a `\r` followed by `\n`?

- A) It keeps both bytes
- B) It removes both bytes
- C) It removes the `\r` and keeps the `\n`, converting [CR LF](https://en.wikipedia.org/wiki/Newline) to [LF](https://en.wikipedia.org/wiki/Newline)
- D) It replaces both with a space

---

### Q3 – EVP return values

What does [EVP_DigestInit_ex()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) return on success?

- A) 0
- B) 1
- C) A pointer to the digest
- D) The length of the digest

---

### Q4 – Tool verification purpose

Why compare your [sha256()](lessons/02-digest-tool-verify.md) output against [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html)?

- A) Because [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html) is faster
- B) To prove your wrapper produces the correct [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function) by checking against an independent, trusted tool
- C) Because [OpenSSL](https://www.openssl.org/) requires it
- D) To test your network connection

---

### Q5 – Proof record verify

How does [proof_record_verify()](lessons/03-proof-record-format.md) detect tampering?

- A) It checks the file modification time
- B) It re-hashes the stored [canonical input](lessons/01-canonical-input.md) and compares the result to the stored [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function) using [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html)
- C) It contacts a remote server
- D) It checks the file size

---

### Q6 – Birthday bound

For a hash with N output bits, approximately how many random inputs do you need to find a [collision](https://en.wikipedia.org/wiki/Birthday_attack)?

- A) $N$
- B) $2^N$
- C) $\sqrt{2^N}= 2^{N/2}$
- D) $N^2$

---

### Q7 – Streaming hash property

Why does [sha256_stream()](lessons/05-streaming-hash.md) calling [EVP_DigestUpdate()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestUpdate.html) in a loop produce the same [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function) as one call with all the data?

- A) Because the [EVP API](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) caches all data and hashes at the end
- B) Because [SHA-256](https://en.wikipedia.org/wiki/SHA-2) uses the [Merkle–Damgård construction](https://en.wikipedia.org/wiki/Merkle%E2%80%93Damg%C3%A5rd_construction) which processes data in blocks — the split point does not matter
- C) Because the chunks are re-assembled in memory before hashing
- D) Because [fread()](https://man7.org/linux/man-pages/man3/fread.3.html) always reads the entire file

---

### Q8 – File open mode

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) [sha256_stream()](lessons/05-streaming-hash.md) open files with `"rb"` instead of `"r"`?

- A) `"rb"` is faster
- B) `"r"` (text mode) may translate [newlines](https://en.wikipedia.org/wiki/Newline) on some platforms, changing the bytes and producing a different [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function)
- C) `"r"` cannot read binary files
- D) `"rb"` enables buffering

---

### Q9 – Short answer: empty string digest

What is the [SHA-256](https://en.wikipedia.org/wiki/SHA-2) hex digest of an empty input (zero bytes)? Write the first 8 hex characters.

---

### Q10 – Short answer: memcmp vs strcmp

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) you use [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html) instead of [strcmp()](https://man7.org/linux/man-pages/man3/strcmp.3.html) to compare two [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digests?

---

### Q11 – Short answer: proof record fields

Name the four fields that [MUST](https://datatracker.ietf.org/doc/html/rfc2119) appear in a [proof record](lessons/03-proof-record-format.md).

---

### Q12 – Short answer: context free

What happens if you call [EVP_DigestFinal_ex()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestFinal.html) but forget to call [EVP_MD_CTX_free()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) afterwards?

---

### Q13 – Read the output: canonical

A program runs:

```
input:  "  TEST\r\n"
output: 74 65 73 74 0a
```

Explain what [canonical()](lessons/01-canonical-input.md) did to produce this output. Name each transformation applied.

---

### Q14 – Read the output: collision

A program prints:

```
16-bit collision found at attempt 312
colliding truncated digest: 0x7f2a
theoretical prediction: ~256 attempts
```

Is 312 a surprising result? Explain why or why not, using the [birthday bound](https://en.wikipedia.org/wiki/Birthday_problem).

---

## Answer Key

| Q | Answer |
|---|--------|
| 1 | B |
| 2 | C |
| 3 | B |
| 4 | B |
| 5 | B |
| 6 | C |
| 7 | B |
| 8 | B |
| 9 | `e3b0c442` — the [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digest of zero bytes is `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| 10 | [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digests are 32 raw bytes that may contain `0x00`. [strcmp()](https://man7.org/linux/man-pages/man3/strcmp.3.html) stops at the first `0x00` byte, so it may report a false match. [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html) compares all 32 bytes regardless of content. |
| 11 | Canonical input, algorithm name, digest, and timestamp. |
| 12 | The [EVP_MD_CTX](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) is leaked — memory allocated by [OpenSSL](https://www.openssl.org/) is never freed. [Valgrind](https://valgrind.org/docs/manual/manual.html) will report a leak. |
| 13 | Three transformations: (1) stripped leading spaces, (2) lowercased `TEST` to `test` (`74 65 73 74` is `t`, `e`, `s`, `t` in [ASCII](https://en.wikipedia.org/wiki/ASCII)), (3) converted `\r\n` ([CR LF](https://en.wikipedia.org/wiki/Newline)) to `\n` ([LF](https://en.wikipedia.org/wiki/Newline), `0a`). |
| 14 | No, 312 is not surprising. The [birthday bound](https://en.wikipedia.org/wiki/Birthday_problem) for 16 bits predicts a collision after roughly $\sqrt{2^{16}} = 256$ attempts. 312 is within normal statistical variation — individual runs will scatter around the average. |
