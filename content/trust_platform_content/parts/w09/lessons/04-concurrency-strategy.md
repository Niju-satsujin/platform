---
id: w09-l04
title: "Concurrency Strategy"
order: 4
type: lesson
duration_min: 50
---

# Concurrency Strategy

## Goal

Protect the [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) so multiple [thread pool](../../../parts/w05/part.md) workers can execute GET, SET, and DEL at the same time without [data races](https://en.wikipedia.org/wiki/Race_condition).

## What you build

A [reader-writer lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) wrapper around the [state machine (L01)](01-state-machine-model.md). GET takes a [read lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) — many readers run in parallel. SET and DEL take a [write lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_wrlock.3p.html) — only one writer runs at a time, and all readers wait. You also write a concurrent stress test that hammers the store from multiple threads.

## Why it matters

Your [event loop (W03)](../../../parts/w03/part.md) dispatches KV commands to [thread pool (W05)](../../../parts/w05/part.md) workers. If two workers run SET on the same key at the same time without a lock, the [hash table](https://en.wikipedia.org/wiki/Hash_table) chain can corrupt — entries get lost or point to freed memory. A [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) would be safe but slow: every GET blocks every other GET. A [reader-writer lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) gives you the best of both worlds — reads are parallel, writes are exclusive. This is the same pattern used by [ConcurrentHashMap](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html) and [RwLock in Rust](https://doc.rust-lang.org/std/sync/struct.RwLock.html).

---

## Training Session

### Warmup — Reader-writer locks

Read the DESCRIPTION section of [pthread_rwlock_rdlock()](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html). Write down:

1. How many threads can hold a [read lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) at the same time — any number.
2. What happens when a thread requests a [write lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_wrlock.3p.html) while readers hold read locks — the writer blocks until all readers release.
3. What happens when a reader requests a [read lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) while a writer holds the write lock — the reader blocks until the writer releases.

### Work — Add the rwlock layer

#### Do

1. Open `w09/kv_store.h`. Add a [pthread_rwlock_t](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) field to `struct kv_store`.
2. In `kv_store_init()`, call [pthread_rwlock_init()](https://man7.org/linux/man-pages/man3/pthread_rwlock_init.3p.html) on the new lock.
3. In `kv_store_destroy()`, call [pthread_rwlock_destroy()](https://man7.org/linux/man-pages/man3/pthread_rwlock_destroy.3p.html).
4. Create `w09/kv_concurrent.h` with three new functions: `kv_concurrent_get()`, `kv_concurrent_set()`, `kv_concurrent_del()`.
5. Create `w09/kv_concurrent.c`.
6. Write `kv_concurrent_get()`:
   - Call [pthread_rwlock_rdlock()](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html).
   - Call `kv_store_get()` from [L01](01-state-machine-model.md).
   - Copy the result to a caller-owned buffer before unlocking — the original pointer is only safe while the lock is held.
   - Call [pthread_rwlock_unlock()](https://man7.org/linux/man-pages/man3/pthread_rwlock_unlock.3p.html).
   - Return the copy.
7. Write `kv_concurrent_set()`:
   - Call [pthread_rwlock_wrlock()](https://man7.org/linux/man-pages/man3/pthread_rwlock_wrlock.3p.html).
   - Call `kv_store_set()`.
   - Call [pthread_rwlock_unlock()](https://man7.org/linux/man-pages/man3/pthread_rwlock_unlock.3p.html).
8. Write `kv_concurrent_del()`:
   - Call [pthread_rwlock_wrlock()](https://man7.org/linux/man-pages/man3/pthread_rwlock_wrlock.3p.html).
   - Call `kv_store_del()`.
   - Call [pthread_rwlock_unlock()](https://man7.org/linux/man-pages/man3/pthread_rwlock_unlock.3p.html).
   - Return the result.
9. Create `w09/kv_concurrent_test.c`. Write a stress test:
   - Create a shared [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database).
   - Spawn 4 writer threads. Each one runs a loop of 1000 SET and DEL operations on random keys.
   - Spawn 4 reader threads. Each one runs a loop of 1000 GET operations on random keys.
   - Join all threads.
   - Call `assert_invariants()` from [L03](03-core-ops-correctness.md) on the final state.
10. Print the total number of operations completed and the time taken.

#### Test

```bash
gcc -Wall -Wextra -pthread -o kv_concurrent_test \
  w09/kv_concurrent_test.c w09/kv_concurrent.c w09/kv_store.c
./kv_concurrent_test
```

#### Expected

```
8 threads, 8000 operations total
assert_invariants: PASS
time: <50ms
```

### Prove — Race detection

Run the stress test under [Helgrind](https://valgrind.org/docs/manual/hg-manual.html):

```bash
valgrind --tool=helgrind ./kv_concurrent_test
```

Zero data race errors reported.

### Ship

```bash
git add w09/kv_concurrent.h w09/kv_concurrent.c w09/kv_concurrent_test.c
git commit -m "w09-l04: rwlock concurrency layer with stress test"
```

---

## Done when

- Multiple GET operations run in parallel (readers do not block each other).
- SET and DEL take an exclusive [write lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_wrlock.3p.html).
- The stress test with 8 threads passes without crashes or assertion failures.
- [Helgrind](https://valgrind.org/docs/manual/hg-manual.html) reports zero data races.
- `assert_invariants()` passes on the final state.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Returning a pointer to the internal value without copying | The pointer is only safe while the [read lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) is held. Copy the value to a caller-owned buffer before unlocking. |
| Using a [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) instead of a [rwlock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) | A [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) serializes all operations including reads. A [rwlock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) lets multiple readers proceed in parallel. |
| Forgetting to unlock on error paths | Every [lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) call [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a matching [unlock](https://man7.org/linux/man-pages/man3/pthread_rwlock_unlock.3p.html). If `kv_store_get()` returns NULL, you still [MUST](https://datatracker.ietf.org/doc/html/rfc2119) unlock before returning. |
| Writer starvation | If readers keep arriving, the writer may never get the lock. The default [pthread_rwlock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) on Linux prefers writers, but document the assumption. |

## Proof

```bash
./kv_concurrent_test
# → 8 threads, 8000 operations total
# → assert_invariants: PASS
# → time: 12ms

valgrind --tool=helgrind ./kv_concurrent_test
# → ERROR SUMMARY: 0 errors from 0 contexts
```

## 🖼️ Hero Visual

```
  reader threads (GET)                writer threads (SET/DEL)
  ┌───────┐ ┌───────┐ ┌───────┐      ┌───────┐
  │ GET A │ │ GET B │ │ GET C │      │ SET X │
  └───┬───┘ └───┬───┘ └───┬───┘      └───┬───┘
      │         │         │               │
      ▼         ▼         ▼               │ (waits)
  ╔═══════════════════════════╗           │
  ║   rdlock   rdlock  rdlock ║           │
  ║                           ║           │
  ║     hash table (state)    ║           │
  ║                           ║           │
  ╚═══════════════════════════╝           │
      │         │         │               │
      ▼ unlock  ▼ unlock  ▼ unlock        ▼
                                    ╔═══════════╗
                                    ║  wrlock   ║
                                    ║  modify   ║
                                    ║  unlock   ║
                                    ╚═══════════╝
```

## 🔮 Future Lock

- In [W09 L05](05-observability.md) you will add [atomic](https://en.cppreference.com/w/c/atomic) counters that track operations without taking the [rwlock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html).
- In [W10](../../../parts/w10/part.md) the [write lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_wrlock.3p.html) will also cover the [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) write — SET writes the log entry and the [hash table](https://en.wikipedia.org/wiki/Hash_table) entry under the same lock.
- In [W11](../../../parts/w11/part.md) you will add a [replication](../../../parts/w11/part.md) step inside the write lock — the leader applies the change and sends it to followers before unlocking.
- In [W12](../../../parts/w12/part.md) [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) serializes writes at the consensus layer, so the local [rwlock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) only protects the local [state machine](https://en.wikipedia.org/wiki/Finite-state_machine).
