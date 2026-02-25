---
id: w07-l05
title: "Expiry window"
order: 5
duration_minutes: 25
xp: 75
kind: lesson
part: w07
proof:
  type: paste
  instructions: "Paste the output of your program that: (1) accepts a fresh envelope, (2) rejects an expired envelope, (3) rejects a replayed envelope, and (4) shows that old nonces are pruned from the tracker."
  regex_patterns:
    - "accepted|valid"
    - "EXPIRED|expired|too old"
    - "REPLAY|duplicate"
    - "prune|purg|clean|removed"
---
# Expiry window

## Concept

Right now your NonceTracker remembers every nonce forever. After a million messages, that is 16 million bytes of nonces just sitting in memory. It only gets worse over time.

The fix: combine nonce tracking with the timestamp. Set an expiry window — say, 30 seconds. The rules become:

1. If the timestamp is older than 30 seconds: reject immediately (EXPIRED). Do not even check the nonce or signature.
2. If the timestamp is within 30 seconds but the nonce is a duplicate: reject (REPLAY).
3. If the timestamp is within 30 seconds and the nonce is new: accept.

Since you reject anything older than 30 seconds, you can also prune nonces older than 30 seconds from your tracker. They will never match a future envelope because any envelope that old would be rejected by the timestamp check first.

This means your nonce set has a natural size limit: at most (messages per second * window size) entries. At 1000 messages per second with a 30-second window, that is 30,000 nonces — totally manageable.

Add a `prune()` method to your NonceTracker that removes nonces older than the window. You need to store the timestamp alongside each nonce. Change your set to a map: nonce -> timestamp. During pruning, scan the map and remove entries whose timestamp is older than the window.

## Task

1. Update `NonceTracker` to store each nonce alongside its timestamp: `std::unordered_map<std::string, uint64_t>`
2. Add a configurable `expiry_window_seconds` parameter (default 30)
3. Add a `prune()` method that removes all entries older than `now - expiry_window_seconds`
4. Update the verification flow: check timestamp freshness first, then check nonce, then verify signature
5. Write a test with four scenarios:
   - Fresh envelope: accepted
   - Envelope with a timestamp from 60 seconds ago: EXPIRED
   - Same fresh envelope sent twice: REPLAY_REJECTED
   - After pruning, old nonces are removed (print tracker size before and after prune)

## Hints

- For testing expired envelopes, create the envelope normally, then manually set the timestamp to `now - 60` before signing (or create a helper that builds envelopes with arbitrary timestamps)
- Call `prune()` at the start of each verification — or call it periodically on a timer
- `std::chrono::system_clock::now()` for current time
- You can test pruning by creating envelopes, calling prune with a short window, and checking the tracker size decreases
- Print: `"tracker size before prune: 5, after prune: 2, removed: 3"`

## Verify

```bash
cmake --build build
./build/test_expiry_window
```

Expected output:
```
test 1 — fresh envelope: accepted
test 2 — expired envelope (60s old): EXPIRED — envelope too old
test 3 — replayed envelope: REPLAY_REJECTED — duplicate nonce
test 4 — prune: tracker size before=3, after=1, removed=2
all tests passed
```

## Done When

Your system rejects expired envelopes, rejects replayed envelopes, and prunes old nonces to keep memory usage bounded.
