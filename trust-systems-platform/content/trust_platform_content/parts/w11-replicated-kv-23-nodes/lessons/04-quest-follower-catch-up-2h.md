---
id: w11-replicated-kv-23-nodes-d04-quest-follower-catch-up-2h
part: w11-replicated-kv-23-nodes
title: "Quest: Follower Catch-Up  2h"
order: 4
duration_minutes: 120
prereqs: ["w11-replicated-kv-23-nodes-d03-quest-quorum-commit-rules-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Follower Catch-Up  2h

## Goal

Design the **follower catch-up procedure** so when a follower falls behind — due to crash, network outage, or slow disk — the leader can efficiently bring it back up to date through log-based retry and, when necessary, fall back to snapshot installation.

By end of this session you will have:

- ✅ A **next_index backoff algorithm** that decrements the leader's next_index on rejection until a matching point is found
- ✅ A **conflict resolution rule** handling divergent log entries on the follower
- ✅ A **snapshot install RPC** for followers too far behind for log-based catch-up
- ✅ A **bounded retry policy** that switches to snapshot after N consecutive rejections
- ✅ A **catch-up progress tracker** showing how far behind each follower is

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | next_index decrements on each rejection until match found | Trace backoff loop |
| 2 | Conflicting entries on follower are truncated and overwritten | Verify truncation logic |
| 3 | Snapshot install sends full state when log-based catch-up fails | Check InstallSnapshot RPC |
| 4 | Bounded retry: switch to snapshot after N consecutive failures | Verify retry counter |
| 5 | Progress tracker shows entries_behind per follower | Check tracking output |

## What You're Building Today

The catch-up mechanism — the leader's procedure for handling followers that don't have all the log entries. This is critical for cluster availability after a node restarts or recovers from a network outage.

By end of this session, you will have:

- ✅ File: `week-11/day4-follower-catch-up.md`
- ✅ next_index backoff: decrement on rejection, send entries from new index
- ✅ Snapshot fallback: InstallSnapshot RPC for hopelessly behind followers
- ✅ Bounded retry: max 50 rejections before snapshot install

What "done" looks like:

```cpp
struct InstallSnapshotRequest {
    uint64_t term;
    uint32_t leader_id;
    uint64_t last_included_index;  // snapshot covers entries up to here
    uint64_t last_included_term;   // term of last included entry
    std::vector<uint8_t> data;     // serialized snapshot bytes
};

void Leader::handle_rejection(uint32_t follower_id,
                               const AppendEntriesResponse& resp);
void Leader::send_snapshot(uint32_t follower_id);
```

You **can**: Bring any lagging follower back to the current state, either via log or snapshot.
You **cannot yet**: Handle network partitions (Day 5) — today is follower state reconciliation.

## Why This Matters

🔴 **Without this, you will:**
- Leave restarted followers permanently behind — they can never participate in quorums again
- Try to send the entire log from the beginning every time, wasting bandwidth
- Keep truncated WAL entries that the leader no longer has — no way to catch up via log
- Have no fallback when the follower's divergence point is before the leader's oldest log entry

🟢 **With this, you will:**
- Bring a lagging follower up to date in O(divergence) steps, not O(total-log) steps
- Handle the common case (small lag) efficiently and the worst case (complete divergence) via snapshot
- Maintain cluster availability by quickly restoring quorum after a node returns
- Provide operational visibility into follower lag for monitoring and alerting

🔗 **How this connects:**
- **To Day 2:** Failed AppendEntries responses trigger the catch-up procedure
- **To Day 3:** Caught-up followers participate in quorum commit
- **To Week 10 Day 5:** Snapshot from checkpoint system is sent to followers
- **To Day 5:** Partition recovery uses the same catch-up mechanism
- **To Week 12 Day 1:** Newly elected leader catches up followers from its own log

🧠 **Mental model: "Book Club Catch-Up"**

Imagine a book club (cluster) reading chapters (log entries) together. If a member (follower) misses a few meetings, the organizer (leader) tells them "read chapters 47-52" (send log entries). If the member missed months and the organizer already recycled old chapters (WAL truncated), the organizer gives them the CliffsNotes (snapshot) to get to the current chapter, then continues chapter-by-chapter. The organizer never asks "have you read everything since chapter 1?" — they find the gap and fill it efficiently.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│              FOLLOWER CATCH-UP PROCEDURE                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Leader log: [1:T1][2:T1][3:T2][4:T2][5:T2][6:T3][7:T3]│
│  Follower:   [1:T1][2:T1][3:T2][4:T2]  ← behind by 3   │
│                                                          │
│  CASE 1: Small gap (log-based catch-up)                  │
│  ┌──────────────────────────────────────┐               │
│  │ Leader: next_index[F] = 5            │               │
│  │ Send: prev=4:T2, entries=[5,6,7]     │               │
│  │ Follower: prev match ✓ → append all  │               │
│  │ Follower now: [1][2][3][4][5][6][7]  │               │
│  └──────────────────────────────────────┘               │
│                                                          │
│  CASE 2: Divergent log (backoff + overwrite)             │
│  Leader:   [1:T1][2:T1][3:T2][4:T3]                    │
│  Follower: [1:T1][2:T1][3:T2][4:T2] ← term mismatch!  │
│  ┌──────────────────────────────────────┐               │
│  │ Send prev=3:T2 → match ✓             │               │
│  │ Send entry [4:T3]                     │               │
│  │ Follower truncates index 4, appends  │               │
│  └──────────────────────────────────────┘               │
│                                                          │
│  CASE 3: Too far behind (snapshot fallback)              │
│  Leader WAL starts at index 100 (earlier truncated)      │
│  Follower at index 50 — leader can't send 51-99         │
│  ┌──────────────────────────────────────┐               │
│  │ Leader sends InstallSnapshot         │               │
│  │ Follower replaces entire state       │               │
│  │ Follower log reset to snapshot point │               │
│  └──────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-11/day4-follower-catch-up.md`

## Do

1. **Implement the next_index backoff algorithm**
   > 💡 *WHY: When a follower rejects AppendEntries, the leader doesn't know exactly where the logs diverge. Decrementing next_index by 1 each time is simple and correct — it takes O(divergence) steps to find the match point. Optimizations exist but correctness first.*

   Write the backoff logic:

   ```cpp
   void Leader::handle_rejection(uint32_t follower_id,
                                  const AppendEntriesResponse& resp) {
       auto& fp = followers_[follower_id];
       fp.consecutive_rejections++;
       // Use follower's hint if available
       if (resp.match_index > 0 && resp.match_index < fp.next_index)
           fp.next_index = resp.match_index + 1;
       else
           fp.next_index = std::max(1UL, fp.next_index - 1);
       // Check if snapshot fallback is needed
       if (fp.consecutive_rejections >= MAX_RETRIES_BEFORE_SNAPSHOT) {
           send_snapshot(follower_id);
           return;
       }
       // Retry with lower next_index
       send_append_entries(follower_id);
   }

   void Leader::handle_success(uint32_t follower_id,
                                const AppendEntriesResponse& resp) {
       auto& fp = followers_[follower_id];
       fp.match_index = resp.match_index;
       fp.next_index = resp.match_index + 1;
       fp.consecutive_rejections = 0;  // reset on success
       maybe_advance_commit();
   }
   ```

2. **Define conflict resolution on the follower**
   > 💡 *WHY: When logs diverge, the follower might have entries from a different leader's term. The leader's log is authoritative — conflicting entries on the follower must be truncated and replaced. This is safe because conflicting entries were never committed.*

   The follower's handling (from Day 2, expanded):

   ```cpp
   // Inside handle_append_entries:
   for (size_t i = 0; i < req.entries.size(); i++) {
       uint64_t idx = req.entries[i].index;
       if (idx <= state.log.size()) {
           // Entry exists at this index
           if (state.log[idx - 1].term != req.entries[i].term) {
               // CONFLICT: truncate from here forward
               log_warn("Conflict at index {}: local term {} vs leader term {}",
                        idx, state.log[idx - 1].term, req.entries[i].term);
               state.log.resize(idx - 1);
           } else {
               continue;  // already have this entry, skip
           }
       }
       // Append new or replacement entry
       state.log.push_back(req.entries[i]);
   }
   ```

3. **Design the InstallSnapshot RPC**
   > 💡 *WHY: When the leader has already truncated log entries that the follower needs, log-based catch-up is impossible. The leader sends its latest snapshot — the follower replaces its entire state and log.*

   Define the RPC:

   ```cpp
   struct InstallSnapshotRequest {
       uint64_t term;
       uint32_t leader_id;
       uint64_t last_included_index;
       uint64_t last_included_term;
       uint64_t offset;              // byte offset for chunked transfer
       std::vector<uint8_t> data;    // snapshot chunk
       bool done;                    // true if this is the last chunk
   };

   struct InstallSnapshotResponse {
       uint64_t term;     // for leader to check if it's still current
   };

   void Follower::handle_install_snapshot(
       const InstallSnapshotRequest& req)
   {
       if (req.term < current_term_) return;  // reject stale
       // Write snapshot data to temp file
       write_snapshot_chunk(req.offset, req.data);
       if (req.done) {
           // Apply snapshot: replace state and trim log
           auto state = load_snapshot(temp_snapshot_path_);
           kv_store_.replace_state(*state);
           // Discard log entries covered by snapshot
           trim_log_before(req.last_included_index);
           log_info("Snapshot installed at index {}",
                    req.last_included_index);
       }
   }
   ```

4. **Define the bounded retry policy**
   > 💡 *WHY: A follower that's been down for days might need the leader to backoff 10,000 times at 1-per-RPC. That's impractical. After N consecutive rejections, switch to snapshot — it's a bulk transfer that's faster than thousands of individual RPCs.*

   Set the bounds:

   ```cpp
   constexpr uint32_t MAX_RETRIES_BEFORE_SNAPSHOT = 50;

   void Leader::send_snapshot(uint32_t follower_id) {
       log_info("Follower {} too far behind ({} rejections), sending snapshot",
                follower_id, followers_[follower_id].consecutive_rejections);
       // Load latest snapshot
       auto snap_data = read_snapshot_file(snapshot_path_);
       // Send in chunks (snapshots may be large)
       constexpr size_t CHUNK_SIZE = 1024 * 1024;  // 1MB chunks
       for (size_t offset = 0; offset < snap_data.size();
            offset += CHUNK_SIZE) {
           size_t len = std::min(CHUNK_SIZE, snap_data.size() - offset);
           InstallSnapshotRequest req;
           req.term = current_term_;
           req.leader_id = my_id_;
           req.last_included_index = snapshot_last_index_;
           req.last_included_term = snapshot_last_term_;
           req.offset = offset;
           req.data.assign(snap_data.begin() + offset,
                           snap_data.begin() + offset + len);
           req.done = (offset + len >= snap_data.size());
           send_rpc(follower_id, req);
       }
       // After snapshot, reset follower progress
       followers_[follower_id].next_index = snapshot_last_index_ + 1;
       followers_[follower_id].match_index = snapshot_last_index_;
       followers_[follower_id].consecutive_rejections = 0;
   }
   ```

5. **Build the catch-up progress tracker**
   > 💡 *WHY: Operations teams need to know which followers are behind and by how much. A follower 2 entries behind is normal. A follower 10,000 entries behind needs attention. The tracker provides this visibility.*

   Implement the tracker:

   ```cpp
   struct CatchUpStatus {
       uint32_t follower_id;
       uint64_t match_index;
       uint64_t leader_last_index;
       uint64_t entries_behind;
       uint32_t consecutive_rejections;
       std::string state;  // "in-sync", "catching-up", "snapshot-transfer"
   };

   std::vector<CatchUpStatus> Leader::get_replication_status() {
       std::vector<CatchUpStatus> status;
       for (const auto& [id, fp] : followers_) {
           uint64_t behind = log_.size() - fp.match_index;
           std::string state = (behind == 0) ? "in-sync" :
               (fp.consecutive_rejections >= MAX_RETRIES_BEFORE_SNAPSHOT) ?
                   "snapshot-transfer" : "catching-up";
           status.push_back({id, fp.match_index, (uint64_t)log_.size(),
                             behind, fp.consecutive_rejections, state});
       }
       return status;
   }
   ```

## Done when

- [ ] next_index decrements on rejection with optional follower hint — *O(divergence) steps to find match point*
- [ ] Conflicting entries truncated and overwritten by leader's entries — *leader's log is authoritative*
- [ ] InstallSnapshot RPC sends full state with chunked transfer — *handles hopelessly-behind followers*
- [ ] Bounded retry: snapshot fallback after 50 consecutive rejections — *prevents endless backoff*
- [ ] Progress tracker shows entries_behind and catch-up state per follower — *operational visibility*

## Proof

Paste your backoff algorithm, InstallSnapshot RPC, and progress tracker, or upload `week-11/day4-follower-catch-up.md`.

**Quick self-test** (answer without looking at your notes):

1. Why is it safe to truncate conflicting entries on the follower? → **Conflicting entries were never committed — they exist only because the follower received them from a leader that was subsequently replaced. Uncommitted entries can be safely overwritten by the current leader.**
2. When does log-based catch-up become impossible? → **When the leader has already truncated (via checkpoint compaction, Week 10 Day 5) the log entries that the follower needs. The leader can't send entries it no longer has.**
3. Why send snapshots in chunks instead of all at once? → **Snapshots can be gigabytes. A single message would block the network, time out, and fail. Chunked transfer allows progress tracking, resumption after failures, and doesn't block other RPCs.**
