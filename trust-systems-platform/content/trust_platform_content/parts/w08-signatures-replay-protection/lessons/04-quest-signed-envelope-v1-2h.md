---
id: w08-signatures-replay-protection-d04-quest-signed-envelope-v1-2h
part: w08-signatures-replay-protection
title: "Quest: Signed Envelope v1  2h"
order: 4
duration_minutes: 120
prereqs: ["w08-signatures-replay-protection-d03-quest-replay-defense-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Signed Envelope v1  2h

## Goal

You have all the ingredients: hashing, canonical serialization, signature creation/verification, and replay defense. Today you combine them into a **single wire format** — the Signed Envelope v1. This is a versioned, self-describing binary message that a receiver can fully validate (integrity, authenticity, freshness) using only the envelope itself and the sender's public key. It must include a protocol version field and mandatory signed metadata for forward compatibility.

By end of this session you will have:

- ✅ Designed the Signed Envelope v1 binary layout with version, key_id, nonce, timestamp, payload_hash, payload, and signature
- ✅ Implemented `seal_envelope(payload, private_key) -> bytes` (sender side)
- ✅ Implemented `open_envelope(bytes, key_store) -> payload | error` (receiver side)
- ✅ Ensured the signature covers all header fields (not just the payload)
- ✅ Tested with valid, tampered-header, tampered-payload, and replayed envelopes

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Envelope starts with magic `0x53454E56` ("SENV") + version byte | Hex dump |
| 2 | Signature covers header fields + payload hash (not raw payload) | Sign input = canonical(header) |
| 3 | Tampered header field (e.g. changed key_id) detected | Modify key_id byte, verify fails |
| 4 | Tampered payload detected via hash mismatch | Modify payload, get hash error |
| 5 | Protocol version checked; unknown version rejected | Set version=99, see reject |

## What You're Building Today

You are building a complete **Signed Envelope v1** format that packages all trust primitives into one self-contained binary message. The sender seals the envelope; the receiver opens it — and opening performs all verification steps automatically.

- ✅ A `SignedEnvelopeV1` struct with all fields
- ✅ A `seal_envelope()` function (hash → sign → serialise)
- ✅ An `open_envelope()` function (parse → verify signature → verify hash → check replay)
- ✅ Comprehensive error reporting for each failure mode

```cpp
struct SignedEnvelopeV1 {
    // Header (signed region)
    uint32_t magic       = 0x53454E56;   // "SENV"
    uint8_t  version     = 1;
    uint8_t  key_id_len;
    // followed by: key_id bytes (variable)
    uint8_t  nonce[16];                   // 128-bit random
    int64_t  timestamp_sec;               // wall clock, big-endian
    uint8_t  payload_hash[32];            // SHA-256 of payload
    uint32_t payload_len;                 // big-endian
    // followed by: payload bytes (variable)

    // Trailer
    uint8_t  signature[64];               // Ed25519 over canonical(header)
};
```

You **can**: add optional extension fields after the payload, add compression.

You **cannot yet**: optimise verification performance — that is Day 5 (Verify Performance).

## Why This Matters

🔴 **Without this, you will:**
- Have integrity, authenticity, and freshness checks scattered across ad-hoc code paths
- Lack a versioned format, making protocol upgrades impossible without breaking all receivers
- Miss signing the header fields — an attacker could swap the key_id or timestamp without detection
- Have no single function a developer can call to "send a trusted message"

🟢 **With this, you will:**
- Provide a one-call API (`seal` / `open`) that enforces all trust checks by construction
- Support forward compatibility via the version byte — v2 can add fields without breaking v1 receivers
- Sign the entire header (including key_id, nonce, timestamp) so no metadata can be tampered
- Have a documented wire format that any team member can implement in any language

🔗 **How this connects:**
- **Week 7 Day 3** (protocol hash envelope) — v1 of the hash-only envelope; today's adds signatures
- **Week 7 Day 4** (canonicalization) — canonical serialization of the header is the signed input
- **Week 8 Day 1** (key policy) — key_id in the header enables key lookup
- **Week 8 Day 2** (sign/verify) — sign and verify functions used inside seal/open
- **Week 8 Day 3** (replay defense) — nonce store checked inside `open_envelope`

🧠 **Mental model: "Certified Mail Envelope"** — a certified mail envelope has: a tracking number (nonce), a postmark date (timestamp), the sender's name (key_id), a sealed flap with wax (signature), and the contents (payload). The post office (receiver) checks the postmark (timestamp window), verifies the seal (signature), confirms the tracking number hasn't been used (nonce store), and only then delivers the contents.

## Visual Model

```
  Signed Envelope v1 — Wire Layout
  ┌──────────────────────────────────────────┐
  │ Bytes   │ Field            │ Notes       │
  │ 0-3     │ magic (0x53454E56)│ "SENV"     │
  │ 4       │ version (0x01)   │ must be 1   │
  │ 5       │ key_id_len       │ N           │
  │ 6..5+N  │ key_id           │ UTF-8       │
  │ +0..+15 │ nonce            │ 128-bit rand│
  │ +16..+23│ timestamp_sec    │ BE int64    │
  │ +24..+55│ payload_hash     │ SHA-256     │
  │ +56..+59│ payload_len      │ BE uint32   │
  │ +60..   │ payload          │ raw bytes   │
  ├──────────────────────────────────────────┤
  │ last 64 │ signature        │ Ed25519     │
  │         │ over canonical(  │             │
  │         │  header fields)  │             │
  └──────────────────────────────────────────┘

  signed_input = canonical(magic ‖ version ‖ key_id
    ‖ nonce ‖ timestamp ‖ payload_hash ‖ payload_len)
```

## Build

File: `week-8/day4-signed-envelope.cpp`

## Do

### 1. **Define the wire layout and signed region**

> 💡 *WHY: The signature must cover ALL header fields. If any field is outside the signed region, an attacker can modify it without detection.*

Document the wire layout as shown above. The **signed input** is the canonical serialization of ALL header fields (magic through payload_len). The signature does NOT cover the raw payload directly — it covers the payload_hash, which transitively authenticates the payload.

```cpp
std::vector<uint8_t> build_signed_input(const SignedEnvelopeV1& env) {
    CanonicalWriter w;
    w.write_u32(env.magic);
    w.write_u8(env.version);
    w.write_bytes(env.key_id.data(), env.key_id.size());
    w.write_bytes(env.nonce, 16);
    w.write_u64(env.timestamp_sec);
    w.write_bytes(env.payload_hash, 32);
    w.write_u32(env.payload_len);
    return w.data();
}
```

### 2. **Implement `seal_envelope`**

> 💡 *WHY: `seal` is a one-call API that enforces the correct order: hash → build header → sign → serialise. A developer cannot skip a step.*

```cpp
std::vector<uint8_t> seal_envelope(
    const uint8_t* payload, uint32_t len,
    const std::string& key_id, EVP_PKEY* privkey) {
    SignedEnvelopeV1 env;
    env.key_id = key_id;
    env.nonce = Nonce::generate();
    env.timestamp_sec = time(nullptr);
    auto hash = hash_bytes(payload, len);
    std::memcpy(env.payload_hash, hash.data(), 32);
    env.payload_len = len;

    auto signed_input = build_signed_input(env);
    auto sig = sign_bytes(signed_input.data(), signed_input.size(), privkey);

    // Serialise: header + payload + signature
    return serialise_envelope(env, payload, sig);
}
```

### 3. **Implement `open_envelope`**

> 💡 *WHY: `open` enforces the correct verification order: parse → check version → verify signature → verify hash → check replay. Every step must pass before the next runs.*

```cpp
OpenResult open_envelope(const uint8_t* data, size_t len,
                         KeyStore& keys, NonceStore& nonces) {
    auto env = parse_envelope(data, len);
    if (!env) return OpenResult::ParseError;
    if (env->version != 1) return OpenResult::UnsupportedVersion;

    auto* pubkey = keys.lookup(env->key_id);
    if (!pubkey) return OpenResult::UnknownKey;

    auto signed_input = build_signed_input(*env);
    if (!verify_bytes(signed_input.data(), signed_input.size(),
                      env->signature, 64, pubkey))
        return OpenResult::InvalidSignature;

    auto actual_hash = hash_bytes(env->payload, env->payload_len);
    if (memcmp(actual_hash.data(), env->payload_hash, 32) != 0)
        return OpenResult::HashMismatch;

    if (!nonces.check_and_insert(env->key_id, env->nonce, env->timestamp_sec))
        return OpenResult::ReplayDetected;

    return OpenResult::Ok(env->payload, env->payload_len);
}
```

### 4. **Add version checking and forward compatibility**

> 💡 *WHY: Without a version byte, you can never change the format. With it, a v1 receiver can reject v2 messages gracefully instead of misinterpreting them.*

Check `version == 1` early in `open_envelope`. Return `UnsupportedVersion` for any other value. In the future, v2 might add fields after `payload_len` — a v1 parser safely ignores them because it reads only the fields it knows.

### 5. **Test all failure modes**

> 💡 *WHY: Each failure mode exercises a different verification layer. Missing any one means that layer is untested.*

| Test | Modify | Expected result |
|------|--------|-----------------|
| Valid envelope | None | `Ok` — payload returned |
| Tamper payload byte | Flip bit in payload | `HashMismatch` |
| Tamper header key_id | Change one char | `InvalidSignature` |
| Tamper header timestamp | Change by 1 | `InvalidSignature` |
| Replay same envelope | Resend exact bytes | `ReplayDetected` |
| Unknown version | Set version=99 | `UnsupportedVersion` |
| Unknown key_id | Use non-existent key | `UnknownKey` |

## Done when

- [ ] Wire layout documented with byte offsets and field types — *spec for any language implementation*
- [ ] `seal_envelope` produces a complete envelope in one call — *correct-by-construction API*
- [ ] `open_envelope` verifies version → signature → hash → replay in order — *defense-in-depth*
- [ ] Signature covers all header fields including key_id and nonce — *no unsigned metadata*
- [ ] All 7 test cases pass with correct error codes — *comprehensive verification*

## Proof

Paste your test results table (all 7 cases) **and** a hex dump of the first 32 bytes of a sealed envelope showing the magic number and version.

**Quick self-test**

1. **Q:** Why sign the `payload_hash` instead of signing the raw payload directly?
   **A:** Signing is computationally expensive for large payloads. Ed25519 internally hashes with SHA-512, but the input should be small. Signing the hash (32 bytes) instead of the payload (potentially MB) keeps signing fast. The hash transitively authenticates the payload.

2. **Q:** Why does the signature cover the `payload_len` field?
   **A:** Without signing `payload_len`, an attacker could truncate the payload and update `payload_len` to match. The truncated payload would have a different hash, but if the attacker also updated the hash... they can't, because the hash is signed too. Still, defense-in-depth: sign everything.

3. **Q:** What happens when you want to add a new mandatory field in v2?
   **A:** v2 envelopes set `version = 2` and include the new field in the signed input. v1 receivers see `version = 2`, return `UnsupportedVersion`, and the sender must negotiate or fall back. This is why version checking is the *first* step in `open_envelope`.
