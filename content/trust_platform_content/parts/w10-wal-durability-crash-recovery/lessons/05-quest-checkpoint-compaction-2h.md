---
id: w10-wal-durability-crash-recovery-d05-quest-checkpoint-compaction-2h
part: w10-wal-durability-crash-recovery
title: "Quest: Checkpoint & Compaction  2h"
order: 5
duration_minutes: 120
prereqs: ["w10-wal-durability-crash-recovery-d04-quest-recovery-algorithm-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Checkpoint & Compaction  2h

## Goal

Design the **checkpoint and compaction system** that periodically writes a snapshot, then safely truncates the WAL — reducing recovery replay time from minutes to seconds while guaranteeing that no committed data is lost during the truncation.

By end of this session you will have:

- ✅ A **checkpoint trigger policy** defining when to create a checkpoint (by record count, time, or WAL size)
- ✅ A **checkpoint procedure** that writes a snapshot and records the WAL cutoff point
- ✅ A **WAL truncation rule** that removes only records covered by the checkpoint
- ✅ A **truncation safety proof** showing data is never lost during compaction
- ✅ A **recovery-with-checkpoint path** combining snapshot load + WAL replay from checkpoint

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Checkpoint trigger has at least 2 conditions (count + time) | Review trigger policy |
| 2 | Snapshot is verified durable (fsync + file exists) before truncation | Check procedure order |
| 3 | WAL truncation removes only records with sequence ≤ snapshot sequence | Verify cutoff logic |
| 4 | Recovery loads snapshot first, then replays WAL from snapshot.sequence + 1 | Trace recovery path |
| 5 | Crash during checkpoint leaves system in a valid state | Analyze crash points |

## What You're Building Today

A checkpoint system that takes the snapshot mechanism from Week 9 Day 4 and integrates it with the WAL from this week — creating a coordinated system where periodic snapshots allow WAL truncation, keeping recovery time bounded.

By end of this session, you will have:

- ✅ File: `week-10/day5-checkpoint-compaction.md`
- ✅ Checkpoint trigger: every N records or T minutes, whichever comes first
- ✅ Procedure: snapshot → verify → record cutoff → truncate WAL
- ✅ Combined recovery: load snapshot → replay WAL from checkpoint

What "done" looks like:

```cpp
struct CheckpointState {
    uint64_t last_checkpoint_seq;    // sequence of last checkpoint
    uint64_t records_since_checkpoint;
    std::chrono::steady_clock::time_point last_checkpoint_time;
};

bool should_checkpoint(const CheckpointState& cs);
bool perform_checkpoint(KVStore& store, WALWriter& wal, const std::string& snap_path);
RecoveryReport recover_with_checkpoint(const std::string& snap_path,
                                        const std::string& wal_path,
                                        KVStore& store);
```

You **can**: Bound recovery time by checkpointing and truncating the WAL.
You **cannot yet**: Ship checkpoints to followers (Week 11 Day 4) — today is local checkpoint only.

## Why This Matters

🔴 **Without this, you will:**
- Have WAL files that grow unboundedly — eventually filling the disk
- Spend minutes replaying millions of WAL records on every restart
- Never reclaim disk space from old writes that the snapshot already captures
- Risk running out of disk space during a long-running workload

🟢 **With this, you will:**
- Keep recovery time bounded: load snapshot (fast) + replay recent WAL (small)
- Reclaim disk space by removing WAL records the snapshot already covers
- Set a clear SLA: "recovery takes at most 5 seconds" based on checkpoint frequency
- Provide Week 11 with a snapshot that followers can install for catch-up

🔗 **How this connects:**
- **To Week 9 Day 4:** Checkpoint uses the snapshot write function designed in Week 9
- **To Day 1:** WAL truncation removes records created by the WAL schema
- **To Day 4:** Recovery-with-checkpoint extends the replay algorithm from yesterday
- **To Week 11 Day 4:** Followers install the latest checkpoint snapshot for catch-up
- **To Week 12 Day 5:** Stale-leader fencing respects checkpoint sequence boundaries

🧠 **Mental model: "Tax Filing"**

Every year you file taxes (checkpoint) that summarize all transactions (WAL records) for the year. Once filed and accepted (snapshot verified durable), you can shred the receipts (truncate WAL) for that year — the tax filing is the authoritative record. You keep receipts for the current year (post-checkpoint WAL records) because you haven't filed yet. If audited (crash), you pull the last tax filing (snapshot) and add the current year's receipts (replay recent WAL). You never shred receipts before filing (never truncate before checkpoint is durable).

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│            CHECKPOINT + TRUNCATION FLOW                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  BEFORE CHECKPOINT:                                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │ WAL: [R1][R2][R3][R4][R5][R6][R7][R8][R9][R10] │    │
│  └─────────────────────────────────────────────────┘    │
│  Recovery replays ALL 10 records (slow)                  │
│                                                          │
│  CHECKPOINT at sequence 7:                               │
│  Step 1: Write snapshot (state at seq 7)                 │
│  Step 2: Verify snapshot (CRC + fsync + file check)      │
│  Step 3: Record cutoff (seq 7)                           │
│  Step 4: Truncate WAL up to seq 7                        │
│                                                          │
│  AFTER CHECKPOINT:                                       │
│  ┌──────────────┐  ┌──────────────────┐                 │
│  │ SNAPSHOT      │  │ WAL (trimmed)    │                 │
│  │ state@seq=7   │  │ [R8][R9][R10]    │                 │
│  │ verified ✓    │  │ starts at seq=8  │                 │
│  └──────────────┘  └──────────────────┘                 │
│                                                          │
│  RECOVERY: load snapshot → replay R8,R9,R10 (fast!)     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ SAFETY: Truncate ONLY after snapshot is durable   │   │
│  │ If crash during checkpoint → old snapshot + full   │   │
│  │ WAL still valid                                    │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-10/day5-checkpoint-compaction.md`

## Do

1. **Define the checkpoint trigger policy**
   > 💡 *WHY: Too frequent checkpoints waste I/O on snapshot writes. Too infrequent checkpoints leave massive WALs and long recovery times. The trigger must balance both — typically by record count AND time, whichever fires first.*

   Implement the trigger:

   ```cpp
   constexpr uint64_t CHECKPOINT_RECORD_LIMIT = 10000;
   constexpr auto CHECKPOINT_TIME_LIMIT = std::chrono::minutes(5);

   bool should_checkpoint(const CheckpointState& cs) {
       if (cs.records_since_checkpoint >= CHECKPOINT_RECORD_LIMIT)
           return true;
       auto elapsed = std::chrono::steady_clock::now() - cs.last_checkpoint_time;
       if (elapsed >= CHECKPOINT_TIME_LIMIT && cs.records_since_checkpoint > 0)
           return true;
       return false;
   }
   ```

2. **Implement the checkpoint procedure**
   > 💡 *WHY: The procedure order is critical. Snapshot MUST be verified durable BEFORE WAL truncation. If you truncate first and the snapshot write fails, you've lost data permanently — the WAL records are gone and the snapshot doesn't exist.*

   Write the procedure:

   ```cpp
   bool perform_checkpoint(KVStore& store, WALWriter& wal,
                           const std::string& snap_path) {
       // Step 1: Write snapshot (uses Week 9 Day 4 function)
       uint64_t snap_seq = store.current_sequence();
       if (!store.write_snapshot(snap_path, snap_seq)) {
           log_error("Checkpoint failed: snapshot write error");
           return false;  // DO NOT truncate — snapshot failed
       }
       // Step 2: Verify snapshot file exists and is readable
       auto loaded = load_snapshot(snap_path);
       if (!loaded.has_value()) {
           log_error("Checkpoint failed: snapshot verification error");
           return false;  // DO NOT truncate — snapshot corrupt
       }
       // Step 3: Truncate WAL — ONLY after verified snapshot
       wal.truncate_before(snap_seq);
       log_info("Checkpoint complete at seq {}", snap_seq);
       // Step 4: Update checkpoint state
       checkpoint_state_.last_checkpoint_seq = snap_seq;
       checkpoint_state_.records_since_checkpoint = 0;
       checkpoint_state_.last_checkpoint_time =
           std::chrono::steady_clock::now();
       return true;
   }
   ```

3. **Implement WAL truncation**
   > 💡 *WHY: Truncation removes records that the snapshot already covers. You must only remove records with sequence ≤ snapshot_sequence. Removing any record with sequence > snapshot_sequence loses data that's not in the snapshot.*

   Write the truncation function:

   ```cpp
   void WALWriter::truncate_before(uint64_t snapshot_seq) {
       // Create new WAL file with only records after snapshot_seq
       std::string new_path = wal_path_ + ".new";
       int new_fd = open(new_path.c_str(),
                         O_WRONLY | O_CREAT | O_TRUNC, 0644);
       write_wal_header(new_fd, snapshot_seq + 1);
       // Copy remaining records (seq > snapshot_seq)
       auto scan = scan_wal(fd_);
       for (const auto& rec : scan.valid_records) {
           if (rec.sequence > snapshot_seq)
               wal_append_raw(new_fd, rec);
       }
       fsync(new_fd);
       close(new_fd);
       // Atomic replace
       close(fd_);
       rename(new_path.c_str(), wal_path_.c_str());
       fd_ = open(wal_path_.c_str(), O_WRONLY | O_APPEND);
   }
   ```

4. **Implement combined recovery (snapshot + WAL)**
   > 💡 *WHY: On restart, the recovery path is: load latest snapshot → replay WAL records after snapshot sequence. This combines the best of both: fast snapshot load + minimal replay.*

   Write the combined recovery:

   ```cpp
   RecoveryReport recover_with_checkpoint(
       const std::string& snap_path,
       const std::string& wal_path,
       KVStore& store)
   {
       RecoveryReport report{};
       // Step 1: Try to load snapshot
       auto snap = load_snapshot(snap_path);
       uint64_t replay_from = 0;
       if (snap.has_value()) {
           store.load_state(snap->entries, snap->global_sequence);
           replay_from = snap->global_sequence;
           log_info("Loaded snapshot at seq {}", replay_from);
       } else {
           log_warn("No valid snapshot — replaying entire WAL");
       }
       // Step 2: Replay WAL from snapshot point
       int fd = open(wal_path.c_str(), O_RDONLY);
       auto scan = scan_wal(fd);
       std::unordered_set<std::string> seen_ids;
       for (const auto& rec : scan.valid_records) {
           if (rec.sequence <= replay_from) {
               report.records_skipped++;
               continue;  // already in snapshot
           }
           replay_record(store, seen_ids, rec, report);
       }
       close(fd);
       report.had_corruption = scan.corruption_found;
       report.last_valid_sequence = scan.last_valid_sequence;
       return report;
   }
   ```

5. **Prove truncation safety**
   > 💡 *WHY: The safety argument must show that no committed data is ever lost during compaction. If you can't prove this, you can't trust your checkpoint system.*

   Walk through the safety proof:

   | Step | Action | Invariant |
   |------|--------|-----------|
   | 1 | Write snapshot at seq N | Snapshot contains all state up to N |
   | 2 | Verify snapshot (load + CRC) | Snapshot is correct and readable |
   | 3 | Truncate WAL records ≤ N | Removed records are redundant with snapshot |
   | 4 | Crash after step 2, before 3 | Snapshot exists + full WAL → safe (replay skips) |
   | 5 | Crash after step 3 | Snapshot + trimmed WAL → safe (normal recovery) |
   | 6 | Crash during step 1 | Old snapshot + full WAL → safe (checkpoint not done) |

   **Theorem:** At no point during the checkpoint procedure can a crash cause data loss, because we never delete WAL records until their data is provably durable in the snapshot.

## Done when

- [ ] Checkpoint triggers on record count OR time elapsed — *bounds recovery time to a predictable window*
- [ ] Snapshot is written AND verified before any WAL truncation — *the inviolable safety rule*
- [ ] WAL truncation removes only records with sequence ≤ snapshot sequence — *no post-snapshot data lost*
- [ ] Combined recovery loads snapshot then replays remaining WAL — *seconds instead of minutes*
- [ ] Safety proof covers all crash points during checkpoint — *formal argument that data is never lost*

## Proof

Paste your checkpoint procedure, truncation function, and safety proof table, or upload `week-10/day5-checkpoint-compaction.md`.

**Quick self-test** (answer without looking at your notes):

1. What happens if you truncate the WAL before verifying the snapshot? → **If the snapshot write failed or produced a corrupt file, the truncated WAL records are gone forever. You've lost data. ALWAYS verify the snapshot is loadable before truncating.**
2. Why create a new WAL file instead of truncating the beginning of the existing one? → **POSIX doesn't support efficiently removing bytes from the beginning of a file (no "truncate-head"). Creating a new file with only the remaining records and atomically renaming it is the standard pattern.**
3. How does combined recovery handle records that are in both the snapshot and the WAL? → **Records with sequence ≤ snapshot_sequence are skipped — they're already in the loaded snapshot state. Only records after the snapshot point are replayed.**
