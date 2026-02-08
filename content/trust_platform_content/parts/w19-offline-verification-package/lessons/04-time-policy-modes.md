---
id: w19-offline-verification-package-d04-time-policy-modes
part: w19-offline-verification-package
title: "Time Policy Modes"
order: 4
duration_minutes: 120
prereqs: ["w19-offline-verification-package-d03-airgap-verification-flow"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Time Policy Modes

## Goal

Implement three time-policy modes — `strict`, `grace`, and `archival` — that govern how the verifier handles time-sensitive checks (freshness, expiration, key validity). The verifier's output must include which policy mode was used, so that consumers can assess the trust level of the verdict.

### ✅ Deliverables

1. A `TimePolicyMode` enum: `STRICT`, `GRACE`, `ARCHIVAL`.
2. A `TimePolicyConfig` struct with configurable thresholds per mode.
3. Integration with the air-gap verifier — mode selection affects freshness, expiration, and key-validity checks.
4. Verifier output includes the mode used as a field in both machine and human formats.
5. Shipped design document: `week-19/day4-time-policy-modes.md`.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | `STRICT` mode rejects expired documents | Set expiration in the past, verify → FAIL |
| 2 | `GRACE` mode accepts documents within grace window | Expired 1 hour ago, grace = 24h → PASS |
| 3 | `ARCHIVAL` mode accepts any expiration | Expired 5 years ago → PASS |
| 4 | Output machine line includes mode field | Parse line, assert 5th field = mode |
| 5 | Output human block includes mode explanation | Check for "Policy mode: GRACE" line |

## What You're Building Today

You are building the "context dial" for time sensitivity. The same document might need strict real-time checking at a border crossing, graceful tolerance at a hospital that's been offline for two days, or full archival acceptance in a researcher's lab studying 10-year-old records. The time-policy mode controls this.

### ✅ Deliverables

- `time_policy.h` / `time_policy.cpp` — mode definitions and config
- `time_checks.cpp` — mode-aware freshness, expiration, and key checks
- `time_policy_test.cpp` — tests for each mode
- Integration patch for `AirGapVerifier`

```cpp
// time_policy.h
#pragma once
#include <cstdint>
#include <string>

enum class TimePolicyMode { STRICT, GRACE, ARCHIVAL };

struct TimePolicyConfig {
    TimePolicyMode mode;
    int64_t        grace_window_seconds;   // only used in GRACE mode
    int64_t        clock_skew_tolerance;   // applied in all modes
};

struct TimeCheckResult {
    bool            passed;
    TimePolicyMode  mode_used;
    std::string     detail;
};

// Check document expiration under the given policy
TimeCheckResult check_expiration(
    int64_t expiration_ts,
    int64_t now,
    const TimePolicyConfig& config);

// Check receipt freshness under the given policy
TimeCheckResult check_receipt_freshness(
    int64_t receipt_ts,
    int64_t now,
    const TimePolicyConfig& config);

// Check key validity under the given policy
TimeCheckResult check_key_validity(
    int64_t key_deactivated_at,
    int64_t now,
    const TimePolicyConfig& config);
```

You **can**:
- Verify documents under three different time-sensitivity levels.
- Include the policy mode in the verifier output for transparency.

You **cannot yet**:
- Batch-verify with mixed modes per document (Day 5).
- Dynamically switch modes mid-verification (single mode per invocation).

## Why This Matters

🔴 **Without time-policy modes:**
- Expired documents are always rejected — even for legitimate archival research.
- Offline verifiers with stale clocks produce false rejections in strict mode.
- No way for a field operator to relax time checks when disconnected for days.
- Consumers don't know what time assumptions the verdict was based on.

🟢 **With time-policy modes:**
- `STRICT` for real-time, `GRACE` for degraded connectivity, `ARCHIVAL` for research.
- Each mode has explicit, documented thresholds — no ambiguity.
- Verifier output declares the mode, so consumers assess trust accordingly.
- Field operators select the appropriate mode for their operational context.

🔗 **Connects:**
- **Week 17 Day 2** (key policy) — key validity checks are mode-aware today.
- **Week 18 Day 4** (freshness policy) — freshness check is extended with mode support.
- **Week 19 Day 1** (UX contract) — mode is added to the machine-line and human-block formats.
- **Week 19 Day 3** (air-gap flow) — air-gap verifier accepts a `TimePolicyConfig` parameter.
- **Week 20 Day 1** (chaos matrix) — chaos tests exercise all three modes under failure conditions.

🧠 **Mental model: "Security Alert Levels"** — An airport operates at different alert levels: normal (routine checks), elevated (extra screening), and critical (full lockdown). Each level changes the rules. Time-policy modes are your alert levels for time sensitivity — `STRICT` is critical, `GRACE` is elevated, `ARCHIVAL` is normal for historical contexts.

## Visual Model

```
┌───────────────── Time Policy Modes ──────────────────┐
│                                                       │
│  ┌─── STRICT ────────────────────────────────────┐   │
│  │  Freshness: max_age only (no grace)            │   │
│  │  Expiration: reject if expired                  │   │
│  │  Key: reject if deactivated                     │   │
│  │  Use: real-time border checks                   │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  ┌─── GRACE ─────────────────────────────────────┐   │
│  │  Freshness: max_age + grace_window              │   │
│  │  Expiration: accept if within grace_window      │   │
│  │  Key: accept if within grace_window             │   │
│  │  Use: field offices with intermittent network   │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  ┌─── ARCHIVAL ──────────────────────────────────┐   │
│  │  Freshness: any age accepted                    │   │
│  │  Expiration: any expiration accepted             │   │
│  │  Key: historical key validity accepted           │   │
│  │  Use: research, legal discovery, audits         │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  Output: verdict + "Policy mode: <MODE>"              │
└───────────────────────────────────────────────────────┘
```

## Build

File: `week-19/day4-time-policy-modes.md`

## Do

### 1. **Define the TimePolicyMode enum and config**

> 💡 *WHY: A config struct decouples mode definitions from the verification logic. Operators can deploy custom thresholds without recompiling.*

Create `time_policy.h` with the enum and `TimePolicyConfig`. `grace_window_seconds` defaults to 86400 (24 hours). `clock_skew_tolerance` defaults to 300 (5 minutes). `ARCHIVAL` ignores both.

### 2. **Implement mode-aware expiration check**

> 💡 *WHY: Expiration is the most user-visible time check. Getting it wrong means either rejecting valid documents (too strict) or accepting dangerous ones (too loose).*

Write `check_expiration()`: `STRICT` — reject if `now > expiration_ts + clock_skew_tolerance`. `GRACE` — reject if `now > expiration_ts + grace_window_seconds`. `ARCHIVAL` — always pass, with a note that archival mode was used.

### 3. **Implement mode-aware freshness and key-validity checks**

> 💡 *WHY: Freshness and key-validity follow the same pattern as expiration but check different timestamps. Consolidating the pattern avoids copy-paste bugs.*

Write `check_receipt_freshness()` and `check_key_validity()` following the same three-mode logic. Each returns a `TimeCheckResult` with `mode_used` populated — this is what appears in the verifier output.

### 4. **Integrate with the air-gap verifier**

> 💡 *WHY: The air-gap verifier (Day 3) currently uses a fixed freshness policy. Today you parameterise it with a `TimePolicyConfig`, making it mode-aware.*

Add `TimePolicyConfig` as a parameter to `verify_airgap()`. Replace the fixed freshness check with `check_receipt_freshness()`. Add `check_expiration()` and `check_key_validity()` calls. Include `mode_used` in the machine line (5th field) and human block.

### 5. **Document the three modes**

> 💡 *WHY: Operators must understand when to use each mode. Choosing the wrong mode is a security decision — the document must make the trade-offs explicit.*

Write `week-19/day4-time-policy-modes.md` covering: mode definitions and thresholds, recommended use cases for each mode, security implications of `GRACE` and `ARCHIVAL`, and configuration guidelines (who decides which mode is used, and how).

## Done when

- [ ] `STRICT` mode rejects expired documents — *the default for real-time border checks*
- [ ] `GRACE` mode accepts documents within the grace window — *supports field offices disconnected for up to 24 hours*
- [ ] `ARCHIVAL` mode accepts any age, expiration, and key status — *enables historical research without false rejections*
- [ ] Verifier output includes the policy mode in both machine and human formats — *consumers know the trust level of the verdict*
- [ ] Design doc specifies modes, thresholds, use cases, and security trade-offs — *operators choose the right mode from this guide*

## Proof

Upload `week-19/day4-time-policy-modes.md` and a terminal screenshot showing: (a) an expired document rejected in STRICT mode, (b) the same document accepted in GRACE mode, and (c) a 5-year-old document accepted in ARCHIVAL mode.

### **Quick self-test**

**Q1:** Why must the output declare the policy mode used?
→ **A: A PASS verdict in ARCHIVAL mode is categorically different from a PASS in STRICT mode. The consumer needs to know the trust level. Omitting the mode would let archival-mode verdicts masquerade as strict-mode verdicts.**

**Q2:** Can a verifier switch modes mid-verification?
→ **A: No. One mode per invocation. If you need multiple modes, run the verifier multiple times with different configs. This prevents confused-deputy attacks where a lenient mode is used for a strict-mode check.*

**Q3:** Is ARCHIVAL mode a security risk?
→ **A: Yes, if misused. It bypasses all time-based protections. It should be restricted to research contexts with explicit audit logging. The design doc recommends requiring operator acknowledgment before enabling archival mode.**
