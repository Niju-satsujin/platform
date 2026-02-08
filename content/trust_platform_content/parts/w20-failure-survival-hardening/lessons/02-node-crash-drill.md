---
id: w20-failure-survival-hardening-d02-node-crash-drill
part: w20-failure-survival-hardening
title: "Node Crash Drill"
order: 2
duration_minutes: 120
prereqs: ["w20-failure-survival-hardening-d01-chaos-matrix"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Node Crash Drill

## Goal

Execute a controlled node-crash drill that kills the leader node during active document issuance and verifies that: (1) the cluster elects a new leader, (2) no duplicate documents are issued, and (3) all in-flight documents reach a deterministic state (either committed or explicitly aborted — never silently lost).

### ✅ Deliverables

1. A `NodeCrashDrill` class that orchestrates: start issuance → kill leader → observe failover → verify no duplicates.
2. A duplicate-detection mechanism that checks for duplicate document hashes in the commit log.
3. An in-flight document tracker that ensures every pending document transitions to `COMMITTED` or `ABORTED`.
4. A drill report with timeline: crash time, failover time, recovery time, duplicate count.
5. Shipped design document: `week-20/day2-node-crash-drill.md`.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Leader crash triggers failover within 10 seconds | Measure time from `kill -9` to new leader elected |
| 2 | Zero duplicate document hashes after recovery | Scan commit log for duplicates → count = 0 |
| 3 | All in-flight documents are COMMITTED or ABORTED | No document in PENDING state after recovery |
| 4 | New leader accepts new issuance requests | Submit a fresh document to the new leader → success |
| 5 | Drill report includes complete timeline | Report has crash_ts, failover_ts, recovery_ts |

## What You're Building Today

You are killing your own system — on purpose. You will start a multi-node CivicTrust cluster, begin issuing documents, kill the leader mid-flight, and verify that the cluster recovers without data loss or duplication. This is the drill that proves your consensus and issuance systems actually work under failure.

### ✅ Deliverables

- `node_crash_drill.h` / `node_crash_drill.cpp` — drill orchestrator
- `duplicate_detector.cpp` — post-crash duplicate scan
- `inflight_tracker.cpp` — pending-to-terminal state checker
- `drill_report.cpp` — timeline and verdict report

```cpp
// node_crash_drill.h
#pragma once
#include <string>
#include <vector>
#include <cstdint>

struct DrillTimeline {
    int64_t     crash_ts;
    int64_t     failover_ts;
    int64_t     recovery_ts;
    int64_t     failover_duration_ms;
    std::string old_leader_id;
    std::string new_leader_id;
};

struct DrillResult {
    DrillTimeline   timeline;
    size_t          duplicate_count;
    size_t          inflight_committed;
    size_t          inflight_aborted;
    size_t          inflight_pending;   // must be 0 after recovery
    bool            passed;
};

class NodeCrashDrill {
public:
    NodeCrashDrill(std::vector<std::string> node_endpoints);

    // Phase 1: Start N issuance requests in parallel
    void start_issuance(size_t num_documents);

    // Phase 2: Kill the leader node (SIGKILL)
    void kill_leader();

    // Phase 3: Wait for failover and recovery
    DrillResult wait_and_verify(int timeout_seconds);

private:
    std::vector<std::string> endpoints_;
    std::string              leader_endpoint_;
};
```

You **can**:
- Execute a repeatable node-crash drill with measurable outcomes.
- Prove zero duplicates and zero lost documents after leader crash.

You **cannot yet**:
- Test network partitions (Day 3).
- Test key compromise scenarios (Day 4).
- Validate full system restore from checkpoint (Day 5).

## Why This Matters

🔴 **Without node-crash drills:**
- You hope the failover works but have never seen it work.
- Duplicate documents silently enter the commit log — discovered weeks later by auditors.
- In-flight documents silently disappear — issuers retry and get duplicates.
- Failover time is unknown — could be 2 seconds or 2 minutes.

🟢 **With node-crash drills:**
- Failover time is measured and baselined — you know it's under 10 seconds.
- Zero-duplicate guarantee is verified by scanning the commit log.
- Every in-flight document reaches a terminal state — no silent losses.
- Drill is repeatable — run it before every release to prevent regression.

🔗 **Connects:**
- **Week 12** (consensus checkpoints) — failover uses the checkpoint mechanism.
- **Week 17 Day 3** (issue workflow) — in-flight documents are mid-issuance envelopes.
- **Week 18 Day 1** (anchoring) — pending anchoring requests must survive the crash.
- **Week 20 Day 1** (chaos matrix) — this drill is CT-001 from the matrix.
- **Week 20 Day 5** (restore validation) — restore uses the same checkpoint/log data.

🧠 **Mental model: "Cardiac Arrest Drill"** — In a hospital, they run code-blue drills: a patient (the leader) "crashes," the team responds, and they measure response time, correct procedure, and patient outcome. Your node-crash drill is code blue for the cluster — the leader crashes, the cluster responds, and you measure failover time, data integrity, and recovery completeness.

## Visual Model

```
┌──────────── Node Crash Drill ──────────────────────────┐
│                                                         │
│  Phase 1: Steady-state issuance                         │
│  ┌────────┐  ┌────────┐  ┌────────┐                    │
│  │ Node-A │  │ Node-B │  │ Node-C │                    │
│  │ LEADER │  │follower│  │follower│                    │
│  └───┬────┘  └────────┘  └────────┘                    │
│      │  ◀── issuing documents                           │
│      │                                                  │
│  Phase 2: Kill leader                                   │
│  ┌────────┐  ┌────────┐  ┌────────┐                    │
│  │ Node-A │  │ Node-B │  │ Node-C │                    │
│  │  DEAD  │  │follower│  │follower│                    │
│  └────────┘  └───┬────┘  └────────┘                    │
│                  │  ◀── election starts                  │
│                                                         │
│  Phase 3: Failover + Recovery                           │
│  ┌────────┐  ┌────────┐  ┌────────┐                    │
│  │ Node-A │  │ Node-B │  │ Node-C │                    │
│  │  DEAD  │  │ LEADER │  │follower│                    │
│  └────────┘  └───┬────┘  └────────┘                    │
│                  │  ◀── resumes issuance                 │
│                                                         │
│  Verify: 0 duplicates, 0 pending, failover < 10s       │
└─────────────────────────────────────────────────────────┘
```

## Build

File: `week-20/day2-node-crash-drill.md`

## Do

### 1. **Build the drill orchestrator**

> 💡 *WHY: Manual kill-and-check is unrepeatable. An automated orchestrator ensures the drill runs identically every time, producing comparable results.*

Create `NodeCrashDrill` with node endpoints. Implement `start_issuance()` — submit `num_documents` issuance requests to the leader in parallel (use `std::async`). Record the document hashes for later duplicate checking.

### 2. **Implement the leader kill**

> 💡 *WHY: `SIGKILL` simulates the worst-case crash — no graceful shutdown, no cleanup, no final log flush. If the system survives SIGKILL, it survives anything.*

Implement `kill_leader()`: identify the current leader via the cluster status endpoint, send `kill -9 <pid>` (or equivalent mock), record the crash timestamp. The kill must be instantaneous — no graceful shutdown signal.

### 3. **Build the duplicate detector**

> 💡 *WHY: Duplicates are the silent killer. Without explicit detection, a duplicate document could be presented as two separate records, doubling the issuer's liability.*

After failover, scan the commit log (or `std::set` of committed hashes) for duplicates. A document hash appearing more than once is a critical failure. Return the count — must be exactly 0.

### 4. **Build the in-flight tracker**

> 💡 *WHY: An in-flight document stuck in PENDING forever is a data loss. The tracker ensures every document reaches a terminal state: COMMITTED (the new leader finished it) or ABORTED (the new leader rolled it back).*

Query each node for the status of all document hashes submitted in Phase 1. Every hash must be in `COMMITTED` or `ABORTED` state. `PENDING` count must be 0 after the recovery timeout.

### 5. **Document the drill procedure and results**

> 💡 *WHY: The drill report is evidence for auditors and a baseline for future drills. If failover time increases from 5s to 15s, the report shows the regression.*

Write `week-20/day2-node-crash-drill.md` covering: drill procedure (start, kill, wait, verify), expected results (0 duplicates, 0 pending, failover < 10s), actual results from your test run, and improvement actions if any check fails.

## Done when

- [ ] Leader crash triggers failover and new leader election within 10 seconds — *failover time is the first metric auditors ask for*
- [ ] Zero duplicate document hashes after recovery — *duplicates are a data-integrity violation that could have legal consequences*
- [ ] All in-flight documents reach COMMITTED or ABORTED — no PENDING after recovery — *silent document loss is worse than explicit abort*
- [ ] New leader accepts new issuance requests after recovery — *the system is fully operational, not just alive*
- [ ] Drill report includes complete timeline and all verification results — *the report is the release sign-off artifact for node-crash resilience*

## Proof

Upload `week-20/day2-node-crash-drill.md` and a terminal screenshot showing: the drill report with crash/failover/recovery timestamps, 0 duplicates, and 0 pending documents.

### **Quick self-test**

**Q1:** Why SIGKILL instead of SIGTERM?
→ **A: SIGTERM allows graceful shutdown — the process flushes buffers and closes connections. In a real crash (power failure, kernel panic), there is no graceful shutdown. SIGKILL simulates the worst case.**

**Q2:** What if the failover takes longer than 10 seconds?
→ **A: The drill fails. 10 seconds is the SLA — any longer, and in-flight requests may time out on the client side, causing retries and potential duplicates. Investigate the election timeout configuration.**

**Q3:** How do you prevent duplicates during failover?
→ **A: The consensus protocol (e.g., Raft) ensures that a committed entry is on a majority of nodes. The new leader replays the log and detects already-committed hashes. Any re-submission of an already-committed hash is idempotently acknowledged, not re-committed.**
