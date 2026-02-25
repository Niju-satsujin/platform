---
id: w06-l05
title: "Signed envelope"
order: 5
duration_minutes: 30
xp: 75
kind: lesson
part: w06
proof:
  type: paste
  instructions: "Paste hex dump of a serialized signed envelope showing the signature bytes and payload, plus output of successful deserialization and verification."
  regex_patterns:
    - "signature|sig"
    - "envelope|payload"
    - "valid|verified"
---
# Signed envelope

## Concept

In Week 3, you built a protocol envelope with fields like version, type, and payload. Now you add a **signature field** — the envelope carries cryptographic proof of who sent it.

The key design decision is: **what exactly do you sign?** You do not sign the entire serialized envelope (that would include the signature field itself, creating a chicken-and-egg problem). Instead, you sign the **payload** — the actual message content. The signature covers everything the sender is asserting about the data.

The serialization order matters:

1. Serialize the payload
2. Sign the serialized payload with the sender's secret key
3. Put the signature into the envelope
4. Serialize the entire envelope (which now includes the signature)

On the receiving side:

1. Deserialize the envelope
2. Extract the signature and the payload
3. Verify the signature against the payload and the sender's public key
4. Only process the payload if verification succeeds

This is how real protocols work — TLS, SSH, and Signal all separate "what is signed" from "how it is transported."

## Task

1. Add a `signature` field to your envelope struct (64 bytes, `crypto_sign_BYTES`)
2. Add a `sign_envelope()` function that takes an envelope and a secret key, signs the payload, and fills the signature field
3. Add a `verify_envelope()` function that takes an envelope and a public key, and returns true if the signature is valid
4. Update your serialization to include the 64-byte signature field after the existing header fields
5. Update your deserialization to read the signature field
6. Write a test program that creates an envelope, signs it, serializes it, deserializes it, and verifies it
7. Test that tampering with the payload after signing causes verification to fail

## Hints

- Store the signature as `unsigned char signature[crypto_sign_BYTES]` in your envelope struct
- `crypto_sign_detached()` for signing, `crypto_sign_verify_detached()` for verifying
- Sign the raw payload bytes, not the entire serialized envelope
- In your serialization format, the signature goes at a fixed offset so the receiver knows where to find it
- Consider: put the signature right after the header, before the payload. Layout: `[version][type][key_id][signature][payload_len][payload]`

## Verify

```bash
g++ -std=c++17 -o test_signed_envelope test_signed_envelope.cpp -lsodium
./test_signed_envelope
```

Expected output:
- "Envelope created and signed"
- "Serialized: <N> bytes"
- "Deserialized successfully"
- "Signature verification: VALID"
- "Tampered payload verification: INVALID"

## Done When

Your envelope struct includes a signature field, serialization/deserialization handles it correctly, and verification catches tampered payloads.
