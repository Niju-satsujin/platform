---
id: w08-signatures-replay-protection-d03-quest-replay-defense-2h
part: w08-signatures-replay-protection
title: "Quest: Replay Defense  2h"
order: 3
duration_minutes: 120
prereqs: ["w08-signatures-replay-protection-d02-quest-signverify-spec-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Replay Defense  2h

## Goal

Yesterday you verified that a message is authentic and untampered. But an attacker can record a valid signed message and re-send it later — a **replay attack**. The signature still verifies because the message is unchanged. Today you add replay defense: every message carries a unique nonce and a timestamp. The receiver maintains a seen-nonce set and rejects any message with a duplicate `(key_id, nonce)` pair or a timestamp outside the acceptable window.

By end of this session you will have:

- ✅ Added a nonce field (128-bit random) and timestamp to every signed message
- ✅ Built a seen-nonce store with bounded memory using a time-based eviction window
- ✅ Implemented the rule: duplicate `(key_id, nonce)` is ALWAYS rejected
- ✅ Implemented a timestamp window check (e.g. ±60 seconds)
- ✅ Tested with deliberately replayed messages to prove detection

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Each message has a 128-bit nonce from `/dev/urandom` or `getrandom()` | Inspect message struct |
| 2 | Seen-nonce store rejects duplicate (key_id, nonce) pair | Replay test |
| 3 | Timestamp outside ±60s window rejected | Send message with stale timestamp |
| 4 | Nonce store evicts entries older than window to bound memory | Check store size after 1000 msgs |
| 5 | Valid non-duplicate messages still accepted after replay rejection | Interleaved test |

## What You're Building Today

You are building a **replay defense layer** that sits between signature verification and message processing. It checks nonce uniqueness and timestamp freshness. The nonce store uses a time-windowed hash set to bound memory.

- ✅ A `NonceStore` class with `check_and_insert(key_id, nonce, timestamp) -> bool`
- ✅ Nonce generation using `getrandom()` for 128-bit random values
- ✅ Timestamp validation against `CLOCK_REALTIME` with configurable window
- ✅ Periodic eviction of expired entries from the nonce store

```cpp
struct Nonce {
    std::array<uint8_t, 16> bytes;  // 128-bit random

    static Nonce generate() {
        Nonce n;
        getrandom(n.bytes.data(), 16, 0);
        return n;
    }
};

class NonceStore {
public:
    explicit NonceStore(int64_t window_sec = 120) : window_sec_(window_sec) {}

    bool check_and_insert(const std::string& key_id,
                          const Nonce& nonce, int64_t timestamp_sec) {
        evict_expired();
        int64_t now = time(nullptr);
        if (std::abs(now - timestamp_sec) > window_sec_) return false;  // stale

        auto key = make_key(key_id, nonce);
        if (seen_.count(key)) return false;  // replay!

        seen_[key] = timestamp_sec;
        return true;
    }

private:
    int64_t window_sec_;
    std::unordered_map<std::string, int64_t> seen_;
    // ...
};
```

You **can**: use a Bloom filter for probabilistic dedup, store nonces on disk for crash recovery.

You **cannot yet**: package nonce and signature into a versioned envelope — that is Day 4 (Signed Envelope v1).

## Why This Matters

🔴 **Without this, you will:**
- Accept replayed "transfer $1000" messages, executing them multiple times
- Have no way to distinguish a legitimate retransmission from a malicious replay
- Be vulnerable to an attacker who records traffic and replays it at an advantageous time
- Accumulate unbounded nonce storage if you never evict old entries

🟢 **With this, you will:**
- Guarantee that every message is processed at most once within the time window
- Detect replay attacks immediately and log the attempt for forensic analysis
- Bound nonce store memory to `window × message_rate × entry_size`
- Enforce a freshness window that limits the useful lifetime of recorded messages

🔗 **How this connects:**
- **Week 8 Day 2** (sign/verify) — signature proves authenticity; nonce proves freshness
- **Week 8 Day 1** (key policy) — key_id is part of the dedup key (different signers may reuse nonces)
- **Week 8 Day 4** (signed envelope v1) — nonce and timestamp become mandatory header fields
- **Week 10 Day 5** (idempotency) — replay defense is the crypto layer; idempotency is the application layer
- **Week 12 Day 4** (exactly-once delivery) — builds on nonce-based dedup for cross-service messaging

🧠 **Mental model: "Concert Ticket Stub"** — your signed message is a concert ticket. The signature proves it's a real ticket (not counterfeit). But the nonce is the ticket stub — torn off at the gate on first entry. If someone tries to enter with the same ticket again, the stub is already in the "used" box, and they are denied.

## Visual Model

```
  Sender                                  Receiver
  ┌──────────────────┐                    ┌──────────────────────────────┐
  │ Generate nonce    │                    │ Receive SignedMessage         │
  │ (128-bit random)  │                    │        │                     │
  │        │          │                    │        ▼                     │
  │ Set timestamp =   │                    │ verify_signature(msg)        │
  │   time(nullptr)   │                    │   FAIL ──▶ REJECT            │
  │        │          │                    │   OK ──▼                     │
  │        ▼          │     network        │ nonce_store.check_and_insert │
  │ Sign(payload +    │ ────────────────▶  │ (key_id, nonce, timestamp)   │
  │   nonce + ts)     │                    │        │                     │
  │        │          │    replay!         │   ┌────┴─────┐               │
  │        ▼          │ ────────────────▶  │   ▼          ▼               │
  │ Send message      │                    │ false      true              │
  └──────────────────┘                    │ (dup/stale) (fresh)          │
                                          │   │          │               │
                                          │   ▼          ▼               │
                                          │ REJECT    PROCESS ✅         │
                                          │ + log     (at-most-once)     │
                                          └──────────────────────────────┘
```

## Build

File: `week-8/day3-replay-defense.cpp`

## Do

### 1. **Add nonce and timestamp fields to the message**

> 💡 *WHY: The nonce ensures uniqueness; the timestamp enables bounded storage. Together they make replay detection tractable.*

Extend your `SignedMessage` (or the payload) with:

```cpp
struct ProtectedPayload {
    Nonce    nonce;           // 16 bytes, random per message
    int64_t  timestamp_sec;  // sender's wall clock at send time
    // ... application fields
};
```

The nonce MUST be generated fresh for every message using `getrandom()`. The timestamp MUST be set from `CLOCK_REALTIME` (wall clock, not monotonic — receivers need to compare across machines).

### 2. **Build the `NonceStore`**

> 💡 *WHY: A hash map keyed on `(key_id, nonce)` gives O(1) lookup — critical when checking every incoming message.*

Implement `check_and_insert()` as shown above. The composite key is `key_id + ":" + hex(nonce)`. If the key exists in `seen_`, return `false` (replay). If the timestamp is outside `±window_sec_` of `now`, return `false` (stale). Otherwise insert and return `true`.

### 3. **Implement time-based eviction**

> 💡 *WHY: Without eviction, the nonce store grows forever. Time-based eviction bounds memory to `window × message_rate`.*

In `evict_expired()`, iterate the map and remove entries where `now - timestamp > window_sec_`. Call this at the start of every `check_and_insert()` (amortised cost) or on a periodic timer.

```cpp
void evict_expired() {
    int64_t cutoff = time(nullptr) - window_sec_;
    for (auto it = seen_.begin(); it != seen_.end(); ) {
        if (it->second < cutoff)
            it = seen_.erase(it);
        else
            ++it;
    }
}
```

### 4. **Wire replay defense into the receiver pipeline**

> 💡 *WHY: Replay check MUST happen after signature verification — a forged nonce should not pollute the nonce store.*

Update the receiver: (1) verify signature, (2) extract nonce + timestamp, (3) call `nonce_store.check_and_insert()`, (4) only if `true`, process the message. On replay rejection, log: `{"event":"replay_rejected","key_id":"...","nonce":"...","ts":...}`.

### 5. **Test with deliberate replays**

> 💡 *WHY: If you never replay a message in testing, you have never proven the defense works.*

Send a valid signed message. Capture its bytes. Re-send the exact same bytes. Verify:

| Test | Expected |
|------|----------|
| First send of message | Accepted, processed |
| Immediate replay (same bytes) | Rejected: `replay_rejected` |
| Replay after 130s (outside 120s window) | Rejected: `stale_timestamp` |
| New message with fresh nonce + timestamp | Accepted, processed |
| Message with timestamp 300s in the future | Rejected: `stale_timestamp` |

## Done when

- [ ] Every message has a 128-bit nonce from `getrandom()` — *unique per message, unpredictable*
- [ ] Duplicate `(key_id, nonce)` always rejected — *replay attack blocked*
- [ ] Stale timestamps (outside ±60s) rejected — *limits replay window*
- [ ] Nonce store evicts entries older than window — *bounded memory usage*
- [ ] Deliberate replay test shows rejection + log entry — *proves defense works*

## Proof

Paste the output of your replay test showing one accepted message and one rejected replay **and** the `replay_rejected` log line.

**Quick self-test**

1. **Q:** Why 128-bit nonces instead of 64-bit?
   **A:** With 64-bit nonces and `2^32` messages (4 billion), the birthday paradox gives a ~50% chance of a collision. At 128 bits, you need `2^64` messages — far beyond any practical system lifetime. 128 bits makes accidental collision negligible.

2. **Q:** Why include `key_id` in the dedup key instead of just the nonce?
   **A:** Two different signers may independently generate the same nonce (unlikely but possible). Using `(key_id, nonce)` as the composite key ensures that nonce uniqueness is scoped per signer, not global.

3. **Q:** What happens if the sender's and receiver's clocks differ by more than the window?
   **A:** All valid messages are rejected as stale. This is why NTP or PTP clock synchronisation is a prerequisite for replay defense with timestamp windows. Alternatively, use a wider window (e.g. 300s) at the cost of a larger nonce store.
