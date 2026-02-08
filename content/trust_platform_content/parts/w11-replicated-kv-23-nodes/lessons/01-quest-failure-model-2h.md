---
id: w11-replicated-kv-23-nodes-d01-quest-failure-model-2h
part: w11-replicated-kv-23-nodes
title: "Quest: Failure Model  2h"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Failure Model  2h

## Goal

Define the **failure model** for your replicated KV cluster so every component has documented failure modes, recovery expectations, and explicit exclusions — making clear what your system tolerates and what it does not.

By end of this session you will have:

- ✅ A **failure taxonomy** classifying node, network, and disk failures
- ✅ A **crash-stop assumption** defining that failed nodes halt cleanly and don't send corrupt messages
- ✅ A **network model** specifying message delay, loss, reordering, and duplication characteristics
- ✅ An **explicit Byzantine exclusion** documenting that nodes are trusted to not lie
- ✅ A **failure tolerance formula** for your cluster size (f failures tolerated in 2f+1 nodes)

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Failure taxonomy covers node crash, network partition, disk failure | Review taxonomy table |
| 2 | Crash-stop: failed node sends no further messages | Verify assumption in model |
| 3 | Network model: messages may be delayed, lost, reordered, duplicated | Check model properties |
| 4 | Byzantine failures explicitly excluded with justification | Find exclusion statement |
| 5 | Tolerance formula: f < n/2 for n nodes | Verify for n=3 and n=5 |

## What You're Building Today

A failure model document — the specification of what can go wrong in your distributed system. This is not code; it is the foundational assumption that every protocol decision in Weeks 11-12 relies on.

By end of this session, you will have:

- ✅ File: `week-11/day1-failure-model.md`
- ✅ Failure taxonomy: crash, partition, slow, disk
- ✅ Crash-stop assumption with explicit non-Byzantine statement
- ✅ Tolerance analysis for 3-node and 5-node clusters

What "done" looks like:

```cpp
// Failure model encoded as configuration
struct FailureModel {
    bool crash_stop = true;       // nodes halt on failure, don't corrupt
    bool byzantine = false;       // NO malicious nodes assumed
    bool network_reliable = false; // messages CAN be lost/delayed
    bool network_ordered = false;  // messages CAN arrive out of order
    uint32_t cluster_size;         // n = 2f + 1
    uint32_t max_failures;         // f = (n - 1) / 2
};

FailureModel model_for_cluster(uint32_t n) {
    return {true, false, false, false, n, (n - 1) / 2};
}
```

You **can**: Precisely state what failures your system tolerates and what it doesn't.
You **cannot yet**: Implement replication (Day 2-5) — today is the assumptions that make replication correct.

## Why This Matters

🔴 **Without this, you will:**
- Build replication without knowing how many node failures it survives — then lose data in production
- Assume the network is reliable and wonder why messages disappear during partitions
- Handle Byzantine failures you don't need to (massive complexity) or miss crash failures you do need to handle
- Have no answer when asked "what happens if two nodes die simultaneously?"

🟢 **With this, you will:**
- Know exactly: "3-node cluster tolerates 1 failure, 5-node cluster tolerates 2"
- Design message handling for loss, delay, and reordering — the real network
- Avoid unnecessary complexity by explicitly excluding Byzantine behavior
- Make every protocol decision traceable to a failure model assumption

🔗 **How this connects:**
- **To Week 10 Day 3:** Crash drills tested single-node crash-stop — now it's cluster-wide
- **To Day 2:** Append RPC handles message loss and delay from this network model
- **To Day 3:** Quorum rules derive from the f < n/2 tolerance formula
- **To Day 5:** Partition policy handles the network split case from this model
- **To Week 12 Day 1:** Election timeouts handle the "leader crash" failure from this taxonomy

🧠 **Mental model: "Rules of the Game"**

The failure model is the **rulebook** for your distributed system. It says what the adversary (nature, hardware, networks) is allowed to do and what it cannot do. Crash-stop says nodes can die but can't lie. Asynchronous network says messages can be slow but can't be forged. The adversary plays within these rules, and your protocol must win despite the adversary's best moves within the rules. If you don't define the rules, you don't know what game you're playing — and you can't prove your protocol wins.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│                  FAILURE MODEL                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐             │
│  │ Node A  │    │ Node B  │    │ Node C  │  (3-node)   │
│  │ (leader)│    │(follower│    │(follower│             │
│  └────┬────┘    └────┬────┘    └────┬────┘             │
│       │              │              │                    │
│       ├──── msg ─────┤   ╳ lost     │                    │
│       │              │              │                    │
│       ├──── msg ─────┼──── msg ─────┤   delayed          │
│       │              │              │                    │
│  ┌────────────────────────────────────────────┐         │
│  │  FAILURE TYPES:                             │         │
│  │                                             │         │
│  │  ✓ Crash-stop: node halts, sends nothing   │         │
│  │  ✓ Network partition: A↔C cut, A↔B OK      │         │
│  │  ✓ Message loss: msg sent but never arrives │         │
│  │  ✓ Message delay: msg arrives after timeout │         │
│  │  ✓ Message reorder: msg2 arrives before msg1│         │
│  │  ✓ Disk failure: node crashes permanently   │         │
│  │  ✗ Byzantine: node sends LIES (excluded)    │         │
│  │  ✗ Message corruption (TCP handles this)    │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  TOLERANCE:  n=3 → f=1    n=5 → f=2                    │
│  QUORUM:     n=3 → q=2    n=5 → q=3                    │
│  RULE: f < n/2, quorum = floor(n/2) + 1                 │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-11/day1-failure-model.md`

## Do

1. **Build the failure taxonomy**
   > 💡 *WHY: Naming failures gives you a precise vocabulary for protocol design. Instead of "something went wrong," you say "crash-stop of follower B during append" — and everyone knows exactly what scenario you mean.*

   Classify every failure type:

   | Failure | Description | Detectable? | Duration |
   |---------|-------------|-------------|----------|
   | Crash-stop | Node halts, all state in memory lost | Yes (heartbeat timeout) | Until restart |
   | Network partition | Messages between node subsets not delivered | No (indistinguishable from slow) | Variable |
   | Message loss | Individual message never arrives | No (timeout only) | Per-message |
   | Message delay | Message arrives after expected timeout | No (looks like loss until arrival) | Variable |
   | Message reorder | Messages arrive in different order than sent | Detectable (sequence numbers) | Per-message |
   | Disk failure | Persistent storage becomes unreadable | Yes (I/O error) | Permanent |

2. **Define the crash-stop assumption**
   > 💡 *WHY: Crash-stop means a failed node simply disappears — it does not send corrupt messages, partial messages, or false acknowledgments. This assumption simplifies protocol design enormously and is realistic for trusted internal clusters.*

   Write the formal statement:

   ```
   CRASH-STOP ASSUMPTION:
   1. A node operates correctly until it fails
   2. When it fails, it immediately halts — no further messages sent
   3. It does not send partial, corrupt, or fabricated messages
   4. On recovery, it starts from its last durable state (WAL + snapshot)
   5. Other nodes detect the failure via heartbeat timeout
   ```

   **What this excludes:** A node that crashes mid-message-send. In practice, TCP handles partial sends via connection reset, so the receiver sees "connection lost," not a corrupt message.

3. **Define the network model**
   > 💡 *WHY: The network is the most adversarial component. Messages can be lost (router drops), delayed (congestion), reordered (multipath routing), and duplicated (TCP retransmit + original both arrive). Your protocol must handle ALL of these.*

   Document each property:

   ```cpp
   struct NetworkModel {
       // Messages may be:
       bool can_lose = true;       // dropped, never delivered
       bool can_delay = true;      // arrive after arbitrary time
       bool can_reorder = true;    // arrive in different order than sent
       bool can_duplicate = true;  // same message delivered twice

       // Messages may NOT be:
       bool can_corrupt = false;   // TCP checksums prevent this
       bool can_forge = false;     // no Byzantine — can't fabricate msgs

       // Delivery assumption:
       // If sender and receiver are both alive and connected,
       // a message will EVENTUALLY be delivered (fair-loss link)
   };
   ```

4. **Compute the failure tolerance formula**
   > 💡 *WHY: For consensus, you need a majority (quorum) to agree. With n nodes, a quorum is ⌊n/2⌋ + 1. The cluster tolerates f = n - quorum = ⌊(n-1)/2⌋ failures. For n=3, f=1. For n=5, f=2.*

   Build the tolerance table:

   | Cluster size (n) | Max failures (f) | Quorum size (q) | Surviving majority |
   |:-:|:-:|:-:|:---|
   | 3 | 1 | 2 | 2 of 3 agree → progress |
   | 5 | 2 | 3 | 3 of 5 agree → progress |
   | 7 | 3 | 4 | 4 of 7 agree → progress |

   ```cpp
   constexpr uint32_t quorum_size(uint32_t n) { return n / 2 + 1; }
   constexpr uint32_t max_failures(uint32_t n) { return (n - 1) / 2; }
   // n=3: quorum=2, max_failures=1
   // n=5: quorum=3, max_failures=2
   ```

5. **Write the explicit Byzantine exclusion**
   > 💡 *WHY: Byzantine fault tolerance (BFT) requires 3f+1 nodes and cryptographic message validation. It's vastly more complex. By explicitly excluding it, you justify simpler protocols and avoid scope creep. If someone asks "what about malicious nodes?" you have a documented answer.*

   Write the exclusion statement:

   ```
   BYZANTINE EXCLUSION:
   This system does NOT tolerate Byzantine failures.

   Assumptions:
   - All nodes run the same correct code
   - No node intentionally sends false information
   - No node fabricates votes, logs, or acknowledgments
   - Network messages are not tampered with in transit

   Justification:
   - Internal cluster on trusted infrastructure
   - All binaries deployed from same verified build
   - Network is private (no untrusted intermediaries)
   - BFT would require 3f+1 nodes (9 for f=2) — impractical overhead

   If Byzantine tolerance is needed later:
   - Add message authentication (HMAC with shared secret)
   - Upgrade to BFT consensus (PBFT or similar)
   - Requires fundamental protocol changes — not a simple add-on
   ```

## Done when

- [ ] Failure taxonomy covers crash-stop, partition, loss, delay, reorder, disk — *the vocabulary for all protocol decisions*
- [ ] Crash-stop assumption documented: nodes halt, don't lie — *simplifies protocol design*
- [ ] Network model: messages can be lost, delayed, reordered, duplicated — *but not corrupted or forged*
- [ ] Tolerance formula computed for n=3 and n=5 clusters — *quorum = ⌊n/2⌋+1, failures = ⌊(n-1)/2⌋*
- [ ] Byzantine exclusion explicit with justification — *bounded scope, documented upgrade path*

## Proof

Paste your failure taxonomy, crash-stop assumption, and tolerance formula, or upload `week-11/day1-failure-model.md`.

**Quick self-test** (answer without looking at your notes):

1. In a 3-node cluster, what happens if 2 nodes crash? → **The remaining 1 node cannot form a quorum (needs 2). The cluster halts — no new writes can be committed. It remains available for reads of previously committed data (depending on implementation).**
2. Why is crash-stop simpler than Byzantine? → **Crash-stop nodes either work correctly or are silent. Byzantine nodes can send arbitrary messages — you must validate every message against every other node's messages. This requires 3f+1 nodes instead of 2f+1 and cryptographic proofs.**
3. Can you distinguish a crashed node from a network partition? → **No. From the perspective of remaining nodes, both look identical — the node stops responding. This ambiguity is fundamental and is why consensus protocols use timeouts and voting rather than trying to diagnose the failure type.**
