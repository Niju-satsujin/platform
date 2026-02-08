---
id: w11-replicated-kv-23-nodes-d05-quest-partition-policy-2h
part: w11-replicated-kv-23-nodes
title: "Quest: Partition Policy  2h"
order: 5
duration_minutes: 120
prereqs: ["w11-replicated-kv-23-nodes-d04-quest-follower-catch-up-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Partition Policy  2h

## Goal

Define the **network partition policy** for your replicated cluster so split-brain is prevented, the minority side cannot accept committed writes, and recovery after the partition heals follows a documented sequencing procedure.

By end of this session you will have:

- ✅ A **partition classification** distinguishing majority-side, minority-side, and symmetric splits
- ✅ A **minority isolation rule** proving the minority partition cannot commit new writes
- ✅ A **stale leader behavior** defining what happens when a leader is on the minority side
- ✅ A **partition recovery sequence** documenting how the cluster reconverges after healing
- ✅ A **client redirect policy** for clients connected to the minority side

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Partition types classified (majority, minority, symmetric) | Review classification |
| 2 | Minority side cannot form quorum — proof via arithmetic | Verify with n=3, n=5 |
| 3 | Stale leader on minority stops committing within 1 heartbeat round | Check timeout behavior |
| 4 | Recovery sequence: partition heals → catch-up → quorum restored | Trace procedure |
| 5 | Clients on minority side receive redirect or error | Check client policy |

## What You're Building Today

A partition policy document — the specification of how your cluster behaves when the network splits nodes into disconnected groups. This is the hardest scenario in distributed systems and the one most likely to cause data loss if mishandled.

By end of this session, you will have:

- ✅ File: `week-11/day5-partition-policy.md`
- ✅ Partition classification with diagrams for 3-node cluster
- ✅ Proof that minority cannot commit
- ✅ Recovery procedure for partition healing

What "done" looks like:

```cpp
// Partition detection (indirect — via failed RPCs)
struct PartitionState {
    std::set<uint32_t> reachable_nodes;
    std::set<uint32_t> unreachable_nodes;
    bool have_quorum() const {
        return reachable_nodes.size() >= quorum_size(total_nodes);
    }
};
```

You **can**: Reason about every partition scenario and prove your cluster is safe in each one.
You **cannot yet**: Implement leader election (Week 12) — but today's policy constrains that design.

## Why This Matters

🔴 **Without this, you will:**
- Have two leaders accepting writes on each side of a partition — split brain with divergent state
- Allow minority-side writes that are later overwritten, surprising clients with "committed" data disappearing
- Heal the partition and have no procedure for reconciling divergent logs
- Lose client availability entirely instead of redirecting clients to the majority side

🟢 **With this, you will:**
- Guarantee: only the majority side can commit new writes during a partition
- Prove mathematically that split-brain is impossible with quorum-based commit
- Have a documented recovery sequence that brings the cluster back to full health
- Provide clients with actionable errors: "leader is on the other side, retry there"

🔗 **How this connects:**
- **To Day 1:** Partition is one of the failure types in the failure model
- **To Day 3:** Quorum commit prevents minority-side commits — this is the proof
- **To Day 4:** Partition recovery uses follower catch-up to reconcile logs
- **To Week 12 Day 1:** Election timeouts trigger when partition isolates a follower from the leader
- **To Week 12 Day 5:** Stale-leader fencing is the mechanism that stops minority-side leaders

🧠 **Mental model: "Walled City"**

A network partition builds a wall through your cluster. Nodes on each side can talk to each other but not across the wall. The side with the majority of citizens (nodes) still functions as the legitimate government (accepts writes). The minority side becomes a resistance cell — it can observe its local state but cannot pass new laws (commit writes). When the wall falls, the resistance cell must accept all the laws passed by the majority government (log catch-up). Any "laws" the minority tried to pass are void (uncommitted entries overwritten).

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│              PARTITION SCENARIOS (3-node)                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  SCENARIO 1: Leader on majority side                     │
│  ┌─────────────────────┐ ║ ┌──────────────┐             │
│  │ A (leader) ←→ B     │ ║ │ C (alone)    │             │
│  │ quorum = 2 ✓        │ ║ │ quorum = 1 ✗ │             │
│  │ CAN commit           │ ║ │ CANNOT commit│             │
│  └─────────────────────┘ ║ └──────────────┘             │
│                          ║  (partition wall)              │
│  SCENARIO 2: Leader on minority side                     │
│  ┌──────────────┐ ║ ┌─────────────────────┐             │
│  │ A (leader)   │ ║ │ B ←→ C              │             │
│  │ quorum = 1 ✗ │ ║ │ quorum = 2 ✓        │             │
│  │ CANNOT commit│ ║ │ Election → new ldr  │             │
│  │ steps down   │ ║ │ CAN commit           │             │
│  └──────────────┘ ║ └─────────────────────┘             │
│                                                          │
│  SCENARIO 3: Symmetric split (no majority possible)      │
│  ┌──────┐ ║ ┌──────┐ ║ ┌──────┐                        │
│  │  A   │ ║ │  B   │ ║ │  C   │                        │
│  │ q=1✗ │ ║ │ q=1✗ │ ║ │ q=1✗ │                        │
│  └──────┘ ║ └──────┘ ║ └──────┘                        │
│  ALL sides frozen — no commits possible (safe!)          │
│                                                          │
│  RECOVERY: partition heals → stale nodes catch up        │
│  → quorum restored → cluster fully operational           │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-11/day5-partition-policy.md`

## Do

1. **Classify partition types**
   > 💡 *WHY: Different partition topologies have different consequences. A leader-on-majority partition is smooth — writes continue. A leader-on-minority partition causes a brief outage until a new leader is elected. A symmetric split freezes everything. Classifying them lets you analyze each one.*

   Build the classification:

   | Type | Majority side | Minority side | Outcome |
   |------|:---:|:---:|---------|
   | Leader + majority | Has leader + quorum | No leader, no quorum | Writes continue normally |
   | Leader + minority | Has leader, no quorum | No leader, has quorum | New election on majority; old leader stalls |
   | Symmetric (n=3: 1-1-1) | No side has quorum | No side has quorum | Cluster frozen until partition heals |
   | Follower isolated | Has leader + enough quorum | One follower alone | Writes continue, follower catches up later |

2. **Prove the minority cannot commit**
   > 💡 *WHY: This is the mathematical core of partition safety. If the minority could commit writes, we'd have two sets of committed entries that conflict — violating the safety property. The proof is simple: quorum > n/2, and minority ≤ n/2, so minority < quorum.*

   Write the proof:

   ```
   PROOF: Minority side cannot commit writes

   Given: n nodes, quorum q = ⌊n/2⌋ + 1, minority size m ≤ ⌊n/2⌋

   Claim: m < q (minority cannot form quorum)

   For n=3: q=2, minority m ≤ 1. Since 1 < 2, minority cannot commit. ✓
   For n=5: q=3, minority m ≤ 2. Since 2 < 3, minority cannot commit. ✓
   
   General: m ≤ ⌊n/2⌋ < ⌊n/2⌋ + 1 = q. ✓

   Corollary: Any two quorums overlap by at least 1 node.
   Proof: q + q = 2(⌊n/2⌋ + 1) > n. So two quorums can't be disjoint.
   This means committed entries on one quorum are visible to any future quorum.
   ```

3. **Define stale leader behavior on the minority side**
   > 💡 *WHY: A leader isolated on the minority side doesn't know it's isolated immediately. It only discovers the problem when it can't get acks for new entries. After one round of failed heartbeats, it should stop accepting writes and wait.*

   Document the behavior:

   ```cpp
   void Leader::check_quorum_health() {
       // Called periodically (e.g., every heartbeat interval)
       int alive = 1;  // self
       auto now = std::chrono::steady_clock::now();
       for (const auto& [id, fp] : followers_) {
           if (now - fp.last_response < election_timeout_)
               alive++;
       }
       if (alive < quorum_size(cluster_size_)) {
           log_warn("Lost quorum contact — {} of {} reachable",
                    alive, cluster_size_);
           // Option 1: Step down immediately (safest)
           role_ = Role::FOLLOWER;
           // Option 2: Continue for a grace period (less disruptive)
           // grace_deadline_ = now + election_timeout_;
       }
   }
   ```

   **Rule:** A leader that cannot reach a quorum MUST stop accepting new writes. It may serve stale reads depending on consistency requirements.

4. **Design the partition recovery sequence**
   > 💡 *WHY: When the partition heals, nodes on the minority side have a stale or divergent log. They must discover the current leader, receive missing entries via catch-up (Day 4), and resume participation. The sequence must be ordered to avoid inconsistency.*

   Document the recovery steps:

   ```
   PARTITION RECOVERY SEQUENCE:
   1. Network connectivity restored between all nodes
   2. Minority nodes receive heartbeat from majority leader
      → They see a higher term → step down to follower
      → Reset election timer
   3. Leader detects newly reachable followers
      → Updates next_index for each (may need backoff)
   4. AppendEntries catch-up begins
      → Leader sends entries from follower's next_index
      → Follower may reject (divergent log) → backoff
      → Eventually: match point found, entries replicated
   5. Quorum restored: commit index can advance again
      → Entries that were waiting for quorum are committed
   6. Clients on minority side reconnect to leader
      → Retried writes use request_id for dedup (Week 12)
   ```

5. **Define the client redirect policy**
   > 💡 *WHY: Clients connected to minority-side nodes get no service. Instead of timing out silently, nodes should actively redirect clients to the known leader (from the last AppendEntries) or return a clear "no leader" error.*

   Write the redirect logic:

   ```cpp
   KVResponse Follower::handle_client_write(const KVRequest& req) {
       if (known_leader_id_ > 0) {
           // Redirect to known leader
           KVResponse resp;
           resp.status = KVResponse::REDIRECT;
           resp.error_msg = "NOT_LEADER: redirect to node " +
                            std::to_string(known_leader_id_);
           return resp;
       }
       // No known leader (partition or election in progress)
       return {KVResponse::ERROR, "", req.request_id,
               "NO_LEADER: cluster may be partitioned, retry later"};
   }
   ```

## Done when

- [ ] Partition types classified with majority/minority analysis — *know exactly what each scenario means*
- [ ] Mathematical proof: minority < quorum, cannot commit — *the safety foundation*
- [ ] Stale leader detects lost quorum and stops accepting writes — *prevents minority-side phantom commits*
- [ ] Recovery sequence: reconnect → heartbeat → catch-up → quorum restored — *orderly reconvergence*
- [ ] Clients on minority side receive redirect or clear error — *actionable error instead of silent timeout*

## Proof

Paste your partition classification, quorum proof, and recovery sequence, or upload `week-11/day5-partition-policy.md`.

**Quick self-test** (answer without looking at your notes):

1. Can a 3-node cluster survive a symmetric partition (all 3 nodes isolated)? → **No. No side has a quorum (needs 2, each has 1). The cluster freezes — no writes are committed. This is safe (no data corruption) but unavailable. It resumes when any 2 nodes can communicate.**
2. Why must a stale leader stop accepting writes even though it's still running? → **It can't get quorum acks, so no writes would be committed anyway. But if it accepts writes and buffers them, clients might think the writes are in progress. Stopping immediately gives clients a clear signal to redirect.**
3. What happens to writes the minority-side leader accepted but couldn't commit? → **They remain uncommitted in the stale leader's log. After partition recovery, the new leader's log takes precedence — the uncommitted entries are overwritten during catch-up. The client must retry using the original request_id.**
