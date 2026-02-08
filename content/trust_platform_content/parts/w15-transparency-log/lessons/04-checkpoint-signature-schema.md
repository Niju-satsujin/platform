---
id: w15-transparency-log-d04-checkpoint-signature-schema
part: w15-transparency-log
title: "Checkpoint Signature Schema"
order: 4
duration_minutes: 120
prereqs: ["w15-transparency-log-d03-consistency-proof-rules"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Checkpoint Signature Schema

## Goal

Checkpoints anchor proofs, but an unsigned checkpoint can be forged by anyone.
Today you add cryptographic signatures. The invariant: **every checkpoint includes
a monotonic sequence number plus a signing key ID, and is signed by the log
operator's private key**. Clients verify the signature before trusting the
checkpoint. No valid signature → no trust.

✅ Deliverables

1. Define a `SignedCheckpoint` schema: `{size, root, sequence, key_id, signature}`.
2. Implement checkpoint signing using Ed25519 (via libsodium or OpenSSL).
3. Implement checkpoint signature verification.
4. Enforce monotonic sequence: new checkpoint sequence > all previous sequences.
5. Reject checkpoints with unknown key_id or invalid signature.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Signed checkpoint verifies with the correct public key | signature valid |
| 2 | Tampered checkpoint (changed root) fails verification | signature invalid |
| 3 | Checkpoint with wrong key_id is rejected | unknown key rejection |
| 4 | Sequence numbers are strictly monotonic | each > previous |
| 5 | Signature covers ALL fields (size, root, sequence, key_id) | tampering any field fails |

## What You're Building Today

A `CheckpointSigner` and `CheckpointVerifier` that use Ed25519 to sign and verify
checkpoint structs. The signing operation covers the canonical byte representation
of all fields, ensuring any modification invalidates the signature.

✅ Deliverables

- `signed_checkpoint.h` / `signed_checkpoint.cpp` — schema, sign, verify.
- `keygen.cpp` — CLI to generate Ed25519 keypair.
- Updated `log.h` / `log.cpp` — auto-sign on checkpoint creation.
- `test_signature.cpp` — positive, tamper, and key mismatch tests.

```cpp
// Quick taste
CheckpointSigner signer(private_key, "log-key-2026-01");
SignedCheckpoint scp = signer.sign(log.checkpoint());
// scp.signature = Ed25519(private_key, canonical_bytes(scp))

CheckpointVerifier verifier({{"log-key-2026-01", public_key}});
bool ok = verifier.verify(scp);  // checks signature + key_id
```

**Can:**
- Sign checkpoints with Ed25519.
- Verify signatures with the corresponding public key.
- Reject tampered or unknown-key checkpoints.

**Cannot (yet):**
- Orchestrate full client verification workflow (Day 5).
- Rotate keys (requires key rotation protocol).

## Why This Matters

🔴 **Without signed checkpoints**

1. Anyone can fabricate a checkpoint with an arbitrary root—inclusion proofs become meaningless.
2. No accountability—you cannot prove which log operator published a checkpoint.
3. MITM attacks can substitute checkpoints during transit.
4. No non-repudiation—the operator can deny publishing a malicious checkpoint.

🟢 **With signed checkpoints**

1. Only the key holder can produce valid checkpoints—forgery requires the private key.
2. Signatures provide non-repudiation—evidence of who signed what.
3. Key ID enables key rotation and multi-operator setups.
4. Clients have a cryptographic anchor for all proof verification.

🔗 **Connects to**

1. Day 1 — Checkpoints commit to the log's append-only state.
2. Day 2 — Inclusion bundles now carry signed checkpoints.
3. Day 3 — Consistency proofs bridge signed checkpoints.
4. Day 5 — Verifier workflow checks signature before accepting any proof.
5. Week 16 — Monitors exchange signed checkpoints in gossip messages.

🧠 **Mental model:** A notary seal on a document. The document (checkpoint) can
be read by anyone, but only the notary (private key holder) can stamp it. The
stamp (signature) proves the notary approved this exact document. Change one word
and the stamp is invalid.

## Visual Model

```
┌────────────────────────────────────────────────────────┐
│           Signed Checkpoint Schema                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────┐              │
│  │  SignedCheckpoint                    │              │
│  │  ├─ size:     10                     │              │
│  │  ├─ root:     "ab12cd34..."          │              │
│  │  ├─ sequence: 42                     │              │
│  │  ├─ key_id:   "log-key-2026-01"      │              │
│  │  └─ signature: "e5f6a7b8..."         │              │
│  └──────────────────────────────────────┘              │
│                     │                                  │
│                     ▼                                  │
│  Signing: Ed25519(sk, canonical_bytes(fields))         │
│                                                        │
│  canonical_bytes =                                     │
│    encode(size) || encode(root) ||                     │
│    encode(sequence) || encode(key_id)                  │
│                                                        │
│  Verification:                                         │
│  ┌──────────────────────────────────────┐              │
│  │ 1. Look up key_id in trusted set     │              │
│  │    → unknown? REJECT                 │              │
│  │ 2. Rebuild canonical_bytes           │              │
│  │ 3. Ed25519_verify(pk, bytes, sig)    │              │
│  │    → invalid? REJECT                 │              │
│  │ 4. Check sequence > last_seen        │              │
│  │    → regression? REJECT              │              │
│  │ 5. ACCEPT                            │              │
│  └──────────────────────────────────────┘              │
└────────────────────────────────────────────────────────┘
```

## Build

**File:** `week-15/day4-checkpoint-signature-schema/signed_checkpoint.h`

```cpp
#pragma once
#include <string>
#include <cstdint>
#include <vector>
#include <unordered_map>

struct SignedCheckpoint {
    uint64_t size;
    std::string root;
    uint64_t sequence;
    std::string key_id;
    std::string signature;  // hex-encoded Ed25519 signature

    // Canonical byte representation for signing
    std::vector<uint8_t> canonical_bytes() const;
    std::string to_json() const;
    static SignedCheckpoint from_json(const std::string& json);
};

class CheckpointSigner {
public:
    CheckpointSigner(const std::vector<uint8_t>& private_key,
                     const std::string& key_id);

    SignedCheckpoint sign(uint64_t size, const std::string& root,
                          uint64_t sequence);

private:
    std::vector<uint8_t> private_key_;
    std::string key_id_;
};

class CheckpointVerifier {
public:
    // trusted_keys: key_id → public key
    explicit CheckpointVerifier(
        const std::unordered_map<std::string,
            std::vector<uint8_t>>& trusted_keys);

    bool verify(const SignedCheckpoint& cp) const;

private:
    std::unordered_map<std::string, std::vector<uint8_t>> trusted_keys_;
};
```

**File:** `week-15/day4-checkpoint-signature-schema/signed_checkpoint.cpp`

```cpp
#include "signed_checkpoint.h"
#include <openssl/evp.h>
#include <stdexcept>
#include <sstream>
#include <cstring>

std::vector<uint8_t> SignedCheckpoint::canonical_bytes() const {
    std::vector<uint8_t> buf;
    // Encode size as 8 bytes big-endian
    for (int i = 7; i >= 0; --i)
        buf.push_back(static_cast<uint8_t>((size >> (i * 8)) & 0xFF));
    // Encode root
    buf.insert(buf.end(), root.begin(), root.end());
    // Encode sequence as 8 bytes big-endian
    for (int i = 7; i >= 0; --i)
        buf.push_back(static_cast<uint8_t>((sequence >> (i * 8)) & 0xFF));
    // Encode key_id
    buf.insert(buf.end(), key_id.begin(), key_id.end());
    return buf;
}

SignedCheckpoint CheckpointSigner::sign(uint64_t size,
                                         const std::string& root,
                                         uint64_t sequence) {
    SignedCheckpoint cp{size, root, sequence, key_id_, ""};
    auto bytes = cp.canonical_bytes();

    // Ed25519 signing via OpenSSL EVP API
    EVP_PKEY* pkey = EVP_PKEY_new_raw_private_key(
        EVP_PKEY_ED25519, nullptr,
        private_key_.data(), private_key_.size());
    if (!pkey) throw std::runtime_error("failed to load private key");

    EVP_MD_CTX* ctx = EVP_MD_CTX_new();
    size_t sig_len = 64;
    std::vector<uint8_t> sig(sig_len);
    EVP_DigestSignInit(ctx, nullptr, nullptr, nullptr, pkey);
    EVP_DigestSign(ctx, sig.data(), &sig_len, bytes.data(), bytes.size());

    // Hex-encode signature
    std::ostringstream oss;
    for (size_t i = 0; i < sig_len; ++i)
        oss << std::hex << std::setfill('0') << std::setw(2)
            << static_cast<int>(sig[i]);
    cp.signature = oss.str();

    EVP_MD_CTX_free(ctx);
    EVP_PKEY_free(pkey);
    return cp;
}
```

## Do

1. **Define canonical byte encoding**
   💡 WHY: The signature must cover a deterministic byte representation. If
   encoding is non-deterministic (e.g., JSON key order), the same checkpoint
   could produce different byte sequences, breaking verification.
   - Big-endian fixed-width integers for size and sequence.
   - Raw bytes for root and key_id. No JSON—just binary.

2. **Implement Ed25519 signing**
   💡 WHY: Ed25519 is fast, deterministic (no nonce needed), and has a clean
   API. It is the standard for transparency log signatures (e.g., Go SumDB).
   - Use OpenSSL's `EVP_PKEY_ED25519` API.
   - Generate keypair with `openssl genpkey -algorithm Ed25519`.

3. **Implement signature verification**
   💡 WHY: Verification is the client-side security gate. It must look up the
   key_id in a trusted set, reject unknown keys, and verify the signature.
   - Look up `key_id` → public key.
   - `EVP_DigestVerify()` with canonical bytes and signature.

4. **Enforce monotonic sequence**
   💡 WHY: Monotonic sequences prevent replay—an old checkpoint with a lower
   sequence number cannot be presented as current.
   - Track `last_seen_sequence` per key_id.
   - New checkpoint sequence must be strictly greater.

5. **Test tamper detection**
   💡 WHY: The signature must catch ANY modification—change one bit of any
   field and verification must fail.
   - Sign checkpoint, verify (OK). Change root, verify (FAIL).
   - Change sequence, verify (FAIL). Change key_id, verify (FAIL).
   - Record all results in `proof.txt`.

## Done when

- [ ] Signed checkpoint verifies with correct public key — *proves signature correctness*
- [ ] Tampered root invalidates the signature — *proves integrity protection*
- [ ] Unknown key_id is rejected — *proves trust boundary*
- [ ] Sequence numbers are strictly monotonic — *proves replay prevention*
- [ ] Changing ANY field invalidates the signature — *proves complete coverage*

## Proof

Paste or upload:
1. Signed checkpoint JSON with all 5 fields.
2. Verification output: OK for valid, FAIL for tampered (3 tamper variants).
3. Sequence monotonicity test output.

**Quick self-test**

Q: Why use Ed25519 instead of RSA for checkpoint signing?
A: Ed25519 signatures are 64 bytes (vs 256+ for RSA), signing is faster, and the algorithm is deterministic (no random nonce that could leak the key if the RNG is broken).

Q: Why does canonical_bytes use fixed-width big-endian integers?
A: Variable-length encodings can be ambiguous (e.g., is `[0x01, 0x02]` the number 258 or two separate bytes?). Fixed-width big-endian is unambiguous and consistent across platforms.

Q: What happens if the log operator's private key is compromised?
A: All checkpoints signed by that key become suspect. The key_id system supports key rotation—publish a new key_id and transition. Clients update their trusted key set.
