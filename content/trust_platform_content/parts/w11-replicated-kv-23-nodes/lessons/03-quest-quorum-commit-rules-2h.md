---
id: w11-replicated-kv-23-nodes-d03-quest-quorum-commit-rules-2h
part: w11-replicated-kv-23-nodes
title: "Quest: Quorum Commit Rules  2h"
order: 3
duration_minutes: 120
prereqs: ["w11-replicated-kv-23-nodes-d02-quest-append-rpc-spec-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Quorum Commit Rules  2h

## Goal

Design the **quorum commit rules** for your replicated KV cluster so the leader only marks an entry as committed after a majority of nodes have acknowledged it — guaranteeing that committed entries survive any single-node failure and are never rolled back.

By end of this session you will have:

- ✅ A **commit index advancement algorithm** that updates commit_index when a majority has matched
- ✅ A **match_index tracking table** showing per-follower replication progress
- ✅ A **term-safety rule** preventing commit of entries from previous terms via count alone
- ✅ A **stale ack filter** rejecting acknowledgments from outdated terms
- ✅ A **commit notification path** applying committed entries to the state machine

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Commit index advances only when majority has match_index ≥ N | Trace algorithm |
| 2 | match_index tracked per follower with initial value 0 | Check tracking table |
| 3 | Entries from old terms not committed by count alone | Verify term check in algorithm |
| 4 | Acks with term < current_term are ignored | Check stale filter |
| 5 | Committed entries applied to state machine in order | Verify apply path |

## What You're Building Today

The commit logic — the algorithm that decides when a replicated log entry is safely committed. This is the core of consensus: an entry is committed if and only if a majority has it, and committed entries are never lost.

By end of this session, you will have:

- ✅ File: `week-11/day3-quorum-commit-rules.md`
- ✅ Commit algorithm: advance commit_index to highest N where majority has match_index ≥ N AND log[N].term == current_term
- ✅ Per-follower match_index tracking
- ✅ State machine apply for committed entries

What "done" looks like:

```cpp
void Leader::maybe_advance_commit() {
    for (uint64_t n = commit_index_ + 1; n <= log_.size(); n++) {
        if (log_[n - 1].term != current_term_) continue;
        int count = 1;  // leader has it
        for (const auto& [id, follower] : followers_)
            if (follower.match_index >= n) count++;
        if (count >= quorum_size(cluster_size_))
            commit_index_ = n;
    }
    apply_committed_entries();
}
```

You **can**: Determine exactly when an entry is safe to apply — backed by majority acknowledgment.
You **cannot yet**: Handle followers that are far behind (Day 4) or network partitions (Day 5).

## Why This Matters

🔴 **Without this, you will:**
- Commit entries after only the leader has them — one crash loses committed data
- Apply entries to the state machine before they're safe — then roll back visible to clients
- Count acks from a follower that's actually in a different term — phantom quorum
- Commit entries from a previous term by count alone — the subtle Raft figure 8 bug

🟢 **With this, you will:**
- Guarantee: once committed, an entry exists on a majority and survives any single failure
- Never roll back a committed entry — the safety property of consensus
- Track replication progress per follower for operational visibility
- Handle the term-safety edge case that catches most Raft implementations off guard

🔗 **How this connects:**
- **To Day 2:** match_index is set by successful AppendEntries responses
- **To Day 1:** Quorum size derives from the failure tolerance formula (majority of 2f+1)
- **To Day 4:** Followers behind the commit point need catch-up to participate in future quorums
- **To Day 5:** Partition policy determines what happens when quorum is unreachable
- **To Week 12 Day 1:** New leader's commit_index starts from the previous leader's committed entries

🧠 **Mental model: "Majority Signature"**

Think of committing an entry like getting a document signed. The leader writes the document (log entry). It sends copies to all committee members (followers). Each member signs (acknowledges). Once a majority has signed (quorum), the document is official (committed) and cannot be revoked. Even if some members lose their copy, the majority still has it. Even if the chairman (leader) is replaced, the new chairman can find the signed document on any majority subset.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│              QUORUM COMMIT TRACKING                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Cluster: 3 nodes (A=leader, B, C)   Quorum = 2         │
│                                                          │
│  Log entries:  [1:T1] [2:T1] [3:T2] [4:T2] [5:T2]      │
│                                                          │
│  match_index tracking:                                   │
│  ┌────────┬─────────────┬──────────────┐                │
│  │ Node   │ match_index │ has entry 5? │                │
│  ├────────┼─────────────┼──────────────┤                │
│  │ A (ldr)│ 5           │ ✓ (always)   │                │
│  │ B      │ 5           │ ✓ (acked)    │                │
│  │ C      │ 3           │ ✗ (behind)   │                │
│  └────────┴─────────────┴──────────────┘                │
│                                                          │
│  Can commit entry 5?                                     │
│  ├── Nodes with match ≥ 5: A, B = 2                     │
│  ├── Quorum needed: 2                                    │
│  ├── Entry 5 term = T2 = current_term? ✓                │
│  └── ✓ COMMIT: advance commit_index to 5                │
│                                                          │
│  Can commit entry 4? (already committed via 5)           │
│  Can commit entry 3? (already committed)                 │
│                                                          │
│  ┌──────────────────────────────────────────────┐       │
│  │ TERM SAFETY: If entry has term < current_term│       │
│  │ it can only be committed indirectly — when a │       │
│  │ LATER entry from current_term is committed.  │       │
│  └──────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-11/day3-quorum-commit-rules.md`

## Do

1. **Implement per-follower match_index tracking**
   > 💡 *WHY: The leader must know exactly how far each follower's log extends. match_index is updated on every successful AppendEntries response. It's the leader's view of the cluster's replication state.*

   Set up the tracking structure:

   ```cpp
   struct FollowerProgress {
       uint64_t match_index = 0;  // highest known replicated index
       uint64_t next_index;       // next index to send
       bool responding = true;    // false if follower appears down
   };

   class Leader {
       std::map<uint32_t, FollowerProgress> followers_;
       uint64_t commit_index_ = 0;
       uint64_t current_term_;
       std::vector<LogEntry> log_;

       void init_follower_progress() {
           for (auto& [id, fp] : followers_) {
               fp.next_index = log_.size() + 1;
               fp.match_index = 0;
           }
       }
   };
   ```

2. **Implement the commit index advancement algorithm**
   > 💡 *WHY: This is the core safety algorithm. It scans from commit_index+1 forward, checking if a majority has replicated each entry. The term check prevents the "figure 8" bug where counting acks for old-term entries leads to committed entries being overwritten.*

   Write the algorithm:

   ```cpp
   void Leader::maybe_advance_commit() {
       uint64_t new_commit = commit_index_;
       for (uint64_t n = commit_index_ + 1; n <= log_.size(); n++) {
           // TERM SAFETY: only commit entries from current term
           if (log_[n - 1].term != current_term_)
               continue;
           // Count nodes with this entry
           int ack_count = 1;  // leader always has it
           for (const auto& [id, fp] : followers_) {
               if (fp.match_index >= n)
                   ack_count++;
           }
           if (ack_count >= quorum_size(cluster_size_))
               new_commit = n;
           else
               break;  // if N not committed, N+1 can't be either
       }
       if (new_commit > commit_index_) {
           commit_index_ = new_commit;
           apply_committed_entries();
       }
   }
   ```

3. **Implement the stale ack filter**
   > 💡 *WHY: A follower might respond to an AppendEntries from a previous term after the leader has already moved to a new term. Counting this stale ack could inflate the quorum count incorrectly.*

   Add the filter:

   ```cpp
   void Leader::handle_append_response(
       uint32_t follower_id,
       const AppendEntriesResponse& resp,
       uint64_t request_term)
   {
       // Reject if response term doesn't match current term
       if (resp.term > current_term_) {
           step_down(resp.term);  // we're stale
           return;
       }
       if (request_term != current_term_) {
           // This ack is from a request we sent in an old term — ignore
           return;
       }
       if (resp.success) {
           followers_[follower_id].match_index = resp.match_index;
           followers_[follower_id].next_index = resp.match_index + 1;
           maybe_advance_commit();
       } else {
           followers_[follower_id].next_index =
               std::max(1UL, followers_[follower_id].next_index - 1);
       }
   }
   ```

4. **Explain the term-safety rule (figure 8 problem)**
   > 💡 *WHY: Without the term check, a leader could commit an entry from term 2 by counting acks in term 4. But another leader in term 3 might have overwritten that entry. Committing it would violate safety. The rule: only commit entries from the current term. Old-term entries get committed indirectly.*

   Document the scenario:

   ```
   FIGURE 8 PROBLEM:
   Term 2: Leader A appends entry X at index 3
           Replicated to A and B (2 of 5, not committed)
   Term 3: Leader C wins election, overwrites index 3 with entry Y
           A and B still have X at index 3
   Term 4: Leader A wins again
           A sees X at index 3, B has X — that's 2 of 5
           
   WITHOUT term check: A commits X (2 acks for 5-node cluster → NO, need 3)
   Actually in a 3-node variant this IS dangerous.
   
   FIX: A can only commit entries from term 4.
        Once a term-4 entry at index 4 gets majority,
        entry 3 (from term 2) is committed indirectly.
   ```

5. **Implement committed entry application**
   > 💡 *WHY: Committed entries must be applied to the KV state machine in log order. This is the point where replication meets your Week 9-10 code — the state machine from Week 9 and the WAL from Week 10 converge with replication.*

   Write the apply function:

   ```cpp
   void Leader::apply_committed_entries() {
       while (last_applied_ < commit_index_) {
           last_applied_++;
           const auto& entry = log_[last_applied_ - 1];
           KVRequest req{entry.command, entry.key,
                         entry.value, entry.request_id};
           auto resp = kv_store_.apply_without_wal(req, entry.index);
           // Notify waiting client (if this node is leader)
           if (pending_clients_.count(entry.request_id))
               pending_clients_[entry.request_id].respond(resp);
       }
   }
   ```

## Done when

- [ ] Per-follower match_index tracked, updated on each successful ack — *the leader's view of cluster state*
- [ ] Commit advances only when majority has match_index ≥ N AND entry N is from current term — *the safety algorithm*
- [ ] Stale acks from old terms are filtered out — *prevents phantom quorum inflation*
- [ ] Term-safety rule documented with figure-8 scenario — *the subtle bug that breaks naive implementations*
- [ ] Committed entries applied to state machine in order — *replication feeds the KV store*

## Proof

Paste your commit advancement algorithm, match_index tracking, and term-safety explanation, or upload `week-11/day3-quorum-commit-rules.md`.

**Quick self-test** (answer without looking at your notes):

1. In a 3-node cluster, how many acks does the leader need to commit an entry? → **2 (including itself). The leader already has the entry, so it needs 1 follower ack to reach quorum of 2.**
2. Why can't the leader commit an entry from a previous term by counting acks alone? → **An entry from term 2 might have been overwritten by a leader in term 3. Counting acks in term 4 for a term-2 entry could commit something that was already replaced — violating safety.**
3. What happens to clients waiting for a response when the leader commits an entry? → **The leader looks up the request_id in its pending_clients map and sends the KV response back to the waiting client. The client's write is confirmed only after quorum commit.**
