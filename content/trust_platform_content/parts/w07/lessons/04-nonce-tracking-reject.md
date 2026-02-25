---
id: w07-l04
title: "Nonce tracking and rejection"
order: 4
duration_minutes: 25
xp: 50
kind: lesson
part: w07
proof:
  type: paste
  instructions: "Paste the output of your program that accepts an envelope the first time and rejects the same envelope the second time with a duplicate nonce error."
  regex_patterns:
    - "accepted|valid"
    - "reject|duplicate|REPLAY"
---
# Nonce tracking and rejection

## Concept

You have a nonce in every envelope. Now you need to track which nonces you have already seen and reject any duplicates.

The data structure is straightforward: a set of seen nonces. When a new envelope arrives, extract its nonce and check: is this nonce already in the set? If yes, reject the envelope — it is a replay. If no, add the nonce to the set and continue with normal verification.

For now, use a simple `std::unordered_set`. The nonce is 16 bytes, so you need a hash function for it. You can use `std::string` as the key (construct a string from the raw bytes) or write a custom hasher for `std::array<uint8_t, 16>`.

The nonce check should happen before the signature check. Why? Because signature verification is computationally expensive (elliptic curve math), while a set lookup is nearly free. Reject cheap, verify expensive.

Order of verification:
1. Extract nonce
2. Check nonce against seen-set (reject if duplicate)
3. Verify signature (reject if invalid)
4. Add nonce to seen-set
5. Accept envelope

## Task

1. Create a `NonceTracker` class with two methods: `bool is_seen(nonce)` and `void mark_seen(nonce)`
2. `is_seen` checks whether the nonce exists in the internal set
3. `mark_seen` adds the nonce to the set
4. Update your envelope verification flow to use the NonceTracker: check before verify, mark after verify
5. Write a test that sends an envelope, verifies it (accepted), then sends the same envelope again (rejected)

## Hints

- `std::unordered_set<std::string>` works if you construct the string from raw nonce bytes: `std::string(reinterpret_cast<const char*>(nonce.data()), nonce.size())`
- Alternatively, use `std::set<std::array<uint8_t, 16>>` which works with the default `<` comparison
- The NonceTracker does not need to be thread-safe yet — single-threaded is fine for now
- Print clear error messages: "REPLAY_REJECTED: duplicate nonce detected"

## Verify

```bash
cmake --build build
./build/test_nonce_tracking
```

Expected output:
```
attempt 1: envelope accepted
attempt 2: REPLAY_REJECTED — duplicate nonce detected
```

## Done When

The same signed envelope is accepted on the first attempt and rejected on the second attempt with a clear duplicate-nonce error message.
