---
id: w09-l05
title: "Observability"
order: 5
type: lesson
duration_min: 35
---

# Observability

## Goal

Add [observability](https://en.wikipedia.org/wiki/Observability_(software)) counters to the [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) so you can see what is happening inside the system without stopping it.

## What you build

A `struct kv_stats` with [atomic](https://en.cppreference.com/w/c/atomic) counters for: total GETs, total SETs, total DELs, total errors, current key count, and total bytes stored. You add a STATS command to the [protocol (L02)](02-protocol-contract.md) that returns all counters. The counters update on every operation without taking the [rwlock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html).

## Why it matters

You cannot fix what you cannot see. When a [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) slows down, the first question is: "Which operation is hot?" Without counters, you guess. With counters, you know. Every production system — [Redis INFO](https://redis.io/commands/info/), [etcd metrics](https://etcd.io/docs/v3.5/metrics/), [Prometheus](https://prometheus.io/) — exposes this data. [Atomic operations](https://en.cppreference.com/w/c/atomic) let you increment counters from any thread without a [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html), so the cost is near zero.

---

## Training Session

### Warmup — Atomic operations

Read the documentation for [atomic_fetch_add()](https://en.cppreference.com/w/c/atomic/atomic_fetch_add). Write down:

1. What "atomic" means — the operation completes as one indivisible step, so no other thread can see a half-updated value.
2. Why [atomic_fetch_add()](https://en.cppreference.com/w/c/atomic/atomic_fetch_add) does not need a [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) — the hardware guarantees the operation is safe across threads.
3. What the `_Atomic` keyword does in C11 — it tells the compiler to use atomic instructions for reads and writes to that variable.

### Work — Build the stats layer

#### Do

1. Create `w09/kv_stats.h`. Define `struct kv_stats` with these `_Atomic` counters:
   - `_Atomic uint64_t gets` — total GET operations.
   - `_Atomic uint64_t sets` — total SET operations.
   - `_Atomic uint64_t dels` — total DEL operations.
   - `_Atomic uint64_t errors` — total invalid commands.
   - `_Atomic int64_t key_count` — current number of keys in the store.
   - `_Atomic uint64_t bytes_stored` — total bytes across all values currently in the store.
2. Create `w09/kv_stats.c`.
3. Write `kv_stats_init(struct kv_stats *stats)` — set every counter to zero using [atomic_store()](https://en.cppreference.com/w/c/atomic/atomic_store).
4. Write helper functions: `kv_stats_inc_gets()`, `kv_stats_inc_sets()`, `kv_stats_inc_dels()`, `kv_stats_inc_errors()`. Each one calls [atomic_fetch_add()](https://en.cppreference.com/w/c/atomic/atomic_fetch_add) with 1.
5. Write `kv_stats_key_added(stats, value_len)` — increment `key_count` by 1 and `bytes_stored` by `value_len`.
6. Write `kv_stats_key_removed(stats, value_len)` — decrement `key_count` by 1 and `bytes_stored` by `value_len`.
7. Write `kv_stats_key_updated(stats, old_len, new_len)` — adjust `bytes_stored` by the difference.
8. Write `kv_stats_format(const struct kv_stats *stats, char *buf, int buf_size)` — produce a human-readable summary:
   - `gets:<N> sets:<N> dels:<N> errors:<N> keys:<N> bytes:<N>\n`
9. Wire the stats into the concurrent layer from [L04](04-concurrency-strategy.md):
   - After `kv_concurrent_get()` completes, call `kv_stats_inc_gets()`.
   - After `kv_concurrent_set()` completes, call `kv_stats_inc_sets()` and the appropriate key-added or key-updated helper.
   - After `kv_concurrent_del()` completes, call `kv_stats_inc_dels()` and key-removed if the key existed.
   - On a protocol error, call `kv_stats_inc_errors()`.
10. Add a `CMD_STATS` case to the [protocol handler (L02)](02-protocol-contract.md). When the server receives `STATS\n`, call `kv_stats_format()` and return the result.

#### Test

```bash
gcc -Wall -Wextra -pthread -o kv_stats_test \
  w09/kv_stats_test.c w09/kv_stats.c w09/kv_concurrent.c w09/kv_store.c
./kv_stats_test
```

#### Expected

```
SET a=1 → OK
SET b=2 → OK
GET a   → VALUE 1
DEL b   → DELETED
STATS   → gets:1 sets:2 dels:1 errors:0 keys:1 bytes:1
```

### Prove — Concurrent counter accuracy

Run the stress test from [L04](04-concurrency-strategy.md) with stats enabled. After all threads join:

- `stats.sets + stats.dels + stats.gets` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) equal the total number of operations executed.
- `stats.key_count` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) match the actual number of entries in the [hash table](https://en.wikipedia.org/wiki/Hash_table).

### Ship

```bash
git add w09/kv_stats.h w09/kv_stats.c
git commit -m "w09-l05: atomic observability counters with STATS command"
```

---

## Done when

- All counters use `_Atomic` types — no [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) needed for counter updates.
- `STATS` command returns correct values after a sequence of SET/GET/DEL.
- The concurrent stress test confirms counter accuracy.
- [Helgrind](https://valgrind.org/docs/manual/hg-manual.html) reports zero data races on counter accesses.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Using a regular `int` instead of `_Atomic` | Two threads incrementing a regular `int` at the same time is a [data race](https://en.wikipedia.org/wiki/Race_condition). Use `_Atomic uint64_t`. |
| Incrementing `key_count` on SET without checking if the key already existed | If the key was already present, SET is an update, not an insert. Only increment `key_count` on a new key. |
| Forgetting to decrement `bytes_stored` on DEL | Track the value length before deleting. Subtract it from `bytes_stored` after the delete succeeds. |
| Reading counters without [atomic_load()](https://en.cppreference.com/w/c/atomic/atomic_load) | Even reads [MUST](https://datatracker.ietf.org/doc/html/rfc2119) use [atomic_load()](https://en.cppreference.com/w/c/atomic/atomic_load) to get a consistent snapshot. |

## Proof

```bash
./kv_stats_test
# → gets:1 sets:2 dels:1 errors:0 keys:1 bytes:1

./kv_concurrent_test   # with stats wired in
# → operations: 8000  counter_sum: 8000  key_count matches: YES
```

## 🖼️ Hero Visual

```
  thread 1          thread 2          thread 3          thread 4
  SET k1=v1         GET k2            DEL k3            GET k1
      │                 │                 │                 │
      ▼                 ▼                 ▼                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                 _Atomic counters (lock-free)                 │
  │  gets: 2    sets: 1    dels: 1    errors: 0    keys: 99     │
  └──────────────────────────────────────────────────────────────┘
      │
      ▼
  STATS → "gets:2 sets:1 dels:1 errors:0 keys:99 bytes:4521"
```

## 🔮 Future Lock

- In [W09 L06](06-regression-harness.md) the [regression harness](https://en.wikipedia.org/wiki/Regression_testing) will assert that counter values match the expected totals after every test run.
- In [W10](../../../parts/w10/part.md) you will add a `wal_writes` counter to track how many entries hit the [write-ahead log](https://en.wikipedia.org/wiki/Write-ahead_logging).
- In [W11](../../../parts/w11/part.md) you will add `replication_lag` and `bytes_replicated` counters.
- In [W12](../../../parts/w12/part.md) you will expose [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) counters: `term`, `commit_index`, `applied_index`.
