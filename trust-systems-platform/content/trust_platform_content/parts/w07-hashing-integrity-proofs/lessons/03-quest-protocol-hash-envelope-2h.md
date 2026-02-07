---
id: w07-hashing-integrity-proofs-d03-quest-protocol-hash-envelope-2h
part: w07-hashing-integrity-proofs
title: "Quest: Protocol Hash Envelope  2h"
order: 3
duration_minutes: 120
prereqs: ["w07-hashing-integrity-proofs-d02-quest-streaming-hash-plan-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Protocol Hash Envelope  2h

## Goal

You can hash files and buffers. Now you need to embed that hash *inside a network protocol message* so the receiver can verify integrity before processing the payload. Today you design a **hash envelope** — a message format that includes a SHA-256 digest of the payload in the header. Any mismatch between the declared hash and the computed hash triggers an immediate reject with full forensic logging.

By end of this session you will have:

- ✅ Designed a binary envelope format with a hash field in the header
- ✅ Implemented sender-side envelope creation (hash payload → write header + payload)
- ✅ Implemented receiver-side verification (read header → hash payload → compare)
- ✅ Rejected mismatched messages with a structured audit log entry
- ✅ Tested with deliberately corrupted payloads to prove detection

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Envelope header contains 32-byte SHA-256 field | Hex dump first 64 bytes |
| 2 | Receiver recomputes hash and compares before processing | Code path verified |
| 3 | Corrupted payload detected and rejected | Flip one bit, observe reject |
| 4 | Reject log includes expected hash, actual hash, sender IP, timestamp | Grep log |
| 5 | Valid payloads pass verification and are processed normally | End-to-end echo test |

## What You're Building Today

You are building a sender/receiver pair that wraps every message in a hash envelope. The sender hashes the payload, writes the header (magic + version + payload length + hash), then writes the payload. The receiver reads the header, reads the payload, recomputes the hash, and only processes the message if the hashes match.

- ✅ An `EnvelopeHeader` struct with magic, version, payload_len, and sha256 fields
- ✅ A `send_envelope(fd, payload, len)` function
- ✅ A `recv_envelope(fd, &payload) -> VerifyResult` function
- ✅ A `VerifyResult` enum: `Ok`, `HashMismatch`, `ReadError`, `InvalidHeader`

```cpp
struct EnvelopeHeader {
    uint32_t magic;         // 0x48534832 ("HSH2")
    uint8_t  version;       // 1
    uint8_t  reserved[3];
    uint32_t payload_len;   // network byte order
    uint8_t  sha256[32];    // SHA-256 of payload bytes
}; // 44 bytes total, packed
static_assert(sizeof(EnvelopeHeader) == 44);
```

You **can**: add HMAC support, compress the payload before hashing.

You **cannot yet**: add cryptographic signatures to the envelope — that is Week 8 Day 4 (Signed Envelope v1).

## Why This Matters

🔴 **Without this, you will:**
- Process corrupted data silently — bit flips, truncation, and injection all go undetected
- Have no forensic evidence when data corruption causes downstream bugs
- Rely on TCP checksums alone, which are only 16-bit CRC and miss multi-bit errors
- Be unable to prove to an auditor that data was intact when received

🟢 **With this, you will:**
- Detect any payload corruption (accidental or malicious) before processing
- Log a forensic-quality audit trail for every rejected message
- Build the foundation for Week 8's signed envelopes (hash + signature)
- Demonstrate defense-in-depth beyond TCP checksums

🔗 **How this connects:**
- **Week 7 Day 1** (hash use cases) — the hash function you built is now embedded in a protocol
- **Week 7 Day 2** (streaming hash) — large payloads use the streaming hasher
- **Week 7 Day 4** (canonicalization) — tomorrow ensures the header itself is hashed canonically
- **Week 8 Day 2** (sign/verify) — the signature covers the hash in the envelope header
- **Week 8 Day 4** (signed envelope v1) — extends this envelope with signature and key_id fields

🧠 **Mental model: "Tamper-Evident Seal"** — the hash is a tamper-evident seal on a shipping container. When the container arrives, the receiver checks the seal. If broken (hash mismatch), the contents are quarantined and the event is logged. You never open a broken seal and use the contents.

## Visual Model

```
  Sender                              Receiver
  ┌────────────────┐                  ┌────────────────────────┐
  │ payload bytes   │                  │ read EnvelopeHeader    │
  │ [0xDE 0xAD ...] │                  │   magic = 0x48534832?  │
  │       │         │                  │   version = 1?         │
  │       ▼         │                  │   payload_len ≤ MAX?   │
  │ SHA-256(payload)│                  │       │                │
  │ = abc123...     │                  │       ▼                │
  │       │         │    TCP           │ read payload_len bytes │
  │       ▼         │ ──────────────▶  │       │                │
  │ ┌────────────┐  │                  │       ▼                │
  │ │  Header    │  │                  │ SHA-256(payload)       │
  │ │ magic+ver  │  │                  │ = actual_hash          │
  │ │ len+sha256 │  │                  │       │                │
  │ ├────────────┤  │                  │ actual == header.sha?  │
  │ │  Payload   │  │                  │  ✅ process            │
  │ │  (raw)     │  │                  │  ❌ REJECT + audit log │
  │ └────────────┘  │                  └────────────────────────┘
  └────────────────┘
```

## Build

File: `week-7/day3-protocol-hash-envelope.cpp`

## Do

### 1. **Define the `EnvelopeHeader` as a packed struct**

> 💡 *WHY: Packed structs ensure wire format matches memory layout — no compiler padding means `read(fd, &hdr, 44)` works correctly.*

Use `__attribute__((packed))` on the struct. Define the magic constant. Write `hton_header()` and `ntoh_header()` helpers that convert `payload_len` between host and network byte order. The hash field is raw bytes and needs no conversion.

```cpp
struct __attribute__((packed)) EnvelopeHeader {
    uint32_t magic       = 0x48534832;
    uint8_t  version     = 1;
    uint8_t  reserved[3] = {};
    uint32_t payload_len = 0;
    uint8_t  sha256[32]  = {};
};
```

### 2. **Implement `send_envelope`**

> 💡 *WHY: Hash-then-send ensures the hash is computed over the exact bytes the receiver will see — no serialisation ambiguity.*

Hash the payload with `hash_bytes()` from Day 1. Populate the header: set `payload_len` in network byte order, copy the hash into `sha256`. Write the header, then write the payload. Handle partial writes.

```cpp
int send_envelope(int fd, const uint8_t* payload, uint32_t len) {
    EnvelopeHeader hdr;
    hdr.payload_len = htonl(len);
    auto digest = hash_bytes(payload, len);
    std::memcpy(hdr.sha256, digest.data(), 32);
    write_all(fd, &hdr, sizeof(hdr));
    write_all(fd, payload, len);
    return 0;
}
```

### 3. **Implement `recv_envelope` with verification**

> 💡 *WHY: Verify-before-process is the cardinal rule — never act on data whose integrity is unconfirmed.*

Read exactly `sizeof(EnvelopeHeader)` bytes. Validate magic and version. Read `ntohl(payload_len)` bytes of payload. Hash the payload. Compare the computed hash to `hdr.sha256` using `CRYPTO_memcmp` (constant-time comparison). Return `VerifyResult::Ok` or `VerifyResult::HashMismatch`.

```cpp
VerifyResult recv_envelope(int fd, std::vector<uint8_t>& payload) {
    EnvelopeHeader hdr;
    if (read_all(fd, &hdr, sizeof(hdr)) != sizeof(hdr)) return VerifyResult::ReadError;
    if (hdr.magic != 0x48534832) return VerifyResult::InvalidHeader;
    uint32_t len = ntohl(hdr.payload_len);
    payload.resize(len);
    if (read_all(fd, payload.data(), len) != len) return VerifyResult::ReadError;
    auto actual = hash_bytes(payload.data(), len);
    if (CRYPTO_memcmp(hdr.sha256, actual.data(), 32) != 0)
        return VerifyResult::HashMismatch;
    return VerifyResult::Ok;
}
```

### 4. **Add forensic logging on mismatch**

> 💡 *WHY: A bare "hash mismatch" log is useless for diagnosis. You need expected, actual, sender, and timestamp to find the root cause.*

On `HashMismatch`, emit a JSON log line:

```json
{"event":"hash_mismatch","expected":"abc1...","actual":"def4...","sender":"192.168.1.5","payload_len":1024,"ts":"2026-02-07T12:00:00Z"}
```

### 5. **Test with deliberate corruption**

> 💡 *WHY: If your test suite doesn't include corruption, you have never proven the verification path works.*

Send a valid envelope, verify it passes. Then flip one bit in the payload before calling `recv_envelope`. Verify it returns `HashMismatch` and the log entry is written.

| Test | Expected result |
|------|----------------|
| Valid payload | `VerifyResult::Ok` |
| Flip bit 0 of payload | `VerifyResult::HashMismatch` |
| Truncate payload by 1 byte | `VerifyResult::ReadError` |
| Wrong magic number | `VerifyResult::InvalidHeader` |
| Empty payload (len=0) | `VerifyResult::Ok` (hash of empty is valid) |

## Done when

- [ ] `EnvelopeHeader` is 44 bytes packed with magic, version, len, sha256 — *wire format for W08D4*
- [ ] `send_envelope` hashes payload and writes header + payload atomically — *sender-side integrity*
- [ ] `recv_envelope` verifies hash before returning payload — *verify-before-process*
- [ ] Hash mismatch emits forensic log with expected/actual/sender — *audit trail for compliance*
- [ ] Bit-flip test detects corruption and returns `HashMismatch` — *proves detection works*

## Proof

Paste the output of your corruption test showing one `Ok` result and one `HashMismatch` result **and** the forensic log line from the mismatch case.

**Quick self-test**

1. **Q:** Why use `CRYPTO_memcmp` instead of `memcmp` for hash comparison?
   **A:** `memcmp` short-circuits on the first differing byte, leaking timing information. An attacker could use timing side-channels to guess the expected hash byte-by-byte. `CRYPTO_memcmp` takes constant time regardless of where the mismatch is.

2. **Q:** Could an attacker modify both the payload *and* the hash in the header?
   **A:** Yes. A hash envelope provides integrity against accidental corruption, not against an active attacker who controls the channel. To defend against that, you need cryptographic signatures (Week 8) — the attacker cannot forge a signature without the private key.

3. **Q:** Why include the magic number and version in the header?
   **A:** The magic number (`HSH2`) lets the receiver detect out-of-sync framing (e.g., connecting to the wrong port). The version allows future header format changes without breaking existing receivers.
