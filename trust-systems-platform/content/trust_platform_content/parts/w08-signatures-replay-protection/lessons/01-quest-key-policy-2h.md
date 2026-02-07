---
id: w08-signatures-replay-protection-d01-quest-key-policy-2h
part: w08-signatures-replay-protection
title: "Quest: Key Policy  2h"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Key Policy  2h

## Goal

Cryptographic keys are the root of all trust in a signed system. If a private key is leaked, every signature ever made with it is worthless. If keys have no IDs, you cannot rotate them. If keys have no expiry, a compromised key lives forever. Today you define and implement a **key lifecycle policy** — generation, storage, permission enforcement, rotation, and revocation — for Ed25519 signing keys on Linux.

By end of this session you will have:

- ✅ Generated an Ed25519 key pair using OpenSSL or libsodium
- ✅ Stored the private key with restricted file permissions (0600, owned by service user)
- ✅ Assigned a versioned key ID (e.g. `key-v1-20260207`) to each key pair
- ✅ Written a key metadata file linking key ID → public key path → creation date → expiry
- ✅ Implemented a permission check that refuses to load keys with wrong permissions

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Ed25519 key pair generated and written to separate files | `ls -la keys/` |
| 2 | Private key file has permissions 0600 | `stat -c %a keys/private-*.pem` |
| 3 | Key ID includes version and date | Inspect key metadata JSON |
| 4 | Loading a key with 0644 permissions fails with error | Change perms, run loader |
| 5 | Key metadata file links ID → paths → expiry | Cat metadata JSON |

## What You're Building Today

You are building a **key management module** that generates, stores, and loads Ed25519 key pairs with strict permission enforcement. Each key gets a versioned ID, and a metadata file tracks the key inventory.

- ✅ A `KeyPair` struct holding the key ID, public key, and private key bytes
- ✅ A `generate_keypair(key_id) -> KeyPair` function
- ✅ A `store_keypair(dir, keypair)` function that writes files with 0600 permissions
- ✅ A `load_keypair(dir, key_id) -> KeyPair` function that checks permissions before loading
- ✅ A `key_metadata.json` file tracking all keys

```cpp
struct KeyPair {
    std::string key_id;        // e.g. "key-v1-20260207"
    std::array<uint8_t, 32> public_key;
    std::array<uint8_t, 64> private_key;  // Ed25519 expanded secret key
    int64_t created_ns;
    int64_t expires_ns;        // 0 = no expiry (not recommended)
};

bool check_permissions(const std::string& path) {
    struct stat st;
    if (stat(path.c_str(), &st) != 0) return false;
    // Must be owned by current user, mode exactly 0600
    return (st.st_uid == getuid()) && ((st.st_mode & 0777) == 0600);
}
```

You **can**: use PEM encoding, add passphrase encryption for the private key, support RSA as well.

You **cannot yet**: use the keys for signing — that is Day 2 (Sign/Verify Spec).

## Why This Matters

🔴 **Without this, you will:**
- Store private keys world-readable, allowing any local user to forge signatures
- Have no way to identify *which* key signed a message when multiple keys exist
- Be unable to rotate keys because old keys have no IDs and no expiry dates
- Discover a key compromise with no revocation mechanism and no way to invalidate old signatures

🟢 **With this, you will:**
- Enforce least-privilege file permissions — the key is usable only by the service account
- Tag every signature with a key ID so verifiers know which public key to use
- Plan key rotation by tracking creation dates and setting expiry windows
- Build the foundation for revocation lists and key escrow in later weeks

🔗 **How this connects:**
- **Week 8 Day 2** (sign/verify) — uses the key pair to sign and verify messages
- **Week 8 Day 3** (replay defense) — key_id is part of the nonce-uniqueness tuple
- **Week 8 Day 4** (signed envelope v1) — key_id is a mandatory header field
- **Week 8 Day 5** (verify performance) — key caching is keyed by key_id
- **Week 14 Day 2** (key rotation) — automates the rotation lifecycle defined here

🧠 **Mental model: "Passport Office"** — key generation is like issuing a passport: it gets a unique ID (passport number), a creation date, an expiry date, and is stored in a secure vault (0600 permissions). When you present the passport (sign a message), the receiver checks the ID against a registry (public key metadata) to verify it is valid and not expired.

## Visual Model

```
  ┌────────────────────────────────────────────────┐
  │             Key Lifecycle Policy                │
  │                                                │
  │  1. Generate                                   │
  │  ┌──────────┐                                  │
  │  │ Ed25519  │──▶ private.pem (0600)            │
  │  │ keygen   │──▶ public.pem  (0644)            │
  │  └──────────┘                                  │
  │       │                                        │
  │  2. Register                                   │
  │  ┌──────────────────────────────┐              │
  │  │ key_metadata.json            │              │
  │  │ { "key-v1-20260207": {       │              │
  │  │     "public": "keys/pub.pem",│              │
  │  │     "created": "2026-02-07", │              │
  │  │     "expires": "2026-08-07", │              │
  │  │     "status": "active"       │              │
  │  │   }                          │              │
  │  │ }                            │              │
  │  └──────────────────────────────┘              │
  │       │                                        │
  │  3. Load (with permission check)               │
  │  stat(private.pem) ──▶ 0600? ✅ load           │
  │                    ──▶ 0644? ❌ REFUSE          │
  │                                                │
  │  4. Rotate (future: W14D2)                     │
  │  Generate v2 ──▶ mark v1 "retired"             │
  └────────────────────────────────────────────────┘
```

## Build

File: `week-8/day1-key-policy.cpp`

## Do

### 1. **Generate an Ed25519 key pair**

> 💡 *WHY: Ed25519 is fast (sign in ~50µs), has small keys (32 bytes), deterministic signatures, and is not vulnerable to nonce-reuse like ECDSA.*

Use OpenSSL's EVP API to generate an Ed25519 key pair. Alternatively, use libsodium's `crypto_sign_keypair()`. Extract the raw 32-byte public key and 64-byte secret key.

```cpp
#include <openssl/evp.h>
#include <openssl/pem.h>

EVP_PKEY* generate_ed25519() {
    EVP_PKEY_CTX* ctx = EVP_PKEY_CTX_new_id(EVP_PKEY_ED25519, nullptr);
    EVP_PKEY_keygen_init(ctx);
    EVP_PKEY* pkey = nullptr;
    EVP_PKEY_keygen(ctx, &pkey);
    EVP_PKEY_CTX_free(ctx);
    return pkey;
}
```

### 2. **Store keys with restricted permissions**

> 💡 *WHY: A private key readable by other users (0644) is equivalent to no key at all — anyone can sign as you.*

Write the private key to a file. Set permissions with `fchmod(fd, 0600)` *before* writing content (to avoid a race window). Write the public key separately with 0644 permissions (public keys are meant to be distributed).

```cpp
void store_key_file(const std::string& path, const uint8_t* data, size_t len, mode_t mode) {
    int fd = open(path.c_str(), O_WRONLY | O_CREAT | O_TRUNC, mode);
    fchmod(fd, mode);  // enforce mode even if umask is permissive
    write(fd, data, len);
    close(fd);
}
```

### 3. **Assign a versioned key ID**

> 💡 *WHY: Without key IDs, a verifier with multiple public keys must try each one — O(n) per message. With key IDs, it is O(1) lookup.*

Format the key ID as `key-v<version>-<YYYYMMDD>`, e.g. `key-v1-20260207`. Store this alongside the key files. The version number increments on each rotation.

### 4. **Write the key metadata file**

> 💡 *WHY: A metadata registry is the source of truth for which keys are active, expired, or revoked.*

Create `key_metadata.json` with an entry per key:

```json
{
  "key-v1-20260207": {
    "public_path": "keys/key-v1-20260207.pub",
    "private_path": "keys/key-v1-20260207.sec",
    "created": "2026-02-07T00:00:00Z",
    "expires": "2026-08-07T00:00:00Z",
    "status": "active"
  }
}
```

### 5. **Implement and test the permission check**

> 💡 *WHY: A permission check on load is a defence-in-depth control — even if someone accidentally chmods the file, the application refuses to use it.*

Before loading a private key, call `check_permissions()`. If it returns false, log an error with the actual permissions and refuse to load. Test by generating a key, verifying it loads, then `chmod 644` and verifying it fails.

| Test | Expected |
|------|----------|
| Private key with 0600, owned by current user | Load succeeds |
| Private key with 0644 | Load fails with "insecure permissions" error |
| Private key owned by root (run as non-root) | Load fails with "wrong owner" error |
| Missing key file | Load fails with "file not found" error |

## Done when

- [ ] Ed25519 key pair generated with 32-byte public + 64-byte secret — *signing primitive for W08D2*
- [ ] Private key stored with 0600 permissions enforced by `fchmod` — *prevents local key theft*
- [ ] Key ID format `key-v<N>-<date>` assigned to every key pair — *enables O(1) lookup at verify time*
- [ ] `key_metadata.json` tracks all keys with status and expiry — *registry for rotation and revocation*
- [ ] Permission check refuses to load keys with wrong mode or ownership — *defence-in-depth control*

## Proof

Paste the output of `ls -la keys/` showing file permissions **and** the content of `key_metadata.json` for your generated key.

**Quick self-test**

1. **Q:** Why Ed25519 instead of RSA-2048 for signing?
   **A:** Ed25519 signatures are 64 bytes vs RSA's 256 bytes. Signing is ~20× faster. Key generation is instant. Ed25519 is deterministic (no nonce to get wrong). RSA is needed only when interoperating with legacy systems.

2. **Q:** Why set permissions with `fchmod` instead of the `mode` argument to `open()`?
   **A:** The `open()` mode is masked by the process `umask`. If `umask` is 022, `open(path, ..., 0600)` creates the file as 0600 — but only because 0600 & ~022 = 0600. With `umask` 000, it would still be 0600. However, `fchmod` explicitly sets the mode regardless of umask, making the intent unambiguous and immune to umask misconfiguration.

3. **Q:** What should happen when a key expires?
   **A:** Set its status to `"expired"` in the metadata. The signer must refuse to sign with an expired key. The verifier should still accept signatures made *before* the expiry date (check the message timestamp). This prevents valid old messages from becoming unverifiable.
