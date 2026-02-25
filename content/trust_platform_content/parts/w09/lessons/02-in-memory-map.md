---
id: w09-l02
title: "In-memory implementation"
order: 2
duration_minutes: 20
xp: 50
kind: lesson
part: w09
proof:
  type: paste
  instructions: "Paste test output showing put/get/delete/overwrite all working correctly."
  regex_patterns:
    - "put|get|delete"
    - "pass|assert"
---
# In-memory implementation

## Concept

The simplest KV store is just a wrapper around `std::unordered_map`. This lesson implements the full API from lesson 1 with proper edge case handling.

Edge cases to think about:
- **Get a key that does not exist** — return nullopt, do not throw
- **Delete a key that does not exist** — return false, do not throw
- **Put to an existing key** — overwrite the value, increment the version
- **Empty key or value** — allow it (empty string is valid data)
- **Large value** — allow it (no artificial size limit for now)

The implementation is straightforward — 10-20 lines of code. But getting the edge cases right matters because the WAL replay (lesson 6) must reproduce this exact behavior.

## Task

1. Implement all methods from your `KVStore` class declaration
2. Write thorough tests for every edge case listed above
3. Test overwrite: put("a", "1"), put("a", "2"), get("a") must return "2"
4. Test delete + re-put: put("a", "1"), delete("a"), put("a", "3"), get("a") must return "3"
5. Test that get after delete returns nullopt

## Hints

- `data_.find(key) != data_.end()` checks if a key exists
- `data_.erase(key)` returns 1 if the key existed, 0 if not
- `data_[key] = value` inserts or overwrites
- For now, version tracking is a simple counter: increment on every put

## Verify

```bash
g++ -std=c++17 -o test_kv test_kv.cpp
./test_kv
echo "exit code: $?"
```

Expected: all edge case tests pass.

## Done When

Every edge case test passes including overwrite, delete-then-reput, and get-after-delete.
