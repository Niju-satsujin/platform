---
id: w19-offline-verification-package-d05-batch-verifier-rules
part: w19-offline-verification-package
title: "Batch Verifier Rules"
order: 5
duration_minutes: 120
prereqs: ["w19-offline-verification-package-d04-time-policy-modes"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Batch Verifier Rules

## Goal

Implement a batch verification engine that processes multiple `OfflineBundle` instances and produces per-document verdicts. A failure in one bundle must not affect the verdicts of other bundles. The batch engine must be safe, fair, and exhaustive — every bundle gets a verdict, even if some fail catastrophically.

### ✅ Deliverables

1. A `BatchVerifier` class that accepts a vector of `OfflineBundle` and produces a vector of `VerifierOutput` (one per bundle).
2. Isolation guarantee: an exception or crash in one bundle's verification does not skip or taint other bundles.
3. Per-bundle timing: the output includes wall-clock time spent on each verification.
4. Summary statistics: total, passed, failed, error counts.
5. Shipped design document: `week-19/day5-batch-verifier-rules.md`.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | 5 bundles in → 5 verdicts out (even if 2 fail) | Submit 3 valid + 2 invalid, assert 5 results |
| 2 | Invalid bundle does not affect valid bundle's verdict | Valid bundle after invalid still returns PASS |
| 3 | Per-bundle timing is non-zero | Check `elapsed_ms > 0` for each result |
| 4 | Summary shows correct pass/fail/error counts | Assert counts match expected |
| 5 | Catastrophic failure (e.g., corrupt bytes) returns ERROR, not crash | Submit garbage bytes, assert ERROR verdict |

## What You're Building Today

You are building the production-scale verification engine. In the real world, a checkpoint might need to verify 200 civic documents at once — a busload of passengers, a shipment manifest, a batch of certificates. Each document must get its own verdict. One bad apple must not crash the barrel.

### ✅ Deliverables

- `batch_verifier.h` / `batch_verifier.cpp` — batch engine
- `batch_result.h` — per-bundle result with timing and summary
- `batch_test.cpp` — isolation, timing, and summary tests

```cpp
// batch_verifier.h
#pragma once
#include "offline_bundle.h"
#include "verifier_output.h"
#include "time_policy.h"
#include <vector>
#include <chrono>

struct BatchEntry {
    VerifierOutput output;
    int64_t        elapsed_ms;
    bool           had_exception;
};

struct BatchSummary {
    size_t total;
    size_t passed;
    size_t failed;
    size_t errors;   // exceptions/crashes
    int64_t total_elapsed_ms;
};

class BatchVerifier {
public:
    explicit BatchVerifier(TimePolicyConfig config);

    std::vector<BatchEntry> verify_batch(
        const std::vector<OfflineBundle>& bundles,
        int64_t local_clock_epoch) const;

    BatchSummary summarise(
        const std::vector<BatchEntry>& results) const;

private:
    TimePolicyConfig config_;
    AirGapVerifier   verifier_;
};
```

You **can**:
- Verify hundreds of bundles in a single invocation with per-document verdicts.
- Get timing data for performance monitoring.

You **cannot yet**:
- Parallelise across CPU cores (future optimisation).
- Stream results as they complete (future enhancement).

## Why This Matters

🔴 **Without batch isolation:**
- One corrupt bundle crashes the verifier — all remaining bundles are unprocessed.
- A slow verification blocks all subsequent bundles indefinitely.
- No summary statistics — operators count pass/fail manually from logs.
- No per-bundle timing — performance bottlenecks are invisible.

🟢 **With batch isolation:**
- Every bundle gets a verdict regardless of other bundles' outcomes.
- Exceptions are caught per-bundle and reported as `ERROR`, not propagated.
- Summary statistics enable quick triage: "47 passed, 2 failed, 1 error."
- Per-bundle timing identifies slow verifications for investigation.

🔗 **Connects:**
- **Week 19 Day 1** (UX contract) — each `BatchEntry.output` follows the UX contract.
- **Week 19 Day 3** (air-gap flow) — the `AirGapVerifier` runs each bundle.
- **Week 19 Day 4** (time policy) — a single `TimePolicyConfig` applies to all bundles.
- **Week 20 Day 1** (chaos matrix) — chaos tests submit batches with injected failures.
- **Week 20 Day 5** (restore validation) — restored systems batch-verify all stored bundles.

🧠 **Mental model: "Assembly Line Quality Check"** — On an assembly line, every widget gets inspected independently. If widget #47 is defective, the inspector marks it and moves to #48. The inspector doesn't stop the line. The batch verifier is your assembly line — every bundle gets inspected, every defect is recorded, and the line never stops.

## Visual Model

```
┌──────────── BatchVerifier ────────────────────────────┐
│                                                        │
│  Input: [ Bundle-1, Bundle-2, Bundle-3, ..., N ]       │
│  Config: TimePolicyConfig (one mode for all)           │
│                                                        │
│  ┌─── Loop: for each bundle ───────────────────────┐  │
│  │                                                  │  │
│  │  try {                                           │  │
│  │    start = clock()                               │  │
│  │    output = verifier_.verify_airgap(bundle, now) │  │
│  │    elapsed = clock() - start                     │  │
│  │    results.push_back({output, elapsed, false})   │  │
│  │  } catch (exception& e) {                        │  │
│  │    results.push_back({ERROR_output, 0, true})    │  │
│  │  }                                               │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Output: [ Entry-1, Entry-2, Entry-3, ..., N ]         │
│                                                        │
│  Summary: { total: N, passed: X, failed: Y, err: Z }  │
└────────────────────────────────────────────────────────┘
```

## Build

File: `week-19/day5-batch-verifier-rules.md`

## Do

### 1. **Build the BatchVerifier class**

> 💡 *WHY: The class encapsulates the config and the inner `AirGapVerifier`. Each invocation is stateless — no state leaks between batches.*

Create `BatchVerifier` with a constructor taking `TimePolicyConfig`. Store an `AirGapVerifier` internally. `verify_batch()` iterates the input vector and calls `verify_airgap()` for each bundle.

### 2. **Implement per-bundle exception isolation**

> 💡 *WHY: A `std::bad_alloc` or a corrupt bundle that triggers undefined behavior in deserialization must not take down the entire batch. Catch everything, record the error, continue.*

Wrap each `verify_airgap()` call in a `try/catch(...)` block. On exception, set `had_exception = true`, produce an ERROR-class `VerifierOutput`, and continue to the next bundle. Never re-throw.

### 3. **Add per-bundle timing**

> 💡 *WHY: Timing reveals performance anomalies. If bundle #47 takes 10 seconds while others take 10 milliseconds, something is wrong with that bundle's data.*

Use `std::chrono::steady_clock` to measure wall-clock time for each `verify_airgap()` call. Store as `elapsed_ms` in the `BatchEntry`. Include in the machine-line output as an additional field.

### 4. **Implement the summary function**

> 💡 *WHY: Operators need a one-glance overview. "200 total, 197 passed, 2 failed, 1 error" tells them whether to investigate or move on.*

Write `summarise()`: iterate `BatchEntry` results. Count PASS (machine line starts with "PASS"), FAIL, and ERROR. Compute `total_elapsed_ms` as the sum of per-bundle times.

### 5. **Document the batch verification rules**

> 💡 *WHY: The isolation guarantee is the most important property. Without documenting it, future developers might "optimise" by removing the try/catch.*

Write `week-19/day5-batch-verifier-rules.md` covering: isolation guarantee (one failure ≠ batch abort), timing semantics (wall-clock, not CPU), summary statistics format, ordering guarantee (results are in input order), and future parallelisation considerations.

## Done when

- [ ] Every input bundle produces exactly one output entry, regardless of other bundles' outcomes — *the core isolation guarantee*
- [ ] An exception in one bundle produces an ERROR entry, not a crash — *no single bad bundle takes down the batch*
- [ ] Per-bundle timing is accurate to millisecond granularity — *performance monitoring for production workloads*
- [ ] Summary counts match the actual pass/fail/error distribution — *operators triage from the summary*
- [ ] Design doc specifies isolation, timing, ordering, and future parallelisation — *maintainers understand the performance and safety contracts*

## Proof

Upload `week-19/day5-batch-verifier-rules.md` and a terminal screenshot showing: a batch of 5 bundles (3 valid, 1 tampered, 1 corrupt) producing 5 results with correct verdicts and a matching summary.

### **Quick self-test**

**Q1:** Why catch *all* exceptions, even `std::bad_alloc`?
→ **A: In a batch context, a memory failure on one bundle should not prevent the other 199 bundles from being verified. The ERROR entry records the failure; the operator investigates that bundle separately.**

**Q2:** Why not parallelise across threads?
→ **A: Today's goal is correctness and isolation. Parallelisation introduces shared-state bugs (race conditions on the summary counters, thread-safety of the AirGapVerifier). It's a future optimisation once the serial version is proven correct.**

**Q3:** If results are in input order, how does the consumer match results to bundles?
→ **A: By index. `results[i]` corresponds to `bundles[i]`. The bundle ID from `BundleMetadata.bundle_id` is also included in the machine line for cross-referencing.**
