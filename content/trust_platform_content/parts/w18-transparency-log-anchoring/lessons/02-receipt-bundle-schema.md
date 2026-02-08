---
id: w18-transparency-log-anchoring-d02-receipt-bundle-schema
part: w18-transparency-log-anchoring
title: "Receipt Bundle Schema"
order: 2
duration_minutes: 120
prereqs: ["w18-transparency-log-anchoring-d01-anchoring-workflow"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3, 7, 21, 60]
---

# Receipt Bundle Schema

## Goal

An anchoring receipt from Day 1 contains the right data, but it lives as an in-memory struct. To be useful across systems, time zones, and air-gapped networks, the receipt must be serialized into a self-contained bundle that any verifier can decode and check without contacting the issuer or the log. Today you define the canonical receipt bundle schema and build serialization and deserialization for it.

✅ Deliverables

- A `ReceiptBundle` struct that packages all verification artifacts into one unit
- A canonical JSON serialization that is byte-deterministic (sorted keys, no trailing whitespace)
- A deserialization function with strict schema validation
- A round-trip test proving `serialize(deserialize(bundle)) == bundle`
- A markdown spec shipped as `week-18/day2-receipt-bundle-schema.md`

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Bundle contains document hash, inclusion proof, checkpoint, and issuer signature | All four fields present and non-empty after construction |
| 2 | Serialization is deterministic | Serialize same bundle twice, compare byte-for-byte |
| 3 | Deserialization rejects malformed input | Feed truncated JSON, assert parse failure |
| 4 | Round-trip equality holds | `serialize(deserialize(blob)) == blob` |
| 5 | Spec file exists at correct path | `stat week-18/day2-receipt-bundle-schema.md` succeeds |

## What You're Building Today

You are building the portable envelope that wraps every piece of evidence a verifier needs. The receipt bundle is the unit of offline trust — it travels with the document and contains the document hash, the Merkle inclusion proof, the log's signed checkpoint, and the original issuer signature. Anyone holding the bundle can verify the chain from document to log root without any network call.

✅ Deliverables

- `ReceiptBundle` struct combining all verification components
- `serialize_bundle()` producing deterministic JSON
- `deserialize_bundle()` with schema validation
- Round-trip fuzz test

```cpp
#include <string>
#include <vector>
#include <cstdint>
#include <stdexcept>

struct ReceiptBundle {
    // Document layer
    std::string document_hash;       // SHA-256 hex of original content
    std::string issuer_signature;    // Ed25519 sig over document_hash

    // Log layer — inclusion proof
    uint64_t leaf_index;
    std::vector<std::string> proof_hashes;  // Merkle sibling path

    // Log layer — signed checkpoint
    uint64_t tree_size;
    std::string root_hash;
    std::string checkpoint_signature;

    // Metadata
    std::string bundle_version = "1.0";
    uint64_t timestamp_unix;
};

std::string serialize_bundle(const ReceiptBundle& b);
ReceiptBundle deserialize_bundle(const std::string& json);
```

You **can:**
- Package all verification evidence into a single portable blob
- Serialize and deserialize bundles deterministically
- Transfer bundles across air-gapped systems via file or QR code

You **cannot yet:**
- Run the full verification sequence on the bundle (Day 3)
- Enforce freshness constraints on the checkpoint timestamp (Day 4)
- Classify bundle failures into attack categories (Day 5)

## Why This Matters

🔴 Without a receipt bundle schema:
- Verification requires live network access to the log and issuer
- Different systems use incompatible receipt formats, breaking interop
- Missing fields silently degrade verification from "proven" to "assumed"
- Air-gapped and offline environments cannot verify any document

🟢 With a receipt bundle schema:
- Verification is fully offline — every artifact is in the bundle
- A canonical schema ensures all implementations agree on format
- Missing fields cause hard parse errors, never silent degradation
- Bundles are self-describing with version numbers for forward compatibility

🔗 Connects:
- **W13 (CAS):** `document_hash` is the content address of the original artifact
- **W14 (Merkle Trees):** `proof_hashes` is the Merkle inclusion path verified against `root_hash`
- **W15 (Transparency Log):** `checkpoint_signature` is the log operator's Ed25519 signature
- **W17 (Signed Documents):** `issuer_signature` is the civic document issuer's signature
- **W19 (Verification Policies):** Policies will consume bundles as input for trust decisions

🧠 Mental model: "Sealed Envelope"
The receipt bundle is a sealed envelope. Inside: the document fingerprint, the notary's stamp (log receipt), and the author's signature. The envelope format is standardized so any post office (verifier) worldwide can open and check it.

## Visual Model

```
┌───────────────────────────────────────────────┐
│              RECEIPT BUNDLE v1.0               │
├───────────────────────────────────────────────┤
│                                               │
│  ┌─────────────── Document ────────────────┐  │
│  │  document_hash:    "a3f8c1..."          │  │
│  │  issuer_signature: "ed25519:9b2e..."    │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ┌─────────────── Inclusion ───────────────┐  │
│  │  leaf_index:   42                       │  │
│  │  proof_hashes: ["b1c2..","d3e4.."]      │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ┌─────────────── Checkpoint ──────────────┐  │
│  │  tree_size:            128              │  │
│  │  root_hash:            "f5a6b7..."      │  │
│  │  checkpoint_signature: "ed25519:c8d9.." │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ┌─────────────── Metadata ────────────────┐  │
│  │  bundle_version:  "1.0"                 │  │
│  │  timestamp_unix:  1739000000            │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ▼ serialize() ──▶ deterministic JSON blob    │
│  ▼ deserialize() ◀── strict schema parse      │
└───────────────────────────────────────────────┘
```

## Build

File: `week-18/day2-receipt-bundle-schema.md`

## Do

1. **Define the ReceiptBundle struct**

   > 💡 *WHY: A single struct that owns every verification artifact eliminates the "did I forget to include the proof?" class of bugs. If the struct compiles, the bundle is complete.*

   Create `receipt_bundle.h` with the struct shown above. Every field is required — no `std::optional`. If a field is missing during construction, throw `std::invalid_argument`. Add a `validate()` method that checks all fields are non-empty:

   ```cpp
   void ReceiptBundle::validate() const {
       if (document_hash.empty()) throw std::invalid_argument("missing document_hash");
       if (issuer_signature.empty()) throw std::invalid_argument("missing issuer_signature");
       if (proof_hashes.empty()) throw std::invalid_argument("missing proof_hashes");
       if (root_hash.empty()) throw std::invalid_argument("missing root_hash");
       if (checkpoint_signature.empty()) throw std::invalid_argument("missing checkpoint_signature");
   }
   ```

2. **Implement deterministic JSON serialization**

   > 💡 *WHY: Deterministic serialization means two systems that independently serialize the same bundle produce byte-identical output. This is critical for hashing and signing bundles downstream.*

   Implement `serialize_bundle()` using sorted keys and no optional whitespace. Use a JSON library (e.g., nlohmann/json) with `dump(2, ' ', false, json::error_handler_t::strict)` and sorted insertion. Verify that key order is: `bundle_version`, `checkpoint_signature`, `document_hash`, `issuer_signature`, `leaf_index`, `proof_hashes`, `root_hash`, `timestamp_unix`, `tree_size`.

3. **Implement strict deserialization**

   > 💡 *WHY: Lenient parsing is a security vulnerability. If a verifier silently ignores a missing checkpoint_signature, the bundle degrades to an unanchored document without warning.*

   Implement `deserialize_bundle()` that parses JSON and calls `validate()`. Reject unknown keys (strict mode). Reject wrong types (e.g., `leaf_index` as string). Return the populated `ReceiptBundle`.

   ```cpp
   ReceiptBundle deserialize_bundle(const std::string& json_str) {
       auto j = json::parse(json_str);
       ReceiptBundle b;
       b.document_hash        = j.at("document_hash").get<std::string>();
       b.issuer_signature     = j.at("issuer_signature").get<std::string>();
       b.leaf_index           = j.at("leaf_index").get<uint64_t>();
       b.proof_hashes         = j.at("proof_hashes").get<std::vector<std::string>>();
       b.tree_size            = j.at("tree_size").get<uint64_t>();
       b.root_hash            = j.at("root_hash").get<std::string>();
       b.checkpoint_signature = j.at("checkpoint_signature").get<std::string>();
       b.bundle_version       = j.at("bundle_version").get<std::string>();
       b.timestamp_unix       = j.at("timestamp_unix").get<uint64_t>();
       b.validate();
       return b;
   }
   ```

4. **Write the round-trip equality test**

   > 💡 *WHY: Round-trip equality is the gold standard for serialization correctness. If `serialize(deserialize(blob))` differs from `blob`, either serialization or deserialization has a bug — no exceptions.*

   Create a test that builds a `ReceiptBundle`, serializes it, deserializes the output, re-serializes, and asserts byte equality. Run with at least 3 different bundles varying `leaf_index` and `tree_size`.

5. **Write the malformed-input rejection tests**

   > 💡 *WHY: Attackers will send crafted bundles. Every malformed input must produce a clear error, never a partial parse that silently drops fields.*

   Test each failure mode in a table:

   | Input mutation | Expected error |
   |----------------|----------------|
   | Remove `document_hash` key | `json::out_of_range` |
   | Set `leaf_index` to string | `json::type_error` |
   | Empty `proof_hashes` array | `std::invalid_argument` |
   | Truncated JSON (missing `}`) | `json::parse_error` |
   | Extra unknown key `"foo"` | `std::invalid_argument` (strict mode) |

## Done when

- [ ] `ReceiptBundle` struct contains all five required verification fields — *consumed by Day 3 verifier sequence*
- [ ] `serialize_bundle()` produces deterministic JSON output — *enables hashing bundles for audit logs in W20*
- [ ] `deserialize_bundle()` rejects every malformed variant — *prevents silent verification degradation*
- [ ] Round-trip test passes for multiple distinct bundles — *guarantees no data loss in serialization*
- [ ] Spec file `week-18/day2-receipt-bundle-schema.md` documents the schema — *shared with external verifiers as a format contract*

## Proof

Upload your completed `week-18/day2-receipt-bundle-schema.md` spec and paste your `serialize_bundle` / `deserialize_bundle` implementation.

**Quick self-test**

1. Q: Why must serialization be deterministic (byte-identical for the same input)?
   **A: Because downstream systems may hash or sign the serialized bundle. Non-deterministic serialization (random key order, trailing whitespace) would produce different hashes for the same logical bundle, breaking signatures and audit comparisons.**

2. Q: Why does `deserialize_bundle()` reject unknown keys instead of ignoring them?
   **A: Unknown keys may indicate a version mismatch or an injection attack. Ignoring them risks processing a bundle with semantics the verifier does not understand, leading to incorrect trust decisions.**

3. Q: What happens if `proof_hashes` is present but empty?
   **A: The `validate()` method throws `std::invalid_argument`. An empty inclusion proof means the bundle cannot prove the document is in the log — it is structurally complete but semantically useless.**
