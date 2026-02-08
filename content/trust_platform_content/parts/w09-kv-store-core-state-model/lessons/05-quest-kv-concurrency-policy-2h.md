---
id: w09-kv-store-core-state-model-d05-quest-kv-concurrency-policy-2h
part: w09-kv-store-core-state-model
title: "Quest: KV Concurrency Policy  2h"
order: 5
duration_minutes: 120
prereqs: ["w09-kv-store-core-state-model-d04-quest-snapshot-rules-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: KV Concurrency Policy  2h

## Goal

Define the **concurrency policy** for your KV store so writes are serialized through a single writer, reads have a consistent view, and lock granularity is chosen deliberately — preserving total ordering of mutations required for replication.

By end of this session you will have:

- ✅ A **single-writer discipline** ensuring all mutations flow through one serialization point
- ✅ A **read consistency model** defining what readers see during and after writes
- ✅ A **lock granularity decision** choosing between store-level, bucket-level, or lock-free approaches
- ✅ A **snapshot-under-concurrency rule** allowing snapshots without blocking all writes
- ✅ A **ordering proof** showing that single-writer preserves the total order required for WAL and replication

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Single-writer ensures no concurrent mutations | Verify mutex or channel serialization |
| 2 | Readers never see partial writes | Check read isolation mechanism |
| 3 | Lock granularity chosen with 3+ tradeoff reasons | Review decision document |
| 4 | Snapshot does not hold write lock for entire duration | Check snapshot concurrency strategy |
| 5 | Total ordering of writes is provably maintained | Verify global_sequence is monotonic under concurrency |

## What You're Building Today

A concurrency policy document that specifies how your KV store handles simultaneous reads and writes safely — the final piece of the core state model before WAL integration next week.

By end of this session, you will have:

- ✅ File: `week-9/day5-kv-concurrency-policy.md`
- ✅ Single-writer serialization: mutex-guarded apply function
- ✅ Read isolation: readers get a consistent snapshot view
- ✅ Lock strategy: coarse-grained now, documented upgrade path for later

What "done" looks like:

```cpp
class KVStore {
    std::mutex write_mutex_;     // single-writer serialization
    std::shared_mutex read_lock_; // readers can share, writer exclusive
    std::map<std::string, VersionedEntry> store_;
    uint64_t global_sequence_ = 0;

public:
    KVResponse apply(const KVRequest& req);   // acquires write_mutex_
    KVResponse read(const std::string& key);  // acquires shared read_lock_
    bool snapshot(const std::string& path);   // COW or lock-step
};
```

You **can**: Safely handle concurrent reads and writes with total ordering.
You **cannot yet**: Persist the ordered writes to WAL (Week 10) — today is the in-memory concurrency model.

## Why This Matters

🔴 **Without this, you will:**
- Allow two threads to increment global_sequence simultaneously, producing duplicate sequence numbers
- Let a reader see key A at version 3 and key B at version 1 from the same "snapshot" — an inconsistent view
- Block all reads during snapshot write — killing read availability for seconds
- Produce an unordered mutation stream that replication cannot replay deterministically

🟢 **With this, you will:**
- Guarantee every write gets a unique, monotonic global sequence — the total order
- Give readers a consistent point-in-time view even while writes continue
- Take snapshots concurrently with reads using copy-on-write or lock-step strategies
- Feed replication a totally ordered command log — the foundation of consensus

🔗 **How this connects:**
- **To Day 1:** Commands are serialized through this single-writer path
- **To Day 2:** Version increments happen inside the write lock — no double-increment possible
- **To Day 4:** Snapshot captures state at a consistent sequence point defined by this policy
- **To Week 10 Day 1:** WAL append happens inside the write lock, before state apply
- **To Week 11:** Replication log is the total-ordered sequence produced by single-writer discipline

🧠 **Mental model: "Turnstile"**

Your write path is a turnstile — only one person passes through at a time. Every person (write) gets a unique ticket number (global_sequence). The turnstile guarantees no one cuts in line, no one gets the same number, and everyone exits in order. Reads are observers standing outside the turnstile — they can watch the current state without blocking the line. Snapshots are a photographer who says "everyone freeze" for one click, then the line resumes. The turnstile is simple, maybe slow for high throughput, but it is **correct** — and correctness is the prerequisite for everything that follows.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│             SINGLE-WRITER CONCURRENCY MODEL               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Write Requests          Read Requests                   │
│  ┌─────┐ ┌─────┐        ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ W1  │ │ W2  │        │ R1  │ │ R2  │ │ R3  │       │
│  └──┬──┘ └──┬──┘        └──┬──┘ └──┬──┘ └──┬──┘       │
│     │       │              │       │       │            │
│     ▼       ▼              ▼       ▼       ▼            │
│  ┌──────────────┐     ┌────────────────────────┐        │
│  │ write_mutex_ │     │  shared read_lock_      │        │
│  │  (exclusive) │     │  (shared — concurrent)  │        │
│  │  W1 ▶ W2     │     │  R1 ∥ R2 ∥ R3          │        │
│  │  (serialized)│     │  (parallel reads OK)    │        │
│  └──────┬───────┘     └──────────┬─────────────┘        │
│         │                        │                       │
│         ▼                        ▼                       │
│  ┌─────────────────────────────────────────────┐        │
│  │             KV STATE MAP                     │        │
│  │  key="x" → {val="A", ver=3, seq=42}         │        │
│  │  key="y" → {val="B", ver=1, seq=40}         │        │
│  └─────────────────────────────────────────────┘        │
│         │                                                │
│         ▼                                                │
│  global_sequence: 42 ──▶ 43 ──▶ 44  (monotonic)        │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-9/day5-kv-concurrency-policy.md`

## Do

1. **Implement single-writer serialization**
   > 💡 *WHY: Two concurrent writes to the same key without serialization produce a data race — undefined behavior in C++. Even if the map itself is thread-safe, the global_sequence increment + state update must be atomic as a unit.*

   Write the serialized apply function:

   ```cpp
   KVResponse KVStore::apply(const KVRequest& req) {
       std::unique_lock<std::mutex> lock(write_mutex_);
       // Inside lock: sequence increment + state mutation are atomic
       if (!validate_request(req))
           return {KVResponse::ERROR, "", req.request_id, "invalid request"};
       uint64_t seq = ++global_sequence_;
       // Apply command to store...
       switch (req.type) {
           case CmdType::PUT: return apply_put(req, seq);
           case CmdType::DELETE: return apply_delete(req, seq);
           default: return {KVResponse::ERROR, "", req.request_id, "bad type"};
       }
   }
   ```

2. **Implement read isolation with shared lock**
   > 💡 *WHY: Readers must not see a half-applied write. std::shared_mutex allows multiple concurrent readers while excluding writers. This gives reads a consistent view without blocking each other.*

   Write the read function:

   ```cpp
   KVResponse KVStore::read(const std::string& key) {
       std::shared_lock<std::shared_mutex> lock(read_lock_);
       auto it = store_.find(key);
       if (it == store_.end())
           return {KVResponse::NOT_FOUND, "", "", ""};
       return {KVResponse::OK, it->second.value, "",
               "", it->second.meta.version};
   }
   ```

   **Rule:** The write path must hold BOTH write_mutex_ AND exclusive read_lock_ during state mutation.

3. **Choose lock granularity and document tradeoffs**
   > 💡 *WHY: Store-level locking is simple but limits throughput. Bucket-level or per-key locking adds complexity but allows concurrent writes to different keys. Choose deliberately and document why.*

   Compare approaches:

   | Strategy | Throughput | Complexity | Ordering guarantee |
   |----------|-----------|-----------|-------------------|
   | Store-level mutex | Low | Simple | Total order ✓ |
   | Bucket-level (hash sharding) | Medium | Moderate | Per-bucket order only |
   | Per-key locks | High | Complex | Per-key order only |
   | Lock-free (MVCC) | Highest | Very complex | Snapshot isolation |

   **Decision for now:** Store-level mutex. Single-writer discipline gives us total ordering, which replication (Week 11) requires. Optimize later if profiling shows lock contention.

4. **Design snapshot-under-concurrency strategy**
   > 💡 *WHY: Snapshot (Day 4) iterates the entire store. If it holds the write lock during iteration, no writes can proceed — potentially blocking for seconds on large stores. You need a strategy that captures consistent state without long locks.*

   Choose and document your approach:

   ```cpp
   bool KVStore::snapshot(const std::string& path) {
       std::map<std::string, VersionedEntry> copy;
       uint64_t snap_seq;
       {
           // Hold write lock only long enough to copy state
           std::unique_lock<std::mutex> lock(write_mutex_);
           copy = store_;          // O(n) copy but short lock hold
           snap_seq = global_sequence_;
       }
       // Write to disk WITHOUT holding any lock
       return write_snapshot(path, copy, snap_seq);
   }
   ```

5. **Prove total ordering is maintained**
   > 💡 *WHY: Replication requires that every node applies writes in the same order. If your concurrency policy allows out-of-order application, replicas diverge. The proof must show that global_sequence is strictly monotonic.*

   Write the ordering argument:

   | Step | Guarantee |
   |------|-----------|
   | write_mutex_ allows one writer | Only one write executes at a time |
   | ++global_sequence_ inside lock | Each write gets a unique, increasing number |
   | State mutation after sequence | State reflects the sequence order |
   | WAL append before unlock (W10) | WAL order matches memory order |
   | No reordering possible | Total order is preserved end-to-end |

## Done when

- [ ] Single-writer mutex serializes all mutations — *the total-order guarantee for replication*
- [ ] Shared read lock allows concurrent reads without seeing partial writes — *read availability preserved*
- [ ] Lock granularity decision documented with tradeoffs — *store-level now, upgrade path clear*
- [ ] Snapshot copies state under short lock, writes to disk outside lock — *no multi-second write stalls*
- [ ] Ordering proof shows global_sequence is strictly monotonic — *replication correctness depends on this*

## Proof

Paste your serialized apply function, read isolation logic, and ordering proof, or upload `week-9/day5-kv-concurrency-policy.md`.

**Quick self-test** (answer without looking at your notes):

1. Why can't you use per-key locks instead of a store-level mutex? → **Per-key locks give you per-key ordering, but not total ordering across all keys. Replication needs a single global order — write A to key X happened before write B to key Y. Only a single serialization point provides this.**
2. What happens if the snapshot copies state without holding the write lock? → **A write might execute mid-copy: key X is copied at version 3, then key Y is written (incrementing it to version 5), then key Y is copied at version 5. The snapshot now contains an inconsistent mix of states that never existed together.**
3. Why does the write path need both write_mutex_ and exclusive read_lock_? → **write_mutex_ serializes writes against each other. Exclusive read_lock_ blocks readers during the state mutation step. Without the read lock, a reader could observe the map mid-modification — seeing a half-updated entry.**
