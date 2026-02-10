---
id: w09-quest
title: "Quest — Single-Node KV Store"
order: 7
type: quest
duration_min: 90
---

# Quest — Single-Node KV Store

## Mission

Build a complete single-node [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) server. It accepts [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) connections, parses the [protocol (L02)](lessons/02-protocol-contract.md), executes [GET/SET/DEL](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) as [state machine](https://en.wikipedia.org/wiki/Finite-state_machine) transitions on a [hash table (L01)](lessons/01-state-machine-model.md), protects concurrent access with a [reader-writer lock (L04)](lessons/04-concurrency-strategy.md), reports [observability counters (L05)](lessons/05-observability.md), passes the full [regression harness (L06)](lessons/06-regression-harness.md), and shuts down cleanly.

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | [Hash table](https://en.wikipedia.org/wiki/Hash_table) [state machine](https://en.wikipedia.org/wiki/Finite-state_machine) with SET, GET, DEL [transitions](https://en.wikipedia.org/wiki/Finite-state_machine#Concepts_and_terminology) | [Correctness suite (L03)](lessons/03-core-ops-correctness.md) — all 6 tests pass |
| R2 | Text [protocol](https://datatracker.ietf.org/doc/html/rfc2119): `SET key value\n`, `GET key\n`, `DEL key\n`, `STATS\n` | `echo "SET foo bar" \| nc -q1 localhost 9099` → `OK` |
| R3 | Malformed commands return `ERROR <reason>\n` — never a crash | `echo "BADCMD" \| nc -q1 localhost 9099` → `ERROR unknown command` |
| R4 | [Reader-writer lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) — multiple GETs run in parallel, SET/DEL are exclusive | [Concurrent stress test (L04)](lessons/04-concurrency-strategy.md) passes with 8 threads |
| R5 | [Atomic](https://en.cppreference.com/w/c/atomic) [observability counters](lessons/05-observability.md) — gets, sets, dels, errors, key_count, bytes_stored | `STATS` returns correct values after a known command sequence |
| R6 | Server uses the [event loop (W03)](../w03/part.md) with [epoll (W04)](../w04/part.md) for IO and dispatches commands to [thread pool (W05)](../w05/part.md) workers | `strace -e epoll_wait ./kv_server 9099` shows [epoll_wait](https://man7.org/linux/man-pages/man2/epoll_wait.2.html) calls |
| R7 | [Regression harness (L06)](lessons/06-regression-harness.md) passes — all 5 test categories | `./w09/test_harness.sh` → `5/5 tests passed` |
| R8 | Clean shutdown on [SIGTERM](https://man7.org/linux/man-pages/man7/signal.7.html) — all threads joined, all fds closed, all memory freed | `kill -TERM $PID` → process exits within 2 seconds, [Valgrind](https://valgrind.org/docs/manual/manual.html) reports 0 leaks |

## Graded Objectives

| Grade | Criteria |
|-------|----------|
| **Pass** | R1–R3: state machine, protocol, and error handling work for a single client |
| **Merit** | R4–R5: concurrent access is safe and counters are accurate |
| **Distinction** | R6–R8: full event-loop integration, regression harness, and clean shutdown |

## Constraints

- C only. No external [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) libraries.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) compile with `gcc -Wall -Wextra -Werror -pthread`.
- Workers [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) call [send()](https://man7.org/linux/man-pages/man2/send.2.html) or [recv()](https://man7.org/linux/man-pages/man2/recv.2.html) — only the [event loop](../w03/part.md) does IO.
- All [rwlocks](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be destroyed in shutdown.
- All [sockets](https://man7.org/linux/man-pages/man2/socket.2.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be [close()](https://man7.org/linux/man-pages/man2/close.2.html)d on every code path.
- The [hash table](https://en.wikipedia.org/wiki/Hash_table) [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) be replaced by a third-party implementation.

## Bonus Challenges

| Bonus | Description |
|-------|-------------|
| B1 | Key expiry — `SET key value EX 10` makes the key expire after 10 seconds. GET on an expired key returns `NOT_FOUND`. |
| B2 | KEYS command — return all keys matching a prefix pattern. Take a [read lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) while scanning. |
| B3 | Pipeline support — parse multiple commands from a single [read(2)](https://man7.org/linux/man-pages/man2/read.2.html) call and batch the responses. |
| B4 | Latency histogram — track p50, p95, p99 latency per operation type using a fixed-size bucket array. |

## Verification

```bash
# Build
gcc -Wall -Wextra -Werror -pthread -o kv_server \
  w09/kv_server.c w09/kv_store.c w09/kv_protocol.c \
  w09/kv_concurrent.c w09/kv_stats.c

# R1: correctness suite
gcc -Wall -Wextra -o kv_correctness_test \
  w09/kv_correctness_test.c w09/kv_store.c
./kv_correctness_test
# → 6/6 tests PASS

# R2 + R3: protocol
./kv_server 9099 &
PID=$!
echo "SET foo bar" | nc -q1 localhost 9099
# → OK
echo "GET foo" | nc -q1 localhost 9099
# → VALUE bar
echo "BADCMD" | nc -q1 localhost 9099
# → ERROR unknown command

# R5: stats
echo "STATS" | nc -q1 localhost 9099
# → gets:1 sets:1 dels:0 errors:1 keys:1 bytes:3

# R7: full harness
./w09/test_harness.sh
# → 5/5 tests passed

# R8: clean shutdown
kill -TERM $PID
wait $PID 2>/dev/null
echo "Exit: $?"
# → Exit: 0

# R4 + R8: helgrind
valgrind --tool=helgrind ./kv_server 9099 &
sleep 1
./w09/test_harness.sh
kill -TERM %1
wait
# → ERROR SUMMARY: 0 errors from 0 contexts
```

## Ship

```bash
git add w09/
git commit -m "w09 quest: single-node kv store with protocol, concurrency, stats, and harness"
```
