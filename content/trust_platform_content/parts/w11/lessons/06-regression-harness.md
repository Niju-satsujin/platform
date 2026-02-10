---
id: w11-l06
title: "Regression Harness"
order: 6
type: lesson
duration_min: 40
---

# Regression Harness

## Goal

Build an automated [regression harness](https://en.wikipedia.org/wiki/Regression_testing) that tests every part of the [replication](https://en.wikipedia.org/wiki/Replication_(computing)) system — leader-follower setup, [log shipping](https://en.wikipedia.org/wiki/Replication_(computing)), [quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) acknowledgment, [conflict resolution](https://en.wikipedia.org/wiki/Eventual_consistency), follower failure, and follower rejoin — in a single script. Run it on every build to prove nothing is broken.

## What you build

A shell script `w11/test_harness.sh` that compiles all components, runs 6 test categories, counts passes and failures, and exits with a non-zero code if any test fails. You also write a C test runner `w11/repl_full_test.c` that exercises the end-to-end replication flow: write records on the leader, ship to followers, collect quorum acks, resolve conflicts, crash a follower, rejoin it, and verify all stores match.

## Why it matters

A [replication](https://en.wikipedia.org/wiki/Replication_(computing)) system has many moving parts — encoding, networking, quorum logic, conflict resolution, failure detection, and catch-up replay. A bug in any one of these can cause silent data loss or divergence between replicas. The [regression harness](https://en.wikipedia.org/wiki/Regression_testing) catches that before it reaches production. In [W10 L06](../../../parts/w10/lessons/06-regression-harness.md) you built a harness for the [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) — this one protects the replication layer on top of it.

---

## Training Session

### Warmup — Test categories

1. List the 5 components built in [L01](01-replication-goal.md) through [L05](05-failure-handling.md): leader-follower connect, log shipping, quorum ack, conflict resolution, and failure rejoin.
2. For each component, write down one thing that could break silently. Example: a wrong [quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) formula could let the leader commit with too few acks.
3. Read the man page for [trap](https://man7.org/linux/man-pages/man1/trap.1p.html). Recall from [W10 L06](../../../parts/w10/lessons/06-regression-harness.md) how `trap cleanup EXIT` ensures child processes are killed and temp files are removed.

### Work — Build the harness

#### Do

1. Create `w11/repl_full_test.c`. This is the end-to-end C test runner.
2. Write test 1 — connectivity: start a leader and 2 followers, exchange heartbeats. Verify all 3 nodes are connected.
3. Write test 2 — log shipping: the leader ships 10 SET records to both followers. Verify both followers have 10 keys matching the leader's store.
4. Write test 3 — quorum ack: ship 5 records with `repl_wait_quorum()`. Verify the leader received Q acks for each record before replying OK.
5. Write test 4 — conflict resolution: send two records for the same key with different timestamps in reverse order to one follower. Verify the follower keeps the higher-timestamp value.
6. Write test 5 — failure and rejoin: ship 5 records, kill follower-2, ship 5 more, restart follower-2 and catch it up. Verify follower-2 has all 10 keys matching the leader.
7. Write test 6 — full pipeline: combine shipping, quorum, conflict resolution, and rejoin in one sequence of 20 records with one mid-sequence follower crash. Verify all stores converge after rejoin.
8. Print a summary: `6/6 tests passed` or the count of failures.
9. Create `w11/test_harness.sh`. Add `set -e` and a [trap](https://man7.org/linux/man-pages/man1/trap.1p.html) on EXIT that kills all child processes and removes temp files.
10. The script compiles every C file with `gcc -Wall -Wextra -Werror`. Runs `repl_full_test`. Checks the exit code. Prints the final result.

#### Test

```bash
chmod +x w11/test_harness.sh
./w11/test_harness.sh
```

#### Expected

```
[build] compiling replication components... ok
[test 1] leader-follower connectivity... PASS
[test 2] log shipping (10 records)... PASS
[test 3] quorum acknowledgment... PASS
[test 4] conflict resolution (LWW)... PASS
[test 5] failure and rejoin... PASS
[test 6] full pipeline (20 records + crash)... PASS
6/6 tests passed
```

### Prove — Harness completeness

Answer in your own words:

1. Why does test 6 combine all components instead of testing them separately?
2. What would happen if you removed test 4 and someone accidentally broke the timestamp comparison in `repl_resolve_conflict()`?
3. Why does the harness need to kill child processes in the [trap](https://man7.org/linux/man-pages/man1/trap.1p.html)? What happens if forked follower processes outlive the test?

### Ship

```bash
git add w11/repl_full_test.c w11/test_harness.sh
git commit -m "w11-l06: regression harness for replication system"
```

---

## Done when

- `repl_full_test.c` runs 6 test categories and prints `6/6 tests passed`.
- `test_harness.sh` compiles with `-Wall -Wextra -Werror`, runs the test, and exits 0 on success.
- The [trap](https://man7.org/linux/man-pages/man1/trap.1p.html) kills all child processes and cleans up temp files on any exit path.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero leaks on the full test.
- Breaking any one component causes at least one test to fail.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not killing child processes in the trap | Forked followers keep running and hold ports open. Use `kill $(jobs -p)` or track PIDs and kill them in the cleanup function. |
| Hardcoding port numbers that conflict with other tests | Use unique ports per test run or per test category. Port conflicts cause `EADDRINUSE` and false failures. |
| No sleep between fork and connect | The leader may try to connect before the follower calls [listen(2)](https://man7.org/linux/man-pages/man2/listen.2.html). Add a small sleep or a retry loop with backoff. |
| Shared WAL files between tests | Each test [MUST](https://datatracker.ietf.org/doc/html/rfc2119) start with fresh WAL files. Delete or use unique filenames to avoid cross-test contamination. |

## Proof

```bash
./w11/test_harness.sh
# → [build] compiling replication components... ok
# → [test 1] leader-follower connectivity... PASS
# → [test 2] log shipping (10 records)... PASS
# → [test 3] quorum acknowledgment... PASS
# → [test 4] conflict resolution (LWW)... PASS
# → [test 5] failure and rejoin... PASS
# → [test 6] full pipeline (20 records + crash)... PASS
# → 6/6 tests passed

valgrind --leak-check=full ./repl_full_test
# → All heap blocks were freed -- no leaks are possible
# → ERROR SUMMARY: 0 errors from 0 contexts
```

## 🖼️ Hero Visual

```
  test_harness.sh
  ┌──────────────────────────────────────────────────────────┐
  │ set -e                                                    │
  │ trap cleanup EXIT                                         │
  │                                                           │
  │ gcc -Wall -Wextra -Werror ... -o repl_full_test           │
  │                                                           │
  │ ./repl_full_test                                          │
  │  ├── test 1: connectivity ................. PASS          │
  │  ├── test 2: log shipping ................. PASS          │
  │  ├── test 3: quorum ack ................... PASS          │
  │  ├── test 4: conflict resolution .......... PASS          │
  │  ├── test 5: failure + rejoin ............. PASS          │
  │  └── test 6: full pipeline ................ PASS          │
  │                                                           │
  │ 6/6 tests passed                                          │
  │ exit 0                                                    │
  └──────────────────────────────────────────────────────────┘
```

## 🔮 Future Lock

- In [W12](../../../parts/w12/part.md) you will extend this harness to test [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) leader election — killing the leader and verifying a follower takes over.
- In [W15](../../../parts/w15/part.md) the harness pattern will verify that replicated [transparency log](https://en.wikipedia.org/wiki/Certificate_Transparency) entries are tamper-evident across all nodes.
- In [W20](../../../parts/w20/part.md) [chaos drills](https://en.wikipedia.org/wiki/Chaos_engineering) will run this harness under injected network partitions, process kills, and clock skew to find edge cases.
- As you add more replication features, new tests [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be added to this harness to maintain coverage.
