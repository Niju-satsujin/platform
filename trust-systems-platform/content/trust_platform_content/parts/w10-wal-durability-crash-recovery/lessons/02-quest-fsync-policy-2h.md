---
id: w10-wal-durability-crash-recovery-d02-quest-fsync-policy-2h
part: w10-wal-durability-crash-recovery
title: "Quest: Fsync Policy  2h"
order: 2
duration_minutes: 120
prereqs: ["w10-wal-durability-crash-recovery-d01-quest-wal-schema-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Fsync Policy  2h

## Goal

Design the **fsync policy** for your WAL so you make a deliberate, documented tradeoff between durability and performance — understanding exactly how many writes you could lose under each policy and when immediate sync is non-negotiable.

By end of this session you will have:

- ✅ A **sync-every-write implementation** for critical operations that cannot tolerate any data loss
- ✅ A **batch sync implementation** that amortizes fsync cost across multiple writes
- ✅ A **group commit strategy** that collects pending writes and syncs them together
- ✅ A **risk analysis** quantifying the data-loss window for each policy
- ✅ A **policy selector** that lets the caller choose sync mode per write

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Sync-every-write calls fsync after each WAL append | Verify syscall in write path |
| 2 | Batch sync accumulates N writes before fsync | Check batch counter logic |
| 3 | Group commit collects waiters and syncs once | Verify single fsync for N waiters |
| 4 | Risk analysis has data-loss window per policy | Check quantified risk table |
| 5 | Critical writes always use immediate sync | Verify policy selection |

## What You're Building Today

An fsync policy layer that sits between WAL append and client acknowledgment — controlling when bytes actually reach persistent storage and defining the durability-performance tradeoff.

By end of this session, you will have:

- ✅ File: `week-10/day2-fsync-policy.md`
- ✅ Three sync modes: immediate, batched, group commit
- ✅ Risk quantification: writes-at-risk per mode
- ✅ Per-write policy selector for mixed workloads

What "done" looks like:

```cpp
enum class SyncPolicy { IMMEDIATE, BATCHED, GROUP_COMMIT };

class WALWriter {
    int fd_;
    SyncPolicy default_policy_;
    uint32_t batch_count_ = 0;
    uint32_t batch_limit_ = 32;

public:
    bool append(const WALRecord& rec, SyncPolicy policy);
    void force_sync();  // explicit sync for critical operations
};
```

You **can**: Control exactly when WAL data is durable and measure the risk window.
You **cannot yet**: Test what happens on crash (Day 3) or replay after crash (Day 4).

## Why This Matters

🔴 **Without this, you will:**
- Call fsync on every write and wonder why throughput is 200 ops/sec instead of 50,000
- Skip fsync entirely and lose minutes of data on power failure
- Have no way to distinguish "critical must-sync writes" from "best-effort batch writes"
- Build replication (Week 11) without understanding the durability guarantee at each node

🟢 **With this, you will:**
- Choose the right durability level per operation — critical config changes sync immediately, bulk imports batch
- Quantify exactly how much data is at risk: "at most 32 writes or 10ms, whichever comes first"
- Implement group commit — the technique that makes databases fast without sacrificing durability
- Provide replication with a clear durability contract: "follower acknowledged = durable on follower's disk"

🔗 **How this connects:**
- **To Day 1:** WAL append calls this fsync layer before acknowledging writes
- **To Day 3:** Crash drill tests each sync mode — immediate survives, no-sync loses data
- **To Day 4:** Recovery replays everything up to the last fsync point
- **To Week 11 Day 2:** Followers fsync received entries before acking the leader
- **To Week 12 Day 3:** Client retry semantics depend on whether the original write was fsync'd

🧠 **Mental model: "Conveyor Belt vs Express Lane"**

Think of the kernel's write buffer as a conveyor belt between your process and the disk. You place packages (writes) on the belt, and they eventually reach the disk — when the OS feels like it. `fsync()` is the "express lane" button: it forces everything on the belt to be delivered NOW, and you wait until delivery is confirmed. Sync-every-write pushes the express button after every package (slow but safe). Batch sync waits until 32 packages are on the belt, then pushes express once (faster). Group commit collects packages from multiple senders, pushes express once for everyone (fastest per package). The trade-off is always: how many packages are on the belt when the power goes out?

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│                FSYNC POLICY COMPARISON                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  IMMEDIATE SYNC         BATCH SYNC          GROUP COMMIT │
│  ─────────────          ──────────          ──────────── │
│                                                          │
│  W1 ──▶ fsync           W1 ──┐              W1 ──┐      │
│  W2 ──▶ fsync           W2 ──┤              W2 ──┤wait  │
│  W3 ──▶ fsync           W3 ──┤              W3 ──┤      │
│  W4 ──▶ fsync           W4 ──┤ batch=4      T ───┤timer │
│                         ──────┴──▶ fsync    ──────┴──▶   │
│                         W5 ──┐               fsync once  │
│                         W6 ──┤              wake all     │
│                         ...                              │
│                                                          │
│  Throughput: LOW        Throughput: MED      Throughput:  │
│  Latency: ~1ms/op      Latency: amortized   HIGH        │
│  Risk: ZERO             Risk: ≤batch_limit   Latency:    │
│                          writes              amortized   │
│                                              Risk: ≤     │
│                                              batch window│
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Power fail hits HERE                               │  │
│  │  Immediate: 0 lost  Batch: ≤N lost  Group: ≤N lost│  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-10/day2-fsync-policy.md`

## Do

1. **Implement sync-every-write mode**
   > 💡 *WHY: This is the baseline — maximum durability, minimum risk. Every acknowledged write survives any crash. This mode is required for critical operations like configuration changes or term updates in consensus.*

   Write the immediate sync path:

   ```cpp
   bool WALWriter::append_sync(const WALRecord& rec) {
       auto bytes = serialize_wal_record(rec);
       uint32_t len = bytes.size();
       struct iovec iov[2] = {
           {&len, sizeof(len)},
           {bytes.data(), bytes.size()}
       };
       if (writev(fd_, iov, 2) < 0) return false;
       // IMMEDIATE: force to disk before returning
       if (fsync(fd_) != 0) {
           perror("fsync");
           return false;
       }
       return true;  // data is on disk — crash-safe
   }
   ```

   **Benchmark expectation:** ~1000-5000 ops/sec on SSD, ~100-200 ops/sec on HDD.

2. **Implement batch sync mode**
   > 💡 *WHY: Amortizing one fsync over N writes reduces the per-write cost dramatically. The trade-off: up to N writes could be lost on crash. For many workloads, losing the last 32 writes is acceptable.*

   Write the batch sync path:

   ```cpp
   bool WALWriter::append_batched(const WALRecord& rec) {
       auto bytes = serialize_wal_record(rec);
       uint32_t len = bytes.size();
       struct iovec iov[2] = {
           {&len, sizeof(len)},
           {bytes.data(), bytes.size()}
       };
       if (writev(fd_, iov, 2) < 0) return false;
       batch_count_++;
       if (batch_count_ >= batch_limit_) {
           fsync(fd_);
           batch_count_ = 0;
       }
       return true;
   }

   // Also trigger sync on timer (every 10ms) for low-traffic periods
   void WALWriter::timer_sync() {
       if (batch_count_ > 0) {
           fsync(fd_);
           batch_count_ = 0;
       }
   }
   ```

3. **Design group commit strategy**
   > 💡 *WHY: Group commit is how production databases achieve high throughput. Multiple concurrent writers queue their WAL records, one thread calls fsync once, and all waiters are unblocked. N writers, 1 fsync — the best amortization.*

   Design the group commit flow:

   ```cpp
   class GroupCommitter {
       std::mutex mu_;
       std::condition_variable cv_;
       bool sync_in_progress_ = false;
       uint64_t synced_up_to_ = 0;

   public:
       void wait_for_sync(uint64_t my_sequence) {
           std::unique_lock<std::mutex> lock(mu_);
           if (synced_up_to_ >= my_sequence) return;  // already synced
           if (!sync_in_progress_) {
               sync_in_progress_ = true;
               lock.unlock();
               fsync(wal_fd_);  // I'm the syncer
               lock.lock();
               synced_up_to_ = my_sequence;
               sync_in_progress_ = false;
               cv_.notify_all();
           } else {
               // Another thread is syncing — wait for it
               cv_.wait(lock, [&]{ return synced_up_to_ >= my_sequence; });
           }
       }
   };
   ```

4. **Quantify the risk for each policy**
   > 💡 *WHY: You must be able to answer "how much data can we lose?" for your chosen policy. This is not a vague question — it has a precise answer measured in records, bytes, or milliseconds.*

   Complete the risk analysis:

   | Policy | Max data loss (crash) | Max data loss (power fail) | Throughput |
   |--------|----------------------|---------------------------|-----------|
   | Immediate | 0 records | 0 records | ~1K-5K ops/s |
   | Batch (N=32) | 31 records | 31 records | ~20K-50K ops/s |
   | Batch (T=10ms) | ~10ms of writes | ~10ms of writes | ~20K-50K ops/s |
   | Group commit | Last batch only | Last batch only | ~30K-80K ops/s |
   | No fsync | All since last OS flush | All since last OS flush | ~100K+ ops/s |

5. **Implement the policy selector**
   > 💡 *WHY: Different operations need different durability. A user's PUT can batch-sync. A leader election vote (Week 12) MUST immediate-sync. The selector lets callers declare their requirement.*

   Write the unified append function:

   ```cpp
   bool WALWriter::append(const WALRecord& rec, SyncPolicy policy) {
       // Write record (common to all policies)
       auto bytes = serialize_wal_record(rec);
       uint32_t len = bytes.size();
       struct iovec iov[2] = {
           {&len, sizeof(len)},
           {bytes.data(), bytes.size()}
       };
       if (writev(fd_, iov, 2) < 0) return false;

       // Sync based on policy
       switch (policy) {
           case SyncPolicy::IMMEDIATE:
               return fsync(fd_) == 0;
           case SyncPolicy::BATCHED:
               if (++batch_count_ >= batch_limit_) {
                   fsync(fd_);
                   batch_count_ = 0;
               }
               return true;
           case SyncPolicy::GROUP_COMMIT:
               group_committer_.wait_for_sync(rec.sequence);
               return true;
       }
       return true;
   }
   ```

## Done when

- [ ] Sync-every-write calls fsync after each append — *the safety baseline for critical writes*
- [ ] Batch sync accumulates N writes before syncing with timer fallback — *practical throughput optimization*
- [ ] Group commit design collects waiters and syncs once — *production-grade durability amortization*
- [ ] Risk table quantifies data-loss window per policy in records and milliseconds — *informed decision-making*
- [ ] Policy selector lets callers choose sync mode per write — *critical writes use immediate, bulk uses batched*

## Proof

Paste your three sync mode implementations and risk analysis table, or upload `week-10/day2-fsync-policy.md`.

**Quick self-test** (answer without looking at your notes):

1. What is the maximum number of writes you can lose with batch sync (N=32) on power failure? → **31 writes — the 32nd triggers the fsync, so up to 31 can be in the kernel buffer when power fails.**
2. Why does group commit outperform batch sync? → **Group commit lets multiple concurrent writers share a single fsync. Batch sync is per-thread. With 8 threads, group commit does 1 fsync where batch sync might do 8.**
3. When must you use IMMEDIATE sync regardless of performance? → **Leader election votes (Week 12), term changes, and any operation where a false "not durable" answer causes a correctness violation — not just a data loss issue.**
