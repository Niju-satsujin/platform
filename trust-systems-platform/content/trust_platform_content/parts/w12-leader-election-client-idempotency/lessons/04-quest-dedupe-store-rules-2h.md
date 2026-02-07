---
id: w12-leader-election-client-idempotency-d04-quest-dedupe-store-rules-2h
part: w12-leader-election-client-idempotency
title: "Quest: Dedupe Store Rules  2h"
order: 4
duration_minutes: 120
prereqs: ["w12-leader-election-client-idempotency-d03-quest-client-retry-idempotency-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Dedupe Store Rules  2h

## Goal

Design the **deduplication store** for your KV server so duplicate requests are detected by request ID, the original response is replayed without re-execution, and expired entries are cleaned up to prevent unbounded memory growth.

By end of this session you will have:

- ✅ A **dedup store** mapping request IDs to cached responses
- ✅ A **check-before-apply rule** that consults the dedup store before executing any mutation
- ✅ A **response replay mechanism** returning the cached response for duplicate requests
- ✅ An **expiration policy** evicting stale dedup entries after a configurable TTL
- ✅ A **dedup-in-replication rule** ensuring the dedup store is consistent across replicas

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Dedup store maps request_id → cached KVResponse | Review data structure |
| 2 | Check happens BEFORE command application | Trace the write path |
| 3 | Duplicate returns cached response, NOT re-execution | Verify no state change on dedup |
| 4 | Expiration removes entries older than TTL | Check cleanup logic |
| 5 | Dedup entries replicated to followers via log | Verify replication path |

## What You're Building Today

The server-side deduplication store — the complement to yesterday's client retry protocol. Together, they guarantee exactly-once semantics: the client reuses request IDs, and the server detects duplicates before they touch state.

By end of this session, you will have:

- ✅ File: `week-12/day4-dedupe-store-rules.md`
- ✅ Dedup store: `std::unordered_map<string, DedupEntry>`
- ✅ Check-before-apply in the write path
- ✅ Expiration policy with configurable TTL

What "done" looks like:

```cpp
struct DedupEntry {
    KVResponse cached_response;
    std::chrono::steady_clock::time_point created_at;
};

class DedupStore {
    std::unordered_map<std::string, DedupEntry> entries_;
    std::chrono::seconds ttl_{300};  // 5 minutes default

public:
    std::optional<KVResponse> check(const std::string& request_id);
    void record(const std::string& request_id, const KVResponse& resp);
    void evict_expired();
};
```

You **can**: Detect and handle duplicate requests, returning cached responses without re-execution.
You **cannot yet**: Fence stale leaders (Day 5) — today is the dedup mechanism itself.

## Why This Matters

🔴 **Without this, you will:**
- Apply the same write twice when a client retries — version jumps by 2 instead of 1
- Return a fresh response on duplicate that might differ from the original — confusing clients
- Grow the dedup table forever — eventually consuming all memory
- Have inconsistent dedup state across replicas — one node deduplicates, another doesn't

🟢 **With this, you will:**
- Guarantee at-most-once application: same request_id → same result, never re-executed
- Return the exact original response on duplicate — byte-identical to the first
- Bound memory usage with TTL-based expiration — predictable resource consumption
- Replicate dedup state so all nodes agree on what's been seen

🔗 **How this connects:**
- **To Day 3:** Client sends same request_id on retry — dedup store catches it
- **To Week 9 Day 1:** Request IDs were designed into the command spec for this purpose
- **To Week 10 Day 4:** WAL recovery replay uses dedup to avoid double-application
- **To Week 11 Day 3:** Dedup must be consistent across quorum for committed entries
- **To Day 5:** Stale-leader fencing works alongside dedup to reject invalid requests

🧠 **Mental model: "Receipt Book"**

Your server keeps a receipt book. When a customer (client) requests a transaction (write), the clerk (server) first checks the receipt book: "Have I already processed this transaction number?" If yes, hand back the carbon copy (cached response) — don't redo the work. If no, process the transaction, write a receipt, and hand the original to the customer. Old receipts are discarded after 5 minutes (TTL) — the customer isn't going to retry a 10-minute-old request. The receipt book must be the same at every branch (replica) so any clerk gives the same answer.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│              DEDUP STORE FLOW                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Incoming request: PUT key="x" value="A" id="abc123"    │
│      │                                                   │
│      ▼                                                   │
│  ┌──────────────────────────────┐                       │
│  │ 1. Check dedup store         │                       │
│  │    dedup.check("abc123")     │                       │
│  └──────────┬───────────────────┘                       │
│             │                                            │
│    ┌────────┴────────┐                                  │
│    ▼                 ▼                                   │
│  FOUND             NOT FOUND                             │
│  ┌──────────┐      ┌─────────────────────────────────┐  │
│  │ Return   │      │ 2. Apply command                 │  │
│  │ cached   │      │    (WAL append + state update)   │  │
│  │ response │      │ 3. Cache response in dedup store │  │
│  │ (no      │      │    dedup.record("abc123", resp)  │  │
│  │ re-exec) │      │ 4. Return response to client     │  │
│  └──────────┘      └─────────────────────────────────┘  │
│                                                          │
│  DEDUP STORE CONTENTS:                                   │
│  ┌──────────────────────────────────────────────┐       │
│  │ request_id  │ response      │ created_at     │       │
│  ├─────────────┼───────────────┼────────────────┤       │
│  │ "abc123"    │ {OK, ver=5}   │ 10:00:01       │       │
│  │ "def456"    │ {OK, ver=3}   │ 10:00:02       │       │
│  │ "ghi789"    │ {NOT_FOUND}   │ 09:55:00 ←TTL │       │
│  └──────────────────────────────────────────────┘       │
│                           │                              │
│  EXPIRATION: evict entries older than TTL (5 min)        │
│  "ghi789" created 5+ min ago → evict                    │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-12/day4-dedupe-store-rules.md`

## Do

1. **Implement the dedup store data structure**
   > 💡 *WHY: The dedup store must be fast — it's consulted on every write. An unordered_map with string keys gives O(1) average lookup. The entry stores the complete response so duplicates get byte-identical replies.*

   Write the store:

   ```cpp
   struct DedupEntry {
       KVResponse cached_response;
       std::chrono::steady_clock::time_point created_at;
       uint64_t log_index;  // for replication awareness
   };

   class DedupStore {
       std::unordered_map<std::string, DedupEntry> entries_;
       std::chrono::seconds ttl_;

   public:
       explicit DedupStore(std::chrono::seconds ttl = std::chrono::seconds(300))
           : ttl_(ttl) {}

       std::optional<KVResponse> check(const std::string& request_id) {
           auto it = entries_.find(request_id);
           if (it == entries_.end()) return std::nullopt;
           return it->second.cached_response;
       }

       void record(const std::string& request_id,
                    const KVResponse& resp, uint64_t log_index) {
           entries_[request_id] = {resp,
               std::chrono::steady_clock::now(), log_index};
       }
   };
   ```

2. **Integrate check-before-apply in the write path**
   > 💡 *WHY: The dedup check MUST happen before WAL append and state mutation. If you check after apply, the duplicate has already been applied. If you check between WAL and apply, the WAL has a duplicate record. Check first, then WAL, then apply.*

   Update the write path:

   ```cpp
   KVResponse KVStore::apply(const KVRequest& req) {
       std::unique_lock<std::mutex> lock(write_mutex_);
       // STEP 0: Dedup check FIRST
       if (req.type == CmdType::PUT || req.type == CmdType::DELETE) {
           auto cached = dedup_.check(req.request_id);
           if (cached.has_value()) {
               // Duplicate detected — return cached response
               return *cached;  // NO re-execution, NO WAL append
           }
       }
       // STEP 1: Validate
       if (!validate_request(req))
           return {KVResponse::ERROR, "", req.request_id, "invalid"};
       // STEP 2: WAL append
       uint64_t seq = ++global_sequence_;
       WALRecord rec{seq, req.type, req.key, req.value, req.request_id, 0};
       if (!wal_append(wal_fd_, rec)) {
           --global_sequence_;
           return {KVResponse::ERROR, "", req.request_id, "WAL failed"};
       }
       // STEP 3: Apply to state
       auto resp = apply_to_state(req, seq);
       // STEP 4: Cache in dedup store
       dedup_.record(req.request_id, resp, seq);
       return resp;
   }
   ```

3. **Implement response replay for duplicates**
   > 💡 *WHY: The duplicate response must be identical to the original. Not "similar" — identical. If the first PUT returned {OK, version=5}, the duplicate must return exactly {OK, version=5}. The client uses this to confirm the operation succeeded.*

   The check function already returns the cached response. Verify identity:

   ```cpp
   // Test: prove duplicate response is identical
   void test_dedup_response_identity() {
       KVStore store;
       KVRequest req{CmdType::PUT, "key1", "val1", "req-001"};
       auto resp1 = store.apply(req);
       assert(resp1.status == KVResponse::OK);
       // Retry with same request_id
       auto resp2 = store.apply(req);  // should be dedup'd
       assert(resp2.status == KVResponse::OK);  // not DUPLICATE_REQ!
       // Response is identical to original
       assert(resp2.value == resp1.value);
       assert(resp2.request_id == resp1.request_id);
       // State was NOT modified (version didn't increment)
       auto get_resp = store.read("key1");
       assert(get_resp.version == 1);  // NOT 2
   }
   ```

   **Design choice:** Return status=OK (not DUPLICATE_REQ) on duplicate, so the client doesn't need to special-case it. The response looks exactly like a fresh success.

4. **Implement expiration and cleanup**
   > 💡 *WHY: Without expiration, the dedup store grows forever — one entry per unique request_id. A 5-minute TTL means clients must retry within 5 minutes (reasonable). After TTL, the request_id is forgotten and a retry would be treated as new.*

   Write the eviction function:

   ```cpp
   void DedupStore::evict_expired() {
       auto now = std::chrono::steady_clock::now();
       for (auto it = entries_.begin(); it != entries_.end(); ) {
           if (now - it->second.created_at > ttl_)
               it = entries_.erase(it);
           else
               ++it;
       }
   }

   // Alternative: lazy eviction on check
   std::optional<KVResponse> DedupStore::check(
       const std::string& request_id) {
       auto it = entries_.find(request_id);
       if (it == entries_.end()) return std::nullopt;
       auto now = std::chrono::steady_clock::now();
       if (now - it->second.created_at > ttl_) {
           entries_.erase(it);
           return std::nullopt;  // expired — treat as new
       }
       return it->second.cached_response;
   }

   // Periodic cleanup (e.g., every 60 seconds)
   // Called from a background timer
   ```

5. **Define dedup-in-replication rules**
   > 💡 *WHY: All replicas must agree on whether a request_id has been seen. The dedup state must be part of the replicated state machine — built from the log, not from timing. This ensures followers can also dedup on recovery replay.*

   Document the replication rules:

   ```
   DEDUP REPLICATION RULES:

   1. Dedup state is derived from the log:
      Every committed log entry's request_id is in the dedup store
      → Followers build dedup store during replay

   2. Dedup check happens at the state machine level:
      Leader checks before proposing to the log
      Followers check during replay (for safety)

   3. TTL is based on log_index, not wall clock:
      Entry expires when log advances by N entries past it
      → Avoids clock skew issues across replicas

   4. Expiration policy is deterministic:
      All replicas evict the same entries at the same log_index
      → No divergence due to timing differences

   5. Snapshot includes dedup store:
      Snapshot = KV state + dedup state + metadata
      → Follower catch-up via snapshot includes dedup
   ```

## Done when

- [ ] Dedup store maps request_id to cached KVResponse with O(1) lookup — *fast enough for every write path*
- [ ] Check-before-apply: dedup consulted before WAL append and state mutation — *no duplicate ever touches state*
- [ ] Duplicate returns identical original response — *client cannot distinguish from fresh success*
- [ ] Expiration evicts entries after TTL to bound memory — *predictable resource consumption*
- [ ] Dedup state replicated via log and included in snapshots — *all replicas agree on seen request_ids*

## Proof

Paste your dedup store, check-before-apply write path, and replication rules, or upload `week-12/day4-dedupe-store-rules.md`.

**Quick self-test** (answer without looking at your notes):

1. Should a duplicate request return status=DUPLICATE_REQ or status=OK with the cached response? → **Return the original status (usually OK) with the cached response. The client expects the same response as the original — it shouldn't need to handle a special "duplicate" code. The dedup is invisible to well-behaved clients.**
2. What happens if a request_id's dedup entry expires and the client retries with that ID? → **The server treats it as a new request and applies it again. This is why the TTL must be longer than any reasonable client retry window. A 5-minute TTL handles most cases.**
3. Why use log_index instead of wall clock for TTL in replication? → **Wall clocks differ across replicas. If one node's clock is 2 minutes ahead, it evicts dedup entries earlier — a retry might succeed on that node but be dedup'd on others. Log-index-based expiration is deterministic and identical on all replicas.**
