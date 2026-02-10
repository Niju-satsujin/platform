---
id: w09-l03
title: "Core Ops Correctness"
order: 3
type: lesson
duration_min: 45
---

# Core Ops Correctness

## Goal

Prove that every [state machine](https://en.wikipedia.org/wiki/Finite-state_machine) [transition](https://en.wikipedia.org/wiki/Finite-state_machine#Concepts_and_terminology) is correct. Define [invariants](https://en.wikipedia.org/wiki/Invariant_(mathematics)#Invariants_in_computer_science) the [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) maintain, then write tests that check them.

## What you build

A correctness test suite for the three core operations. You define the [invariants](https://en.wikipedia.org/wiki/Invariant_(mathematics)#Invariants_in_computer_science), write targeted tests for each one, and run them after every change. You also add an `assert_invariants()` function that walks the entire [hash table](https://en.wikipedia.org/wiki/Hash_table) and verifies its internal structure is valid.

## Why it matters

A working demo is not proof. A [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) that passes the happy path but corrupts data on edge cases is worse than one that crashes — because corruption is silent. [Invariants](https://en.wikipedia.org/wiki/Invariant_(mathematics)#Invariants_in_computer_science) make bugs loud. Production systems like [SQLite](https://www.sqlite.org/testing.html) run thousands of [assert](https://man7.org/linux/man-pages/man3/assert.3.html) checks. In [W10](../../../parts/w10/part.md) your [write-ahead log](https://en.wikipedia.org/wiki/Write-ahead_logging) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) preserve these same invariants across crashes.

---

## Training Session

### Warmup — Invariants and assertions

Read the man page for [assert()](https://man7.org/linux/man-pages/man3/assert.3.html). Write down:

1. What [assert()](https://man7.org/linux/man-pages/man3/assert.3.html) does when the expression is false — it prints the file, line, and expression, then calls [abort()](https://man7.org/linux/man-pages/man3/abort.3.html).
2. Why you [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) put side effects inside [assert()](https://man7.org/linux/man-pages/man3/assert.3.html) — because asserts can be compiled out with `NDEBUG`.
3. Review your [hash table](https://en.wikipedia.org/wiki/Hash_table) from [L01](01-state-machine-model.md). List the things that could go wrong: duplicate keys, dangling pointers, wrong bucket index.

### Work — Build the correctness suite

#### Do

1. Create `w09/kv_correctness_test.c`.
2. Define three [invariants](https://en.wikipedia.org/wiki/Invariant_(mathematics)#Invariants_in_computer_science) for the store:
   - **I1 — No duplicate keys.** Every key appears in at most one entry across all buckets.
   - **I2 — Correct bucket.** Every entry's key hashes to the bucket it lives in.
   - **I3 — No dangling values.** Every entry has a non-NULL key and a non-NULL value.
3. Write `assert_invariants(struct kv_store *store)`:
   - Walk every bucket and every chain.
   - For I1, keep a count of keys seen. If any key appears twice, [assert()](https://man7.org/linux/man-pages/man3/assert.3.html) fails.
   - For I2, re-hash each key and confirm it matches the bucket index.
   - For I3, [assert()](https://man7.org/linux/man-pages/man3/assert.3.html) that both `key` and `value` are not NULL.
4. Write test `test_set_get_basic()`: SET a key, GET it, assert the value matches. Call `assert_invariants()`.
5. Write test `test_set_overwrite()`: SET a key, SET the same key with a new value, GET it, assert you get the new value. Call `assert_invariants()`.
6. Write test `test_del_existing()`: SET a key, DEL it, GET it, assert NULL is returned. Call `assert_invariants()`.
7. Write test `test_del_missing()`: DEL a key that was never set. Assert the return value is 0. Call `assert_invariants()`.
8. Write test `test_many_keys()`: SET 1000 unique keys. GET each one to confirm correctness. DEL every other key. GET the deleted keys to confirm NULL. GET the remaining keys to confirm their values. Call `assert_invariants()` after each phase.
9. Write test `test_collision()`: Find two different keys that hash to the same bucket. SET both. GET both. DEL the first. GET the second to confirm it is still there. Call `assert_invariants()`.
10. Write a `main()` that runs all six tests and prints PASS or FAIL for each.

#### Test

```bash
gcc -Wall -Wextra -o kv_correctness_test w09/kv_correctness_test.c w09/kv_store.c
./kv_correctness_test
```

#### Expected

```
test_set_get_basic      PASS
test_set_overwrite      PASS
test_del_existing       PASS
test_del_missing        PASS
test_many_keys          PASS
test_collision          PASS
```

### Prove — Invariant coverage

Ask yourself: "Is there any sequence of SET/GET/DEL that could violate I1, I2, or I3 and still pass all six tests?" If yes, add a seventh test that covers the gap.

### Ship

```bash
git add w09/kv_correctness_test.c
git commit -m "w09-l03: correctness suite with invariant checks for all core ops"
```

---

## Done when

- `assert_invariants()` checks I1, I2, and I3 on every call.
- All six tests pass.
- The test for 1000 keys does not leak memory — confirm with [Valgrind](https://valgrind.org/docs/manual/manual.html).
- Adding a deliberate bug (like skipping the duplicate check in SET) makes at least one test fail.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Only testing the happy path | Always test the empty store, duplicate keys, missing keys, and [hash collisions](https://en.wikipedia.org/wiki/Hash_table#Collision_resolution). |
| Putting [assert()](https://man7.org/linux/man-pages/man3/assert.3.html) in production code instead of test code | Use [assert()](https://man7.org/linux/man-pages/man3/assert.3.html) for test invariants. In production, return error codes. |
| Not calling `assert_invariants()` after DEL | DEL changes the chain structure. If the re-linking is wrong, I2 or I3 may be violated. |
| Checking only key presence, not value correctness | GET returning a non-NULL value is not enough. Assert the value [MUST](https://datatracker.ietf.org/doc/html/rfc2119) match what was SET. |

## Proof

```bash
./kv_correctness_test
# → test_set_get_basic      PASS
# → test_set_overwrite      PASS
# → test_del_existing       PASS
# → test_del_missing        PASS
# → test_many_keys          PASS
# → test_collision          PASS

valgrind --leak-check=full ./kv_correctness_test
# → All heap blocks were freed -- no leaks are possible
```

## 🖼️ Hero Visual

```
  Invariant check after every transition
  ┌────────────────────────────────────────────┐
  │  SET foo=bar   ──▶  assert_invariants() ✓  │
  │  SET foo=baz   ──▶  assert_invariants() ✓  │
  │  DEL foo       ──▶  assert_invariants() ✓  │
  │  GET missing   ──▶  assert_invariants() ✓  │
  │                                            │
  │  I1: no duplicate keys           ✓         │
  │  I2: every key in correct bucket ✓         │
  │  I3: no dangling values          ✓         │
  └────────────────────────────────────────────┘
```

## 🔮 Future Lock

- In [W09 L04](04-concurrency-strategy.md) you will run these same tests under concurrent access to confirm the [rwlock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) protects the invariants.
- In [W09 L06](06-regression-harness.md) you will run the correctness suite as part of the full [regression harness](https://en.wikipedia.org/wiki/Regression_testing).
- In [W10](../../../parts/w10/part.md) you will verify that replaying the [write-ahead log](https://en.wikipedia.org/wiki/Write-ahead_logging) produces a store that passes `assert_invariants()`.
- In [W12](../../../parts/w12/part.md) you will check that all [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) replicas agree on the same [state](https://en.wikipedia.org/wiki/State_(computer_science)) by running invariant checks on every node.
