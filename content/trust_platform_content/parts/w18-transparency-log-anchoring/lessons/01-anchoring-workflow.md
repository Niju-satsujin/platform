---
id: w18-transparency-log-anchoring-d01-anchoring-workflow
part: w18-transparency-log-anchoring
title: "Anchoring Workflow"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3, 7, 21, 60]
---

# Anchoring Workflow

## Goal

A signed civic document is not trustworthy just because it carries an issuer signature. Until that document is recorded in an append-only transparency log and the issuer holds a cryptographic receipt proving inclusion, the document's existence can be silently denied. Today you build the end-to-end anchoring workflow that turns a freshly signed document into a log-backed, receipt-carrying artifact.

✅ Deliverables

- A `AnchoringClient` class that submits a document hash to the transparency log
- A `AnchoringReceipt` struct returned on successful inclusion
- A state machine tracking document status through `pending → anchored → failed`
- An integration test that round-trips: sign → submit → receive receipt
- A markdown spec shipped as `week-18/day1-anchoring-workflow.md`

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Document hash submitted to log endpoint | Unit test asserts HTTP 202 or mock equivalent |
| 2 | Receipt contains inclusion proof and checkpoint | Struct fields are non-empty after anchoring |
| 3 | State transitions follow `pending → anchored` | State machine rejects invalid transitions |
| 4 | Failed submission sets state to `failed` | Inject network error, assert state |
| 5 | Spec file exists at correct path | `stat week-18/day1-anchoring-workflow.md` succeeds |

## What You're Building Today

You are building the first half of the trust bridge between document issuance (W17) and the transparency log (W15). The anchoring workflow is the pipeline that takes a signed document hash, submits it to the log operator, waits for inclusion, and returns a receipt the issuer can store alongside the original document.

✅ Deliverables

- `AnchoringClient` with `submit()` and `poll_receipt()` methods
- `AnchoringReceipt` struct with `log_checkpoint`, `inclusion_proof`, `leaf_hash`
- `AnchorState` enum: `Pending`, `Anchored`, `Failed`
- Round-trip integration test

```cpp
#include <string>
#include <vector>
#include <cstdint>

enum class AnchorState { Pending, Anchored, Failed };

struct InclusionProof {
    uint64_t leaf_index;
    std::vector<std::string> hashes;  // sibling path
};

struct SignedCheckpoint {
    uint64_t tree_size;
    std::string root_hash;
    std::string signature;
};

struct AnchoringReceipt {
    std::string leaf_hash;
    InclusionProof proof;
    SignedCheckpoint checkpoint;
    AnchorState state = AnchorState::Pending;
};

class AnchoringClient {
public:
    explicit AnchoringClient(const std::string& log_url);
    AnchoringReceipt submit(const std::string& document_hash);
    AnchoringReceipt poll_receipt(const std::string& leaf_hash);
private:
    std::string log_url_;
};
```

You **can:**
- Hash a signed document and submit it to a transparency log endpoint
- Receive and store an anchoring receipt proving log inclusion
- Track anchoring state with an explicit state machine

You **cannot yet:**
- Verify the receipt independently (Day 3)
- Enforce freshness windows on receipts (Day 4)
- Classify anchoring failures into attack categories (Day 5)

## Why This Matters

🔴 Without anchoring workflow:
- Signed documents can be silently revoked with no public trace
- An issuer can deny ever producing a document — no log evidence exists
- Verifiers must blindly trust the issuer's word about document existence
- Split-view attacks succeed because there is no single source of truth

🟢 With anchoring workflow:
- Every issued document has a cryptographic receipt tied to the public log
- Issuers cannot deny issuance — the log is append-only and publicly auditable
- Verifiers can check inclusion without contacting the issuer
- The receipt is self-contained — verification works offline

🔗 Connects:
- **W13 (CAS):** The document hash submitted to the log is content-addressed
- **W14 (Merkle Trees):** The inclusion proof is a Merkle path from leaf to root
- **W15 (Transparency Log):** The log operator produces signed checkpoints over the tree
- **W16 (Monitoring):** Monitors watch for equivocation in checkpoints
- **W17 (Signed Documents):** The document being anchored carries an issuer signature

🧠 Mental model: "Notary Stamp"
Think of anchoring as getting a notary stamp. The document is already signed, but the notary stamp (receipt) proves it was witnessed by a trusted third party (the log) at a specific point in time.

## Visual Model

```
┌─────────────────────────────────────────────────────┐
│                 ANCHORING WORKFLOW                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐    hash    ┌──────────────────┐       │
│  │  Signed  │───────────▶│  AnchoringClient │       │
│  │ Document │            │                  │       │
│  └──────────┘            │  submit(hash)    │       │
│                          └────────┬─────────┘       │
│                                   │                 │
│                                   ▼                 │
│                          ┌──────────────────┐       │
│                          │ Transparency Log │       │
│                          │   (append-only)  │       │
│                          └────────┬─────────┘       │
│                                   │                 │
│                    ┌──────────────┼──────────────┐  │
│                    ▼              ▼              ▼   │
│              ┌──────────┐  ┌──────────┐  ┌────────┐ │
│              │ Pending  │  │ Anchored │  │ Failed │ │
│              │  state   │─▶│  state   │  │ state  │ │
│              └──────────┘  └────┬─────┘  └────────┘ │
│                                 │                   │
│                                 ▼                   │
│                          ┌──────────────┐           │
│                          │   Receipt    │           │
│                          │ leaf + proof │           │
│                          │ + checkpoint │           │
│                          └──────────────┘           │
└─────────────────────────────────────────────────────┘
```

## Build

File: `week-18/day1-anchoring-workflow.md`

## Do

1. **Define the AnchoringReceipt struct**

   > 💡 *WHY: The receipt is the atomic unit of trust — it binds a document hash to a log position with a cryptographic proof. Without a well-defined struct, downstream verification has no contract to rely on.*

   Create `anchoring_receipt.h` with the structs shown above. Ensure `InclusionProof` stores the Merkle sibling path as a vector of hex-encoded hashes, and `SignedCheckpoint` stores the log's tree size, root hash, and Ed25519 signature.

2. **Implement the AnchorState enum and transitions**

   > 💡 *WHY: Explicit state machines prevent bugs where a failed submission is accidentally treated as anchored. Every state transition must be intentional and logged.*

   Define valid transitions: `Pending → Anchored`, `Pending → Failed`. Any other transition throws `std::logic_error`. Write a `transition()` function:

   ```cpp
   AnchorState transition(AnchorState current, AnchorState next) {
       if (current == AnchorState::Pending &&
           (next == AnchorState::Anchored || next == AnchorState::Failed))
           return next;
       throw std::logic_error("Invalid anchor state transition");
   }
   ```

3. **Build the AnchoringClient submit method**

   > 💡 *WHY: The submit method is the single entry point for anchoring. It must be idempotent — submitting the same hash twice should return the same receipt, not create a duplicate log entry.*

   Implement `submit()` to POST the document hash to `{log_url}/add-leaf`. Parse the JSON response to populate the `AnchoringReceipt`. Set state to `Anchored` on 200, `Pending` on 202, `Failed` on 4xx/5xx.

4. **Build the poll_receipt method**

   > 💡 *WHY: Log inclusion is asynchronous. The log operator batches leaves into checkpoints at intervals. Polling bridges the gap between submission and confirmed inclusion.*

   Implement `poll_receipt()` to GET `{log_url}/receipt/{leaf_hash}`. Return updated `AnchoringReceipt` with the inclusion proof and signed checkpoint once available. Implement exponential backoff with a maximum of 5 retries.

5. **Write the integration test**

   > 💡 *WHY: The round-trip test proves the entire pipeline works end-to-end. A unit test for submit alone cannot catch serialization bugs between client and log.*

   Create a test that: (a) hashes a test document with SHA-256, (b) calls `submit()`, (c) asserts state is `Anchored` or `Pending`, (d) if `Pending`, calls `poll_receipt()` until `Anchored`, (e) asserts receipt fields are non-empty.

   ```cpp
   void test_anchoring_round_trip() {
       AnchoringClient client("http://localhost:8080");
       auto receipt = client.submit(sha256("test-civic-doc-001"));
       assert(receipt.state == AnchorState::Anchored);
       assert(!receipt.proof.hashes.empty());
       assert(!receipt.checkpoint.root_hash.empty());
   }
   ```

## Done when

- [ ] `AnchoringReceipt` struct compiles and stores leaf hash, inclusion proof, and signed checkpoint — *used by Day 2 to define the receipt bundle schema*
- [ ] `AnchorState` enum enforces valid transitions only — *reused in Day 5 attack matrix for failure classification*
- [ ] `AnchoringClient::submit()` sends document hash and returns receipt — *the core primitive for all anchoring operations*
- [ ] `AnchoringClient::poll_receipt()` handles async inclusion with backoff — *extended in Day 4 with freshness policy*
- [ ] Spec file `week-18/day1-anchoring-workflow.md` documents the full workflow — *referenced by auditors and verifiers in later weeks*

## Proof

Upload your completed `week-18/day1-anchoring-workflow.md` spec and paste your `AnchoringClient` implementation (header + source).

**Quick self-test**

1. Q: Why is a document not considered "final" after the issuer signs it?
   **A: Because without a transparency log receipt, the issuer can silently deny or revoke the document. The log receipt is the public, append-only proof of issuance.**

2. Q: What are the only valid state transitions for `AnchorState`?
   **A: `Pending → Anchored` and `Pending → Failed`. No other transitions are allowed — `Anchored` and `Failed` are terminal states.**

3. Q: Why must `submit()` be idempotent?
   **A: Submitting the same document hash twice should return the existing receipt, not create a duplicate leaf. Duplicate leaves waste log space and create ambiguity during verification.**
