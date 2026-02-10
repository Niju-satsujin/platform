---
id: w11-quest
title: "Quest — Replicated KV Store"
order: 7
type: quest
duration_min: 90
---

# Quest — Replicated KV Store

## Mission

Integrate all six lessons into a complete [leader-follower replication](https://en.wikipedia.org/wiki/Replication_(computing)) system for the [KV store (W09)](../w09/part.md). The leader accepts writes, appends each operation to its [write-ahead log (W10)](../w10/part.md), and ships the [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) records over [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) to two followers. Each follower verifies the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check), appends the record, applies it, and sends an ACK. The leader waits for a [quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) before confirming the write. [Last-writer-wins](https://en.wikipedia.org/wiki/Eventual_consistency) conflict resolution ensures convergence. Follower crash and rejoin is handled via WAL-based catch-up. The full [regression harness](https://en.wikipedia.org/wiki/Regression_testing) passes.

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | [Leader-follower](https://en.wikipedia.org/wiki/Replication_(computing)) connection — leader connects to 2 followers over [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) with heartbeat exchange | [Connectivity test (L01)](lessons/01-replication-goal.md) — `2/2 followers responded` |
| R2 | [Log shipping](https://en.wikipedia.org/wiki/Replication_(computing)) — leader sends length-prefixed [WAL records](https://en.wikipedia.org/wiki/Write-ahead_logging) to all online followers | [Shipping test (L02)](lessons/02-log-shipping.md) — follower stores match leader |
| R3 | [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) verification on receive — follower rejects records with bad checksums | Bit-flip in shipped record causes rejection |
| R4 | [Quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) acknowledgment — leader waits for Q acks before replying OK | [Quorum test (L03)](lessons/03-ack-quorum-lite.md) — write blocks until Q acks arrive |
| R5 | [Last-writer-wins](https://en.wikipedia.org/wiki/Eventual_consistency) conflict resolution with [timestamp](https://en.wikipedia.org/wiki/Timestamp) comparison and lexicographic tiebreaker | [Conflict test (L04)](lessons/04-conflict-handling.md) — out-of-order records converge |
| R6 | Follower failure detection with [TCP keepalive](https://man7.org/linux/man-pages/man7/tcp.7.html) and `online` flag | Dead follower is marked offline within keepalive timeout |
| R7 | Follower rejoin with WAL-based catch-up from last applied [LSN](https://en.wikipedia.org/wiki/Write-ahead_logging) | [Rejoin test (L05)](lessons/05-failure-handling.md) — rejoined follower matches leader |
| R8 | [Regression harness](https://en.wikipedia.org/wiki/Regression_testing) passes all 6 test categories | `./w11/test_harness.sh` → `6/6 tests passed` |
| R9 | Zero memory leaks, no [undefined behavior](https://en.wikipedia.org/wiki/Undefined_behavior) | [Valgrind](https://valgrind.org/docs/manual/manual.html) reports 0 leaks, 0 errors |

## Graded Objectives

| Grade | Criteria |
|-------|----------|
| **Pass** | R1–R3: leader-follower connect, log shipping, and CRC verification work for a clean run |
| **Merit** | R4–R6: quorum acks, conflict resolution, and failure detection work |
| **Distinction** | R7–R9: follower rejoin, full harness, and zero leaks |

## Constraints

- C only. No external [replication](https://en.wikipedia.org/wiki/Replication_(computing)) or [database](https://en.wikipedia.org/wiki/Database) libraries.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) compile with `gcc -Wall -Wextra -Werror`.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reuse the [WAL record codec (W10)](../w10/lessons/01-record-format-checksum.md) and [WAL writer (W10)](../w10/lessons/02-append-discipline.md) — do not rewrite them.
- All [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) connections [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have [SO_REUSEADDR](https://man7.org/linux/man-pages/man7/socket.7.html) and [TCP keepalive](https://man7.org/linux/man-pages/man7/tcp.7.html) enabled.
- The leader [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) reply OK to the client before [quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) is reached.
- Conflict resolution [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be deterministic — all replicas [MUST](https://datatracker.ietf.org/doc/html/rfc2119) converge to the same value for the same set of records.

## Bonus Challenges

| Bonus | Description |
|-------|-------------|
| B1 | Read-from-follower — add a flag that lets GET requests be served by any follower. Measure the latency improvement compared to leader-only reads. |
| B2 | Parallel shipping — ship records to all followers concurrently using [threads (W05)](../w05/part.md) instead of sequentially. Measure the throughput improvement. |
| B3 | Snapshot-based rejoin — if a follower's last LSN is too far behind, send a full [checkpoint (W10 L05)](../w10/lessons/05-checkpointing.md) instead of replaying the entire WAL tail. |
| B4 | Replication lag monitoring — track each follower's last acked LSN and print the lag (leader LSN minus follower LSN) on every write. |

## Verification

```bash
# Build everything
gcc -Wall -Wextra -Werror -o repl_full_test \
  w11/repl_full_test.c w11/repl_rejoin.c w11/repl_quorum.c \
  w11/repl_ship.c w11/repl_conflict.c w11/repl_config.c \
  w10/wal_record.c w10/wal_writer.c w10/wal_recovery.c \
  w10/crc32.c w09/kv_store.c

# R1: connectivity
./repl_full_test
# → [test 1] leader-follower connectivity... PASS

# R2 + R3: shipping + CRC
# → [test 2] log shipping (10 records)... PASS

# R4: quorum
# → [test 3] quorum acknowledgment... PASS

# R5: conflict resolution
# → [test 4] conflict resolution (LWW)... PASS

# R6 + R7: failure + rejoin
# → [test 5] failure and rejoin... PASS

# R8: full pipeline
# → [test 6] full pipeline (20 records + crash)... PASS

# Full harness
./w11/test_harness.sh
# → 6/6 tests passed

# R9: memory safety
valgrind --leak-check=full ./repl_full_test
# → All heap blocks were freed -- no leaks are possible
# → ERROR SUMMARY: 0 errors from 0 contexts
```

## Ship

```bash
git add w11/
git commit -m "w11 quest: replicated KV store with log shipping, quorum, LWW, and rejoin"
```
