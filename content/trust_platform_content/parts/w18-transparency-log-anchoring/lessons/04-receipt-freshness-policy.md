---
id: w18-transparency-log-anchoring-d04-receipt-freshness-policy
part: w18-transparency-log-anchoring
title: "Receipt Freshness Policy"
order: 4
duration_minutes: 120
prereqs: ["w18-transparency-log-anchoring-d03-anchor-verifier-sequence"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3, 7, 21, 60]
---

# Receipt Freshness Policy

## Goal

A cryptographically valid receipt bundle is not automatically trustworthy. If the checkpoint is six months old, the log operator's signing key may have been compromised since then, and the receipt proves inclusion in a tree state that no longer reflects reality. Today you build a freshness policy engine that rejects receipts whose checkpoints fall outside a configurable time window. Stale receipts must fail verification — no exceptions, no grace periods.

✅ Deliverables

- A `FreshnessPolicy` struct with configurable `max_age_seconds` window
- A `check_freshness()` function integrated into the verification sequence
- Rejection logic that distinguishes `stale` from `clock_skew` failures
- A test suite covering fresh, stale, future-dated, and boundary-edge receipts
- A markdown spec shipped as `week-18/day4-receipt-freshness-policy.md`

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Receipts within window pass freshness check | Bundle with recent timestamp returns `Fresh` |
| 2 | Receipts older than `max_age_seconds` are rejected | Bundle with old timestamp returns `Stale` |
| 3 | Future-dated receipts are rejected | Bundle timestamp > now + skew returns `ClockSkew` |
| 4 | Freshness check runs after checkpoint verification | Reorder steps, assert different behavior |
| 5 | Spec file exists at correct path | `stat week-18/day4-receipt-freshness-policy.md` succeeds |

## What You're Building Today

You are adding a temporal dimension to the verification sequence from Day 3. The four cryptographic checks prove the bundle is mathematically valid, but they say nothing about when the checkpoint was produced. A freshness policy adds a fifth gate: the checkpoint must be recent enough that the log operator's key is still trusted and the tree state is still current.

✅ Deliverables

- `FreshnessPolicy` with `max_age_seconds` and `max_clock_skew_seconds`
- `FreshnessStatus` enum: `Fresh`, `Stale`, `ClockSkew`
- Integration into `AnchorVerifier::verify()` as step 1.5 (after checkpoint sig, before inclusion proof)

```cpp
#include <cstdint>
#include <ctime>
#include <string>

enum class FreshnessStatus { Fresh, Stale, ClockSkew };

struct FreshnessPolicy {
    uint64_t max_age_seconds       = 86400;   // 24 hours default
    uint64_t max_clock_skew_seconds = 300;    // 5 minutes tolerance

    FreshnessStatus check(uint64_t checkpoint_timestamp_unix) const {
        uint64_t now = static_cast<uint64_t>(std::time(nullptr));
        if (checkpoint_timestamp_unix > now + max_clock_skew_seconds)
            return FreshnessStatus::ClockSkew;
        if (now - checkpoint_timestamp_unix > max_age_seconds)
            return FreshnessStatus::Stale;
        return FreshnessStatus::Fresh;
    }
};

struct FreshnessResult {
    FreshnessStatus status;
    uint64_t        age_seconds;
    std::string     reason;
};
```

You **can:**
- Enforce time-based validity windows on anchoring receipts
- Distinguish between stale receipts and clock synchronization errors
- Configure freshness windows per deployment context (strict vs. lenient)

You **cannot yet:**
- Classify stale receipts as a specific attack type (Day 5)
- Combine freshness with revocation checks (W20)
- Aggregate freshness across multiple receipts in a policy evaluation (W19)

## Why This Matters

🔴 Without freshness policy:
- A receipt from a compromised log key remains "valid" forever
- Attackers can replay old receipts after a key rotation event
- Stale tree states may reference leaves that were later proven fraudulent
- Verifiers have no way to demand recent evidence of log inclusion

🟢 With freshness policy:
- Receipts expire like certificates — old evidence must be refreshed
- Key compromise has a bounded blast radius: only receipts within the window are trusted
- Verifiers can tune the window to their threat model (hours for high-security, days for archival)
- Clock skew detection catches misconfigured or malicious timestamp injection

🔗 Connects:
- **W15 (Transparency Log):** Checkpoints carry timestamps; freshness evaluates them
- **W16 (Monitoring):** Monitors detect checkpoint gaps that may indicate freshness violations
- **W17 (Signed Documents):** Issuers must re-anchor after freshness window expires
- **W18 Day 3:** Freshness slots into the verification sequence after checkpoint sig verification
- **W21 (Key Lifecycle):** Key rotation events shorten the effective freshness window

🧠 Mental model: "Expiration Date"
Freshness policy is the expiration date on milk. The milk (receipt) might look fine, but if it's past the date, you throw it out. The date is conservative — the milk might still be good, but you don't take the risk. Similarly, a stale receipt might still be valid, but the policy rejects it because the risk of key compromise grows with time.

## Visual Model

```
┌──────────────────────────────────────────────────────┐
│              FRESHNESS POLICY ENGINE                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Timeline:                                           │
│                                                      │
│  ◀──── max_age_seconds (24h) ────▶                   │
│  │                                │                  │
│  ├────────────────────────────────┤                  │
│  │          FRESH WINDOW          │                  │
│  ├────────────────────────────────┤                  │
│  │                                │    now + skew    │
│  ▼                                ▼        ▼         │
│  ┌────────┐  ┌──────────────┐  ┌──────┐  ┌───────┐  │
│  │ STALE  │  │    FRESH     │  │ now  │  │ CLOCK │  │
│  │ reject │  │    accept    │  │      │  │ SKEW  │  │
│  └────────┘  └──────────────┘  └──────┘  └───────┘  │
│                                                      │
│  Verification sequence insertion:                    │
│                                                      │
│  verify_checkpoint ──▶ check_freshness ──▶           │
│       (Step 1)           (Step 1.5)                  │
│                              │                       │
│                    ┌─────────┼──────────┐            │
│                    ▼         ▼          ▼             │
│                 Fresh     Stale    ClockSkew          │
│                   │         │          │             │
│                   ▼         ▼          ▼             │
│              continue    REJECT     REJECT           │
│              to Step 2                               │
└──────────────────────────────────────────────────────┘
```

## Build

File: `week-18/day4-receipt-freshness-policy.md`

## Do

1. **Define the FreshnessPolicy struct and FreshnessStatus enum**

   > 💡 *WHY: Hardcoded time windows are deployment-specific bugs waiting to happen. A configurable struct lets high-security deployments use a 1-hour window while archival systems use 7 days — same code, different policy.*

   Create `freshness_policy.h` with the structs shown above. The defaults (24h window, 5min skew) are reasonable for most deployments. Add a `FreshnessResult` struct that includes the computed age for diagnostics:

   ```cpp
   FreshnessResult evaluate(uint64_t checkpoint_ts) const {
       uint64_t now = static_cast<uint64_t>(std::time(nullptr));
       uint64_t age = (now > checkpoint_ts) ? (now - checkpoint_ts) : 0;
       FreshnessStatus status = check(checkpoint_ts);
       std::string reason;
       if (status == FreshnessStatus::Stale)
           reason = "checkpoint age " + std::to_string(age) + "s exceeds max "
                  + std::to_string(max_age_seconds) + "s";
       else if (status == FreshnessStatus::ClockSkew)
           reason = "checkpoint timestamp " + std::to_string(checkpoint_ts)
                  + " is in the future beyond skew tolerance";
       return {status, age, reason};
   }
   ```

2. **Integrate freshness into the verification sequence**

   > 💡 *WHY: Freshness must run after checkpoint signature verification but before inclusion proof. If the checkpoint signature is invalid, checking its timestamp is meaningless. If the checkpoint is stale, checking the inclusion proof wastes cycles on untrusted data.*

   Modify `AnchorVerifier::verify()` to accept a `FreshnessPolicy` parameter. Insert the freshness check between step 1 (checkpoint sig) and step 2 (inclusion proof):

   ```cpp
   VerificationResult AnchorVerifier::verify(
       const ReceiptBundle& bundle,
       const std::string& log_pk,
       const std::string& issuer_pk,
       const FreshnessPolicy& policy)
   {
       if (!verify_checkpoint(bundle, log_pk))
           return {VerifyStatus::Unverified, "checkpoint", "bad log signature"};
       auto freshness = policy.evaluate(bundle.timestamp_unix);
       if (freshness.status != FreshnessStatus::Fresh)
           return {VerifyStatus::Unverified, "freshness", freshness.reason};
       if (!verify_inclusion(bundle))
           return {VerifyStatus::Unverified, "inclusion", "proof mismatch"};
       // ... remaining steps
   }
   ```

3. **Write the boundary-edge tests**

   > 💡 *WHY: Off-by-one errors in time comparisons are the most common freshness bugs. Testing at exact boundaries catches `<` vs `<=` mistakes that would silently accept or reject edge-case receipts.*

   Test these scenarios with a fixed `now` (mock `std::time`):

   | Scenario | `checkpoint_ts` | Expected |
   |----------|-----------------|----------|
   | Fresh (1 hour old) | `now - 3600` | `Fresh` |
   | Exact boundary | `now - max_age` | `Fresh` (inclusive) |
   | One second stale | `now - max_age - 1` | `Stale` |
   | Future within skew | `now + 200` | `Fresh` |
   | Future beyond skew | `now + 600` | `ClockSkew` |

4. **Implement time mocking for testability**

   > 💡 *WHY: Tests that depend on real wall-clock time are flaky by definition. A time source abstraction lets you control "now" in tests while using the real clock in production.*

   Create a `TimeSource` interface that the policy uses instead of raw `std::time`:

   ```cpp
   struct TimeSource {
       virtual uint64_t now() const { return static_cast<uint64_t>(std::time(nullptr)); }
       virtual ~TimeSource() = default;
   };

   struct MockTimeSource : TimeSource {
       uint64_t fixed_now;
       explicit MockTimeSource(uint64_t t) : fixed_now(t) {}
       uint64_t now() const override { return fixed_now; }
   };
   ```

5. **Document freshness window selection guidance**

   > 💡 *WHY: Operators need guidance to choose appropriate windows. Too short causes re-anchoring churn. Too long gives attackers a wide window after key compromise.*

   Add a decision table to your spec: real-time civic verification → 3600s (1h), standard issuance → 86400s (24h), archival/audit → 604800s (7d), emergency/incident → 300s (5min).

## Done when

- [ ] `FreshnessPolicy::check()` correctly classifies fresh, stale, and clock-skew receipts — *reused in Day 5 to label stale attacks*
- [ ] Freshness check is wired into verifier after checkpoint sig, before inclusion proof — *ordering enforced by verification sequence from Day 3*
- [ ] Boundary-edge tests pass with mocked time source — *prevents off-by-one regressions*
- [ ] `TimeSource` abstraction decouples policy from wall clock — *enables deterministic CI pipelines*
- [ ] Spec file `week-18/day4-receipt-freshness-policy.md` includes window selection guide — *referenced by operators configuring production deployments*

## Proof

Upload your completed `week-18/day4-receipt-freshness-policy.md` spec and paste your `FreshnessPolicy` implementation with the boundary-edge test results.

**Quick self-test**

1. Q: Why is a cryptographically valid receipt with a 6-month-old checkpoint rejected?
   **A: Because the log operator's signing key may have been compromised in the 6 months since the checkpoint was issued. The receipt proves inclusion in a tree state that is no longer guaranteed to be authoritative.**

2. Q: Why does freshness check run after checkpoint signature verification, not before?
   **A: If the checkpoint signature is invalid, the timestamp in the checkpoint is untrustworthy — an attacker could set it to any value. Checking freshness on an unverified timestamp is meaningless.**

3. Q: What is the difference between `Stale` and `ClockSkew`?
   **A: `Stale` means the checkpoint is too old (past the max_age window). `ClockSkew` means the checkpoint timestamp is in the future beyond the tolerance, indicating either a misconfigured clock or a malicious timestamp injection. Both are rejected, but the diagnostic reason differs for debugging.**
