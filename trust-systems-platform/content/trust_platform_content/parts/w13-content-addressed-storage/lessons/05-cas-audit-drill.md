---
id: w13-content-addressed-storage-d05-cas-audit-drill
part: w13-content-addressed-storage
title: "CAS Audit Drill"
order: 5
duration_minutes: 120
prereqs: ["w13-content-addressed-storage-d04-cas-gc-policy"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# CAS Audit Drill

## Goal

A CAS store provides integrity on read, but what about objects nobody reads?
Bit-rot, hardware faults, and operator errors accumulate silently. Today you
build a full store auditor that walks every object, recalculates its hash,
compares it to the object's CAS ID, and produces a **machine-parseable
discrepancy report**. Corrupted objects are quarantined, not silently deleted.

✅ Deliverables

1. Implement `CASAuditor::full_scan()` that walks the entire object tree.
2. Recalculate SHA-256 for every object and compare to its path-derived ID.
3. Generate a JSON discrepancy report: `{ ok: N, corrupt: [...], missing: [...] }`.
4. Quarantine corrupt objects (move to `quarantine/` with original ID in filename).
5. Build a CLI `cas_audit` that runs the scan and prints the report.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Full scan visits every object in the store | count matches `find objects/ -type f | wc -l` |
| 2 | Corrupt object detected (injected bit-flip) | appears in `corrupt` list |
| 3 | Report is valid JSON parseable by `jq` | `jq .` exits 0 |
| 4 | Quarantined object preserves original ID for forensics | filename contains hex ID |
| 5 | Clean store produces `corrupt: [], missing: []` | empty arrays |

## What You're Building Today

A `CASAuditor` class that performs a complete integrity scan. It iterates the
fan-out directory tree, reconstructs the expected CAS ID from the path, reads the
blob, hashes it, and flags any mismatch. The output is a structured JSON report
suitable for monitoring pipelines and alerting.

✅ Deliverables

- `auditor.h` / `auditor.cpp` — scan and report logic.
- `main.cpp` — CLI: `cas_audit [--quarantine] <store_path>`.
- `test_audit.cpp` — injects corruption and verifies detection.
- `inject_corruption.sh` — helper script to flip a byte in a random object.

```cpp
// Quick taste
CASAuditor auditor(store);
AuditReport report = auditor.full_scan();
std::cout << report.to_json() << "\n";
// {"ok":48,"corrupt":[{"id":"ab01..","expected":"ab01..","actual":"ff23.."}],"missing":[]}
```

**Can:**
- Detect bit-rot, accidental overwrites, and truncation.
- Produce machine-parseable reports for CI/monitoring.
- Quarantine corrupt objects while preserving forensic information.

**Cannot (yet):**
- Repair corrupt objects (requires replica or erasure coding).
- Run incrementally on only changed objects (future enhancement).

## Why This Matters

🔴 **Without periodic audits**

1. Bit-rot accumulates—by the time a corrupt object is read, it may be the only copy.
2. No visibility into store health—operators cannot make informed retention decisions.
3. Corrupt manifests reference corrupt chunks, creating cascading failures.
4. Compliance frameworks (SOC 2, HIPAA) require evidence of data integrity checks.

🟢 **With structured audits**

1. Silent corruption is detected proactively, before it reaches readers.
2. JSON reports feed into alerting pipelines (Prometheus, PagerDuty).
3. Quarantine preserves evidence for root-cause analysis.
4. Audit logs satisfy compliance requirements with machine-verifiable evidence.

🔗 **Connects to**

1. Day 1 — Audit reuses `CASObject::id()` to recompute hashes.
2. Day 2 — Auditor walks the fan-out directory layout created by `CASStore`.
3. Day 4 — Quarantine directory is shared with GC; audit and GC must not conflict.
4. Week 14 — Merkle tree verification generalises today's per-object audit.
5. Week 16 — Monitor architecture logs audit results as observations.

🧠 **Mental model:** A bank auditor who walks the vault, recounts every deposit
box, and compares totals to the ledger. Discrepancies go on a report—boxes are
not destroyed, but flagged and sealed for investigation.

## Visual Model

```
┌────────────────────────────────────────────────────┐
│                CAS Audit Flow                      │
├────────────────────────────────────────────────────┤
│                                                    │
│  objects/                                          │
│  ├── ab/                                           │
│  │   ├── cdef0123...  ◄── read + hash              │
│  │   └── 9876fedc...  ◄── read + hash              │
│  ├── cd/                                           │
│  │   └── 1234abcd...  ◄── read + hash              │
│  └── ...                                           │
│                                                    │
│       ┌─────────────────┐                          │
│       │  For each file: │                          │
│       │  1. Path → ID   │                          │
│       │  2. Read bytes  │                          │
│       │  3. SHA-256     │                          │
│       │  4. Compare     │                          │
│       └────────┬────────┘                          │
│                │                                   │
│          ┌─────┴─────┐                             │
│          ▼           ▼                             │
│     ┌────────┐  ┌──────────┐                       │
│     │  MATCH │  │ MISMATCH │                       │
│     │  ok++  │  │ corrupt[]│──▶ quarantine/        │
│     └────────┘  └──────────┘                       │
│                                                    │
│  Output: audit_report.json                         │
│  {"ok":48,"corrupt":[...],"missing":[]}            │
└────────────────────────────────────────────────────┘
```

## Build

**File:** `week-13/day5-cas-audit-drill/auditor.h`

```cpp
#pragma once
#include "cas_store.h"
#include <string>
#include <vector>
#include <filesystem>

struct CorruptEntry {
    std::string expected_id;
    std::string actual_hash;
    std::string path;
};

struct AuditReport {
    size_t ok = 0;
    std::vector<CorruptEntry> corrupt;
    std::vector<std::string> missing;  // referenced but file absent
    std::string to_json() const;
};

class CASAuditor {
public:
    explicit CASAuditor(CASStore& store);

    // Walk entire object tree, verify every hash
    AuditReport full_scan();

    // Move corrupt objects to quarantine
    void quarantine_corrupt(const AuditReport& report);

private:
    CASStore& store_;
    std::string id_from_path(const std::filesystem::path& p) const;
    std::string hash_file(const std::filesystem::path& p) const;
};
```

**File:** `week-13/day5-cas-audit-drill/auditor.cpp` (key excerpt)

```cpp
AuditReport CASAuditor::full_scan() {
    AuditReport report;
    auto obj_dir = store_.root() / "objects";

    for (auto& prefix : std::filesystem::directory_iterator(obj_dir)) {
        if (!prefix.is_directory()) continue;
        for (auto& entry : std::filesystem::directory_iterator(prefix)) {
            std::string expected = id_from_path(entry.path());
            std::string actual = hash_file(entry.path());
            if (expected == actual) {
                report.ok++;
            } else {
                report.corrupt.push_back(
                    {expected, actual, entry.path().string()});
            }
        }
    }
    return report;
}

void CASAuditor::quarantine_corrupt(const AuditReport& report) {
    auto qdir = store_.root() / "quarantine";
    std::filesystem::create_directories(qdir);
    for (const auto& c : report.corrupt) {
        auto dest = qdir / ("corrupt_" + c.expected_id);
        std::filesystem::rename(c.path, dest);
    }
}

std::string CASAuditor::id_from_path(
    const std::filesystem::path& p) const {
    // objects/ab/cdef... → abcdef...
    auto parent = p.parent_path().filename().string();
    auto file = p.filename().string();
    return parent + file;
}
```

## Do

1. **Implement path-to-ID reconstruction**
   💡 WHY: The fan-out path encodes the CAS ID (`objects/ab/cdef...` → `abcdef...`).
   Reconstructing it avoids needing a separate index.
   - Extract prefix directory name + filename → concatenate → expected ID.
   - Test with a known object.

2. **Implement file hashing**
   💡 WHY: Re-hashing is the core verification operation. It must use the exact
   same algorithm as `CASObject::id()` but without normalisation (data is already
   normalised on disk).
   - Read file bytes, compute SHA-256, return hex string.
   - Confirm it matches `CASObject{data}.id()`.

3. **Implement full scan loop**
   💡 WHY: Walking the entire tree ensures no object escapes audit. A partial
   scan leaves a false sense of security.
   - Use `std::filesystem::directory_iterator` over `objects/` prefixes.
   - Skip non-regular files (symlinks, directories).
   - Accumulate `ok` and `corrupt` counts.

4. **Implement report generation and quarantine**
   💡 WHY: Machine-parseable JSON lets you pipe `cas_audit` into monitoring
   systems. Quarantine preserves evidence without polluting the live store.
   - Emit JSON with `ok`, `corrupt` (with expected/actual hashes), `missing`.
   - Quarantine: `rename()` to `quarantine/corrupt_<id>`.

5. **Inject corruption and verify detection**
   💡 WHY: If the auditor cannot catch a known-bad object, it is useless.
   Testing the negative case is mandatory.
   - Write a bash script: pick a random object, flip one byte with `dd`.
   - Run `cas_audit`, verify the corrupt object appears in the report.
   - Run again after quarantine, verify a clean report.

## Done when

- [ ] Full scan visits every object in the store — *proves completeness*
- [ ] Injected corruption is detected and reported — *proves detection capability*
- [ ] Report is valid JSON parseable by `jq .` — *proves machine readability*
- [ ] Quarantine preserves original CAS ID in filename — *proves forensic traceability*
- [ ] Clean store produces empty corrupt and missing arrays — *proves no false positives*

## Proof

Paste or upload:
1. JSON audit report showing a detected corrupt object.
2. `ls quarantine/` showing the quarantined file with ID in name.
3. Clean audit report after quarantine (all ok, no corrupt).

**Quick self-test**

Q: Why quarantine instead of delete corrupt objects?
A: Quarantine preserves evidence for root-cause analysis (was it bit-rot? operator error? malicious tampering?) and allows recovery if the "corruption" was actually an auditor bug.

Q: Why must the audit use the same hash algorithm as `CASObject::id()`?
A: If audit uses a different algorithm, it will compute a different hash for valid objects and flag them as corrupt—false positives destroy trust in the auditor.

Q: How would you extend this to handle manifests specifically?
A: After hashing the manifest blob itself, also parse it and verify each referenced chunk ID exists and passes its own hash check—a deep audit vs. today's shallow audit.
