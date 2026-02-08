---
id: w20-failure-survival-hardening-d03-partition-drill
part: w20-failure-survival-hardening
title: "Partition Drill"
order: 3
duration_minutes: 120
prereqs: ["w20-failure-survival-hardening-d02-node-crash-drill"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Partition Drill

## Goal

Execute a controlled network-partition drill that splits the cluster into a majority and a minority partition, then verifies that: (1) the minority partition cannot produce final anchored documents, (2) the majority partition continues operating, and (3) after the partition heals, the minority re-joins without data divergence.

### ✅ Deliverables

1. A `PartitionDrill` class that orchestrates: establish partition → test both sides → heal → verify convergence.
2. Minority-halt verification: requests to the minority partition return `PARTITION_MINORITY` error, not stale successes.
3. Majority-continues verification: the majority partition issues and anchors documents normally.
4. Convergence verification: after healing, all nodes agree on the same commit log.
5. Shipped design document: `week-20/day3-partition-drill.md`.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Minority partition rejects issuance requests | Submit to minority → `PARTITION_MINORITY` error |
| 2 | Majority partition continues issuing | Submit to majority → `SignedEnvelope` returned |
| 3 | Minority cannot produce anchored documents | Attempt anchor from minority → fails |
| 4 | After healing, all nodes have identical commit logs | Compare log hashes across all nodes |
| 5 | No split-brain documents (different content, same ID) | Scan for conflicting document hashes |

## What You're Building Today

You are simulating the nightmare scenario for any distributed system: the network splits in half. Nodes on each side can talk to their neighbours but not to the other side. Without partition tolerance, both sides might issue contradictory documents. Today you prove that doesn't happen.

### ✅ Deliverables

- `partition_drill.h` / `partition_drill.cpp` — drill orchestrator
- `partition_rules.cpp` — iptables-based partition injection
- `convergence_check.cpp` — post-healing log comparison
- `partition_report.cpp` — drill report generator

```cpp
// partition_drill.h
#pragma once
#include <string>
#include <vector>
#include <cstdint>

struct PartitionConfig {
    std::vector<std::string> majority_nodes;  // > N/2
    std::vector<std::string> minority_nodes;  // < N/2
};

struct PartitionResult {
    bool    minority_halted;         // true = minority refused requests
    bool    majority_continued;      // true = majority issued documents
    bool    converged_after_heal;    // true = all logs match post-heal
    size_t  split_brain_count;       // must be 0
    int64_t partition_duration_ms;
    int64_t convergence_duration_ms;
};

class PartitionDrill {
public:
    PartitionDrill(std::vector<std::string> all_nodes);

    // Phase 1: Create network partition using iptables
    void create_partition(const PartitionConfig& config);

    // Phase 2: Test both sides
    PartitionResult test_during_partition(int test_duration_seconds);

    // Phase 3: Heal partition and check convergence
    PartitionResult heal_and_verify(int convergence_timeout_seconds);

private:
    std::vector<std::string> all_nodes_;
    PartitionConfig          active_partition_;
};
```

You **can**:
- Simulate and test network partitions in a controlled environment.
- Prove the minority partition cannot issue final documents.

You **cannot yet**:
- Test key compromise during a partition (Day 4).
- Validate full restore after a partition + crash combination (Day 5).

## Why This Matters

🔴 **Without partition drills:**
- You assume partition tolerance works but have never tested it.
- A minority partition might issue "valid" documents that the majority doesn't know about — split brain.
- After healing, nodes might disagree on the commit log — permanent data divergence.
- No measured convergence time — replication lag is unknown.

🟢 **With partition drills:**
- Minority halt is verified — the minority cannot issue final documents.
- Majority continuity is verified — the system remains available to the majority.
- Post-heal convergence is verified — all nodes agree on the same state.
- Split-brain count is verified to be zero — no contradictory documents.

🔗 **Connects:**
- **Week 10** (Raft consensus) — partition behaviour is defined by the consensus protocol.
- **Week 12** (checkpoints) — checkpoints survive the partition and aid convergence.
- **Week 18 Day 1** (anchoring) — minority cannot obtain anchoring receipts.
- **Week 19 Day 3** (air-gap mode) — minority nodes operate in air-gap-like mode.
- **Week 20 Day 1** (chaos matrix) — this drill is CT-002 from the matrix.

🧠 **Mental model: "Island Split"** — Imagine an island split by a rising river. The side with the town hall (majority) continues governing. The side without (minority) can't pass laws — they wait for the bridge to be rebuilt. When the river recedes, both sides reconcile any local decisions. The partition drill proves the minority side doesn't forge laws while cut off.

## Visual Model

```
┌──────────── Partition Drill ───────────────────────────┐
│                                                         │
│  Phase 1: Create partition                              │
│  ┌────────────────────┐  ║  ┌──────────────────────┐   │
│  │   MAJORITY (2/3)   │  ║  │   MINORITY (1/3)     │   │
│  │  Node-A  Node-B    │  ║  │   Node-C             │   │
│  │  ◀── issuing OK    │  ║  │   ◀── HALTED         │   │
│  └────────────────────┘  ║  └──────────────────────┘   │
│                          ║                              │
│  Phase 2: Test                                          │
│  Majority: issue doc ──▶ SUCCESS ✓                      │
│  Minority: issue doc ──▶ PARTITION_MINORITY ✗           │
│  Minority: anchor    ──▶ REJECTED ✗                     │
│                                                         │
│  Phase 3: Heal + Converge                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Node-A  Node-B  Node-C                          │  │
│  │  ◀── all logs match ✓                             │  │
│  │  ◀── split-brain count: 0 ✓                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Verdict: PASSED                                        │
└─────────────────────────────────────────────────────────┘
```

## Build

File: `week-20/day3-partition-drill.md`

## Do

### 1. **Build the partition injection system**

> 💡 *WHY: `iptables` rules simulate real network failures without needing multiple physical machines. They're reversible, precise, and automatable.*

Implement `create_partition()`: for each minority node, add `iptables -A INPUT -s <majority_ip> -j DROP` and `iptables -A OUTPUT -d <majority_ip> -j DROP`. This creates a bidirectional partition. Store the rules for cleanup.

### 2. **Verify minority halt**

> 💡 *WHY: If the minority can issue documents, you have a split-brain system. The minority must know it's a minority and refuse write operations.*

Send issuance requests to each minority node. Assert that every request returns a `PARTITION_MINORITY` error (not a timeout, not a stale success). The minority must actively reject, not passively fail.

### 3. **Verify majority continuity**

> 💡 *WHY: Halting the minority is only half the story. The majority must continue serving — otherwise the partition caused a full outage, not a degraded mode.*

Send issuance and anchoring requests to majority nodes. Assert success. The majority should be unaware of the partition (from a functionality perspective) — it has quorum and continues operating.

### 4. **Implement heal and convergence check**

> 💡 *WHY: Healing is not instant. The minority must replay missed log entries and sync to the majority's state. Convergence time must be measured and bounded.*

Remove the `iptables` rules. Wait for nodes to reconnect. Poll each node for its commit log hash. Assert all nodes return the same hash within the convergence timeout. Scan for split-brain documents (same document ID, different content hash). Count must be 0.

### 5. **Document the drill and results**

> 💡 *WHY: The drill report proves partition tolerance to auditors. It includes timeline, majority/minority behaviour, convergence time, and split-brain count.*

Write `week-20/day3-partition-drill.md` covering: partition creation method (iptables rules), minority halt behaviour, majority continuity behaviour, convergence measurement, and split-brain detection methodology.

## Done when

- [ ] Minority partition rejects all issuance and anchoring requests — *prevents split-brain document issuance*
- [ ] Majority partition continues issuing and anchoring documents — *the system remains available to the majority*
- [ ] After healing, all nodes have identical commit log hashes — *convergence proves no data divergence*
- [ ] Split-brain count is zero — *no contradictory documents were issued during the partition*
- [ ] Drill report includes timeline, convergence duration, and all verification results — *the report is evidence for partition-tolerance audits*

## Proof

Upload `week-20/day3-partition-drill.md` and a terminal screenshot showing: minority rejection, majority success, post-heal convergence with matching log hashes, and split-brain count = 0.

### **Quick self-test**

**Q1:** Why must the minority *actively reject* rather than just time out?
→ **A: A timeout is ambiguous — it could mean "network slow" or "node down." Active rejection (`PARTITION_MINORITY`) tells the client exactly what happened, enabling it to redirect to the majority instead of retrying indefinitely.**

**Q2:** What if the majority issues a document while the minority is partitioned, then the minority heals — does the minority see the new document?
→ **A: Yes. After healing, the minority replays the majority's log entries. The new document is replicated to the minority during convergence. This is the standard Raft log-replication catch-up.**

**Q3:** Can a partition create orphaned anchoring receipts?
→ **A: No. Anchoring requires the signed envelope, which requires issuance, which requires majority quorum. If the minority can't issue, it can't anchor. If the majority issues and anchors, those receipts are replicated during convergence.**
