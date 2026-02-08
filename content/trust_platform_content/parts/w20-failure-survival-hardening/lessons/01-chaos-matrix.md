---
id: w20-failure-survival-hardening-d01-chaos-matrix
part: w20-failure-survival-hardening
title: "Chaos Matrix"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Chaos Matrix

## Goal

Design and implement a chaos testing matrix that enumerates every failure mode the CivicTrust system can experience, specifies the expected degraded mode for each, and defines the recovery trigger that returns the system to normal. Each test is a row in the matrix with: failure type, injection method, expected behaviour, and recovery condition.

### ✅ Deliverables

1. A `ChaosMatrix` data structure containing a list of `ChaosTest` entries.
2. At least 8 chaos test definitions covering: node crash, network partition, key compromise, log unavailability, clock skew, disk corruption, memory pressure, and malformed input.
3. A `ChaosRunner` that executes each test, injects the failure, observes the system, and records whether the expected degraded mode was entered.
4. A pass/fail report for the entire matrix.
5. Shipped design document: `week-20/day1-chaos-matrix.md`.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Matrix contains ≥ 8 chaos tests | Count entries in `ChaosMatrix` |
| 2 | Each test specifies expected degraded mode | Inspect `expected_mode` field |
| 3 | Each test specifies recovery trigger | Inspect `recovery_trigger` field |
| 4 | Runner executes all tests and produces pass/fail per test | Run matrix, check report |
| 5 | At least one test exercises each: crash, partition, key, log, clock | Check test categories |

## What You're Building Today

You are building the blueprint for chaos engineering the CivicTrust system. Before you can survive failure, you must enumerate every way the system can fail. Today you catalogue the failures; Days 2-5 execute the most critical ones.

### ✅ Deliverables

- `chaos_matrix.h` — data structures
- `chaos_tests.cpp` — 8+ test definitions
- `chaos_runner.h` / `chaos_runner.cpp` — test executor
- `chaos_report.cpp` — pass/fail report generator

```cpp
// chaos_matrix.h
#pragma once
#include <string>
#include <vector>
#include <functional>

enum class FailureCategory {
    NODE_CRASH, NETWORK_PARTITION, KEY_COMPROMISE,
    LOG_UNAVAILABLE, CLOCK_SKEW, DISK_CORRUPTION,
    MEMORY_PRESSURE, MALFORMED_INPUT
};

struct ChaosTest {
    std::string       test_id;
    std::string       description;
    FailureCategory   category;
    std::string       injection_method;
    std::string       expected_degraded_mode;
    std::string       recovery_trigger;
    std::function<bool()> execute;  // returns true if expected mode observed
};

struct ChaosReport {
    size_t total;
    size_t passed;
    size_t failed;
    std::vector<std::pair<std::string, bool>> results;  // test_id → pass/fail
};

class ChaosRunner {
public:
    void load_matrix(std::vector<ChaosTest> tests);
    ChaosReport run_all();
private:
    std::vector<ChaosTest> matrix_;
};
```

You **can**:
- Enumerate and execute structured chaos tests against the CivicTrust system.
- Produce a pass/fail report showing which failure modes are handled.

You **cannot yet**:
- Perform deep node-crash drills (Day 2).
- Test network partition behaviour (Day 3).
- Execute the key-compromise runbook (Day 4).
- Validate full system restore (Day 5).

## Why This Matters

🔴 **Without a chaos matrix:**
- Failure modes are discovered in production, by users, at the worst time.
- No systematic enumeration — some failure modes are never tested.
- Recovery procedures are ad-hoc and untested — they may not work when needed.
- Teams argue about "what could go wrong" instead of executing a defined test plan.

🟢 **With a chaos matrix:**
- Every known failure mode is catalogued with injection method and expected behaviour.
- Tests are repeatable — run the matrix before every release.
- Recovery triggers are validated — you know the system can recover before it needs to.
- New failure modes are added as rows in the matrix, not as production incidents.

🔗 **Connects:**
- **Week 17 Day 5** (policy gates) — chaos tests inject policy-violating documents.
- **Week 18 Day 5** (attack matrix) — attack classifications become chaos test inputs.
- **Week 19 Day 5** (batch verifier) — batch tests include chaos-injected bundles.
- **Week 20 Day 2** (node crash) — specific drill from this matrix.
- **Week 20 Day 3** (partition) — specific drill from this matrix.

🧠 **Mental model: "Fire Drill Binder"** — A fire marshal maintains a binder of drill scenarios: kitchen fire, electrical fire, evacuation route blocked. Each scenario has a procedure and an expected outcome. The chaos matrix is your fire drill binder — when the alarm goes off, you've already rehearsed every scenario.

## Visual Model

```
┌──────────────────── Chaos Matrix ────────────────────────┐
│                                                           │
│  Test ID    │ Category     │ Expected Mode  │ Recovery    │
│  ───────────┼──────────────┼────────────────┼──────────── │
│  CT-001     │ NODE_CRASH   │ leader-failovr │ new leader  │
│  CT-002     │ PARTITION    │ minority-halt  │ rejoin      │
│  CT-003     │ KEY_COMPRMSE │ key-revoked    │ rotate key  │
│  CT-004     │ LOG_DOWN     │ anchor-pending │ log-restore │
│  CT-005     │ CLOCK_SKEW   │ grace-mode     │ NTP sync    │
│  CT-006     │ DISK_CORPT   │ read-only      │ restore     │
│  CT-007     │ MEM_PRESSRE  │ reject-new     │ free memory │
│  CT-008     │ BAD_INPUT    │ reject-input   │ N/A         │
│                                                           │
│  ChaosRunner::run_all()                                   │
│       │                                                   │
│       ▼                                                   │
│  ChaosReport { total: 8, passed: 7, failed: 1 }          │
│       └──▶ CT-006: FAILED (did not enter read-only mode)  │
└───────────────────────────────────────────────────────────┘
```

## Build

File: `week-20/day1-chaos-matrix.md`

## Do

### 1. **Define the ChaosTest and ChaosReport structures**

> 💡 *WHY: Structured test definitions enable automated execution. A test without a defined expected mode is untestable.*

Create `chaos_matrix.h` with `ChaosTest` (including `expected_degraded_mode` and `recovery_trigger`) and `ChaosReport` (total, passed, failed, per-test results).

### 2. **Define 8 chaos tests covering all failure categories**

> 💡 *WHY: Eight categories cover the most common distributed-system failures. Each category requires a different injection method and produces a different degraded mode.*

Create test definitions: (a) CT-001: kill leader node → expect follower takes over, (b) CT-002: `iptables` partition → minority halts, (c) CT-003: inject compromised key → revocation triggered, (d) CT-004: kill transparency log → anchoring enters PENDING, (e) CT-005: skew clock 10 minutes → grace mode activates, (f) CT-006: corrupt WAL file → read-only mode, (g) CT-007: `cgroup` memory limit → new requests rejected, (h) CT-008: submit garbage bytes → clean error returned.

### 3. **Implement the ChaosRunner**

> 💡 *WHY: The runner isolates each test, catches exceptions, and records results. A failure in one test must not prevent others from running.*

Write `ChaosRunner::run_all()`: iterate `matrix_`, call each test's `execute()` lambda, record pass/fail. Catch exceptions and record as `failed` with the exception message.

### 4. **Implement the report generator**

> 💡 *WHY: The report is the artifact that goes into the release sign-off. It must be clear enough for a non-engineer to understand.*

Generate a report with: total tests, passed, failed, and for each failed test: the test ID, description, expected mode, and actual observation. Format as both structured data (JSON) and human-readable text.

### 5. **Document the chaos matrix methodology**

> 💡 *WHY: Future engineers need to add new tests when new components are added. The methodology document explains how to write a test, what fields are required, and how to validate the expected mode.*

Write `week-20/day1-chaos-matrix.md` covering: test anatomy (fields and their meanings), how to define injection methods (process kill, iptables, cgroup, byte injection), how to observe degraded modes (log parsing, status endpoints), and the release sign-off process (all tests must pass before deploy).

## Done when

- [ ] Chaos matrix contains ≥ 8 tests covering all 8 failure categories — *systematic enumeration prevents "we didn't think of that" incidents*
- [ ] Each test specifies expected degraded mode and recovery trigger — *tests are deterministic and repeatable*
- [ ] `ChaosRunner` executes all tests and produces a pass/fail report — *automated execution for CI/CD integration*
- [ ] A failing test does not prevent subsequent tests from running — *isolation between tests mirrors isolation in production*
- [ ] Design doc describes methodology, test anatomy, and release sign-off process — *future engineers extend the matrix systematically*

## Proof

Upload `week-20/day1-chaos-matrix.md` and a terminal screenshot showing the `ChaosRunner` report with ≥ 8 tests executed and per-test pass/fail results.

### **Quick self-test**

**Q1:** Why is "expected degraded mode" required for each test?
→ **A: Without an expected mode, you can't distinguish "graceful degradation" from "system crashed." The expected mode is the assertion — if the system enters a different mode, the test fails.**

**Q2:** How do you inject a network partition in a test environment?
→ **A: Use `iptables -A INPUT -s <node_ip> -j DROP` to block traffic from specific nodes. This simulates a partition without physical network changes. Clean up with `iptables -D` after the test.**

**Q3:** Should the chaos matrix run in production?
→ **A: Only in a controlled production-like environment (staging). Running in production is called "chaos engineering in production" and requires strict blast-radius controls, circuit breakers, and operator approval — not covered in this lesson.**
