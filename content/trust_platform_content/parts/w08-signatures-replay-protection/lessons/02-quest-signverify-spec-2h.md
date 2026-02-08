---
id: w08-signatures-replay-protection-d02-quest-signverify-spec-2h
part: w08-signatures-replay-protection
title: "Quest: Sign/Verify Spec  2h"
order: 2
duration_minutes: 120
prereqs: ["w08-signatures-replay-protection-d01-quest-key-policy-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Sign/Verify Spec  2h

## Goal

A hash proves data hasn't been accidentally corrupted. A **signature** proves it hasn't been tampered with — and that it came from someone who holds a specific private key. Today you implement the complete sign/verify flow: canonicalise the message, sign the canonical bytes with Ed25519, embed the signature, and verify before processing. The cardinal rule: **reject any unsigned or unverifiable message by default** (fail-closed).

By end of this session you will have:

- ✅ Implemented `sign(canonical_bytes, private_key) -> signature` using Ed25519
- ✅ Implemented `verify(canonical_bytes, signature, public_key) -> bool`
- ✅ Integrated sign/verify into a message send/receive pipeline
- ✅ Enforced fail-closed: unsigned messages rejected at the receiver
- ✅ Tested with valid signatures, invalid signatures, and unsigned messages

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | `sign()` produces a 64-byte Ed25519 signature | Check output length |
| 2 | `verify()` returns true for valid signature, false for tampered | Unit test |
| 3 | Receiver rejects messages with no signature field | Send bare message, see reject |
| 4 | Receiver rejects messages with invalid signature | Flip one bit in sig, see reject |
| 5 | Fail-closed: processing function never called for unverified messages | Add assert before process |

## What You're Building Today

You are building a **sign/verify layer** that wraps around your canonical serialization and message pipeline. The sender signs canonical bytes. The receiver verifies the signature against the declared key_id's public key before any processing.

- ✅ A `sign(bytes, private_key) -> std::array<uint8_t, 64>` function
- ✅ A `verify(bytes, signature, public_key) -> bool` function
- ✅ A `SignedMessage` struct carrying payload + signature + key_id
- ✅ A receiver pipeline that rejects unsigned/invalid messages

```cpp
#include <openssl/evp.h>

std::array<uint8_t, 64> sign_bytes(
    const uint8_t* data, size_t len, EVP_PKEY* private_key) {
    std::array<uint8_t, 64> sig{};
    size_t sig_len = 64;
    EVP_MD_CTX* ctx = EVP_MD_CTX_new();
    EVP_DigestSignInit(ctx, nullptr, nullptr, nullptr, private_key);
    EVP_DigestSign(ctx, sig.data(), &sig_len, data, len);
    EVP_MD_CTX_free(ctx);
    return sig;
}

bool verify_bytes(
    const uint8_t* data, size_t len,
    const uint8_t* sig, size_t sig_len, EVP_PKEY* public_key) {
    EVP_MD_CTX* ctx = EVP_MD_CTX_new();
    EVP_DigestVerifyInit(ctx, nullptr, nullptr, nullptr, public_key);
    int rc = EVP_DigestVerify(ctx, sig, sig_len, data, len);
    EVP_MD_CTX_free(ctx);
    return rc == 1;
}
```

You **can**: add support for batch verification, pre-hashing for large messages.

You **cannot yet**: defend against replay attacks — that is Day 3 (Replay Defense).

## Why This Matters

🔴 **Without this, you will:**
- Accept messages from any source — an attacker on the network can inject forged commands
- Have no proof of authorship — you cannot tell who sent a message
- Process tampered data that passes hash checks (attacker recomputes hash after tampering)
- Fail open by default, processing messages when signature verification is "not yet implemented"

🟢 **With this, you will:**
- Authenticate every message: only the private key holder can produce a valid signature
- Detect tampering that even hash-only integrity would miss (attacker can forge hash + payload)
- Enforce fail-closed semantics: no signature = no processing, period
- Build the signing primitive that the signed envelope (Day 4) packages for the wire

🔗 **How this connects:**
- **Week 8 Day 1** (key policy) — provides the key pair used for signing and verification
- **Week 7 Day 4** (canonicalization) — canonical bytes are what you sign, not raw structs
- **Week 8 Day 3** (replay defense) — signatures alone don't prevent replay; nonces do
- **Week 8 Day 4** (signed envelope v1) — wraps sign/verify into a complete wire format
- **Week 8 Day 5** (verify performance) — optimises the verification hot path

🧠 **Mental model: "Wax Seal on a Letter"** — the signature is a wax seal. Only the sender has the seal stamp (private key). The receiver recognises the seal pattern (public key). A broken or missing seal means the letter is not trusted. Unlike a hash (which anyone can compute), a signature can only be made by the key holder.

## Visual Model

```
  Sender                                 Receiver
  ┌────────────────────┐                 ┌──────────────────────────┐
  │ Message payload     │                 │ Read SignedMessage        │
  │       │             │                 │       │                  │
  │       ▼             │                 │       ▼                  │
  │ canonical_serialize │                 │ Has signature field?     │
  │       │             │                 │  NO ──▶ REJECT (no sig) │
  │       ▼             │                 │  YES ──▼                 │
  │ sign(bytes, privkey)│    network      │ Look up key_id           │
  │       │             │ ─────────────▶  │  NOT FOUND ──▶ REJECT   │
  │       ▼             │                 │  FOUND ──▼               │
  │ ┌──────────────┐    │                 │ canonical_serialize      │
  │ │SignedMessage  │    │                 │       │                  │
  │ │ key_id       │    │                 │       ▼                  │
  │ │ payload      │    │                 │ verify(bytes, sig, pub)  │
  │ │ signature    │    │                 │  FALSE ──▶ REJECT        │
  │ └──────────────┘    │                 │  TRUE  ──▶ PROCESS ✅    │
  └────────────────────┘                 └──────────────────────────┘
```

## Build

File: `week-8/day2-sign-verify.cpp`

## Do

### 1. **Implement `sign_bytes` and `verify_bytes`**

> 💡 *WHY: Ed25519 signing takes ~50µs and verification ~100µs — fast enough to sign every message without batching.*

Write the functions as shown above. Note that Ed25519 does NOT use a separate hash step — the algorithm internally hashes with SHA-512. Pass `nullptr` as the digest parameter to `EVP_DigestSignInit`.

### 2. **Define the `SignedMessage` struct**

> 💡 *WHY: Bundling key_id + payload + signature in a single struct ensures all three travel together — you cannot verify without all three.*

```cpp
struct SignedMessage {
    std::string key_id;
    std::vector<uint8_t> payload;         // canonical bytes
    std::array<uint8_t, 64> signature;
};
```

Write `serialize_signed_message()` and `parse_signed_message()` using the `CanonicalWriter`/`CanonicalReader` from Week 7 Day 4.

### 3. **Build the sender pipeline: canonicalise → sign → send**

> 💡 *WHY: The sender must sign the exact canonical bytes that the receiver will verify. Any discrepancy = verification failure.*

Given a logical message struct, canonicalise it with `CanonicalWriter`. Sign the canonical bytes. Build a `SignedMessage`. Serialise and send over the socket.

### 4. **Build the receiver pipeline: receive → verify → process**

> 💡 *WHY: Fail-closed means the default action is rejection. Processing happens only after explicit verification success.*

Receive and parse the `SignedMessage`. Check that `key_id` is known (lookup in `key_metadata.json`). Load the public key. Call `verify_bytes()`. If verification fails or the key is unknown, reject with a log entry and close. Only on `true` do you call the processing function.

```cpp
if (!has_signature(msg)) {
    log_reject("no_signature", msg);
    return;
}
auto* pubkey = key_store.lookup(msg.key_id);
if (!pubkey) {
    log_reject("unknown_key", msg);
    return;
}
if (!verify_bytes(msg.payload.data(), msg.payload.size(),
                  msg.signature.data(), 64, pubkey)) {
    log_reject("invalid_signature", msg);
    return;
}
process(msg);  // only reached on valid signature
```

### 5. **Test all rejection paths**

> 💡 *WHY: Fail-closed must be tested for every failure mode — not just the happy path.*

| Test case | Expected result |
|-----------|----------------|
| Valid signature | `process()` called, message accepted |
| Signature with one bit flipped | Rejected: `invalid_signature` |
| Message with signature field removed | Rejected: `no_signature` |
| Valid signature but unknown key_id | Rejected: `unknown_key` |
| Payload modified after signing | Rejected: `invalid_signature` |

Run all 5 tests and verify the rejection logs.

## Done when

- [ ] `sign_bytes` produces 64-byte Ed25519 signatures — *signing primitive for all messages*
- [ ] `verify_bytes` returns true for valid, false for tampered — *verification primitive*
- [ ] Unsigned messages rejected before processing function is called — *fail-closed enforced*
- [ ] Unknown key_id rejected with structured log — *key management integration*
- [ ] All 5 test cases pass with correct accept/reject outcomes — *comprehensive coverage*

## Proof

Paste your test results table showing all 5 test cases with PASS/FAIL status **and** one sample rejection log line.

**Quick self-test**

1. **Q:** Why sign the canonical bytes instead of the raw payload?
   **A:** If two senders serialise the same logical data differently (different padding, byte order), the signatures won't match even though the data is the same. Canonical bytes guarantee that sign and verify operate on identical input.

2. **Q:** An attacker intercepts a signed message and resends it. Will `verify_bytes` catch this?
   **A:** No. The signature is valid — it was produced by the real sender. This is a **replay attack**. Verification proves authenticity and integrity, not freshness. Replay defense (Day 3) adds nonces and timestamps to catch this.

3. **Q:** Why fail-closed (reject by default) instead of fail-open (accept by default)?
   **A:** Fail-open means every bug in your verification code is a security bypass. Fail-closed means every bug is a denial of service — bad for availability but not for security. In a trust system, security failures are always worse than availability failures.
