---
id: w07-l08
title: "Deprecated key transition"
order: 8
duration_minutes: 30
xp: 75
kind: lesson
part: w07
proof:
  type: paste
  instructions: "Paste the output of your program that: (1) accepts a deprecated key within the grace period with a warning, (2) rejects a deprecated key after the grace period expires, (3) shows the automatic transition from deprecated to revoked."
  regex_patterns:
    - "WARNING|warning|DEPRECATED"
    - "grace.period|transition"
    - "auto.*revok|expired.*revok|REVOKED"
---
# Deprecated key transition

## Concept

In lesson 6 you made deprecated keys work forever — a deprecated key is accepted just like an active key. That is too permissive. In practice, deprecation is a countdown to revocation.

Here is the lifecycle of a key:

```
ACTIVE  -->  DEPRECATED (grace period)  -->  REVOKED
```

When a key is deprecated, it enters a grace period. During this window — say 7 days — the key still works, but the verifier emits a warning: "This key is deprecated. It will stop working on <date>. Please use the new key." After the grace period expires, the key automatically becomes revoked.

This gives everyone time to migrate. The sender can switch to the new key. Any in-flight messages signed with the old key will still be accepted. But there is a clear deadline.

To implement this, add a `deprecated_at` timestamp and a `grace_period_seconds` to each key entry. When verifying, if the key is deprecated, compute: `now - deprecated_at`. If that is less than the grace period, accept with a warning. If it is greater, treat it as revoked.

You can check this lazily (during verification) or eagerly (with a background task that scans for expired deprecated keys and flips them to revoked). The lazy approach is simpler and fine for now.

## Task

1. Add `deprecated_at` (uint64 timestamp) and `grace_period_seconds` (uint64, default 604800 = 7 days) to each key entry
2. When `rotate_key()` deprecates a key, record the current time as `deprecated_at`
3. Update verification logic for deprecated keys:
   - If `now - deprecated_at < grace_period_seconds`: accept, but print a warning
   - If `now - deprecated_at >= grace_period_seconds`: treat as REVOKED, reject
4. Write a helper `check_deprecated_keys()` that scans the registry and auto-revokes any keys past their grace period
5. Write a test using a short grace period (e.g., 2 seconds) that shows: accept during grace period, then reject after grace period

## Hints

- For testing, use a grace period of 2 seconds and `std::this_thread::sleep_for()` to wait
- `#include <thread>` for `std::this_thread::sleep_for(std::chrono::seconds(3))`
- The warning message should include the deadline: `"WARNING: key ABC123 deprecated, expires in 5 seconds"`
- `check_deprecated_keys()` iterates over the registry, finds keys where status is DEPRECATED and grace period has elapsed, and changes their status to REVOKED
- Consider printing a summary: `"auto-revoked 1 expired deprecated key(s)"`

## Verify

```bash
cmake --build build
./build/test_deprecated_transition
```

Expected output:
```
key OLD_KEY status: ACTIVE
--- rotating key (grace period: 2 seconds) ---
key OLD_KEY status: DEPRECATED (grace period: 2s)
key NEW_KEY status: ACTIVE

verify with OLD_KEY (within grace period): WARNING — key OLD_KEY deprecated, accept with warning
sleeping 3 seconds...
verify with OLD_KEY (grace period expired): REVOKED — key OLD_KEY grace period expired, auto-revoked
deprecated transition test passed
```

## Done When

A deprecated key is accepted with a warning during the grace period and automatically treated as revoked after the grace period expires.
