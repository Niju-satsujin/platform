---
id: w09-l03
title: "Version tracking for every key"
order: 3
duration_minutes: 20
xp: 50
kind: lesson
part: w09
proof:
  type: paste
  instructions: "Paste output showing version numbers incrementing on put, and a conditional put that fails on version mismatch."
  regex_patterns:
    - "version"
    - "mismatch|conflict|reject"
---
# Version tracking for every key

## Concept

Every value in your KV store has a **version number**. The first time you put a key, it gets version 1. Update it, version 2. Update again, version 3. Versions never go backward.

Why track versions? Two reasons:

1. **Conflict detection** — in a replicated system (Week 10-11), two nodes might update the same key simultaneously. Versions tell you which update came first.
2. **Conditional put** — "update this key only if the current version is 5." If someone else updated it to version 6 while you were not looking, your conditional put fails. This prevents lost updates.

The version is a global counter, not per-key. Every write operation (put or delete) increments the global counter and stamps the entry with the new value. This gives you a total ordering of all operations.

In database terms, this is called a **Log Sequence Number (LSN)**. You will use this same counter for the WAL in lesson 4.

## Task

1. Add a global `uint64_t next_version_ = 1` to your KVStore
2. Change the internal storage to `std::unordered_map<std::string, ValueEntry>` where `ValueEntry = {std::string value, uint64_t version}`
3. `put()` returns the new version number
4. `get()` returns `std::optional<ValueEntry>` (value + version)
5. Add `put_if_version(key, value, expected_version)` — only succeeds if current version matches expected

## Hints

- `struct ValueEntry { std::string value; uint64_t version; };`
- On put: `entry.version = next_version_++;`
- On conditional put: `if (current.version != expected_version) return false;`
- Delete also increments the version counter (deletions are operations too)
- The version counter is monotonically increasing — it never resets

## Verify

```bash
./test_kv
```

Expected: `put("a","1")` returns version 1, `put("b","2")` returns version 2, `put("a","3")` returns version 3. `put_if_version("a","4",3)` succeeds, `put_if_version("a","5",3)` fails (version is now 4).

## Done When

Versions increment correctly and conditional put rejects stale versions.
