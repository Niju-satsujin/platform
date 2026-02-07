---
id: w11-replicated-kv-23-nodes-d02-quest-append-rpc-spec-2h
part: w11-replicated-kv-23-nodes
title: "Quest: Append RPC Spec  2h"
order: 2
duration_minutes: 120
prereqs: ["w11-replicated-kv-23-nodes-d01-quest-failure-model-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Append RPC Spec  2h

## Goal

Design the **AppendEntries RPC specification** for leader-to-follower log shipping so the leader can replicate WAL entries to followers, followers can verify log consistency using the previous-index check, and acknowledgments carry enough information for the leader to track replication progress.

By end of this session you will have:

- ✅ An **AppendEntries request struct** with leader term, prev_log_index, prev_log_term, entries, and commit_index
- ✅ An **AppendEntries response struct** with success/failure, follower's term, and match_index
- ✅ A **prev-index consistency check** that followers use to reject mismatched log prefixes
- ✅ A **heartbeat mode** using empty AppendEntries to maintain leader authority
- ✅ An **ack semantics document** defining exactly what a successful response means

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Request has term, prev_log_index, prev_log_term, entries[], commit_index | Review struct |
| 2 | Response has success, term, match_index | Review struct |
| 3 | Follower rejects if prev_log_index/term don't match its log | Test with mismatch |
| 4 | Empty entries[] = heartbeat, still resets election timer | Verify heartbeat path |
| 5 | Ack semantics: success means entries are appended AND fsync'd | Check ack contract |

## What You're Building Today

The AppendEntries RPC — the core replication primitive that the leader uses to ship log entries to followers. This is the mechanism that keeps all nodes' logs consistent.

By end of this session, you will have:

- ✅ File: `week-11/day2-append-rpc-spec.md`
- ✅ Request/response structs with all required fields
- ✅ Follower handling logic with prev-index consistency check
- ✅ Heartbeat as a special case of AppendEntries

What "done" looks like:

```cpp
struct AppendEntriesRequest {
    uint64_t term;              // leader's current term
    uint32_t leader_id;         // so followers know who to redirect clients to
    uint64_t prev_log_index;    // index of entry immediately preceding new ones
    uint64_t prev_log_term;     // term of prev_log_index entry
    std::vector<LogEntry> entries;  // empty for heartbeat
    uint64_t leader_commit;     // leader's commit index
};

struct AppendEntriesResponse {
    uint64_t term;              // follower's current term (for leader to update)
    bool success;               // true if follower matched prev_log and appended
    uint64_t match_index;       // highest index follower has after this append
};
```

You **can**: Specify the complete wire protocol for log replication between leader and followers.
You **cannot yet**: Implement quorum commit (Day 3) or handle follower catch-up (Day 4).

## Why This Matters

🔴 **Without this, you will:**
- Ship entries to followers without verifying log consistency — divergent logs across nodes
- Have no way for the leader to know which entries each follower has — commit index stuck forever
- Miss heartbeats and trigger unnecessary elections during normal operation
- Build acknowledgments that don't confirm durability — "acked" entries lost on follower crash

🟢 **With this, you will:**
- Guarantee log consistency: every follower's log is a prefix of the leader's log
- Track per-follower replication progress for commit index advancement (Day 3)
- Keep elections suppressed during normal operation via heartbeat
- Know that an ack means "appended and durable" — safe for commit counting

🔗 **How this connects:**
- **To Day 1:** RPC handles message loss and delay from the failure model
- **To Week 10 Day 1:** Entries are WAL records — same format, now shipped over network
- **To Day 3:** Leader counts acks from this RPC to decide when to commit
- **To Day 4:** Failed consistency checks trigger the catch-up procedure
- **To Week 12 Day 2:** Vote requests use a similar term-based protocol structure

🧠 **Mental model: "Linked List Verification"**

The log is a linked list where each entry points back to the previous one via (index, term). AppendEntries says: "Here are new entries. The one just before them has index=X and term=Y." The follower checks: "Does my entry at index X have term Y?" If yes, the link is valid — append the new entries. If no, the chain is broken — reject and tell the leader to try an earlier link. This is how logs stay consistent without ever comparing the entire log — just one backward pointer check per RPC.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│              APPEND ENTRIES RPC FLOW                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Leader Log:   [1:T1] [2:T1] [3:T2] [4:T2] [5:T2]      │
│                                 ▲                        │
│                                 │ prev_log_index=3       │
│                                 │ prev_log_term=T2       │
│                                                          │
│  AppendEntries ──────────────────────────────▶ Follower  │
│  │ term: T2                                      │       │
│  │ prev_log_index: 3                             │       │
│  │ prev_log_term: T2                             │       │
│  │ entries: [{4:T2}, {5:T2}]                     │       │
│  │ leader_commit: 3                              │       │
│                                                  │       │
│  Follower checks:                                │       │
│  ┌──────────────────────────────────────┐       │       │
│  │ My log at index 3 = term T2?        │       │       │
│  │ ├── YES → append entries 4,5        │       │       │
│  │ │         fsync to disk             │       │       │
│  │ │         respond: success=true     │       │       │
│  │ │         match_index=5             │       │       │
│  │ │                                   │       │       │
│  │ └── NO  → respond: success=false    │       │       │
│  │           (leader must retry lower) │       │       │
│  └──────────────────────────────────────┘       │       │
│                                                          │
│  Heartbeat: same RPC, entries=[] , resets election timer │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-11/day2-append-rpc-spec.md`

## Do

1. **Define the AppendEntries request struct**
   > 💡 *WHY: Every field serves a specific purpose. The term proves the leader is legitimate. prev_log_index/term verify consistency. entries carry the data. leader_commit tells followers what's safe to apply. Missing any field breaks the protocol.*

   Document each field's purpose:

   ```cpp
   struct LogEntry {
       uint64_t index;     // position in the log (1-based)
       uint64_t term;      // term when entry was created
       CmdType  command;   // PUT or DELETE
       std::string key;
       std::string value;
       std::string request_id;
   };

   struct AppendEntriesRequest {
       uint64_t term;            // leader's current term
       uint32_t leader_id;       // for client redirect
       uint64_t prev_log_index;  // consistency check: index before entries
       uint64_t prev_log_term;   // consistency check: term at prev index
       std::vector<LogEntry> entries;  // new entries (empty = heartbeat)
       uint64_t leader_commit;   // leader's commit index
   };
   ```

2. **Implement the follower's consistency check**
   > 💡 *WHY: This check is the core of log safety. If the follower's log at prev_log_index has a different term, the logs have diverged. Appending new entries on top of a diverged log would make things worse. Rejection forces the leader to find the correct divergence point.*

   Write the handler:

   ```cpp
   AppendEntriesResponse handle_append_entries(
       const AppendEntriesRequest& req, ReplicaState& state)
   {
       // Rule 1: Reject if request term < current term
       if (req.term < state.current_term)
           return {state.current_term, false, 0};
       // Update term if request has newer term
       if (req.term > state.current_term) {
           state.current_term = req.term;
           state.role = Role::FOLLOWER;
       }
       state.reset_election_timer();  // leader is alive
       // Rule 2: Consistency check on prev_log
       if (req.prev_log_index > 0) {
           if (req.prev_log_index > state.log.size())
               return {state.current_term, false, state.log.size()};
           auto& prev = state.log[req.prev_log_index - 1];
           if (prev.term != req.prev_log_term)
               return {state.current_term, false, req.prev_log_index - 1};
       }
       // Rule 3: Append new entries (overwrite conflicts)
       for (const auto& entry : req.entries) {
           if (entry.index <= state.log.size()) {
               if (state.log[entry.index - 1].term != entry.term)
                   state.log.resize(entry.index - 1);  // truncate conflict
           }
           state.log.push_back(entry);
       }
       // Rule 4: Update commit index
       if (req.leader_commit > state.commit_index)
           state.commit_index = std::min(req.leader_commit,
                                          (uint64_t)state.log.size());
       uint64_t match = state.log.size();
       return {state.current_term, true, match};
   }
   ```

3. **Define the response struct and ack semantics**
   > 💡 *WHY: The leader uses responses to track replication progress. match_index tells the leader "I have entries up to this index." The leader needs this to compute the commit index (Day 3). A response with success=false tells the leader to retry with an earlier prev_log_index.*

   Document the ack contract:

   ```
   ACK SEMANTICS:
   success=true means:
   ├── Follower's log at prev_log_index matches prev_log_term
   ├── All entries in the request are appended to follower's log
   ├── Entries are fsync'd to follower's WAL (durable)
   ├── match_index = last entry index in follower's log
   └── Follower's commit_index updated to min(leader_commit, match_index)

   success=false means:
   ├── Follower's log at prev_log_index does NOT match
   │   OR follower's term is higher than request term
   ├── No entries were appended
   ├── match_index = follower's hint for where to retry
   └── Leader should decrement prev_log_index and retry
   ```

4. **Define heartbeat as empty AppendEntries**
   > 💡 *WHY: A dedicated heartbeat message would complicate the protocol. Instead, an AppendEntries with empty entries[] serves as a heartbeat — it resets the follower's election timer without shipping data. Same handler, same path, less code.*

   Document the heartbeat rules:

   ```cpp
   void Leader::send_heartbeats() {
       for (auto& follower : followers_) {
           AppendEntriesRequest hb;
           hb.term = current_term_;
           hb.leader_id = my_id_;
           hb.prev_log_index = follower.match_index;
           hb.prev_log_term = log_[follower.match_index - 1].term;
           hb.entries = {};  // EMPTY = heartbeat
           hb.leader_commit = commit_index_;
           send_rpc(follower.id, hb);
       }
   }
   // Heartbeat interval: 100-150ms (must be < election timeout)
   ```

5. **Handle term updates from responses**
   > 💡 *WHY: If a follower responds with a term higher than the leader's, the leader is stale — a new election has happened. The leader must immediately step down to follower role. Ignoring this causes split-brain: two leaders in different terms.*

   Write the term update logic:

   ```cpp
   void Leader::handle_append_response(uint32_t follower_id,
                                        const AppendEntriesResponse& resp)
   {
       // CRITICAL: Check term first
       if (resp.term > current_term_) {
           current_term_ = resp.term;
           role_ = Role::FOLLOWER;
           return;  // stop being leader immediately
       }
       if (resp.success) {
           followers_[follower_id].match_index = resp.match_index;
           followers_[follower_id].next_index = resp.match_index + 1;
           maybe_advance_commit();  // Day 3
       } else {
           // Decrement and retry
           followers_[follower_id].next_index =
               std::max(1UL, resp.match_index);
           retry_append(follower_id);  // Day 4
       }
   }
   ```

## Done when

- [ ] AppendEntries request has term, prev_log_index/term, entries, leader_commit — *the complete replication message*
- [ ] Follower rejects on prev_log_index/term mismatch — *guarantees log prefix consistency*
- [ ] Ack semantics: success means appended AND durable — *safe for commit counting*
- [ ] Heartbeat uses empty entries[] to reset election timer — *leader authority without data overhead*
- [ ] Leader steps down on higher term in response — *prevents split-brain*

## Proof

Paste your AppendEntries request/response structs, consistency check, and ack semantics, or upload `week-11/day2-append-rpc-spec.md`.

**Quick self-test** (answer without looking at your notes):

1. What does the follower do if prev_log_index=5 but its log only has 3 entries? → **Returns success=false with match_index=3. The follower doesn't have entry 5, so it can't verify the consistency check. The leader must retry with a lower prev_log_index.**
2. Why does the heartbeat still carry leader_commit? → **Followers need to know the commit index to apply entries to their state machines. Even without new entries, the commit index may have advanced since the last message.**
3. Why must the leader step down immediately when it sees a higher term? → **A higher term means a new election happened. The old leader's authority is revoked. If it continues accepting writes, it creates conflicting committed entries — violating safety.**
