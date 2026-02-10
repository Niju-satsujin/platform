---
id: w18-l02
title: "Anchor Checkpoint"
order: 2
type: lesson
duration_min: 40
---

# Anchor Checkpoint

## Goal

Format an [anchor record](lessons/01-append-only-model.md) into the [checkpoint format](https://github.com/transparency-dev/formats/blob/main/log/README.md) defined by the [transparency-dev specification](https://github.com/transparency-dev/formats/blob/main/log/README.md), then sign it so that an external [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) can parse, verify, and [cosign](https://en.wikipedia.org/wiki/Witness_(transparency)) the anchor.

## What you build

A `struct anchor_checkpoint` that holds three text lines: `origin` (a string identifying the log, for example `"trust.example.com/log"`), `tree_size` (decimal string of the anchored size), and `root_hash` (the [Base64](https://en.wikipedia.org/wiki/Base64)-encoded [SHA-256](https://en.wikipedia.org/wiki/SHA-2) root). A `format_anchor_checkpoint()` function that takes an [anchor record](lessons/01-append-only-model.md) and returns the checkpoint as a newline-separated string matching the [transparency-dev checkpoint format](https://github.com/transparency-dev/formats/blob/main/log/README.md). A `sign_anchor_checkpoint()` function that takes the formatted checkpoint and an [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) private key, then appends a blank line followed by a [signature line](https://datatracker.ietf.org/doc/html/rfc6962#section-3) — `<key_hint> <base64_signature>`. A `parse_anchor_checkpoint()` function that takes a raw checkpoint string and returns a populated `anchor_checkpoint` struct, or an error if the format is invalid.

## Why it matters

In [W15 L02](../w15/lessons/02-checkpoint.md) you built a [checkpoint](../w15/lessons/02-checkpoint.md) as a binary struct for internal use. A [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) is an independent third party. It cannot understand your internal struct. The [checkpoint format](https://github.com/transparency-dev/formats/blob/main/log/README.md) is a public specification that any [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) implementation can parse. By formatting your [anchor](lessons/01-append-only-model.md) into this standard layout and signing it with [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519), you make the anchor portable. Any client with your public key can verify the signature. Any [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) that speaks the same format can cosign it. This is how [Certificate Transparency](https://en.wikipedia.org/wiki/Certificate_Transparency) and [Go module transparency](https://go.dev/ref/mod#checksum-database) interoperate across independent operators.

---

## Training Session

### Warmup

Read the [checkpoint format specification](https://github.com/transparency-dev/formats/blob/main/log/README.md). Write down:

1. The exact order of the three header lines: origin, tree size, root hash.
2. How the signature block is separated from the header (a blank line).
3. What [Base64 encoding](https://en.wikipedia.org/wiki/Base64) is used for the root hash (standard, not URL-safe).

### Work

#### Do

1. Create `w18/anchor_checkpoint.h`.
2. Define `struct anchor_checkpoint` with `char origin[256]`, `uint64_t tree_size`, `uint8_t root_hash[32]`, and `char signed_note[1024]` for the full signed output.
3. Create `w18/anchor_checkpoint.c`.
4. Write `format_anchor_checkpoint()`:
   - Accept a pointer to an [anchor record](lessons/01-append-only-model.md) and an origin string.
   - Write line 1: the origin string.
   - Write line 2: the decimal tree size.
   - Write line 3: the [Base64](https://en.wikipedia.org/wiki/Base64)-encoded root hash.
   - Terminate with a newline. Return the formatted string.
5. Write `sign_anchor_checkpoint()`:
   - Accept the formatted checkpoint, an [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) private key, and a 4-byte key hint.
   - Compute the [Ed25519 signature](https://en.wikipedia.org/wiki/EdDSA#Ed25519) over the header bytes.
   - Append a blank line, then `<key_hint_base64> <signature_base64>`, then a final newline.
   - Return the full signed note.
6. Write `parse_anchor_checkpoint()`:
   - Split on newlines. Validate three header lines.
   - Decode the [Base64](https://en.wikipedia.org/wiki/Base64) root hash. Parse the tree size.
   - Return the populated struct, or an error code for malformed input.
7. Write a `main()` test: format an anchor checkpoint, sign it, parse it back, and print each field.

#### Test

```bash
gcc -Wall -Wextra -Werror -o anchor_ckpt_test \
  w18/anchor_checkpoint.c w18/anchor_record.c -lcrypto
./anchor_ckpt_test
```

#### Expected

Output shows the formatted checkpoint, the signature line, and the parsed fields matching the originals. No crashes.

### Prove It

```bash
# Verify the signature with openssl
./anchor_ckpt_test | head -4 > /tmp/ckpt_header.txt
# Signature verification passes
```

### Ship It

```bash
git add w18/anchor_checkpoint.h w18/anchor_checkpoint.c
git commit -m "w18-l02: anchor checkpoint format and signing"
```

---

## Done when

- `format_anchor_checkpoint()` produces output that matches the [transparency-dev checkpoint format](https://github.com/transparency-dev/formats/blob/main/log/README.md) byte-for-byte.
- `sign_anchor_checkpoint()` appends a valid [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) signature block.
- `parse_anchor_checkpoint()` round-trips: format → sign → parse returns identical fields.
- Malformed input (missing line, bad [Base64](https://en.wikipedia.org/wiki/Base64), negative size) returns an error code without crashing.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Using URL-safe [Base64](https://en.wikipedia.org/wiki/Base64) instead of standard | The [checkpoint format](https://github.com/transparency-dev/formats/blob/main/log/README.md) uses standard [Base64](https://en.wikipedia.org/wiki/Base64) with `+` and `/`, not `-` and `_`. |
| Missing the trailing newline after the header | The spec requires a newline after the root hash line, before the blank separator. Omitting it breaks every parser. |
| Signing the entire note including the signature block | Sign only the header lines. The signature block is appended after signing. Signing the signature creates a circular dependency. |
| Hardcoding the origin string | The origin [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be a parameter. Different logs have different origins. |

## Proof

```bash
./anchor_ckpt_test
# → trust.example.com/log
# → 42
# → oWV1b2x5c2lz... (base64 root)
# →
# → AQIDBAUGBw== Zm9vYmFy... (key_hint + signature)
# → Parsed: origin=trust.example.com/log size=42 root=a1b2c3d4...
```

## Hero visual

```
  anchor_record                format_anchor_checkpoint()           signed note
  ┌──────────────┐            ┌──────────────────────────┐     ┌────────────────────────┐
  │ tree_size=42 │            │ trust.example.com/log    │     │ trust.example.com/log  │
  │ root=a1b2... │  ──────▶  │ 42                       │ ──▶ │ 42                     │
  │ witness=...  │            │ oWV1b2x5c2lz...         │     │ oWV1b2x5c2lz...       │
  └──────────────┘            │                          │     │                        │
                              └──────────────────────────┘     │ AQIDBAUGBw== Zm9v...   │
                                 header only                   └────────────────────────┘
                                                                  header + signature
```

## Future Lock

- In [W18 L03](03-consistency-proof.md) you will generate a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) that links the anchored tree size to the current log head — proving nothing changed between two anchor events.
- In [W18 L04](04-audit-client.md) the [audit client](04-audit-client.md) will call `parse_anchor_checkpoint()` to decode anchors fetched from the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)).
- In [W19](../w19/part.md) [trust bundles](../w19/part.md) will carry these signed notes so clients verify anchors offline.
- In [W20](../w20/part.md) [chaos tests](../w20/part.md) will mutate checkpoint bytes to confirm that `parse_anchor_checkpoint()` rejects all corrupted inputs.
