---
id: w19-offline-verification-package-d02-offline-bundle-format
part: w19-offline-verification-package
title: "Offline Bundle Format"
order: 2
duration_minutes: 120
prereqs: ["w19-offline-verification-package-d01-verifier-ux-contract"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Offline Bundle Format

## Goal

Extend the receipt bundle from Week 18 into a fully self-contained offline verification package that includes a revocation registry snapshot, a key-timeline snapshot, and a freshness attestation. The bundle must verify its own completeness before any cryptographic checks begin.

### ✅ Deliverables

1. An `OfflineBundle` struct extending `ReceiptBundle` with revocation snapshot, key-timeline snapshot, and freshness attestation.
2. A `bundle_integrity_check()` that validates all sections are present and internally consistent (e.g., key-timeline covers the signing key).
3. Deterministic serialisation/deserialisation with a distinct magic header.
4. Unit tests for completeness, integrity, and round-trip fidelity.
5. Shipped design document: `week-19/day2-offline-bundle-format.md`.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | `OfflineBundle` contains all required sections | Inspect struct after construction |
| 2 | Missing revocation snapshot → integrity check fails | Omit snapshot, call check |
| 3 | Key timeline doesn't cover signing key → integrity fails | Use mismatched timeline |
| 4 | Round-trip preserves all fields including snapshots | Serialise → deserialise → compare |
| 5 | Distinct magic header differentiates from ReceiptBundle | First 8 bytes = `0x4F46464C424E444C` |

## What You're Building Today

You are building the "field kit" — everything a verifier needs when there is no network. Imagine a customs inspector at a border crossing with no cell signal. They receive a civic document and this offline bundle. Without making a single network call, they can verify the document's signature, anchoring, key validity, and revocation status.

### ✅ Deliverables

- `offline_bundle.h` — extended bundle struct
- `bundle_integrity.cpp` — pre-crypto integrity checks
- `offline_serde.cpp` — deterministic serialise/deserialise
- `offline_bundle_test.cpp` — completeness and round-trip tests

```cpp
// offline_bundle.h
#pragma once
#include "receipt_bundle.h"
#include "revocation_registry.h"
#include "issuer_key_policy.h"

struct FreshnessAttestation {
    int64_t     attested_at;        // when snapshot was taken
    std::string attester_id;        // who attested freshness
    std::vector<uint8_t> signature; // attester signs the snapshot hash
};

struct OfflineBundle {
    ReceiptBundle              receipt;
    RevocationRegistry         revocation_snapshot;
    IssuerKeyPolicy            key_timeline_snapshot;
    FreshnessAttestation       freshness;
};

struct IntegrityResult {
    bool        passed;
    std::string first_failure;  // empty if passed
};

IntegrityResult bundle_integrity_check(const OfflineBundle& b);
std::vector<uint8_t> serialise_offline_bundle(const OfflineBundle& b);
std::optional<OfflineBundle> deserialise_offline_bundle(
    const std::vector<uint8_t>& bytes);
```

You **can**:
- Verify a civic document with zero network calls.
- Check revocation status against the bundled snapshot.

You **cannot yet**:
- Run the full air-gap verification flow (Day 3).
- Apply time-policy modes to the offline context (Day 4).
- Batch-verify multiple bundles (Day 5).

## Why This Matters

🔴 **Without a self-contained offline bundle:**
- Verifiers in disconnected environments cannot check revocation — they either skip it (insecure) or refuse to verify (unusable).
- Key-timeline lookups fail without network → legitimate documents rejected.
- No freshness attestation → stale snapshots silently accepted.
- Different offline formats lead to interoperability nightmares between agencies.

🟢 **With a self-contained offline bundle:**
- Revocation, key timeline, and freshness travel with the document.
- Verifiers produce the same verdict offline as they would online (given the snapshot).
- Freshness attestation bounds the staleness risk explicitly.
- Standard format enables cross-agency interoperability.

🔗 **Connects:**
- **Week 17 Day 2** (key policy) — key-timeline snapshot is a serialised `IssuerKeyPolicy`.
- **Week 17 Day 4** (revocation) — revocation snapshot is a serialised `RevocationRegistry`.
- **Week 18 Day 2** (receipt bundle) — the `ReceiptBundle` is a sub-component.
- **Week 19 Day 3** (air-gap flow) — the air-gap verifier consumes this bundle exclusively.
- **Week 20 Day 5** (restore validation) — restored nodes rebuild offline bundles for re-verification.

🧠 **Mental model: "Emergency Kit"** — An emergency kit contains everything you need when infrastructure fails: water, flashlight, first-aid, radio. The offline bundle is your verification emergency kit — when the network is gone, you open the kit and have everything: document, proof, keys, revocation list, and a timestamp of when the kit was packed.

## Visual Model

```
┌─────────────── OfflineBundle ────────────────────────┐
│  Magic: 0x4F46464C424E444C ("OFLBNDL")              │
│                                                       │
│  ┌── ReceiptBundle ──────────────────────────────┐   │
│  │  SignedEnvelope + InclusionProof + Keys        │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  ┌── RevocationSnapshot ─────────────────────────┐   │
│  │  revoked_documents: { hash → timestamp }       │   │
│  │  revoked_keys:      { key_id → timestamp }     │   │
│  │  snapshot_at:       1738886400                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  ┌── KeyTimelineSnapshot ────────────────────────┐   │
│  │  KeySlot[] covering signing_key_id             │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  ┌── FreshnessAttestation ───────────────────────┐   │
│  │  attested_at │ attester_id │ signature         │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  bundle_integrity_check() ──▶ passed ✓                │
└───────────────────────────────────────────────────────┘
```

## Build

File: `week-19/day2-offline-bundle-format.md`

## Do

### 1. **Define the OfflineBundle struct**

> 💡 *WHY: Composition over inheritance — the OfflineBundle contains a ReceiptBundle plus the offline-specific snapshots. This makes the ReceiptBundle reusable independently.*

Create `offline_bundle.h`. Include `FreshnessAttestation` with the attester's signature over the combined hash of the revocation and key-timeline snapshots. This proves the snapshots haven't been tampered with.

### 2. **Implement bundle integrity checks**

> 💡 *WHY: Completeness alone isn't enough. The key-timeline snapshot must contain the signing key referenced in the envelope. The revocation snapshot must be timestamped. Integrity checks enforce these cross-section invariants.*

Write `bundle_integrity_check()`: (a) call `bundle_complete()` on the inner `ReceiptBundle`, (b) verify the key-timeline contains a `KeySlot` matching `envelope.signing_key_id`, (c) verify the revocation snapshot has a non-zero `snapshot_at`, (d) verify the freshness attestation signature covers the expected data.

### 3. **Implement serialisation with a new magic header**

> 💡 *WHY: A distinct magic header lets tools auto-detect offline bundles vs. receipt bundles. `file` command can identify the format before parsing.*

Use `0x4F46464C424E444C` ("OFLBNDL" + padding) as the magic header. Serialise the inner `ReceiptBundle` first, then append the three offline sections in order: revocation, key-timeline, freshness.

### 4. **Write comprehensive tests**

> 💡 *WHY: The integrity check has multiple cross-section invariants. Each must be tested independently to prevent silent regression.*

Test: (a) complete bundle → integrity passes, (b) missing revocation snapshot → fails at check (c), (c) key-timeline missing the signing key → fails at check (b), (d) tampered freshness signature → fails at check (d), (e) round-trip serialise→deserialise → field equality.

### 5. **Document the offline bundle format**

> 💡 *WHY: Agencies deploying offline verifiers need a spec to build interoperable tools. The design doc is the interoperability contract.*

Write `week-19/day2-offline-bundle-format.md` covering: field table for all sections, magic header, integrity invariants, snapshot freshness recommendations (e.g., refresh every 24 hours), and upgrade path (adding new sections without breaking v1 parsers).

## Done when

- [ ] `OfflineBundle` contains receipt, revocation snapshot, key-timeline snapshot, and freshness attestation — *this is the complete offline verification package*
- [ ] `bundle_integrity_check()` catches missing or inconsistent sections — *prevents garbage-in before expensive crypto checks*
- [ ] Key-timeline snapshot must cover the envelope's signing key — *a mismatched timeline would cause false rejections in air-gapped environments*
- [ ] Round-trip serialisation preserves all fields including snapshot data — *field-deployed bundles must survive storage on USB drives*
- [ ] Design doc specifies format, integrity invariants, and freshness recommendations — *cross-agency interoperability depends on this spec*

## Proof

Upload `week-19/day2-offline-bundle-format.md` and a terminal screenshot showing: (a) a complete bundle passing integrity, (b) a bundle with a mismatched key-timeline failing integrity with a clear error.

### **Quick self-test**

**Q1:** Why include a revocation snapshot instead of just checking online?
→ **A: The entire point of the offline bundle is zero network dependency. The snapshot is the verifier's last-known view of the revocation registry. Its staleness is bounded by the freshness attestation.**

**Q2:** What if the freshness attestation is forged?
→ **A: The attestation includes a cryptographic signature from a trusted attester (e.g., the issuing agency's infrastructure key). Forging it requires compromising the attester's private key.**

**Q3:** Why a separate magic header from the ReceiptBundle?
→ **A: Tools need to distinguish the two formats at the byte level. An offline bundle parser must know to expect the extra sections. Feeding a ReceiptBundle to an offline parser (or vice versa) is caught at the magic-header check, before any allocation.**
