---
id: w07-l06
title: "Regression Harness"
order: 6
type: lesson
duration_min: 50
---

# Regression Harness

## Goal

Build a single test program that exercises every function from [L01](01-canonical-input.md) through [L05](05-streaming-hash.md) against known test vectors and edge cases, so that any future change that breaks the library is caught immediately.

## What you build

A C program `w07/test_harness.c` that runs a suite of test cases covering [canonical()](01-canonical-input.md), [sha256()](02-digest-tool-verify.md), [proof_record_create()](03-proof-record-format.md), [proof_record_verify()](03-proof-record-format.md), [truncated_hash()](04-collision-thinking.md), and [sha256_stream()](05-streaming-hash.md). Each test prints its name and PASS or FAIL. The harness exits with code 0 if all tests pass and code 1 if any test fails.

## Why it matters

Code without tests is code you cannot trust. Every time you refactor, add a feature, or upgrade [OpenSSL](https://www.openssl.org/), you need to know that nothing broke. A [regression harness](https://en.wikipedia.org/wiki/Regression_testing) runs in seconds and gives a clear pass/fail answer. This same pattern appears in every serious project — [SQLite has over 90 million test lines](https://www.sqlite.org/testing.html). In [W01](../../w01/part.md) you learned [structured logging](../../w01/part.md); now your tests produce structured output that can be parsed by [CI](https://en.wikipedia.org/wiki/Continuous_integration) systems.

---

## Training Session

### Warmup — inventory of functions

1. List every function you have built this week:
   - [canonical()](01-canonical-input.md) from L01
   - [sha256()](02-digest-tool-verify.md) and `hex_encode()` from L02
   - [proof_record_create()](03-proof-record-format.md), [proof_record_verify()](03-proof-record-format.md), `proof_record_print()` from L03
   - `truncated_hash()` from [L04](04-collision-thinking.md)
   - [sha256_stream()](05-streaming-hash.md) from L05
2. For each function, write down one normal input and one edge-case input. For example:
   - [canonical()](01-canonical-input.md): normal = `"  Hello\r\n"`, edge = `""` (empty string).
   - [sha256()](02-digest-tool-verify.md): normal = `"hello"`, edge = zero-length input.
   - [sha256_stream()](05-streaming-hash.md): normal = a small file, edge = an empty file.

### Work — building the harness

#### Do

1. Create `w07/test_harness.c`. Include all the headers from L01 through L05.
2. Define a counter `int failures = 0;`.
3. Write a helper `void check(const char *name, int condition)` that prints `PASS: <name>` if condition is true and `FAIL: <name>` and increments `failures` if condition is false.
4. Write canonical tests:
   - Test that `"  Hello\r\n"` produces the same output as `"hello"`.
   - Test that an all-whitespace input produces `out_len == 0`.
   - Test that a NULL input returns -1.
5. Write digest tests:
   - Test that `sha256()` of `"hello"` produces the known hex digest `2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824`.
   - Test that `sha256()` of an empty string (`""`, length 0) produces the known empty-string digest `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
6. Write proof record tests:
   - Create a record and verify it — [MUST](https://datatracker.ietf.org/doc/html/rfc2119) pass.
   - Tamper with one byte and verify — [MUST](https://datatracker.ietf.org/doc/html/rfc2119) fail.
   - Check that the `algorithm` field is `"sha256"`.
7. Write streaming hash tests:
   - Create a temp file with known content, hash it with `sha256_stream()`, compare against [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html).
   - Create an empty temp file. Its digest [MUST](https://datatracker.ietf.org/doc/html/rfc2119) equal the empty-string SHA-256 digest.
   - Create a file larger than 4096 bytes and verify the digest.
8. At the end of `main()`, print `"ALL PASSED"` if `failures == 0`, otherwise print `"FAILURES: <count>"`.
9. Return `failures == 0 ? 0 : 1`.

#### Test

```bash
gcc -Wall -Wextra -Werror -o test_harness \
  w07/canonical.c w07/digest.c w07/proof_record.c \
  w07/stream_hash.c w07/test_harness.c -lcrypto
./test_harness
echo "Exit code: $?"
```

#### Expected

Every line shows `PASS`. The final line shows `ALL PASSED`. Exit code is 0.

### Prove — break something on purpose

1. Temporarily change one byte in [canonical()](01-canonical-input.md) — for example, skip the [tolower()](https://man7.org/linux/man-pages/man3/tolower.3.html) call.
2. Rebuild and run the harness. It [MUST](https://datatracker.ietf.org/doc/html/rfc2119) report at least one FAIL.
3. Revert the change. Run again. All tests pass.
4. This proves the harness catches real bugs.

### Ship — commit your work

```bash
git add w07/test_harness.c
git commit -m "w07-l06: regression harness for all hash-integrity functions"
```

---

## Done when

- [ ] The harness tests [canonical()](01-canonical-input.md), [sha256()](02-digest-tool-verify.md), [proof_record_create()](03-proof-record-format.md), [proof_record_verify()](03-proof-record-format.md), and [sha256_stream()](05-streaming-hash.md).
- [ ] At least 10 test cases total, covering normal inputs and edge cases.
- [ ] Exit code is 0 when all tests pass and 1 when any test fails.
- [ ] Intentionally breaking one function causes at least one FAIL.
- [ ] Compiles with `-Wall -Wextra -Werror -lcrypto`.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not cleaning up temp files | Use [remove()](https://man7.org/linux/man-pages/man3/remove.3.html) at the end of each streaming test. Leftover files pollute the workspace. |
| Comparing hex strings with wrong length | Always compare exactly 64 characters for [SHA-256](https://en.wikipedia.org/wiki/SHA-2) hex. Use [strncmp()](https://man7.org/linux/man-pages/man3/strncmp.3.html) with length 64. |
| Hard-coding file paths that only work on your machine | Use relative paths or create temp files in the current directory. |
| Skipping error-path tests | Test that [sha256_stream()](05-streaming-hash.md) returns -1 for a nonexistent file. Error paths have bugs too. |

## Proof

```bash
./test_harness
# → PASS: canonical_trim
# → PASS: canonical_crlf
# → PASS: canonical_empty
# → PASS: canonical_null
# → PASS: sha256_hello
# → PASS: sha256_empty
# → PASS: proof_create_verify
# → PASS: proof_tamper_detect
# → PASS: proof_algorithm_field
# → PASS: stream_small_file
# → PASS: stream_empty_file
# → PASS: stream_large_file
# → PASS: stream_missing_file
# → ALL PASSED
# Exit code: 0
```

## 🖼️ Hero Visual

```
  test_harness.c
  ┌─────────────────────────────────────────────────┐
  │ canonical tests  │ ✓ ✓ ✓ ✓                      │
  │ digest tests     │ ✓ ✓                           │
  │ proof tests      │ ✓ ✓ ✓                         │
  │ streaming tests  │ ✓ ✓ ✓ ✓                       │
  ├─────────────────────────────────────────────────┤
  │                 ALL PASSED                       │
  │                 exit code: 0                     │
  └─────────────────────────────────────────────────┘
```

## 🔮 Future Lock

- In [W07 Quest](../quest.md) you will extend this harness to cover the full integrity pipeline from raw input to verified proof record.
- In [W08](../../w08/part.md) you will add signature tests to the same harness pattern — verify that signing and verifying round-trip correctly.
- In [W13](../../w13/part.md) the [content-addressable store](../../w13/part.md) will have its own regression harness modeled on this one.
- In [W14](../../w14/part.md) [Merkle tree](../../w14/part.md) tests will follow the same `check()` pattern: known tree, known root hash, compare.
