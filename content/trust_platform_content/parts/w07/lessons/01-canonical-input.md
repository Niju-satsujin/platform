---
id: w07-l01
title: "Canonical Input"
order: 1
type: lesson
duration_min: 40
---

# Canonical Input

## Goal

Build a `canonical()` function that converts any variation of the same logical data into one exact [byte](https://en.wikipedia.org/wiki/Byte) sequence so that [SHA-256](https://en.wikipedia.org/wiki/SHA-2) always produces the same [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function).

## What you build

A C function `canonical(const char *raw, size_t len, char *out, size_t *out_len)` that strips leading and trailing [whitespace](https://en.wikipedia.org/wiki/Whitespace_character), converts all [CR LF](https://en.wikipedia.org/wiki/Newline) pairs to [LF](https://en.wikipedia.org/wiki/Newline), lowercases all [ASCII](https://en.wikipedia.org/wiki/ASCII) letters, and null-terminates the result. After calling `canonical()`, two inputs that mean the same thing produce the same bytes.

## Why it matters

If you hash `"Hello\r\n"` on Windows and `"hello\n"` on Linux, [SHA-256](https://en.wikipedia.org/wiki/SHA-2) gives two different [digests](https://en.wikipedia.org/wiki/Cryptographic_hash_function) even though the data means the same thing. Every system that checks integrity — [Git](https://en.wikipedia.org/wiki/Git), [TLS certificates](https://en.wikipedia.org/wiki/Transport_Layer_Security), [JSON Web Tokens](https://en.wikipedia.org/wiki/JSON_Web_Token) — solves this by [canonicalising](https://en.wikipedia.org/wiki/Canonicalization) input before hashing. Without [canonical input](https://en.wikipedia.org/wiki/Canonicalization), your [proof records (L03)](03-proof-record-format.md) will fail verification on a different machine. In [W01](../../w01/part.md) you built [structured logs](../../w01/part.md) — those log entries will become hash inputs in [W15 (transparency log)](../../w15/part.md), so they [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be canonical.

---

## Training Session

### Warmup — byte-level awareness

1. Open a terminal. Run `echo -n "Hello" | xxd`. Write down the hex bytes.
2. Run `echo -n "hello" | xxd`. Compare. The bytes differ at every character because [ASCII](https://en.wikipedia.org/wiki/ASCII) uppercase and lowercase have different codes.
3. Run `printf "hi\r\n" | xxd`. Find the `0d 0a` pair — that is [CR LF](https://en.wikipedia.org/wiki/Newline).
4. Run `printf "hi\n" | xxd`. Now there is only `0a` — that is [LF](https://en.wikipedia.org/wiki/Newline).
5. Think: if you hash both, will the [digests](https://en.wikipedia.org/wiki/Cryptographic_hash_function) match? No. That is why [canonicalisation](https://en.wikipedia.org/wiki/Canonicalization) exists.

### Work — building the canonical function

#### Do

1. Create `w07/canonical.h`. Declare `int canonical(const char *raw, size_t len, char *out, size_t *out_len)`.
2. Create `w07/canonical.c`. Include `<ctype.h>` for [tolower()](https://man7.org/linux/man-pages/man3/tolower.3.html) and `<string.h>` for [memcpy()](https://man7.org/linux/man-pages/man3/memcpy.3.html).
3. First pass: find the start index by skipping leading [whitespace](https://en.wikipedia.org/wiki/Whitespace_character) characters (space, tab, carriage return, newline).
4. Second pass: find the end index by skipping trailing [whitespace](https://en.wikipedia.org/wiki/Whitespace_character) from the back.
5. Third pass: walk from start to end. For each byte:
   - If the byte is `\r` and the next byte is `\n`, skip the `\r`.
   - Otherwise, write [tolower()](https://man7.org/linux/man-pages/man3/tolower.3.html) of the byte to `out`.
6. Set `*out_len` to the number of bytes written. Null-terminate `out`.
7. Return 0 on success, -1 if `raw` is NULL or `len` is 0.
8. Create `w07/test_canonical.c` with a `main()` that calls `canonical()` on at least four test strings: one with leading spaces, one with trailing tabs, one with [CR LF](https://en.wikipedia.org/wiki/Newline), and one already clean. Print each result in hex with [printf()](https://man7.org/linux/man-pages/man3/printf.3.html).

#### Test

```bash
gcc -Wall -Wextra -Werror -o test_canonical w07/canonical.c w07/test_canonical.c
./test_canonical
```

#### Expected

All four test cases print the same canonical output bytes regardless of the original whitespace or case. For example, `"  Hello\r\n"` and `"hello"` both produce the hex sequence `68 65 6c 6c 6f`.

### Prove — edge cases

1. What happens when the input is all whitespace? `canonical()` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) produce an empty output with `*out_len == 0`.
2. What happens with a lone `\r` not followed by `\n`? It [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be lowercased and kept — only the `\r` in a `\r\n` pair is stripped.
3. Add both edge cases to your test file and run again.

### Ship — commit your work

```bash
git add w07/canonical.h w07/canonical.c w07/test_canonical.c
git commit -m "w07-l01: canonical input normalisation"
```

---

## Done when

- [ ] `canonical()` strips leading and trailing [whitespace](https://en.wikipedia.org/wiki/Whitespace_character).
- [ ] `canonical()` converts [CR LF](https://en.wikipedia.org/wiki/Newline) to [LF](https://en.wikipedia.org/wiki/Newline).
- [ ] `canonical()` lowercases all [ASCII](https://en.wikipedia.org/wiki/ASCII) bytes.
- [ ] Two logically identical inputs always produce identical output bytes.
- [ ] All-whitespace input returns `*out_len == 0`.
- [ ] Test program compiles with `-Wall -Wextra -Werror` and prints correct hex.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Stripping all `\r` bytes instead of only `\r\n` pairs | Only skip `\r` when the next byte is `\n`. A bare `\r` is valid data. |
| Forgetting to null-terminate `out` | Always write `out[pos] = '\0'` after the loop. |
| Using [strlen()](https://man7.org/linux/man-pages/man3/strlen.3.html) on binary data | Use the `len` parameter. Binary data can contain `\0` bytes before the end. |
| Not handling empty input | Check for `len == 0` or `raw == NULL` and return -1 immediately. |

## Proof

```bash
./test_canonical
# → input: "  Hello\r\n"  canonical hex: 68 65 6c 6c 6f
# → input: "hello"        canonical hex: 68 65 6c 6c 6f
# → input: "\thello\t"    canonical hex: 68 65 6c 6c 6f
# → input: "HELLO\r\n"    canonical hex: 68 65 6c 6c 6f
```

## 🖼️ Hero Visual

```
  raw inputs                    canonical()                output
  ┌──────────────┐             ┌───────────┐            ┌───────────┐
  │ "  Hello\r\n"│──┐         │ 1. trim   │            │ "hello\n" │
  │ "HELLO\r\n"  │──┼────────▶│ 2. CR→LF  │──────────▶│ 68 65 6c  │
  │ "\thello\t"  │──┘         │ 3. lower  │            │ 6c 6f 0a  │
  └──────────────┘             └───────────┘            └───────────┘
  different bytes               one function             same bytes
```

## 🔮 Future Lock

- In [W07 L02](02-digest-tool-verify.md) you will feed canonical output into [SHA-256](https://en.wikipedia.org/wiki/SHA-2) to produce a [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function).
- In [W07 L03](03-proof-record-format.md) the canonical bytes and their digest become a [proof record](03-proof-record-format.md).
- In [W08](../../w08/part.md) [digital signatures](../../w08/part.md) will sign the digest of canonical data — if the input is not canonical, the signature breaks on a different machine.
- In [W13](../../w13/part.md) the [content-addressable store](../../w13/part.md) uses canonical file content as the hash key.
- In [W15](../../w15/part.md) [transparency log](../../w15/part.md) entries are canonical log lines chained by digest.
