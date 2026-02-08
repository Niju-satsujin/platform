---
id: w19-offline-verification-package-d01-verifier-ux-contract
part: w19-offline-verification-package
title: "Verifier UX Contract"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Verifier UX Contract

## Goal

Define a strict UX contract for the verifier output: every verification produces exactly one machine-readable status line and one human-readable explanation block. No verifier output may be ambiguous, partial, or require interpretation. The contract is the API between the verification engine and every consumer — CLI tools, web UIs, and audit logs.

### ✅ Deliverables

1. A `VerifierOutput` struct containing a one-line machine status (`PASS`, `FAIL`, `WARN`) and a multi-line human explanation block.
2. A `format_machine_line()` function producing a single pipe-delimited status line parseable by `awk`.
3. A `format_human_block()` function producing a structured explanation with verdict, reason, and recommended action.
4. Tests proving every verdict from Weeks 17-18 maps to exactly one machine line and one human block.
5. Shipped design document: `week-19/day1-verifier-ux-contract.md`.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Machine line has exactly 4 pipe-delimited fields | Split by `\|`, assert 4 tokens |
| 2 | Human block starts with `[VERDICT]` header | Regex match on first line |
| 3 | `PASS` machine line maps to `VERIFIED` verdict | Issue valid bundle, check output |
| 4 | `FAIL` machine line includes failure step number | Issue tampered bundle, check output |
| 5 | Every Week 17-18 verdict has a mapping | Iterate all enum values, assert non-empty output |

## What You're Building Today

You are building the output layer that every downstream consumer relies on. The verification engine (Weeks 17-18) produces typed verdicts internally. Today you translate those verdicts into two parallel outputs: one for machines (monitoring, scripts, dashboards) and one for humans (operators, auditors, inspectors).

### ✅ Deliverables

- `verifier_output.h` — output struct and formatters
- `format_machine.cpp` — pipe-delimited machine line
- `format_human.cpp` — structured explanation block
- `ux_contract_test.cpp` — mapping tests for all verdicts

```cpp
// verifier_output.h
#pragma once
#include <string>
#include <cstdint>

struct VerifierOutput {
    std::string machine_line;   // "PASS|doc_hash|step_0|2026-02-07T10:00:00Z"
    std::string human_block;    // multi-line explanation
};

// Machine line format: STATUS|DOC_HASH_HEX|STEP|TIMESTAMP
std::string format_machine_line(
    const std::string& status,       // PASS, FAIL, WARN
    const std::string& doc_hash_hex,
    int failed_step,
    int64_t timestamp);

// Human block format:
// [VERDICT] PASS / FAIL / WARN
// Reason: <one-line explanation>
// Detail: <multi-line context>
// Action: <recommended next step>
std::string format_human_block(
    const std::string& verdict,
    const std::string& reason,
    const std::string& detail,
    const std::string& action);
```

You **can**:
- Produce machine-parseable and human-readable output for any verification result.
- Pipe machine lines into monitoring tools (`grep FAIL | wc -l`).

You **cannot yet**:
- Package the output into an offline bundle (Day 2).
- Run verification in air-gapped mode (Day 3).
- Switch time-policy modes (Day 4).

## Why This Matters

🔴 **Without a UX contract:**
- Different verifiers produce different output formats — scripts break on upgrades.
- Operators see raw enum names (`INVALID_LOG_SIGNATURE`) with no explanation or action.
- Monitoring tools parse ad-hoc log lines with fragile regex patterns.
- Audit reports require manual translation from code verdicts to human language.

🟢 **With a UX contract:**
- Machine output is stable across versions — one format, pipe-delimited, `awk`-friendly.
- Human output includes verdict, reason, and recommended action — no interpretation needed.
- New verdicts added in future weeks automatically map to both output formats.
- Audit logs are machine-indexed and human-reviewable simultaneously.

🔗 **Connects:**
- **Week 17 Day 4** (verify & revocation) — the five `Verdict` enum values map to UX outputs.
- **Week 18 Day 3** (anchor verifier) — the six `AnchorVerdict` values map to UX outputs.
- **Week 19 Day 2** (offline bundle) — the bundle carries the verifier output.
- **Week 19 Day 5** (batch verifier) — batch output is one UX line per document.
- **Week 20 Day 5** (restore validation) — restore checks produce UX output for each re-verified document.

🧠 **Mental model: "Airport Arrivals Board"** — The arrivals board shows one line per flight: flight number, origin, status, gate. Passengers read the board; software reads the API. Same data, two formats. The verifier UX contract is your arrivals board — one machine line, one human explanation, same underlying truth.

## Visual Model

```
┌──────────── VerifierOutput ──────────────────────────┐
│                                                       │
│  Internal Verdict (enum)                              │
│       │                                               │
│       ├──▶ format_machine_line()                      │
│       │    ┌──────────────────────────────────────┐   │
│       │    │ PASS|a3f8c2...|0|2026-02-07T10:00Z  │   │
│       │    └──────────────────────────────────────┘   │
│       │    ▲ pipe-delimited, one line, awk-friendly   │
│       │                                               │
│       ├──▶ format_human_block()                       │
│       │    ┌──────────────────────────────────────┐   │
│       │    │ [VERDICT] PASS                       │   │
│       │    │ Reason:  Document verified.          │   │
│       │    │ Detail:  All 6 steps passed.         │   │
│       │    │          Signature: Ed25519 valid.   │   │
│       │    │          Anchor: Merkle proof valid.  │   │
│       │    │ Action:  No action required.         │   │
│       │    └──────────────────────────────────────┘   │
│       │    ▲ multi-line, human-readable               │
│       │                                               │
│       └──▶ VerifierOutput { machine_line, human }     │
└───────────────────────────────────────────────────────┘
```

## Build

File: `week-19/day1-verifier-ux-contract.md`

## Do

### 1. **Define the VerifierOutput struct**

> 💡 *WHY: A single struct forces every code path to produce both machine and human output. If they're separate, one will be forgotten.*

Create `verifier_output.h` with `VerifierOutput` containing `machine_line` and `human_block`. Neither field may be empty — the constructor asserts both are non-empty.

### 2. **Implement the machine-line formatter**

> 💡 *WHY: Pipe-delimited is the simplest format for shell scripts. No JSON parsing, no XML — just `cut -d'|' -f1` to get the status.*

Write `format_machine_line()` producing `STATUS|DOC_HASH_HEX|STEP|TIMESTAMP`. `STATUS` is one of `PASS`, `FAIL`, `WARN`. `STEP` is 0 for pass, 1-6 for the failing step. `TIMESTAMP` is ISO-8601 UTC.

### 3. **Implement the human-block formatter**

> 💡 *WHY: Operators in the field need actionable text, not error codes. "INVALID_PROOF" means nothing to a customs inspector. "The anchoring receipt's Merkle path is corrupted — contact the issuer" is actionable.*

Write `format_human_block()` producing four labelled sections: `[VERDICT]`, `Reason:`, `Detail:`, `Action:`. Map each internal verdict to a specific reason and action string.

### 4. **Create the verdict-to-UX mapping table**

> 💡 *WHY: The mapping table is the single source of truth. When a new verdict is added, it gets one row in this table — and both formatters read from it.*

Build a `std::map<int, UxMapping>` where each entry contains the machine status, human reason, and recommended action. Iterate all `Verdict` and `AnchorVerdict` enum values and assert each has an entry.

### 5. **Document the UX contract**

> 💡 *WHY: Third-party verifiers and monitoring tools integrate against this contract. If it's not documented, they reverse-engineer the format and break on the next change.*

Write `week-19/day1-verifier-ux-contract.md` covering: machine-line format spec (field order, types, delimiters), human-block format spec (section names, allowed content), versioning strategy (how to add fields without breaking parsers), and example outputs for each verdict.

## Done when

- [ ] Every internal verdict maps to exactly one machine line and one human block — *no verdict falls through without output*
- [ ] Machine line is parseable by `cut -d'|'` and `awk` — *monitoring scripts depend on this format*
- [ ] Human block includes `[VERDICT]`, `Reason:`, `Detail:`, and `Action:` — *field operators and auditors read this*
- [ ] Empty machine line or human block is a compile-time or runtime error — *prevents silent output omission*
- [ ] Design doc specifies format, versioning, and examples — *third-party integrators build against this spec*

## Proof

Upload `week-19/day1-verifier-ux-contract.md` and a terminal screenshot showing: (a) a PASS output with both machine and human formats, and (b) a FAIL output with the failing step and recommended action.

### **Quick self-test**

**Q1:** Why pipe-delimited instead of JSON for the machine line?
→ **A: Pipe-delimited is instantly parseable by `awk`, `cut`, and `grep` — the tools available on every Linux system, including air-gapped field devices. JSON requires a parser library.**

**Q2:** What if a new verdict is added but the mapping table isn't updated?
→ **A: The test iterates all enum values and asserts each has an entry. A missing mapping is a test failure, caught before deployment.**

**Q3:** Why include a recommended action in the human block?
→ **A: A verdict without an action is a problem without a solution. Operators in the field need to know what to do *right now* — "contact the issuer," "re-anchor the document," "escalate to security team."**
