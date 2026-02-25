---
id: w09-l01
title: "Design the KV store API"
order: 1
duration_minutes: 20
xp: 50
kind: lesson
part: w09
proof:
  type: paste
  instructions: "Paste your KVStore class declaration showing get, put, delete methods and their return types."
  regex_patterns:
    - "get|put|delete"
    - "KVStore|KeyValue"
---
# Design the KV store API

## Concept

A key-value store is the simplest useful database. You store pairs: a key (string) maps to a value (bytes). Three operations: put (store a pair), get (retrieve by key), delete (remove a pair).

In C, you would use a hash table with `char*` keys and `void*` values. In C++, `std::unordered_map<std::string, std::string>` does the same thing with less pain — no manual memory management, no hash function to write, no collision handling.

Before writing any code, define the API — what the caller sees. Design decisions:
- **get** returns `std::optional<std::string>` — nullopt if the key does not exist (no exceptions, no error codes for missing keys)
- **put** takes a key and value, returns a version number (uint64_t)
- **delete** takes a key, returns true if the key existed
- **All operations are synchronous** for now — the caller waits until the operation is complete

This API is similar to Redis (GET, SET, DEL) but much simpler. You will not add expiry, transactions, or secondary indexes — those are distractions. The minimal API is enough to learn durability.

## Task

1. Define a `class KVStore` with the three methods described above
2. Add a `size()` method that returns the number of keys
3. Add a `contains(key)` method that returns bool
4. Write the class declaration in a header file `kv_store.h`
5. Write a test: put 3 keys, get them back, delete one, verify size is 2

## Hints

- `#include <unordered_map>` for the internal storage
- `#include <optional>` for `std::optional`
- The internal map: `std::unordered_map<std::string, std::string> data_;`
- `std::optional<std::string> get(const std::string& key)` — return `data_[key]` if it exists, `std::nullopt` otherwise
- Start with an in-memory-only implementation — no disk, no WAL. Durability comes in later lessons.

## Verify

```bash
g++ -std=c++17 -o test_kv test_kv.cpp
./test_kv
echo "exit code: $?"
```

Expected: all assertions pass, exit code 0.

## Done When

The KV store API compiles, put/get/delete work, and the basic test passes.
