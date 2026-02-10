---
id: w07-l03
title: "Proof Record Format"
order: 3
type: lesson
duration_min: 35
---

# Proof Record Format

## Goal

Design a `proof_record` struct that bundles the [canonical input](01-canonical-input.md), the [algorithm](https://en.wikipedia.org/wiki/SHA-2) name, the [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function), and a [Unix timestamp](https://en.wikipedia.org/wiki/Unix_time) into one self-describing record.

## What you build

A C struct `proof_record` with four fields: `canonical_input` (the normalised bytes), `algorithm` (the string `"sha256"`), `digest` (32 bytes), and `timestamp` (seconds since [epoch](https://en.wikipedia.org/wiki/Unix_time)). A function `proof_record_create()` fills the struct. A function `proof_record_verify()` re-hashes the `canonical_input` and checks that the result matches the stored `digest`. A function `proof_record_print()` writes the record as a human-readable text block.

## Why it matters

A bare digest is useless without context. If someone gives you 32 bytes, you cannot tell what was hashed, which [algorithm](https://en.wikipedia.org/wiki/SHA-2) was used, or when. A [proof record](https://en.wikipedia.org/wiki/Proof_of_work) answers all three questions. This is the same idea behind [signed commits in Git](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work) and [certificate transparency logs](https://certificate.transparency.dev/). In [W15](../../w15/part.md) your [transparency log](../../w15/part.md) will store chains of proof records.

---

## Training Session

### Warmup — what belongs in a proof

1. Think about what a judge needs to trust a piece of evidence: the evidence itself, when it was collected, and how it was sealed. A [proof record](https://en.wikipedia.org/wiki/Proof_of_work) is the digital version.
2. Read the first paragraph of [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119). Note the meaning of [MUST](https://datatracker.ietf.org/doc/html/rfc2119), [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119), and [MAY](https://datatracker.ietf.org/doc/html/rfc2119).
3. Write down: what four pieces of information [MUST](https://datatracker.ietf.org/doc/html/rfc2119) a proof record contain?

### Work — building the proof record

#### Do

1. Create `w07/proof_record.h`. Define `struct proof_record` with:
   - `char canonical_input[4096]` — the normalised input bytes.
   - `size_t input_len` — how many bytes of `canonical_input` are used.
   - `char algorithm[16]` — the string `"sha256"`.
   - `unsigned char digest[32]` — the [SHA-256](https://en.wikipedia.org/wiki/SHA-2) output.
   - `time_t timestamp` — seconds since [epoch](https://en.wikipedia.org/wiki/Unix_time), from [time()](https://man7.org/linux/man-pages/man2/time.2.html).
2. Declare `int proof_record_create(const char *raw, size_t raw_len, struct proof_record *rec)`.
3. Declare `int proof_record_verify(const struct proof_record *rec)`.
4. Declare `void proof_record_print(const struct proof_record *rec)`.
5. Create `w07/proof_record.c`.
6. In `proof_record_create()`:
   - Call [canonical()](01-canonical-input.md) to normalise `raw` into `rec->canonical_input`. Store the length in `rec->input_len`.
   - Copy `"sha256"` into `rec->algorithm`.
   - Call [sha256()](02-digest-tool-verify.md) on the canonical bytes. Store the result in `rec->digest`.
   - Call [time()](https://man7.org/linux/man-pages/man2/time.2.html) and store the result in `rec->timestamp`.
   - Return 0 on success.
7. In `proof_record_verify()`:
   - Compute [sha256()](02-digest-tool-verify.md) of `rec->canonical_input` with length `rec->input_len`.
   - Compare the result with `rec->digest` using [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html).
   - Return 0 if they match, -1 if they differ.
8. In `proof_record_print()`:
   - Print algorithm, timestamp, input length, and hex digest on separate lines.
9. Create `w07/test_proof_record.c`. In `main()`:
   - Create a proof record from a test string.
   - Print it.
   - Verify it and print PASS or FAIL.
   - Tamper with one byte of the digest. Verify again — it [MUST](https://datatracker.ietf.org/doc/html/rfc2119) fail.

#### Test

```bash
gcc -Wall -Wextra -Werror -o test_proof_record \
  w07/canonical.c w07/digest.c w07/proof_record.c w07/test_proof_record.c -lcrypto
./test_proof_record
```

#### Expected

First verify prints `PASS`. After tampering, second verify prints `FAIL — digest mismatch`. Both results confirm the proof record works.

### Prove — timestamp ordering

1. Create two proof records one second apart (use [sleep(1)](https://man7.org/linux/man-pages/man3/sleep.3.html) between them).
2. Check that the second record's `timestamp` is greater than the first.
3. This ordering property is the foundation of [append-only logs in W15](../../w15/part.md).

### Ship — commit your work

```bash
git add w07/proof_record.h w07/proof_record.c w07/test_proof_record.c
git commit -m "w07-l03: proof record create, verify, print"
```

---

## Done when

- [ ] `proof_record_create()` fills all four fields: canonical input, algorithm, digest, timestamp.
- [ ] `proof_record_verify()` re-hashes and compares.
- [ ] Verify returns success on an untampered record.
- [ ] Verify returns failure when any byte of the digest is changed.
- [ ] `proof_record_print()` displays a human-readable summary.
- [ ] Compiles with `-Wall -Wextra -Werror -lcrypto`.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Storing raw input instead of [canonical](01-canonical-input.md) input | Always run [canonical()](01-canonical-input.md) first. The record [MUST](https://datatracker.ietf.org/doc/html/rfc2119) hold normalised bytes. |
| Comparing digests with [strcmp()](https://man7.org/linux/man-pages/man3/strcmp.3.html) | Digests are binary. Use [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html) with length 32. |
| Forgetting to set `input_len` | Without the length, `proof_record_verify()` does not know how many bytes to hash. |
| Hardcoding the algorithm instead of storing it | Always store the algorithm string. Future weeks may add [SHA-512](https://en.wikipedia.org/wiki/SHA-2) or other algorithms. |

## Proof

```bash
./test_proof_record
# → algorithm: sha256
# → timestamp: 1770681600
# → input_len: 5
# → digest: 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
# → verify: PASS
# → tampered verify: FAIL — digest mismatch
```

## 🖼️ Hero Visual

```
  ┌─────────────────────────────────────┐
  │          proof_record               │
  ├─────────────────────────────────────┤
  │ algorithm:  "sha256"                │
  │ timestamp:  1770681600              │
  │ input_len:  5                       │
  │ canonical:  68 65 6c 6c 6f          │
  │ digest:     2cf24dba...938b9824     │
  └─────────────────────────────────────┘
        │                     │
        ▼                     ▼
  re-hash canonical     compare with stored
  input to verify       digest → PASS / FAIL
```

## 🔮 Future Lock

- In [W07 L04](04-collision-thinking.md) you will reason about what happens when two different inputs produce the same [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function) — a [collision](https://en.wikipedia.org/wiki/Birthday_attack).
- In [W08](../../w08/part.md) you will add a [digital signature](../../w08/part.md) field to the proof record, signing the digest with a private key.
- In [W14](../../w14/part.md) proof records become the leaves of a [Merkle tree](../../w14/part.md).
- In [W15](../../w15/part.md) each [transparency log](../../w15/part.md) entry is a proof record whose digest chains to the previous entry.
