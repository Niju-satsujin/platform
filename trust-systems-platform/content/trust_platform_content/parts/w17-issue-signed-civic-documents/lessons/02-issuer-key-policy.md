---
id: w17-issue-signed-civic-documents-d02-issuer-key-policy
part: w17-issue-signed-civic-documents
title: "Issuer Key Policy"
order: 2
duration_minutes: 120
prereqs: ["w17-issue-signed-civic-documents-d01-document-schema"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Issuer Key Policy

## Goal

Build a key-policy engine that governs which cryptographic keys an issuer may use at any point in time, including support for key rotation with an overlap window so that documents signed by a prior active key remain verifiable during the transition period.

### ✅ Deliverables

1. An `IssuerKeyPolicy` class that stores a timeline of active keys with activation and deactivation timestamps.
2. A `resolve_key(timestamp)` method returning the valid signing key (or keys during overlap).
3. An overlap-window validator that accepts signatures from the prior key within a configurable grace period.
4. Rejection logic for keys that are fully deactivated — no grace period bypasses.
5. A shipped design document: `week-17/day2-issuer-key-policy.md`.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Key timeline stores ≥ 2 keys with activation/deactivation | Inspect `IssuerKeyPolicy` after loading test fixture |
| 2 | `resolve_key(t)` returns correct key for mid-window timestamp | Unit test with known timestamps |
| 3 | Overlap window accepts prior key within grace period | Signature from old key verifies if within window |
| 4 | Fully deactivated key is rejected unconditionally | Verification returns `KEY_EXPIRED` error |
| 5 | Design doc covers rotation ceremony and overlap rules | `week-17/day2-issuer-key-policy.md` contains both sections |

## What You're Building Today

You are building the policy layer that sits between "I have a key" and "I may use this key." Without this, any leaked or retired key could sign documents forever.

### ✅ Deliverables

- `issuer_key_policy.h` — class definition with key timeline
- `key_resolver.cpp` — timestamp-based key lookup
- `overlap_validator.cpp` — grace-period logic
- `key_policy_test.cpp` — tests for rotation scenarios

```cpp
// issuer_key_policy.h
#pragma once
#include <vector>
#include <string>
#include <optional>
#include <cstdint>

struct KeySlot {
    std::string key_id;
    std::string public_key_pem;
    int64_t     activated_at;   // epoch seconds
    int64_t     deactivated_at; // 0 = still active
};

class IssuerKeyPolicy {
public:
    void add_key(KeySlot slot);
    std::optional<KeySlot> resolve_key(int64_t timestamp) const;
    bool in_overlap_window(const std::string& key_id,
                           int64_t timestamp,
                           int64_t grace_seconds) const;
private:
    std::vector<KeySlot> timeline_;
};
```

You **can**:
- Determine which key is valid for any given timestamp.
- Accept signatures from a recently-rotated key within a grace window.

You **cannot yet**:
- Actually sign documents (Day 3).
- Revoke individual documents (Day 4).
- Enforce pre-signing policy gates (Day 5).

## Why This Matters

🔴 **Without issuer key policy:**
- A compromised old key can forge documents indefinitely.
- Key rotation is a flag-day event — all prior documents break.
- No auditability of which key was valid at signing time.
- Grace-period ambiguity leads to intermittent verification failures.

🟢 **With issuer key policy:**
- Old keys are time-bounded — forgery window shrinks to overlap duration.
- Rotation is seamless; verifiers consult the timeline, not a single key.
- Audit trails map every document to the exact key that signed it.
- Overlap window gives operational teams a safe rotation runway.

🔗 **Connects:**
- **Week 14** (identity primitives) — key material originates from identity key generation.
- **Week 15** (trust policy engine) — policy engine references key validity status.
- **Week 17 Day 1** (document schema) — `issuer_id` in schema maps to a key timeline.
- **Week 18** (transparency log) — anchoring receipt references the signing key's ID.
- **Week 20 Day 4** (key compromise runbook) — runbook triggers immediate deactivation in this timeline.

🧠 **Mental model: "Shift Schedule"** — Think of keys like employees on a shift schedule. The day-shift key clocks out, the night-shift key clocks in, and there's a 30-minute handover where both are on the floor. After the handover, the day-shift key cannot serve customers.

## Visual Model

```
┌─────────────────── Key Timeline ───────────────────┐
│                                                     │
│  Key-A  ████████████████░░░░░                       │
│         activated       deactivated                 │
│                    ┌── overlap ──┐                   │
│  Key-B         ░░░░████████████████████             │
│                activated               (active)     │
│                                                     │
│  Time ──▶  t0     t1    t2    t3    t4    now       │
│                                                     │
│  resolve_key(t1) → Key-A ✓                          │
│  resolve_key(t2) → Key-A (overlap) or Key-B ✓      │
│  resolve_key(t4) → Key-B ✓                          │
│  resolve_key(t0-1) → ∅  (no key active)            │
│                                                     │
│  Legend: ████ = active  ░░░░ = overlap/ramp         │
└─────────────────────────────────────────────────────┘
```

## Build

File: `week-17/day2-issuer-key-policy.md`

## Do

### 1. **Model the key timeline**

> 💡 *WHY: A flat "current key" field cannot represent rotation. You need an ordered list of key slots with time boundaries.*

Implement `IssuerKeyPolicy::add_key()`. Maintain `timeline_` sorted by `activated_at`. Validate that no two slots have overlapping active ranges beyond the declared grace period.

### 2. **Implement timestamp-based key resolution**

> 💡 *WHY: When a verifier checks a document signed at time T, it must know which key was authoritative at T — not which key is active now.*

Write `resolve_key(int64_t timestamp)`. Binary-search the timeline. Return the key whose `[activated_at, deactivated_at)` range contains the timestamp. If multiple keys are active (overlap), return the newest.

### 3. **Add overlap-window validation**

> 💡 *WHY: During key rotation, in-flight documents may arrive signed by the old key. The overlap window prevents false rejections.*

Implement `in_overlap_window()`. A deactivated key is "in overlap" if `timestamp < deactivated_at + grace_seconds`. Return `true` only if the key was the immediately-prior active key.

### 4. **Enforce hard deactivation**

> 💡 *WHY: The overlap window must be finite. After it closes, the old key must be irrevocably dead to bound the forgery window.*

After the grace period, `resolve_key()` must return `std::nullopt` for the old key. Unit-test with a timestamp 1 second past the grace boundary and assert rejection.

### 5. **Document the rotation ceremony**

> 💡 *WHY: Operational teams need a step-by-step procedure — generate new key, register in timeline, wait for overlap, deactivate old key.*

Write `week-17/day2-issuer-key-policy.md` covering: rotation trigger conditions, overlap duration recommendations (e.g., 24-72 hours), emergency rotation (zero overlap), and rollback procedure if the new key fails health checks.

## Done when

- [ ] Key timeline stores multiple keys with non-overlapping active periods (plus declared overlap) — *Week 20's key-compromise runbook triggers emergency deactivation on this timeline*
- [ ] `resolve_key(t)` returns the correct key for timestamps before, during, and after overlap — *every verification in Weeks 18-19 calls this resolver*
- [ ] Prior key is accepted within the overlap grace period — *prevents false rejections during rolling deployments*
- [ ] Prior key is rejected one second after the grace period expires — *bounds the forgery window to a known, auditable duration*
- [ ] Design doc describes rotation ceremony, overlap recommendations, and emergency procedure — *operations teams follow this in Week 20 chaos drills*

## Proof

Upload `week-17/day2-issuer-key-policy.md` and a terminal screenshot showing all key-resolution tests passing, including the overlap boundary edge cases.

### **Quick self-test**

**Q1:** Why not just have one active key at a time with instant cutover?
→ **A: In a distributed system, clock skew and in-flight messages mean some nodes will still present the old key after cutover. The overlap window absorbs this latency.**

**Q2:** What happens if the overlap window is set to zero?
→ **A: It becomes an emergency rotation — the old key is immediately dead. Any in-flight documents signed with it will fail verification. This is acceptable only for key compromise.**

**Q3:** Can two overlap windows of consecutive rotations ever overlap each other?
→ **A: No — `add_key()` validates that a new key's activation is after the prior key's deactivation plus any existing grace period. Overlapping overlaps would create an ambiguous three-key window.**
