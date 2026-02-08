---
id: w18-transparency-log-anchoring-d03-anchor-verifier-sequence
part: w18-transparency-log-anchoring
title: "Anchor Verifier Sequence"
order: 3
duration_minutes: 120
prereqs: ["w18-transparency-log-anchoring-d02-receipt-bundle-schema"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3, 7, 21, 60]
---

# Anchor Verifier Sequence

## Goal

You have a portable receipt bundle (Day 2). Now you need a verifier that checks every link in the trust chain — in the correct order, with zero tolerance for missing steps. Today you build the `AnchorVerifier` that executes a strict four-step sequence: checkpoint signature → inclusion proof → document hash → issuer signature. If any single step fails, the entire bundle is rejected as `unverified`. There is no partial credit.

✅ Deliverables

- An `AnchorVerifier` class implementing the four-step verification sequence
- A `VerificationResult` enum: `Verified`, `Unverified`, with a reason string
- Individual step functions that can be tested in isolation
- A test suite covering all four failure modes plus the happy path
- A markdown spec shipped as `week-18/day3-anchor-verifier-sequence.md`

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Checkpoint signature verified first | Swap step order, assert different failure reason |
| 2 | Invalid inclusion proof → `Unverified` | Corrupt one proof hash, assert rejection |
| 3 | Document hash mismatch → `Unverified` | Change document hash, assert rejection |
| 4 | Bad issuer signature → `Unverified` | Swap signature bytes, assert rejection |
| 5 | All steps pass → `Verified` | Valid bundle returns `Verified` with empty reason |

## What You're Building Today

You are building the trust chain verifier. Given a `ReceiptBundle` from Day 2, the verifier walks the chain from the log's checkpoint signature down to the issuer's document signature. The sequence is not arbitrary — each step gates the next. Verifying the checkpoint first ensures you trust the log root before checking the inclusion proof against it.

✅ Deliverables

- `AnchorVerifier` with `verify(bundle, log_pubkey, issuer_pubkey) → VerificationResult`
- Four internal step functions: `verify_checkpoint`, `verify_inclusion`, `verify_hash`, `verify_issuer`
- Fail-fast logic: first failure short-circuits remaining steps

```cpp
#include <string>

enum class VerifyStatus { Verified, Unverified };

struct VerificationResult {
    VerifyStatus status;
    std::string  failed_step;   // empty if Verified
    std::string  reason;        // human-readable explanation
};

class AnchorVerifier {
public:
    VerificationResult verify(
        const ReceiptBundle& bundle,
        const std::string& log_public_key,
        const std::string& issuer_public_key
    );

private:
    bool verify_checkpoint(const ReceiptBundle& b, const std::string& log_pk);
    bool verify_inclusion(const ReceiptBundle& b);
    bool verify_hash(const ReceiptBundle& b, const std::string& expected_doc_hash);
    bool verify_issuer(const ReceiptBundle& b, const std::string& issuer_pk);
};
```

You **can:**
- Verify every layer of the trust chain in a receipt bundle
- Reject bundles with any invalid or missing cryptographic proof
- Produce clear diagnostic output identifying the exact failed step

You **cannot yet:**
- Enforce time-based freshness constraints on checkpoints (Day 4)
- Classify failures into named attack categories (Day 5)
- Build verification policies that combine multiple bundles (W19)

## Why This Matters

🔴 Without an ordered verifier sequence:
- A verifier might check the issuer signature first and accept a document not in the log
- Partial verification gives false confidence — "the signature is valid" hides missing log proof
- Out-of-order checks can leak timing information to attackers
- Soft-pass logic ("warn but continue") erodes the entire transparency guarantee

🟢 With an ordered verifier sequence:
- The checkpoint is trusted before any proof is evaluated against it
- Every link in the chain is checked — no step can be skipped or reordered
- Fail-fast behavior means the first broken link halts verification immediately
- Diagnostic output pinpoints the exact layer that failed for debugging

🔗 Connects:
- **W14 (Merkle Trees):** `verify_inclusion()` recomputes the Merkle path from leaf to root
- **W15 (Transparency Log):** `verify_checkpoint()` checks the log operator's Ed25519 signature
- **W16 (Monitoring):** Monitors run this same verifier sequence on sampled log entries
- **W17 (Signed Documents):** `verify_issuer()` checks the document issuer's signature
- **W18 Day 2:** The `ReceiptBundle` struct is the input to this verifier

🧠 Mental model: "Airport Security Checkpoints"
Each verification step is a checkpoint at the airport. Passport (checkpoint sig) → boarding pass (inclusion proof) → baggage tag (document hash) → ID photo match (issuer sig). Skip one, and you don't fly. The order matters because later checks depend on earlier ones being clean.

## Visual Model

```
┌──────────────────────────────────────────────────┐
│          ANCHOR VERIFIER SEQUENCE                │
├──────────────────────────────────────────────────┤
│                                                  │
│  ReceiptBundle                                   │
│       │                                          │
│       ▼                                          │
│  ┌─────────────────────────────┐                 │
│  │ Step 1: verify_checkpoint   │──── FAIL ──▶ ✗  │
│  │ Ed25519(root‖size, log_pk)  │              │  │
│  └────────────┬────────────────┘       Unverified│
│               │ PASS                             │
│               ▼                                  │
│  ┌─────────────────────────────┐                 │
│  │ Step 2: verify_inclusion    │──── FAIL ──▶ ✗  │
│  │ Merkle(leaf → root_hash)    │                 │
│  └────────────┬────────────────┘                 │
│               │ PASS                             │
│               ▼                                  │
│  ┌─────────────────────────────┐                 │
│  │ Step 3: verify_hash         │──── FAIL ──▶ ✗  │
│  │ SHA-256(doc) == leaf_hash   │                 │
│  └────────────┬────────────────┘                 │
│               │ PASS                             │
│               ▼                                  │
│  ┌─────────────────────────────┐                 │
│  │ Step 4: verify_issuer       │──── FAIL ──▶ ✗  │
│  │ Ed25519(doc_hash, issuer_pk)│                 │
│  └────────────┬────────────────┘                 │
│               │ PASS                             │
│               ▼                                  │
│           ✓ Verified                             │
└──────────────────────────────────────────────────┘
```

## Build

File: `week-18/day3-anchor-verifier-sequence.md`

## Do

1. **Implement verify_checkpoint**

   > 💡 *WHY: The checkpoint signature is the root of trust. If the log's signature over the root hash is invalid, nothing else in the bundle can be trusted — the root itself might be forged.*

   Verify the Ed25519 signature in `checkpoint_signature` over the concatenation of `root_hash` and `tree_size` (encoded as big-endian 8-byte integer). Use libsodium's `crypto_sign_verify_detached`:

   ```cpp
   bool AnchorVerifier::verify_checkpoint(const ReceiptBundle& b,
                                          const std::string& log_pk) {
       std::string message = b.root_hash + encode_be64(b.tree_size);
       return crypto_sign_verify_detached(
           from_hex(b.checkpoint_signature).data(),
           reinterpret_cast<const unsigned char*>(message.data()),
           message.size(),
           from_hex(log_pk).data()
       ) == 0;
   }
   ```

2. **Implement verify_inclusion**

   > 💡 *WHY: The inclusion proof is a Merkle path from the document's leaf to the root. Recomputing the root from the leaf and proof hashes and comparing it to the checkpoint's root_hash proves the document is in the tree.*

   Walk the `proof_hashes` from leaf to root, hashing pairs at each level. Compare the computed root to `b.root_hash`. If they differ, inclusion fails:

   ```cpp
   bool AnchorVerifier::verify_inclusion(const ReceiptBundle& b) {
       std::string current = b.document_hash;
       uint64_t index = b.leaf_index;
       for (const auto& sibling : b.proof_hashes) {
           current = (index % 2 == 0)
               ? sha256(current + sibling)
               : sha256(sibling + current);
           index /= 2;
       }
       return current == b.root_hash;
   }
   ```

3. **Implement verify_hash**

   > 💡 *WHY: This step binds the original document content to the log entry. Without it, an attacker could anchor one document and claim the receipt belongs to a different one.*

   Given the original document bytes (passed separately or reconstructed), compute SHA-256 and compare to `b.document_hash`. This step is trivial but critical — it closes the semantic gap between "something is in the log" and "this specific document is in the log."

4. **Implement verify_issuer**

   > 💡 *WHY: The issuer signature proves the document was produced by the claimed author. Without it, anyone could anchor arbitrary content and claim it was issued by a trusted authority.*

   Verify `b.issuer_signature` over `b.document_hash` using the issuer's public key. Same Ed25519 verification pattern as step 1, but with the issuer's key instead of the log's key.

5. **Wire the four steps into verify() with fail-fast logic**

   > 💡 *WHY: Fail-fast ensures that the first broken link halts verification. Running all four steps and reporting multiple failures leaks information about which steps pass, which an attacker can exploit to iteratively fix a forged bundle.*

   Implement `verify()` to call each step in order. On failure, return immediately with the step name and reason. On success of all four steps, return `Verified`:

   ```cpp
   VerificationResult AnchorVerifier::verify(
       const ReceiptBundle& bundle,
       const std::string& log_pk,
       const std::string& issuer_pk)
   {
       if (!verify_checkpoint(bundle, log_pk))
           return {VerifyStatus::Unverified, "checkpoint", "bad log signature"};
       if (!verify_inclusion(bundle))
           return {VerifyStatus::Unverified, "inclusion", "proof does not match root"};
       if (!verify_hash(bundle))
           return {VerifyStatus::Unverified, "hash", "document hash mismatch"};
       if (!verify_issuer(bundle, issuer_pk))
           return {VerifyStatus::Unverified, "issuer", "bad issuer signature"};
       return {VerifyStatus::Verified, "", ""};
   }
   ```

## Done when

- [ ] `verify_checkpoint()` rejects forged log signatures — *same check used by monitors in W16*
- [ ] `verify_inclusion()` recomputes Merkle root from proof path — *reuses W14 Merkle verification logic*
- [ ] `verify_hash()` binds document content to log entry — *prevents hash substitution attacks in Day 5*
- [ ] `verify_issuer()` confirms document authorship — *extends W17 issuer signature verification*
- [ ] All four steps execute in strict order with fail-fast — *the ordering is enforced by Day 4 freshness checks*

## Proof

Upload your completed `week-18/day3-anchor-verifier-sequence.md` spec and paste your `AnchorVerifier::verify()` implementation with all four step functions.

**Quick self-test**

1. Q: Why must the checkpoint signature be verified before the inclusion proof?
   **A: The inclusion proof is checked against the root hash in the checkpoint. If the checkpoint is forged, the root hash is untrusted, and a valid-looking inclusion proof could be fabricated to match the fake root.**

2. Q: What does the verifier return if the inclusion proof fails but the issuer signature is valid?
   **A: `Unverified` with `failed_step = "inclusion"`. The verifier never reaches the issuer signature check because fail-fast halts at the first failure. Partial validity is meaningless.**

3. Q: Why is verify_hash a separate step from verify_inclusion?
   **A: `verify_inclusion` proves that *some* leaf is in the tree. `verify_hash` proves that the leaf corresponds to *this specific document*. Without the hash check, an attacker could reuse a valid inclusion proof from a different document.**
