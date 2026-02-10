---
id: w08-l03
title: "Canonical Signing Bytes"
order: 3
type: lesson
duration_min: 40
---

# Canonical Signing Bytes

## Goal

Build a `signing_bytes()` function that takes structured fields — action, timestamp, payload — and produces a single deterministic byte buffer that is always the same for the same logical input, regardless of field order or whitespace.

## What you build

A C function `signing_bytes()` that accepts a struct with an action string, a [Unix timestamp](https://en.wikipedia.org/wiki/Unix_time), and a payload byte array. It [canonicalises](https://en.wikipedia.org/wiki/Canonicalization) each field using the [canonical()](../../w07/lessons/01-canonical-input.md) function from [W07](../../w07/part.md), concatenates them with length prefixes, and writes the result to an output buffer. A test program confirms that two structs with the same logical content but different whitespace produce identical signing bytes.

## Why it matters

If you sign raw, unsorted, unformatted data, two machines with the same logical message may produce different bytes and therefore different [signatures](https://en.wikipedia.org/wiki/Digital_signature). That makes verification fail even when the message is genuine. [Canonical signing bytes](https://en.wikipedia.org/wiki/Canonicalization) guarantee that the same logical data always produces the same byte sequence. This idea comes from [W07 canonical input](../../w07/lessons/01-canonical-input.md) but adds structure: fields are sorted, length-prefixed, and concatenated in a fixed order. [Content-addressable stores (W13)](../../w13/part.md) and [Merkle trees (W14)](../../w14/part.md) depend on this property.

---

## Training Session

### Warmup — why raw concatenation fails

1. Think about two fields: `action = "submit"` and `payload = "data"`. If you concatenate them as `"submitdata"`, how do you tell where `action` ends and `payload` begins?
2. Now think about `action = "sub"` and `payload = "mitdata"`. The concatenation is also `"submitdata"`. Two different messages produce the same signing bytes. This is a [canonicalization](https://en.wikipedia.org/wiki/Canonicalization) failure.
3. Length-prefixing solves this: `6:submit4:data` is unambiguous. The receiver reads the length, then reads exactly that many bytes.
4. Review [canonical()](../../w07/lessons/01-canonical-input.md) from [W07](../../w07/part.md). You will reuse it here.

### Work — building the signing bytes function

#### Do

1. Create `w08/signing_bytes.h`. Define a struct `signing_input`:
   - `char action[64]` — the operation name (for example, `"submit"` or `"revoke"`).
   - `time_t timestamp` — seconds since [epoch](https://en.wikipedia.org/wiki/Unix_time), from [time()](https://man7.org/linux/man-pages/man2/time.2.html).
   - `unsigned char payload[4096]` — the message content.
   - `size_t payload_len` — length of the payload.
2. Declare `int signing_bytes(const struct signing_input *input, unsigned char *out, size_t *out_len)`.
3. Create `w08/signing_bytes.c`.
4. In `signing_bytes()`:
   - Canonicalise the `action` field using [canonical()](../../w07/lessons/01-canonical-input.md). This strips whitespace and lowercases.
   - Convert the `timestamp` to a decimal string using [snprintf()](https://man7.org/linux/man-pages/man3/snprintf.3.html).
   - Write the canonical action as a length-prefixed field: write the length as a decimal string, a colon, then the bytes.
   - Write the timestamp string as a length-prefixed field.
   - Write the payload as a length-prefixed field: length, colon, raw bytes.
   - Set `*out_len` to the total number of bytes written.
   - Return 0 on success.
5. Create `w08/test_signing_bytes.c`. In `main()`:
   - Create two `signing_input` structs with the same logical content but different whitespace in the `action` field (for example, `"  Submit "` vs `"submit"`).
   - Call `signing_bytes()` on each.
   - Compare the two output buffers with [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html). They [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be identical.
   - Print the signing bytes as hex for visual inspection.
   - Print PASS or FAIL.

#### Test

```bash
gcc -Wall -Wextra -Werror -o test_signing_bytes \
  w07/canonical.c w08/signing_bytes.c w08/test_signing_bytes.c -lcrypto
./test_signing_bytes
```

#### Expected

Both signing byte buffers are identical. Program prints the hex representation and `PASS`.

### Prove — ambiguity resistance

1. Create two inputs where the action and payload could be confused without length prefixes (for example, `action="ab" payload="cd"` vs `action="abc" payload="d"`).
2. Call `signing_bytes()` on both. Confirm the outputs are different because length prefixes separate the fields.
3. This proves your [canonical signing bytes](https://en.wikipedia.org/wiki/Canonicalization) are unambiguous.

### Ship — commit your work

```bash
git add w08/signing_bytes.h w08/signing_bytes.c w08/test_signing_bytes.c
git commit -m "w08-l03: canonical signing bytes with length-prefixed fields"
```

---

## Done when

- [ ] `signing_bytes()` produces identical output for logically identical inputs with different whitespace.
- [ ] Length-prefixed fields prevent ambiguity between different field values.
- [ ] The timestamp is included in the signing bytes.
- [ ] Output is deterministic — same input always gives same output.
- [ ] Compiles with `-Wall -Wextra -Werror`.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Concatenating fields without length prefixes | Always write `length:data` for each field. Without prefixes, different inputs can produce the same bytes. |
| Forgetting to [canonicalise](https://en.wikipedia.org/wiki/Canonicalization) the action | The action [MUST](https://datatracker.ietf.org/doc/html/rfc2119) go through [canonical()](../../w07/lessons/01-canonical-input.md) first. `"Submit"` and `"submit"` must produce the same bytes. |
| Using [sprintf()](https://man7.org/linux/man-pages/man3/sprintf.3.html) instead of [snprintf()](https://man7.org/linux/man-pages/man3/snprintf.3.html) | [snprintf()](https://man7.org/linux/man-pages/man3/snprintf.3.html) limits output length and prevents buffer overflows. |
| Signing the struct directly instead of the byte buffer | Sign the output of `signing_bytes()`, not the raw struct. The struct may have padding bytes that differ between compilers. |

## Proof

```bash
./test_signing_bytes
# → input A: action="  Submit ", ts=1770681600, payload="hello"
# → input B: action="submit",   ts=1770681600, payload="hello"
# → bytes A: 06 3a 73 75 62 6d 69 74 ... (hex)
# → bytes B: 06 3a 73 75 62 6d 69 74 ... (hex)
# → memcmp: match
# → PASS
```

## 🖼️ Hero Visual

```
  signing_input                     signing_bytes output
  ┌─────────────────────┐         ┌──────────────────────────────┐
  │ action: "  Submit "  │──can──▶│ 6:submit                     │
  │ timestamp: 17706816  │──str──▶│ 10:1770681600                │
  │ payload: "hello"     │──len──▶│ 5:hello                      │
  └─────────────────────┘         └──────────────────────────────┘
                                     deterministic, unambiguous
                                     ──▶ ready to sign
```

## 🔮 Future Lock

- In [W08 L04](04-replay-protection.md) you will add a [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) field to the signing bytes, making each message unique even if the action and payload repeat.
- In [W08 L05](05-envelope-format.md) the [envelope format](05-envelope-format.md) wraps [canonical signing bytes](https://en.wikipedia.org/wiki/Canonicalization) together with metadata and the [signature](https://en.wikipedia.org/wiki/Digital_signature).
- In [W13](../../w13/part.md) the [content-addressable store](../../w13/part.md) hashes canonical signing bytes to produce content addresses.
- In [W14](../../w14/part.md) [Merkle tree](../../w14/part.md) leaves are the [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digest of canonical signing bytes.
