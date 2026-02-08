---
id: w16-monitoring-anti-equivocation-d03-equivocation-detection
part: w16-monitoring-anti-equivocation
title: "Equivocation Detection"
order: 3
duration_minutes: 120
prereqs: ["w16-monitoring-anti-equivocation-d02-monitor-gossip-schema"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Equivocation Detection

## Goal

Equivocation occurs when a log operator signs two different checkpoints for the
same tree size—presenting different histories to different parties. Today you
build a detector that compares gossip-received checkpoints against local
observations. The invariant: **any conflict between two signed checkpoints at the
same size generates a signed incident record** containing both checkpoints as
cryptographic evidence.

✅ Deliverables

1. Implement `EquivocationDetector` that compares checkpoint roots at each tree size.
2. Define a `ConflictRecord` struct: both conflicting checkpoints + detection metadata.
3. Sign the conflict record with the detecting monitor's key.
4. Persist conflict records to a dedicated incident log.
5. Test with a simulated split-view attack.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Two checkpoints with same size but different root → conflict detected | detection rate 100% |
| 2 | ConflictRecord contains BOTH conflicting signed checkpoints | both present |
| 3 | ConflictRecord is signed by the detecting monitor | signature valid |
| 4 | Same-size same-root checkpoints from different monitors → no false positive | 0 false positives |
| 5 | Detection latency ≤ 1 gossip round after equivocation | timing check |

## What You're Building Today

An `EquivocationDetector` class that maintains a map of `{tree_size → root_hash}`
from all sources (local observations + gossip). When a new checkpoint arrives, it
checks whether a different root has already been recorded for that size. If so,
it constructs a `ConflictRecord` with both checkpoints as evidence.

✅ Deliverables

- `equivocation.h` / `equivocation.cpp` — detector and conflict records.
- `incident_log.h` / `incident_log.cpp` — persistent incident storage.
- `main.cpp` — CLI: `monitor detect` (runs detector on observation + gossip data).
- `test_equivocation.cpp` — split-view simulation.

```cpp
// Quick taste
EquivocationDetector detector(monitor_id, private_key);
detector.observe(cp_from_local);    // size=10, root="ab..."
detector.observe(cp_from_gossip);   // size=10, root="cd..."  ← DIFFERENT!
// detector.conflicts() → [{local: cp1, remote: cp2, evidence_sig: "..."}]
```

**Can:**
- Detect equivocation from gossip data.
- Produce cryptographic evidence of log misbehaviour.
- Persist incident records for investigation.

**Cannot (yet):**
- Trigger automated alerts (Day 4).
- Execute incident response (Day 5).

## Why This Matters

🔴 **Without equivocation detection**

1. A log operator can show client A one history and client B another—split-view attack.
2. Both clients verify their own view successfully—neither knows the other sees something different.
3. No evidence is generated—the attack is invisible unless clients manually compare.
4. Trust in the log is based on assumption, not verification.

🟢 **With equivocation detection**

1. Any split-view produces two conflicting signed checkpoints at the same tree size.
2. The conflict is machine-detectable by comparing gossip with local observations.
3. The signed conflict record is undeniable evidence—the log operator signed both.
4. Detection is automatic—no human intervention required for initial detection.

🔗 **Connects to**

1. Day 1 — Detector uses observations from the monitor's local log.
2. Day 2 — Gossip provides the cross-monitor data needed for comparison.
3. Day 4 — Alert policy consumes conflict records as triggers.
4. Day 5 — Incident runbook uses conflict records as primary evidence.
5. Week 15 — Signed checkpoints from Day 4 make equivocation provable.

🧠 **Mental model:** Two receipts from the same cashier for the same transaction
number but different amounts. Each receipt individually looks valid (signed by
the cashier). But holding both proves the cashier is dishonest. The pair of
receipts IS the proof—neither alone is sufficient.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│            Equivocation Detection Flow                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Local observation:           Gossip from peer:          │
│  ┌─────────────────┐         ┌─────────────────┐        │
│  │ size: 10        │         │ size: 10        │        │
│  │ root: "ab12..." │         │ root: "cd34..." │        │
│  │ sig:  valid ✓   │         │ sig:  valid ✓   │        │
│  └────────┬────────┘         └────────┬────────┘        │
│           │                           │                  │
│           └──────────┬────────────────┘                  │
│                      ▼                                   │
│           ┌──────────────────────┐                       │
│           │ Same size?  YES      │                       │
│           │ Same root?  NO  ◄── CONFLICT!                │
│           └──────────┬───────────┘                       │
│                      ▼                                   │
│           ┌──────────────────────────────────┐           │
│           │  ConflictRecord                  │           │
│           │  ├─ checkpoint_a: { ab12... }    │           │
│           │  ├─ checkpoint_b: { cd34... }    │           │
│           │  ├─ detector_id: "monitor-A"     │           │
│           │  ├─ detected_at: "2026-..."      │           │
│           │  └─ evidence_sig: "e5f6..."      │           │
│           └──────────────────────────────────┘           │
│                      │                                   │
│                      ▼                                   │
│              Incident Log (persisted)                    │
│              + Alert Pipeline (Day 4)                    │
└──────────────────────────────────────────────────────────┘
```

## Build

**File:** `week-16/day3-equivocation-detection/equivocation.h`

```cpp
#pragma once
#include "signed_checkpoint.h"
#include "gossip.h"
#include <string>
#include <vector>
#include <unordered_map>

struct ConflictRecord {
    SignedCheckpoint checkpoint_a;  // first observation
    SignedCheckpoint checkpoint_b;  // conflicting observation
    std::string source_a;          // who observed checkpoint_a
    std::string source_b;          // who observed checkpoint_b
    std::string detector_id;       // monitor that detected the conflict
    std::string detected_at;       // ISO 8601 timestamp
    std::string evidence_signature; // detecting monitor signs this record

    std::vector<uint8_t> canonical_bytes() const;
    std::string to_json() const;
    static ConflictRecord from_json(const std::string& json);
};

class EquivocationDetector {
public:
    EquivocationDetector(const std::string& monitor_id,
                          const std::vector<uint8_t>& private_key);

    // Record an observation (local or from gossip)
    // Returns a ConflictRecord if equivocation is detected
    std::optional<ConflictRecord> observe(
        const SignedCheckpoint& cp, const std::string& source);

    // All detected conflicts
    const std::vector<ConflictRecord>& conflicts() const { return conflicts_; }

private:
    std::string monitor_id_;
    std::vector<uint8_t> private_key_;

    // Map: tree_size → {root → (checkpoint, source)}
    struct CheckpointEntry {
        SignedCheckpoint cp;
        std::string source;
    };
    std::unordered_map<uint64_t,
        std::unordered_map<std::string, CheckpointEntry>> seen_;
    std::vector<ConflictRecord> conflicts_;

    ConflictRecord create_conflict(
        const CheckpointEntry& existing,
        const SignedCheckpoint& new_cp,
        const std::string& new_source);
    void sign_record(ConflictRecord& record);
};
```

**File:** `week-16/day3-equivocation-detection/equivocation.cpp`

```cpp
#include "equivocation.h"

std::optional<ConflictRecord> EquivocationDetector::observe(
    const SignedCheckpoint& cp, const std::string& source) {
    auto& size_map = seen_[cp.size];

    // Check if we've seen a DIFFERENT root for this size
    for (const auto& [root, entry] : size_map) {
        if (root != cp.root) {
            // EQUIVOCATION DETECTED
            auto conflict = create_conflict(entry, cp, source);
            sign_record(conflict);
            conflicts_.push_back(conflict);
            return conflict;
        }
    }

    // No conflict — record this observation
    if (size_map.find(cp.root) == size_map.end()) {
        size_map[cp.root] = {cp, source};
    }
    return std::nullopt;
}

ConflictRecord EquivocationDetector::create_conflict(
    const CheckpointEntry& existing,
    const SignedCheckpoint& new_cp,
    const std::string& new_source) {
    ConflictRecord record;
    record.checkpoint_a = existing.cp;
    record.checkpoint_b = new_cp;
    record.source_a = existing.source;
    record.source_b = new_source;
    record.detector_id = monitor_id_;
    record.detected_at = /* ISO 8601 now */;
    return record;
}
```

## Do

1. **Implement the size → root comparison map**
   💡 WHY: The detector needs to answer "have I seen a different root for this
   tree size?" in O(1). A hash map keyed by tree size is the natural structure.
   - For each incoming checkpoint, look up `seen_[cp.size]`.
   - If a different root exists → equivocation.
   - If same root → no conflict (expected from honest log).

2. **Implement ConflictRecord creation**
   💡 WHY: The conflict record IS the evidence. It must contain BOTH conflicting
   checkpoints so anyone can independently verify the equivocation.
   - Include both checkpoints with their original log operator signatures.
   - Include metadata: who detected it, when, from which sources.

3. **Implement evidence signing**
   💡 WHY: The detecting monitor signs the conflict record to attest "I saw this
   conflict." This prevents fabrication of conflict records.
   - Sign `canonical_bytes()` of the conflict record.
   - Include the monitor's key_id.

4. **Integrate with gossip receiver**
   💡 WHY: Equivocation detection requires observations from multiple sources.
   The gossip receiver feeds incoming checkpoints into the detector.
   - On each valid gossip message, call `detector.observe(cp, source_id)`.
   - On local verification, call `detector.observe(cp, "self")`.

5. **Test with simulated split-view**
   💡 WHY: You must prove the detector catches real equivocation. Simulating a
   split view is the only way to trigger detection in a controlled setting.
   - Sign two checkpoints with same size but different roots.
   - Feed both to the detector → conflict record produced.
   - Verify the conflict record's signature.

## Done when

- [ ] Two checkpoints with same size, different root → conflict detected — *proves detection*
- [ ] ConflictRecord contains both conflicting signed checkpoints — *proves evidence preservation*
- [ ] ConflictRecord is signed by the detecting monitor — *proves attestation*
- [ ] Same-size same-root from different monitors → no false positive — *proves specificity*
- [ ] Detection occurs within one observe() call of the conflict — *proves latency*

## Proof

Paste or upload:
1. ConflictRecord JSON showing both conflicting checkpoints.
2. Evidence signature verification output.
3. Test output showing no false positives for same-root same-size observations.

**Quick self-test**

Q: Why must the ConflictRecord contain BOTH checkpoints, not just the roots?
A: The full signed checkpoints are self-verifiable evidence. Anyone can check both log operator signatures independently, proving the log operator signed two conflicting states. Roots alone lack the signature proof.

Q: Can the log operator deny equivocation if presented with a ConflictRecord?
A: No. The ConflictRecord contains two checkpoints, each with the operator's valid signature over a different root at the same tree size. The signatures are cryptographic proof of dishonesty.

Q: What if a monitor fabricates a ConflictRecord?
A: The ConflictRecord contains the log operator's signatures on both checkpoints. A monitor cannot forge the operator's signature. The only fabrication risk is the monitor's own attestation, which is why the detecting monitor's key is known and its signature verifiable.
