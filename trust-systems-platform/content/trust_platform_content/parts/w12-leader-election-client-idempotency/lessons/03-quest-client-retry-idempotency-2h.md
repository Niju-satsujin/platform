---
id: w12-leader-election-client-idempotency-d03-quest-client-retry-idempotency-2h
part: w12-leader-election-client-idempotency
title: "Quest: Client Retry + Idempotency  2h"
order: 3
duration_minutes: 120
prereqs: ["w12-leader-election-client-idempotency-d02-quest-vote-rules-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Client Retry + Idempotency  2h

## Goal

Design the **client retry and idempotency protocol** so clients can safely retry any failed write — across leader changes, network timeouts, and connection resets — using the same request ID, with the guarantee that no write is applied more than once.

By end of this session you will have:

- ✅ A **client retry policy** defining when and how to retry with the original request ID
- ✅ A **request ID contract** requiring all mutating requests to carry a unique, client-generated ID
- ✅ A **leader redirect protocol** handling "not the leader" responses during transitions
- ✅ A **timeout and retry backoff** strategy for network failures
- ✅ A **idempotency guarantee** proving that retries with the same request ID produce exactly-once semantics

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | All retries reuse the original request_id | Verify client code |
| 2 | Client redirects to the correct leader on REDIRECT response | Check redirect handling |
| 3 | Exponential backoff with jitter on network timeout | Verify backoff formula |
| 4 | Retry limit prevents infinite retry loops | Check max_retries |
| 5 | Server-side dedup ensures at-most-once application | Trace dedup path |

## What You're Building Today

The client-side retry protocol and the idempotency contract between client and server — ensuring that every write is applied exactly once, even when the client must retry due to leader changes, timeouts, or crashes.

By end of this session, you will have:

- ✅ File: `week-12/day3-client-retry-idempotency.md`
- ✅ Client retry logic with request_id preservation
- ✅ Leader redirect handling
- ✅ Idempotency proof: same request_id → same result, no double-apply

What "done" looks like:

```cpp
class KVClient {
    std::string current_leader_;
    uint32_t max_retries_ = 5;

public:
    KVResponse put(const std::string& key, const std::string& value) {
        std::string request_id = generate_unique_id();
        return send_with_retry(CmdType::PUT, key, value, request_id);
    }

private:
    KVResponse send_with_retry(CmdType type, const std::string& key,
                                const std::string& value,
                                const std::string& request_id);
    std::string generate_unique_id();
};
```

You **can**: Build a client that safely retries any operation across leader changes.
You **cannot yet**: Implement server-side dedup storage (Day 4) — today is the client protocol and contract.

## Why This Matters

🔴 **Without this, you will:**
- Generate a new request_id on every retry, causing the server to apply the same write twice
- Get stuck in an infinite retry loop during extended leadership transitions
- Time out silently when the leader changes, with no mechanism to find the new leader
- Tell users "write succeeded" when it actually failed, or "write failed" when it actually succeeded

🟢 **With this, you will:**
- Guarantee exactly-once semantics: every write is applied once, even with 5 retries
- Find the new leader within 1-2 retries via redirect responses
- Bound retry time with exponential backoff — no infinite loops
- Give clients a deterministic outcome: the write either succeeds or fails after max_retries

🔗 **How this connects:**
- **To Week 9 Day 1:** Request IDs were required in the command spec — this is why
- **To Day 1-2:** Leader changes during elections are the primary retry trigger
- **To Day 4:** Server-side dedup store handles the duplicate detection
- **To Week 11 Day 5:** Clients on minority partition side need redirect to majority
- **To Week 10 Day 4:** Recovery replay uses request_id for WAL dedup

🧠 **Mental model: "Package Tracking Number"**

The request_id is like a tracking number on a package. You give the number when you ship (first write). If the package seems lost (timeout), you call the carrier with the SAME tracking number (retry). The carrier checks: "We delivered that already" (dedup) → "Here's the confirmation" (cached response). You never ask for a new tracking number on a retry — that would create a duplicate shipment. The tracking number is assigned once at the start and follows the request through every retry until it's confirmed.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│             CLIENT RETRY FLOW                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Client: PUT key="x" value="A" request_id="abc123"      │
│      │                                                   │
│      ├──▶ Node B (believed leader)                       │
│      │    Response: REDIRECT → "leader is Node A"        │
│      │                                                   │
│      ├──▶ Node A (actual leader)  [same request_id!]     │
│      │    Response: timeout (leader crashed mid-write)   │
│      │                                                   │
│      │    [backoff: 100ms + jitter]                      │
│      │                                                   │
│      ├──▶ Node A (no response, try Node C)               │
│      │    Response: REDIRECT → "leader is Node C"        │
│      │                                                   │
│      ├──▶ Node C (new leader)  [same request_id!]        │
│      │    Response: OK (applied)                         │
│      │    OR                                             │
│      │    Response: DUPLICATE_REQ (already applied by A   │
│      │    before crash — still returns original result)   │
│      │                                                   │
│      └── Client gets final answer: OK                    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ INVARIANT: request_id="abc123" is used for EVERY   │  │
│  │ retry attempt. Never generate a new ID on retry.   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-12/day3-client-retry-idempotency.md`

## Do

1. **Implement request ID generation**
   > 💡 *WHY: The request ID must be globally unique — no two clients, ever, should generate the same ID. UUID v4 provides 122 bits of randomness. The ID is generated ONCE per operation and reused on every retry of that operation.*

   Write the ID generator:

   ```cpp
   #include <random>
   #include <sstream>
   #include <iomanip>

   std::string generate_unique_id() {
       static thread_local std::mt19937_64 rng(std::random_device{}());
       std::uniform_int_distribution<uint64_t> dist;
       uint64_t hi = dist(rng);
       uint64_t lo = dist(rng);
       std::ostringstream oss;
       oss << std::hex << std::setfill('0')
           << std::setw(16) << hi << std::setw(16) << lo;
       return oss.str();
   }

   // CRITICAL: Generate once, reuse on every retry
   // ✓ std::string id = generate_unique_id();
   //   retry1: send(key, value, id);
   //   retry2: send(key, value, id);
   // ✗ retry1: send(key, value, generate_unique_id());  // WRONG
   //   retry2: send(key, value, generate_unique_id());  // WRONG
   ```

2. **Implement the retry loop with leader redirect**
   > 💡 *WHY: During leader elections, nodes return REDIRECT pointing to the leader they last heard from. The client follows these redirects, always sending the same request_id. After max_retries, the client gives up with a clear error.*

   Write the retry loop:

   ```cpp
   KVResponse KVClient::send_with_retry(
       CmdType type, const std::string& key,
       const std::string& value, const std::string& request_id)
   {
       int retries = 0;
       int backoff_ms = 100;
       while (retries < max_retries_) {
           auto resp = send_to(current_leader_, type, key,
                               value, request_id);
           switch (resp.status) {
               case KVResponse::OK:
               case KVResponse::NOT_FOUND:
               case KVResponse::DUPLICATE_REQ:
                   return resp;  // terminal responses
               case KVResponse::REDIRECT:
                   current_leader_ = resp.redirect_target;
                   continue;  // retry immediately, no backoff
               case KVResponse::ERROR:
                   if (resp.error_msg == "NO_LEADER") {
                       // Election in progress — backoff and retry
                       backoff_sleep(backoff_ms);
                       backoff_ms = std::min(backoff_ms * 2, 5000);
                       retries++;
                       continue;
                   }
                   return resp;  // non-retryable error
               case KVResponse::TIMEOUT:
                   // Network issue — try another node
                   try_next_node();
                   backoff_sleep(backoff_ms);
                   backoff_ms = std::min(backoff_ms * 2, 5000);
                   retries++;
                   continue;
           }
       }
       return {KVResponse::ERROR, "", request_id,
               "max retries exceeded"};
   }
   ```

3. **Implement exponential backoff with jitter**
   > 💡 *WHY: If 100 clients all retry at the same time (thundering herd), they overwhelm the new leader immediately. Exponential backoff spreads retries over time. Jitter prevents synchronized retries even with the same backoff schedule.*

   Write the backoff function:

   ```cpp
   void backoff_sleep(int base_ms) {
       static thread_local std::mt19937 rng(std::random_device{}());
       // Add ±25% jitter
       int jitter = std::uniform_int_distribution<int>(
           -base_ms / 4, base_ms / 4)(rng);
       int sleep_ms = std::max(10, base_ms + jitter);
       std::this_thread::sleep_for(std::chrono::milliseconds(sleep_ms));
   }

   // Backoff schedule: 100ms → 200ms → 400ms → 800ms → 1600ms
   // With jitter: 75-125ms → 150-250ms → 300-500ms → ...
   ```

4. **Define the retry classification (retryable vs terminal)**
   > 💡 *WHY: Not every error should be retried. A "key too long" error will fail on every retry — retrying wastes time. A "no leader" error is transient — retrying after backoff will likely succeed. Classifying responses prevents useless retries.*

   Build the classification:

   | Response | Retryable? | Action |
   |----------|:---:|--------|
   | OK | No | Return success to caller |
   | NOT_FOUND | No | Return to caller |
   | DUPLICATE_REQ | No | Return original response (already applied) |
   | REDIRECT | Yes (immediate) | Follow redirect, no backoff |
   | NO_LEADER | Yes (with backoff) | Wait, retry — election in progress |
   | TIMEOUT | Yes (with backoff) | Try different node |
   | ERROR (validation) | No | Return to caller — request is invalid |
   | ERROR (server internal) | Yes (with backoff) | Transient server issue |

5. **Document the exactly-once guarantee**
   > 💡 *WHY: The combination of client-side "reuse request_id" + server-side "dedup on request_id" achieves exactly-once semantics. Each piece alone is insufficient. The client must cooperate with the server for the guarantee to hold.*

   Write the guarantee:

   ```
   EXACTLY-ONCE GUARANTEE:
   
   Client contract:
   ├── Generate request_id ONCE per operation
   ├── Reuse the SAME request_id on every retry
   └── Never generate a new ID for a retry

   Server contract (detailed in Day 4):
   ├── Check request_id before applying
   ├── If seen: return cached response (no re-execution)
   └── If new: apply, cache response, return result

   Combined guarantee:
   ├── First attempt: server applies and caches
   ├── Retry (same ID): server returns cached result
   ├── Different operation (new ID): server applies fresh
   └── Result: every operation applied EXACTLY ONCE

   Failure modes that DON'T break the guarantee:
   ├── Client crashes after send, before response
   │   → Client restarts, generates new ID → new operation
   ├── Leader crashes after apply, before response
   │   → Client retries, new leader checks dedup → returns cached
   └── Network drops response
       → Client retries with same ID → server returns cached
   ```

## Done when

- [ ] Request ID generated once per operation, reused on all retries — *the client-side idempotency contract*
- [ ] Retry loop follows REDIRECT, backs off on NO_LEADER/TIMEOUT — *finds new leader efficiently*
- [ ] Exponential backoff with jitter prevents thundering herd — *spreads retry load over time*
- [ ] Retry classification: terminal vs retryable responses — *no useless retries on permanent errors*
- [ ] Exactly-once guarantee documented with client + server contracts — *the complete idempotency story*

## Proof

Paste your retry loop, backoff function, and exactly-once guarantee document, or upload `week-12/day3-client-retry-idempotency.md`.

**Quick self-test** (answer without looking at your notes):

1. A client sends PUT with request_id="abc", times out, and retries with request_id="def". What happens? → **The server treats "def" as a new operation and applies the PUT again. The key is now written twice — version incremented twice. This is a client bug: retries MUST reuse the original ID.**
2. Why doesn't the REDIRECT response need a backoff? → **REDIRECT means "I know who the leader is, try them." The target node is available — no need to wait. Backoff is for situations where no leader exists or the network is failing.**
3. What happens if the client crashes after sending a PUT but before receiving the response? → **The write may or may not have been applied. When the client restarts, it has no record of the pending operation. It generates a new request_id for its next operation. The original write is either committed (and stays) or lost (and the client doesn't know about it).**
