---
id: w11-l04
title: "Conflict Handling"
order: 4
type: lesson
duration_min: 40
---

# Conflict Handling

## Goal

Handle the case where the same key is written twice with different values in quick succession. Use a [last-writer-wins](https://en.wikipedia.org/wiki/Eventual_consistency) strategy based on [timestamps](https://en.wikipedia.org/wiki/Timestamp) to guarantee all replicas converge to the same final value.

## What you build

A `uint64_t timestamp` field added to the [WAL record](../../../parts/w10/lessons/01-record-format-checksum.md). A `repl_resolve_conflict()` function that compares the timestamp of an incoming record with the timestamp of the existing value in the store. The record with the higher timestamp wins. If timestamps are equal, the record with the lexicographically larger value wins as a tiebreaker.

## Why it matters

In a [leader-follower](https://en.wikipedia.org/wiki/Replication_(computing)) system, all writes go through the leader, so conflicts are rare. But network delays can reorder records between leader and follower, and a future multi-leader setup makes conflicts common. [Last-writer-wins](https://en.wikipedia.org/wiki/Eventual_consistency) is the simplest conflict resolution strategy and is used by [Amazon DynamoDB](https://en.wikipedia.org/wiki/Amazon_DynamoDB) and [Apache Cassandra](https://en.wikipedia.org/wiki/Apache_Cassandra). More advanced systems use [vector clocks](https://en.wikipedia.org/wiki/Vector_clock) to detect conflicts without losing data — but [last-writer-wins](https://en.wikipedia.org/wiki/Eventual_consistency) is the right first step because it is deterministic and every replica reaches the same state without coordination.

---

## Training Session

### Warmup — Conflict scenarios

1. Read the first two paragraphs of [Eventual consistency](https://en.wikipedia.org/wiki/Eventual_consistency). Write down what it means for replicas to "eventually" agree.
2. Read the summary of [Vector clock](https://en.wikipedia.org/wiki/Vector_clock). Write down how a vector clock detects concurrent writes — but note that we will not implement vector clocks this week.
3. Sketch a scenario: the leader sends `SET x=1 (t=100)` then `SET x=2 (t=101)`. A slow network delivers them to follower-1 in order but to follower-2 in reverse order. Draw what each follower's store looks like before and after conflict resolution.

### Work — Build last-writer-wins resolution

#### Do

1. Add a `uint64_t timestamp` field to `struct wal_record` in `w10/wal_record.h`. Update `wal_record_encode()` and `wal_record_decode()` to include the timestamp in the serialized format. The [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) now covers the timestamp bytes too.
2. Modify the leader's write path to stamp each record with the current time using [clock_gettime(CLOCK_MONOTONIC)](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) converted to nanoseconds.
3. Add a `uint64_t last_write_ts` field to each entry in the [KV store (W09)](../../../parts/w09/part.md) hash table. When a key is first set, store its timestamp alongside the value.
4. Create `w11/repl_conflict.h` and `w11/repl_conflict.c`. Implement `repl_resolve_conflict(existing_ts, incoming_ts, existing_val, incoming_val)`. Return `APPLY` if the incoming record should be applied, `SKIP` if the existing value should be kept.
5. The rule: if `incoming_ts > existing_ts`, return `APPLY`. If `incoming_ts < existing_ts`, return `SKIP`. If timestamps are equal, compare values with [memcmp(3)](https://man7.org/linux/man-pages/man3/memcmp.3.html) — the lexicographically larger value wins.
6. Modify `repl_receive_record()` in the follower. Before applying a SET, call `repl_resolve_conflict()`. Only apply the record if the result is `APPLY`.
7. Create `w11/repl_conflict_test.c`. Test case 1: send `SET x=old (t=100)` then `SET x=new (t=200)`. Verify the store has `x=new`.
8. Test case 2: send `SET x=new (t=200)` then `SET x=old (t=100)` (out of order). Verify the store still has `x=new` because the conflict resolver keeps the higher timestamp.
9. Test case 3: send `SET x=aaa (t=100)` then `SET x=zzz (t=100)` (same timestamp). Verify the store has `x=zzz` because `zzz` is lexicographically larger.

#### Test

```bash
gcc -Wall -Wextra -o repl_conflict_test \
  w11/repl_conflict_test.c w11/repl_conflict.c w11/repl_ship.c \
  w11/repl_config.c w10/wal_record.c w10/wal_writer.c \
  w10/crc32.c w09/kv_store.c
./repl_conflict_test
```

#### Expected

```
test 1: in-order writes — x=new (t=200) ✓
test 2: out-of-order writes — x=new (t=200) kept, old (t=100) skipped ✓
test 3: same timestamp tiebreaker — x=zzz wins over x=aaa ✓
3/3 conflict tests passed
```

### Prove — Convergence guarantees

Answer in your own words:

1. Why does [last-writer-wins](https://en.wikipedia.org/wiki/Eventual_consistency) guarantee that all replicas converge to the same value, even if records arrive in different orders?
2. What data can [last-writer-wins](https://en.wikipedia.org/wiki/Eventual_consistency) lose? Give a concrete example of a write that is silently discarded.
3. How would [vector clocks](https://en.wikipedia.org/wiki/Vector_clock) improve on [last-writer-wins](https://en.wikipedia.org/wiki/Eventual_consistency)? What extra complexity would they add?

### Ship

```bash
git add w11/repl_conflict.h w11/repl_conflict.c w11/repl_conflict_test.c
git commit -m "w11-l04: last-writer-wins conflict resolution with timestamps"
```

---

## Done when

- Every [WAL record](https://en.wikipedia.org/wiki/Write-ahead_logging) carries a `uint64_t timestamp` covered by the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check).
- `repl_resolve_conflict()` returns `APPLY` or `SKIP` based on timestamp comparison.
- Out-of-order records are handled correctly — the higher timestamp always wins.
- The tiebreaker rule produces a deterministic result when timestamps are equal.
- All 3 conflict tests pass.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Using wall-clock time across different machines | [Wall-clock time](https://en.wikipedia.org/wiki/Wall-clock_time) can drift between machines. In a single-leader setup this is safe because all timestamps come from one machine. For multi-leader, you would need [NTP](https://en.wikipedia.org/wiki/Network_Time_Protocol) or [vector clocks](https://en.wikipedia.org/wiki/Vector_clock). |
| Forgetting to update the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) to cover the timestamp field | The timestamp [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be part of the checksum. Otherwise a corrupted timestamp would silently change conflict resolution. |
| No tiebreaker for equal timestamps | Without a tiebreaker, replicas receiving records in different orders may keep different values. The lexicographic comparison [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be deterministic. |
| Applying DEL without checking the timestamp | A stale DEL with a lower timestamp than the current value [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be skipped, just like a stale SET. |

## Proof

```bash
./repl_conflict_test
# → test 1: in-order writes — x=new (t=200) ✓
# → test 2: out-of-order writes — x=new (t=200) kept, old (t=100) skipped ✓
# → test 3: same timestamp tiebreaker — x=zzz wins over x=aaa ✓
# → 3/3 conflict tests passed
```

## 🖼️ Hero Visual

```
  Last-writer-wins conflict resolution:

  record arrives:  SET x=old (t=100)
  store has:       x=new (t=200)

  compare:  incoming_ts=100  <  existing_ts=200
  result:   SKIP — keep x=new

  ──────────────────────────────────────────

  record arrives:  SET x=new (t=200)
  store has:       x=old (t=100)

  compare:  incoming_ts=200  >  existing_ts=100
  result:   APPLY — overwrite with x=new

  ──────────────────────────────────────────

  record arrives:  SET x=zzz (t=100)
  store has:       x=aaa (t=100)

  compare:  incoming_ts=100  == existing_ts=100
  tiebreak: memcmp("zzz","aaa") > 0
  result:   APPLY — overwrite with x=zzz
```

## 🔮 Future Lock

- In [W11 L05](05-failure-handling.md) you will handle what happens when a follower misses records during a crash — conflict resolution ensures it converges after catching up.
- In [W12](../../../parts/w12/part.md) the [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) protocol eliminates most conflicts by totally ordering all writes through a single leader per term.
- In [W20](../../../parts/w20/part.md) [chaos drills](https://en.wikipedia.org/wiki/Chaos_engineering) will inject clock skew and reorder records to verify convergence under stress.
- A future multi-leader week could replace [last-writer-wins](https://en.wikipedia.org/wiki/Eventual_consistency) with [vector clocks](https://en.wikipedia.org/wiki/Vector_clock) for conflict detection without data loss.
