---
id: w07-quest
title: "Quest – Hash-Integrity Pipeline"
order: 7
type: quest
duration_min: 90
---

# Quest – Hash-Integrity Pipeline

## Mission

Build a complete hash-integrity pipeline. Your program reads raw input from a file, [canonicalises](lessons/01-canonical-input.md) it, computes a [SHA-256 digest](https://en.wikipedia.org/wiki/SHA-2), packages the result as a [proof record](lessons/03-proof-record-format.md), verifies the record, and then repeats the process using [streaming hash](lessons/05-streaming-hash.md) on the same file to confirm the digests match. The full [regression harness](lessons/06-regression-harness.md) must pass with zero failures.

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | [Canonical input](lessons/01-canonical-input.md): raw input with mixed whitespace, [CR LF](https://en.wikipedia.org/wiki/Newline), and uppercase is normalised before hashing | Feed `"  Hello World\r\n"` and `"hello world\n"` — both produce the same [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function) |
| R2 | [SHA-256 digest](lessons/02-digest-tool-verify.md): wrapper output matches [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html) | `echo -n "<canonical>" \| sha256sum` matches your output |
| R3 | [Proof record](lessons/03-proof-record-format.md): record contains algorithm, timestamp, canonical input, and digest | `proof_record_print()` shows all four fields |
| R4 | [Proof verification](lessons/03-proof-record-format.md): untampered record passes, tampered record fails | Flip one digest bit → `proof_record_verify()` returns -1 |
| R5 | [Streaming hash](lessons/05-streaming-hash.md): large file digest matches [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html) | Create a 100 KB file, hash with `sha256_stream()`, compare with [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html) |
| R6 | [Streaming vs in-memory](lessons/05-streaming-hash.md): digest from `sha256()` and `sha256_stream()` match for the same content | Write canonical bytes to a file, stream-hash the file, compare digests |
| R7 | [Regression harness](lessons/06-regression-harness.md): all tests pass with exit code 0 | `./test_harness && echo OK` prints `OK` |
| R8 | Zero [Valgrind](https://valgrind.org/docs/manual/manual.html) errors | `valgrind ./integrity_pipeline input.txt` reports 0 errors, 0 leaks |

## Constraints

- C only. No external hashing libraries besides [OpenSSL](https://www.openssl.org/).
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) compile with `gcc -Wall -Wextra -Werror -lcrypto`.
- Every [EVP_MD_CTX_new()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a matching [EVP_MD_CTX_free()](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html).
- Every [fopen()](https://man7.org/linux/man-pages/man3/fopen.3.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a matching [fclose()](https://man7.org/linux/man-pages/man3/fclose.3.html).
- All [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function) comparisons [MUST](https://datatracker.ietf.org/doc/html/rfc2119) use [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html), not [strcmp()](https://man7.org/linux/man-pages/man3/strcmp.3.html).
- Proof records [MUST](https://datatracker.ietf.org/doc/html/rfc2119) store [canonical](lessons/01-canonical-input.md) bytes, never raw input.

## Graded objectives

| Grade | Criteria |
|-------|----------|
| **Pass** | R1–R4 met: canonical input, correct digest, proof record create and verify |
| **Merit** | R5–R6 also met: streaming hash works and matches in-memory hash |
| **Distinction** | R7–R8 also met: full regression harness passes, zero Valgrind errors |

## Bonus challenges

| Bonus | Description |
|-------|-------------|
| B1 | Add a `--verify` flag: `./integrity_pipeline --verify record.txt` reads a saved proof record and re-verifies it |
| B2 | Add [SHA-512](https://en.wikipedia.org/wiki/SHA-2) support: the `algorithm` field in the proof record selects between `"sha256"` and `"sha512"` |
| B3 | Print a timing report: how many microseconds each phase (canonical, hash, verify) took, using [clock_gettime()](https://man7.org/linux/man-pages/man3/clock_gettime.3.html) |
| B4 | Batch mode: `./integrity_pipeline dir/` hashes every file in a directory and produces one proof record per file |

## Verification

```bash
# Build everything
gcc -Wall -Wextra -Werror -o integrity_pipeline \
  w07/canonical.c w07/digest.c w07/proof_record.c \
  w07/stream_hash.c w07/integrity_pipeline.c -lcrypto

# Build regression harness
gcc -Wall -Wextra -Werror -o test_harness \
  w07/canonical.c w07/digest.c w07/proof_record.c \
  w07/stream_hash.c w07/test_harness.c -lcrypto

# R1 + R2: canonical + digest
echo -e "  Hello World\r\n" > /tmp/raw_input.txt
./integrity_pipeline /tmp/raw_input.txt
# → digest: <hex string>
echo -n "hello world" | sha256sum
# → same hex string

# R3: proof record fields
./integrity_pipeline /tmp/raw_input.txt
# → algorithm: sha256
# → timestamp: <epoch>
# → input_len: 11
# → digest: <hex>

# R4: tamper detection
# (handled inside the program — prints PASS/FAIL for verify)

# R5 + R6: streaming hash
dd if=/dev/urandom of=/tmp/big_file.bin bs=1024 count=100
./integrity_pipeline /tmp/big_file.bin
sha256sum /tmp/big_file.bin
# → digests match

# R7: regression harness
./test_harness
echo "Exit: $?"
# → ALL PASSED
# → Exit: 0

# R8: valgrind
valgrind --leak-check=full ./integrity_pipeline /tmp/raw_input.txt
# → 0 errors, 0 leaks
```
