---
id: w08-l05
title: "Envelope Format"
order: 5
type: lesson
duration_min: 45
---

# Envelope Format

## Goal

Design a self-describing [envelope](https://en.wikipedia.org/wiki/Digital_envelope) struct that bundles a header, payload, [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce), and [signature](https://en.wikipedia.org/wiki/Digital_signature) into one package that can be serialised, transmitted, and verified independently.

## What you build

A C struct `envelope` with five fields: a `version` byte, a `header` (action and timestamp), a `payload` (raw message bytes), a `nonce` (16 bytes), and a `signature` (64 bytes). A function `envelope_seal()` builds the [canonical signing bytes](03-canonical-signing-bytes.md), signs them, and fills the envelope. A function `envelope_verify()` re-builds the [canonical signing bytes](03-canonical-signing-bytes.md) from the envelope fields, then calls [verify_message()](02-sign-verify.md) to check the [signature](https://en.wikipedia.org/wiki/Digital_signature). A function `envelope_serialize()` writes the envelope to a byte buffer. A function `envelope_deserialize()` reads it back.

## Why it matters

A bare [signature](https://en.wikipedia.org/wiki/Digital_signature) is useless without knowing what was signed, which algorithm was used, and what version of the format produced it. A self-describing [envelope](https://en.wikipedia.org/wiki/Digital_envelope) answers all these questions. This is the same pattern as [JSON Web Signatures (JWS)](https://en.wikipedia.org/wiki/JSON_Web_Signature), [Protocol Buffers](https://en.wikipedia.org/wiki/Protocol_Buffers) with signed fields, and [certificate formats](https://en.wikipedia.org/wiki/X.509). In [W13](../../w13/part.md) the [content-addressable store](../../w13/part.md) stores envelopes. In [W17](../../w17/part.md) credentials are envelopes. In [W19](../../w19/part.md) trust bundles are collections of envelopes.

---

## Training Session

### Warmup — what belongs in an envelope

1. Think of a physical sealed envelope: it has a return address (header), a letter inside (payload), a unique stamp (nonce), and a wax seal (signature). A digital [envelope](https://en.wikipedia.org/wiki/Digital_envelope) works the same way.
2. Review [canonical signing bytes (L03)](03-canonical-signing-bytes.md). The envelope's verify function re-builds the same bytes and checks the [signature](https://en.wikipedia.org/wiki/Digital_signature).
3. Review [nonce (L04)](04-replay-protection.md). The [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be part of both the envelope and the signing bytes.

### Work — building the envelope

#### Do

1. Create `w08/envelope.h`. Define a struct `envelope`:
   - `uint8_t version` — format version (set to 1).
   - `char action[64]` — the operation name.
   - `time_t timestamp` — seconds since [epoch](https://en.wikipedia.org/wiki/Unix_time).
   - `unsigned char payload[4096]` — the message content.
   - `size_t payload_len` — length of the payload.
   - `unsigned char nonce[NONCE_SIZE]` — the [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) from [L04](04-replay-protection.md).
   - `unsigned char signature[64]` — the [Ed25519 signature](https://en.wikipedia.org/wiki/EdDSA#Ed25519).
   - `size_t sig_len` — length of the signature.
2. Declare `int envelope_seal(struct envelope *env, EVP_PKEY *priv)`.
3. Declare `int envelope_verify(const struct envelope *env, EVP_PKEY *pub)`.
4. Declare `int envelope_serialize(const struct envelope *env, unsigned char *buf, size_t *buf_len)`.
5. Declare `int envelope_deserialize(const unsigned char *buf, size_t buf_len, struct envelope *env)`.
6. Create `w08/envelope.c`.
7. In `envelope_seal()`:
   - Build a [signing_input](03-canonical-signing-bytes.md) from the envelope's action, timestamp, payload, and [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce).
   - Call [signing_bytes()](03-canonical-signing-bytes.md) to get the deterministic byte buffer.
   - Call [sign_message()](02-sign-verify.md) with the [private key](https://en.wikipedia.org/wiki/Public-key_cryptography) and the signing bytes.
   - Store the [signature](https://en.wikipedia.org/wiki/Digital_signature) in the envelope.
   - Return 0 on success.
8. In `envelope_verify()`:
   - Re-build the [signing_input](03-canonical-signing-bytes.md) from the envelope fields.
   - Call [signing_bytes()](03-canonical-signing-bytes.md) to get the same byte buffer.
   - Call [verify_message()](02-sign-verify.md) with the [public key](https://en.wikipedia.org/wiki/Public-key_cryptography), the signing bytes, and the stored [signature](https://en.wikipedia.org/wiki/Digital_signature).
   - Return 0 if valid, -1 if invalid.
9. In `envelope_serialize()`:
   - Write the version byte, then action length and action, then timestamp as 8 bytes, then payload length and payload, then [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) (fixed 16 bytes), then [signature](https://en.wikipedia.org/wiki/Digital_signature) length and signature.
   - Set `*buf_len` to total bytes written.
10. In `envelope_deserialize()`:
    - Read each field back in the same order.
    - Return 0 on success, -1 if the buffer is malformed.
11. Create `w08/test_envelope.c`. In `main()`:
    - Generate a keypair with [ed25519_keygen()](01-keypair-basics.md).
    - Fill an envelope with action `"submit"`, a timestamp, a payload, and a generated [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce).
    - Seal the envelope.
    - Verify the envelope — [MUST](https://datatracker.ietf.org/doc/html/rfc2119) pass.
    - Serialize and deserialize the envelope. Verify the deserialized copy — [MUST](https://datatracker.ietf.org/doc/html/rfc2119) pass.
    - Tamper with one byte of the deserialized payload. Verify — [MUST](https://datatracker.ietf.org/doc/html/rfc2119) fail.
    - Print PASS or FAIL.

#### Test

```bash
gcc -Wall -Wextra -Werror -o test_envelope \
  w07/canonical.c w08/keypair.c w08/sign.c w08/signing_bytes.c \
  w08/nonce.c w08/envelope.c w08/test_envelope.c -lcrypto
./test_envelope
```

#### Expected

Seal succeeds. First verify prints `PASS`. Round-trip serialize/deserialize verify prints `PASS`. Tampered verify prints `FAIL — signature invalid`.

### Prove — version forward-compatibility

1. Create an envelope with `version = 1`.
2. Think about what happens when you add a new field in version 2 (for example, an `algorithm` field). The deserializer can read the version byte first and decide which layout to expect.
3. Write a comment in your code explaining how the version byte enables forward-compatibility.

### Ship — commit your work

```bash
git add w08/envelope.h w08/envelope.c w08/test_envelope.c
git commit -m "w08-l05: self-describing envelope with seal, verify, serialize"
```

---

## Done when

- [ ] `envelope_seal()` builds [canonical signing bytes](03-canonical-signing-bytes.md) and signs them.
- [ ] `envelope_verify()` re-builds signing bytes and checks the [signature](https://en.wikipedia.org/wiki/Digital_signature).
- [ ] `envelope_serialize()` and `envelope_deserialize()` round-trip correctly.
- [ ] Tampered payload causes verification to fail.
- [ ] The [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) is part of the signed data.
- [ ] Compiles with `-Wall -Wextra -Werror -lcrypto`.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Signing the struct bytes directly | Sign the output of [signing_bytes()](03-canonical-signing-bytes.md), not the raw struct. Struct padding varies between compilers. |
| Excluding the [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) from signing bytes | The [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be in the signed data. Otherwise an attacker can swap nonces without invalidating the [signature](https://en.wikipedia.org/wiki/Digital_signature). |
| Forgetting the version byte in serialization | Without the version byte, future format changes break all existing envelopes. |
| Not validating buffer bounds in `envelope_deserialize()` | Always check remaining buffer length before reading each field. |

## Proof

```bash
./test_envelope
# → seal: OK
# → verify: PASS
# → serialize: 197 bytes
# → deserialize + verify: PASS
# → tampered verify: FAIL — signature invalid
# → PASS
```

## 🖼️ Hero Visual

```
  ┌─────────────────────────────────────────────┐
  │                envelope (v1)                 │
  ├──────────┬──────────┬────────┬──────────────┤
  │ version  │ action   │ ts     │ payload      │
  │ 0x01     │ "submit" │ epoch  │ "hello"      │
  ├──────────┴──────────┴────────┴──────────────┤
  │ nonce: 16 random bytes                      │
  ├─────────────────────────────────────────────┤
  │ signature: 64 bytes (Ed25519)               │
  └─────────────────────────────────────────────┘
       │                              │
       ▼                              ▼
  signing_bytes(action,ts,       verify with
  payload,nonce)──▶sign()        public key
```

## 🔮 Future Lock

- In [W08 L06](06-regression-harness.md) the [regression harness](06-regression-harness.md) tests the full envelope lifecycle.
- In [W13](../../w13/part.md) the [content-addressable store](../../w13/part.md) stores envelopes indexed by the [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digest of their serialized bytes.
- In [W17](../../w17/part.md) a [verifiable credential](https://en.wikipedia.org/wiki/Verifiable_credentials) is an envelope whose payload is the credential claim.
- In [W19](../../w19/part.md) a [trust bundle](../../w19/part.md) is a collection of envelopes from different issuers, each independently verifiable.
