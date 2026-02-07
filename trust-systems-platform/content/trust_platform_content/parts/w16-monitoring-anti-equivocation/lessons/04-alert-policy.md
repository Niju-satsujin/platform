---
id: w16-monitoring-anti-equivocation-d04-alert-policy
part: w16-monitoring-anti-equivocation
title: "Alert Policy"
order: 4
duration_minutes: 120
prereqs: ["w16-monitoring-anti-equivocation-d03-equivocation-detection"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Alert Policy

## Goal

Detection without response is useless. Today you define the monitor's **alert
policy**: a set of rules that map verification and detection results to alert
severity levels and actions. The invariant: **critical alerts require
cryptographic evidence attachment**. No alert fires without machine-verifiable
proof of the triggering condition.

✅ Deliverables

1. Define alert severity levels: INFO, WARNING, CRITICAL, EMERGENCY.
2. Define trigger rules mapping verification/detection results to severity.
3. Implement `AlertEngine` that evaluates rules and emits structured alerts.
4. Attach cryptographic evidence (ConflictRecord, failed proof, etc.) to each alert.
5. Build alert output in JSON format suitable for monitoring pipelines.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Equivocation detection → EMERGENCY alert | severity check |
| 2 | Consistency failure → CRITICAL alert with failed proof attached | evidence present |
| 3 | Signature failure → CRITICAL alert with checkpoint attached | evidence present |
| 4 | Normal verification → INFO (no alert escalation) | severity = INFO |
| 5 | All CRITICAL+ alerts contain cryptographic evidence | evidence field non-empty |

## What You're Building Today

An `AlertEngine` that consumes events from the monitor, detector, and verifier,
evaluates them against a policy ruleset, and emits structured alerts with
cryptographic evidence. The policy is defined in a JSON configuration file,
making it adjustable without code changes.

✅ Deliverables

- `alert.h` / `alert.cpp` — alert structs, engine, and evaluation.
- `alert_policy.json` — configurable severity rules.
- `main.cpp` — CLI: `monitor alert eval <event.json>`.
- `test_alert.cpp` — test each severity level with appropriate triggers.

```cpp
// Quick taste
AlertEngine engine("alert_policy.json");

// Equivocation detected → EMERGENCY
Alert alert = engine.evaluate(Event::equivocation(conflict_record));
// alert.severity == EMERGENCY
// alert.evidence == conflict_record.to_json()
// alert.action == "freeze_acceptance"
```

**Can:**
- Map any verification/detection result to an alert severity.
- Attach cryptographic evidence to every alert.
- Output structured JSON for monitoring pipeline integration.

**Cannot (yet):**
- Execute incident response actions (Day 5).
- Route alerts to external systems (PagerDuty, etc.).

## Why This Matters

🔴 **Without alert policy**

1. Equivocation is detected but nobody is notified.
2. Alerts without evidence are unactionable—responders cannot verify the claim.
3. All events are treated equally—no prioritisation between info and emergency.
4. Ad-hoc alerting leads to alert fatigue or missed critical events.

🟢 **With structured alert policy**

1. Severity levels enable triage—emergency stops everything, info is logged.
2. Cryptographic evidence in alerts enables responders to verify independently.
3. Configurable rules adapt to operational needs without code changes.
4. Structured JSON integrates with existing monitoring infrastructure.

🔗 **Connects to**

1. Day 1 — Monitor observations feed events into the alert engine.
2. Day 2 — Gossip-derived events are alert triggers.
3. Day 3 — ConflictRecords are the primary evidence for equivocation alerts.
4. Day 5 — Incident runbook defines what to DO when alerts fire.
5. Week 15 — Failed verification results from the verifier are alert triggers.

🧠 **Mental model:** A hospital triage system. Every patient (event) is assessed
and assigned a priority (severity). Critical patients get immediate attention
(EMERGENCY). Routine check-ups are logged (INFO). The triage protocol (policy)
ensures the right response for the right situation. Every serious case comes
with lab results (evidence).

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│                  Alert Policy Engine                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Events:                                                 │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │ VERIFY_OK       │  │ VERIFY_FAIL     │               │
│  │ (normal)        │  │ (consistency)   │               │
│  └────────┬────────┘  └────────┬────────┘               │
│           │                    │                         │
│  ┌────────┴────────┐  ┌───────┴─────────┐               │
│  │ GOSSIP_RECEIVED │  │ EQUIVOCATION    │               │
│  │ (routine)       │  │ (conflict!)     │               │
│  └────────┬────────┘  └────────┬────────┘               │
│           │                    │                         │
│           └────────┬───────────┘                         │
│                    ▼                                     │
│  ┌───────────────────────────────────────┐               │
│  │  Policy Rules (alert_policy.json)     │               │
│  │                                       │               │
│  │  VERIFY_OK        → INFO              │               │
│  │  GOSSIP_RECEIVED  → INFO              │               │
│  │  SIGNATURE_FAIL   → CRITICAL          │               │
│  │  CONSISTENCY_FAIL → CRITICAL          │               │
│  │  EQUIVOCATION     → EMERGENCY         │               │
│  └──────────────────┬────────────────────┘               │
│                     ▼                                    │
│  ┌───────────────────────────────────────┐               │
│  │  Alert Output (JSON)                  │               │
│  │  {                                    │               │
│  │    "severity": "EMERGENCY",           │               │
│  │    "event": "EQUIVOCATION",           │               │
│  │    "timestamp": "2026-...",           │               │
│  │    "action": "freeze_acceptance",     │               │
│  │    "evidence": { ConflictRecord }     │               │
│  │  }                                    │               │
│  └───────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────┘
```

## Build

**File:** `week-16/day4-alert-policy/alert.h`

```cpp
#pragma once
#include <string>
#include <vector>
#include <optional>

enum class Severity { INFO, WARNING, CRITICAL, EMERGENCY };

struct Event {
    std::string type;        // "VERIFY_OK", "CONSISTENCY_FAIL", "EQUIVOCATION", etc.
    std::string source;      // monitor ID
    std::string timestamp;   // ISO 8601
    std::string evidence;    // JSON blob of supporting evidence

    static Event verify_ok(const std::string& source);
    static Event consistency_fail(const std::string& source,
                                   const std::string& proof_json);
    static Event signature_fail(const std::string& source,
                                 const std::string& cp_json);
    static Event equivocation(const std::string& source,
                               const std::string& conflict_json);
};

struct Alert {
    Severity severity;
    std::string event_type;
    std::string timestamp;
    std::string action;       // recommended action
    std::string evidence;     // cryptographic evidence (required for CRITICAL+)

    std::string to_json() const;
};

struct PolicyRule {
    std::string event_type;
    Severity severity;
    std::string action;
    bool evidence_required;
};

class AlertEngine {
public:
    explicit AlertEngine(const std::string& policy_path);

    Alert evaluate(const Event& event) const;
    std::vector<PolicyRule> rules() const { return rules_; }

private:
    std::vector<PolicyRule> rules_;
    void load_policy(const std::string& path);
    PolicyRule find_rule(const std::string& event_type) const;
};
```

**File:** `week-16/day4-alert-policy/alert_policy.json`

```json
{
  "rules": [
    {
      "event_type": "VERIFY_OK",
      "severity": "INFO",
      "action": "log",
      "evidence_required": false
    },
    {
      "event_type": "GOSSIP_RECEIVED",
      "severity": "INFO",
      "action": "log",
      "evidence_required": false
    },
    {
      "event_type": "SIGNATURE_FAIL",
      "severity": "CRITICAL",
      "action": "reject_and_alert",
      "evidence_required": true
    },
    {
      "event_type": "CONSISTENCY_FAIL",
      "severity": "CRITICAL",
      "action": "reject_and_alert",
      "evidence_required": true
    },
    {
      "event_type": "EQUIVOCATION",
      "severity": "EMERGENCY",
      "action": "freeze_acceptance",
      "evidence_required": true
    }
  ]
}
```

**File:** `week-16/day4-alert-policy/alert.cpp`

```cpp
#include "alert.h"
#include <fstream>
#include <stdexcept>
#include <sstream>

Alert AlertEngine::evaluate(const Event& event) const {
    PolicyRule rule = find_rule(event.type);

    // Enforce evidence requirement
    if (rule.evidence_required && event.evidence.empty()) {
        throw std::runtime_error(
            "CRITICAL+ alert requires evidence but none provided for "
            + event.type);
    }

    Alert alert;
    alert.severity = rule.severity;
    alert.event_type = event.type;
    alert.timestamp = event.timestamp;
    alert.action = rule.action;
    alert.evidence = event.evidence;
    return alert;
}

std::string severity_string(Severity s) {
    switch (s) {
        case Severity::INFO:      return "INFO";
        case Severity::WARNING:   return "WARNING";
        case Severity::CRITICAL:  return "CRITICAL";
        case Severity::EMERGENCY: return "EMERGENCY";
    }
    return "UNKNOWN";
}

std::string Alert::to_json() const {
    std::ostringstream oss;
    oss << "{\"severity\":\"" << severity_string(severity) << "\""
        << ",\"event_type\":\"" << event_type << "\""
        << ",\"timestamp\":\"" << timestamp << "\""
        << ",\"action\":\"" << action << "\""
        << ",\"evidence\":" << (evidence.empty() ? "null" : evidence)
        << "}";
    return oss.str();
}
```

## Do

1. **Define severity levels and trigger mapping**
   💡 WHY: Clear severity levels enable automated triage. EMERGENCY stops the
   system, CRITICAL alerts humans, WARNING logs for review, INFO is routine.
   - Map each event type to exactly one severity level.
   - Document the rationale for each mapping.

2. **Implement the AlertEngine**
   💡 WHY: A rule-based engine separates policy from logic. Operators can
   change alert thresholds without modifying code.
   - Load rules from `alert_policy.json`.
   - `evaluate()` finds the matching rule and produces an `Alert`.

3. **Enforce evidence requirements**
   💡 WHY: An alert without evidence is just noise. CRITICAL and EMERGENCY
   alerts must carry the proof that triggered them.
   - CRITICAL+ events must have non-empty `evidence` field.
   - Throw if evidence is missing—this is a programming error, not a runtime condition.

4. **Integrate with monitor and detector**
   💡 WHY: The alert engine must consume events from real sources. Integration
   connects detection to notification.
   - On verify OK → `Event::verify_ok()` → evaluate → INFO.
   - On consistency fail → `Event::consistency_fail()` → evaluate → CRITICAL.
   - On equivocation → `Event::equivocation()` → evaluate → EMERGENCY.

5. **Test each severity level**
   💡 WHY: Every rule must be tested with its expected trigger and verified to
   produce the correct severity and action.
   - Fire each event type → assert correct severity.
   - Fire CRITICAL without evidence → assert exception.
   - Record all outputs in `proof.txt`.

## Done when

- [ ] Equivocation triggers EMERGENCY with evidence — *proves escalation*
- [ ] Consistency failure triggers CRITICAL with failed proof — *proves evidence attachment*
- [ ] Normal verification triggers INFO without evidence requirement — *proves baseline*
- [ ] CRITICAL+ alert without evidence throws error — *proves evidence enforcement*
- [ ] Alert JSON is parseable by `jq` — *proves pipeline readiness*

## Proof

Paste or upload:
1. EMERGENCY alert JSON with ConflictRecord as evidence.
2. CRITICAL alert JSON with failed consistency proof as evidence.
3. Error output when CRITICAL event lacks evidence.

**Quick self-test**

Q: Why require cryptographic evidence for CRITICAL+ alerts?
A: Without evidence, an alert is unverifiable—the responder must blindly trust the monitor. With evidence (signed checkpoints, conflict records), the responder can independently verify the alert is legitimate.

Q: Why is the alert policy in a JSON config file instead of hardcoded?
A: Different deployments have different risk tolerances. A financial system might escalate more aggressively than a dev environment. Config-based policy enables tuning without recompilation.

Q: What is the "freeze_acceptance" action for EMERGENCY?
A: It means the system stops accepting new entries from the log until a human investigates. This prevents further damage during an active equivocation attack. Day 5's runbook details the freeze procedure.
