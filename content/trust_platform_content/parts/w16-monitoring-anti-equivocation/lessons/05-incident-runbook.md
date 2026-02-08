---
id: w16-monitoring-anti-equivocation-d05-incident-runbook
part: w16-monitoring-anti-equivocation
title: "Incident Runbook"
order: 5
duration_minutes: 120
prereqs: ["w16-monitoring-anti-equivocation-d04-alert-policy"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Incident Runbook

## Goal

When an EMERGENCY fires, responders need a clear, step-by-step procedure. Today
you build an **incident runbook**: a machine-structured document that defines
decision criteria, evidence collection, escalation paths, and recovery procedures.
The invariant: **the runbook includes freeze-new-acceptance decision criteria**—
explicit conditions under which the system stops trusting the log until
investigation concludes.

✅ Deliverables

1. Define a structured `Runbook` format with phases: detect → freeze → investigate → resolve.
2. Implement freeze-new-acceptance logic that halts log trust on EMERGENCY.
3. Define evidence collection checklist for each incident type.
4. Implement a `RunbookExecutor` that guides responders through each phase.
5. Build a CLI: `incident run <alert.json>` that starts the runbook workflow.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | EMERGENCY alert triggers freeze within 1 second | timing check |
| 2 | Freeze halts all new proof acceptance | verify returns FROZEN |
| 3 | Evidence collection checklist covers observation log, gossip, conflicts | 3+ items |
| 4 | Unfreeze requires explicit operator confirmation + investigation ID | guard check |
| 5 | Runbook phases execute in order: detect → freeze → investigate → resolve | sequence check |

## What You're Building Today

A `RunbookExecutor` that takes an EMERGENCY alert, freezes new acceptance,
guides evidence collection, and provides structured resolution steps. The
executor is a state machine that progresses through phases, requiring explicit
operator decisions at each gate.

✅ Deliverables

- `runbook.h` / `runbook.cpp` — runbook state machine.
- `freeze_gate.h` / `freeze_gate.cpp` — freeze/unfreeze logic.
- `runbook_template.json` — structured runbook template.
- `main.cpp` — CLI: `incident run <alert.json>`.
- `test_runbook.cpp` — end-to-end phase progression test.

```cpp
// Quick taste
RunbookExecutor executor(runbook_template, verifier, freeze_gate);
executor.start(emergency_alert);
// Phase 1: DETECT — alert ingested, evidence recorded
// Phase 2: FREEZE — new acceptance halted
//   verifier.verify(...) → FROZEN (all proofs rejected)
// Phase 3: INVESTIGATE — guided evidence collection
// Phase 4: RESOLVE — operator confirms resolution, unfreeze
executor.resolve("INC-2026-001", "false positive confirmed by manual audit");
```

**Can:**
- Execute a structured incident response.
- Freeze and unfreeze log acceptance.
- Collect and bundle evidence for investigation.

**Cannot (yet):**
- Automatically determine if an incident is real or false positive.
- Coordinate multi-party incident response (requires protocol extension).

## Why This Matters

🔴 **Without an incident runbook**

1. EMERGENCY fires and responders panic—no clear first step.
2. No freeze mechanism means the system continues trusting a potentially compromised log.
3. Evidence is collected ad-hoc—some is missed, some is contaminated.
4. No formal resolution—the incident is "handled" but never closed with documentation.

🟢 **With a structured runbook**

1. Responders follow a tested, step-by-step procedure—no guesswork.
2. Automatic freeze prevents further damage during investigation.
3. Evidence checklist ensures nothing is missed.
4. Formal resolution creates an audit trail for post-mortems and compliance.

🔗 **Connects to**

1. Day 1 — Observation logs are primary evidence during investigation.
2. Day 2 — Gossip logs provide corroborating evidence from other monitors.
3. Day 3 — ConflictRecords are the evidence that triggered the incident.
4. Day 4 — Alert policy determines which events trigger the runbook.
5. Week 15 — The verifier's freeze mode prevents accepting proofs from the compromised log.

🧠 **Mental model:** A fire evacuation plan. When the alarm (EMERGENCY) sounds,
you follow the plan: 1) pull the alarm (freeze), 2) evacuate (stop accepting),
3) fire brigade investigates (evidence collection), 4) all-clear (unfreeze after
resolution). The plan exists BEFORE the fire.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│              Incident Runbook Phases                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  EMERGENCY Alert                                         │
│       │                                                  │
│       ▼                                                  │
│  ┌─────────────────────────────────────┐                 │
│  │ PHASE 1: DETECT                     │                 │
│  │ • Ingest alert + evidence            │                 │
│  │ • Log incident ID (INC-YYYY-NNN)    │                 │
│  │ • Notify on-call responder          │                 │
│  └────────────────┬────────────────────┘                 │
│                   ▼                                      │
│  ┌─────────────────────────────────────┐                 │
│  │ PHASE 2: FREEZE                     │                 │
│  │ • Set verifier mode = FROZEN        │                 │
│  │ • All verify() calls → FROZEN       │                 │
│  │ • Record freeze timestamp           │                 │
│  │ • Decision: freeze if                │                 │
│  │   - EQUIVOCATION evidence exists    │                 │
│  │   - OR signature failure from 2+    │                 │
│  │     independent monitors            │                 │
│  └────────────────┬────────────────────┘                 │
│                   ▼                                      │
│  ┌─────────────────────────────────────┐                 │
│  │ PHASE 3: INVESTIGATE                │                 │
│  │ • Collect: observation log          │                 │
│  │ • Collect: gossip message log       │                 │
│  │ • Collect: ConflictRecords          │                 │
│  │ • Collect: log server responses     │                 │
│  │ • Verify all evidence signatures    │                 │
│  │ • Determine: real attack or false+  │                 │
│  └────────────────┬────────────────────┘                 │
│                   ▼                                      │
│  ┌─────────────────────────────────────┐                 │
│  │ PHASE 4: RESOLVE                    │                 │
│  │ • Operator decision:                │                 │
│  │   - False positive → unfreeze       │                 │
│  │   - Real attack → rotate keys,      │                 │
│  │     new log operator, unfreeze      │                 │
│  │ • Record resolution + justification │                 │
│  │ • Close incident ID                 │                 │
│  └─────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────┘
```

## Build

**File:** `week-16/day5-incident-runbook/runbook.h`

```cpp
#pragma once
#include "alert.h"
#include "client_verifier.h"
#include <string>
#include <vector>
#include <optional>

enum class IncidentPhase {
    DETECT,
    FREEZE,
    INVESTIGATE,
    RESOLVE,
    CLOSED,
};

struct EvidenceItem {
    std::string type;       // "observation_log", "gossip_log", "conflict_record"
    std::string path;       // file path or inline JSON
    std::string integrity;  // SHA-256 of the evidence file
};

struct IncidentRecord {
    std::string incident_id;    // INC-YYYY-NNN
    IncidentPhase phase;
    Alert trigger_alert;
    std::string freeze_time;
    std::string resolve_time;
    std::string resolution;      // operator's written resolution
    std::vector<EvidenceItem> evidence;

    std::string to_json() const;
};

class FreezeGate {
public:
    void freeze(const std::string& incident_id);
    void unfreeze(const std::string& incident_id,
                  const std::string& resolution);
    bool is_frozen() const { return frozen_; }
    std::string frozen_by() const { return frozen_by_; }

private:
    bool frozen_ = false;
    std::string frozen_by_;
};

class RunbookExecutor {
public:
    RunbookExecutor(Verifier& verifier, FreezeGate& gate);

    // Start incident from an EMERGENCY alert
    IncidentRecord start(const Alert& alert);

    // Advance to next phase
    void advance(IncidentRecord& record);

    // Collect evidence item
    void collect_evidence(IncidentRecord& record,
                          const EvidenceItem& item);

    // Resolve incident (requires operator confirmation)
    void resolve(IncidentRecord& record,
                 const std::string& resolution);

private:
    Verifier& verifier_;
    FreezeGate& gate_;
    std::string generate_incident_id();
    uint32_t next_id_ = 1;
};
```

**File:** `week-16/day5-incident-runbook/runbook.cpp`

```cpp
#include "runbook.h"
#include <sstream>
#include <iomanip>
#include <chrono>

IncidentRecord RunbookExecutor::start(const Alert& alert) {
    IncidentRecord record;
    record.incident_id = generate_incident_id();
    record.phase = IncidentPhase::DETECT;
    record.trigger_alert = alert;

    // Phase 1: DETECT — record the triggering alert
    // Automatically advance to FREEZE for EMERGENCY
    if (alert.severity == Severity::EMERGENCY) {
        record.phase = IncidentPhase::FREEZE;
        gate_.freeze(record.incident_id);
        record.freeze_time = /* ISO 8601 now */;
    }

    return record;
}

void RunbookExecutor::collect_evidence(
    IncidentRecord& record, const EvidenceItem& item) {
    if (record.phase != IncidentPhase::INVESTIGATE) {
        throw std::runtime_error(
            "cannot collect evidence outside INVESTIGATE phase");
    }
    record.evidence.push_back(item);
}

void RunbookExecutor::resolve(
    IncidentRecord& record, const std::string& resolution) {
    if (record.phase != IncidentPhase::INVESTIGATE &&
        record.phase != IncidentPhase::FREEZE) {
        throw std::runtime_error(
            "cannot resolve from current phase");
    }
    record.resolution = resolution;
    record.resolve_time = /* ISO 8601 now */;
    record.phase = IncidentPhase::CLOSED;
    gate_.unfreeze(record.incident_id, resolution);
}

void RunbookExecutor::advance(IncidentRecord& record) {
    switch (record.phase) {
        case IncidentPhase::DETECT:
            record.phase = IncidentPhase::FREEZE;
            break;
        case IncidentPhase::FREEZE:
            record.phase = IncidentPhase::INVESTIGATE;
            break;
        case IncidentPhase::INVESTIGATE:
            // Cannot auto-advance — requires resolve()
            throw std::runtime_error(
                "INVESTIGATE requires explicit resolve()");
        default:
            break;
    }
}

std::string RunbookExecutor::generate_incident_id() {
    std::ostringstream oss;
    oss << "INC-2026-" << std::setfill('0')
        << std::setw(3) << next_id_++;
    return oss.str();
}
```

**File:** `week-16/day5-incident-runbook/freeze_gate.cpp`

```cpp
#include "runbook.h"
#include <stdexcept>

void FreezeGate::freeze(const std::string& incident_id) {
    if (frozen_) {
        throw std::runtime_error("already frozen by " + frozen_by_);
    }
    frozen_ = true;
    frozen_by_ = incident_id;
}

void FreezeGate::unfreeze(const std::string& incident_id,
                           const std::string& resolution) {
    if (!frozen_) {
        throw std::runtime_error("not currently frozen");
    }
    if (frozen_by_ != incident_id) {
        throw std::runtime_error(
            "can only unfreeze with the incident that froze: "
            + frozen_by_);
    }
    if (resolution.empty()) {
        throw std::runtime_error(
            "resolution justification required to unfreeze");
    }
    frozen_ = false;
    frozen_by_.clear();
}
```

## Do

1. **Define the freeze decision criteria**
   💡 WHY: Not every alert warrants a freeze. The criteria define when the
   system should stop trusting the log—too aggressive and you get false freezes,
   too lenient and you miss real attacks.
   - Freeze if: EQUIVOCATION evidence exists (any), OR signature failure from
     2+ independent monitors, OR consistency failure from 3+ consecutive checks.
   - Do NOT freeze for: single signature failure (could be transient), INFO events.

2. **Implement the FreezeGate**
   💡 WHY: The freeze gate is the safety switch. When frozen, the verifier
   rejects all proofs—the system is in lockdown until a human investigates.
   - `freeze(incident_id)` — set frozen flag.
   - `unfreeze(incident_id, resolution)` — requires the SAME incident ID and
     a non-empty resolution string. This prevents accidental unfreeze.

3. **Implement the RunbookExecutor state machine**
   💡 WHY: A state machine ensures phases execute in order. You cannot skip
   investigation to resolve, and you cannot collect evidence before freezing.
   - Phases: DETECT → FREEZE → INVESTIGATE → RESOLVE → CLOSED.
   - Each phase has entry conditions and exit actions.

4. **Implement evidence collection**
   💡 WHY: Structured evidence collection ensures nothing is missed. Each
   item has a type, path, and integrity hash for chain of custody.
   - Types: `observation_log`, `gossip_log`, `conflict_record`, `log_server_response`.
   - Hash each evidence file for integrity verification.

5. **Test end-to-end runbook execution**
   💡 WHY: The runbook must work under pressure. Testing it now, before an
   incident, ensures it functions when you need it most.
   - Simulate: EMERGENCY alert → freeze → collect 3 evidence items →
     resolve with justification → verify unfreeze.
   - Verify: during freeze, `verifier.verify()` returns FROZEN.
   - Verify: after resolve, `verifier.verify()` works normally.

## Done when

- [ ] EMERGENCY alert triggers freeze within the same function call — *proves immediate response*
- [ ] Frozen verifier rejects all new proofs — *proves effective lockdown*
- [ ] Evidence collection requires INVESTIGATE phase — *proves phase ordering*
- [ ] Unfreeze requires matching incident_id + non-empty resolution — *proves controlled recovery*
- [ ] Full runbook execution completes all phases in order — *proves state machine correctness*

## Proof

Paste or upload:
1. Incident record JSON showing all 4 phases completed.
2. Output showing verifier returning FROZEN during active incident.
3. Unfreeze output with resolution justification.

**Quick self-test**

Q: Why require a resolution justification to unfreeze?
A: Without justification, someone could silently unfreeze after an attack without documenting what happened. The justification creates an audit trail for post-mortems and compliance.

Q: What if the freeze is a false positive?
A: The runbook handles this: during INVESTIGATE, if the operator determines it is a false positive, they resolve with "false positive: <reason>". The system unfreezes and the incident record documents the false alarm for process improvement.

Q: Why can only the incident that caused the freeze unfreeze it?
A: This prevents a second incident from accidentally clearing the freeze of the first. If incident INC-001 freezes the system, only INC-001's resolution can unfreeze it—other incidents must wait or be handled separately.
