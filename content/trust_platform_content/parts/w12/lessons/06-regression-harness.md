---
id: w12-l06
title: "Regression Harness"
order: 6
type: lesson
duration_min: 50
---

# Regression Harness

## Goal

Build a [regression harness](https://en.wikipedia.org/wiki/Regression_testing) that validates every [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) invariant built in [L01](01-terms-voting.md)–[L05](05-split-brain-defense.md) with a single command.

## What you build

A `w12/test_harness.sh` shell script and a `w12/raft_full_test.c` test program that run six categories of tests: [election](https://en.wikipedia.org/wiki/Leader_election), [heartbeats](https://raft.github.io/raft.pdf), [idempotency](https://en.wikipedia.org/wiki/Idempotence), [redirect](https://raft.github.io/raft.pdf), [fencing](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html), and a full pipeline that combines all features. The harness prints a summary and exits with a non-zero code if any test fails.

## Why it matters

Individual tests verify single features, but bugs often hide in the interaction between features. A leader [election (L01)](01-terms-voting.md) followed by a client request with [idempotency (L03)](03-client-idempotency.md), a [redirect (L04)](04-redirect-rules.md), and a [fencing check (L05)](05-split-brain-defense.md) exercises the full code path. The [regression harness](https://en.wikipedia.org/wiki/Regression_testing) runs all of these together so you catch integration bugs before they reach production. Every serious systems project — [SQLite](https://www.sqlite.org/testing.html), [jepsen](https://jepsen.io/) — has a comprehensive test suite that runs before every commit.

---

## Training Session

### Warmup — Regression testing concepts

1. Read the first three paragraphs of [Regression testing](https://en.wikipedia.org/wiki/Regression_testing). Write down why tests [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be re-run after every change.
2. Read about [Jepsen](https://jepsen.io/) and how it tests distributed systems for [linearizability](https://en.wikipedia.org/wiki/Linearizability). Note that Jepsen found bugs in [etcd](https://etcd.io/), [CockroachDB](https://www.cockroachlabs.com/), and [Redis](https://redis.io/).
3. Review the [regression harness from W11 L06](../w11/lessons/06-regression-harness.md). Understand the pattern: compile, run each test category, count passes.
4. List the six invariants you need to test: one [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) per [term](https://raft.github.io/raft.pdf), heartbeat prevents [election](https://en.wikipedia.org/wiki/Leader_election), duplicate requests are skipped, [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) redirect to [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)), stale [leaders](https://en.wikipedia.org/wiki/Raft_(algorithm)) are fenced, and the full pipeline commits correctly.

### Work — Build the harness

#### Do

1. Create `w12/raft_full_test.c`. This program runs all six test categories in sequence. Each category is a function that returns 0 on success and -1 on failure.
2. Test 1 — Election: initialize a 3-node cluster, trigger an [election](https://en.wikipedia.org/wiki/Leader_election), and verify exactly one [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) exists with the correct [term](https://raft.github.io/raft.pdf). Reuse the logic from [L01](01-terms-voting.md).
3. Test 2 — Heartbeats: elect a [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)), run 20 ticks, and verify no [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) starts an [election](https://en.wikipedia.org/wiki/Leader_election). Reuse the logic from [L02](02-heartbeats.md).
4. Test 3 — Idempotency: send a request, then send the same request again. Verify the second is detected as a duplicate and the store has only one copy of the value. Reuse the logic from [L03](03-client-idempotency.md).
5. Test 4 — Redirect: connect a client to a [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)), verify it receives a `REDIRECT`, follow the redirect to the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)), and verify the request succeeds. Reuse the logic from [L04](04-redirect-rules.md).
6. Test 5 — Fencing: simulate a 5-node [partition](https://en.wikipedia.org/wiki/Network_partition), elect a new [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) on the majority side, heal the partition, and verify the stale leader is fenced. Reuse the logic from [L05](05-split-brain-defense.md).
7. Test 6 — Full pipeline: start a 3-node cluster, elect a [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)), process 10 client requests with [idempotency](https://en.wikipedia.org/wiki/Idempotence) and [redirect](https://raft.github.io/raft.pdf), kill the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)), wait for a new [election](https://en.wikipedia.org/wiki/Leader_election), resend the last request (which [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be deduplicated), and verify the cluster reaches the correct state.
8. At the end, print the summary: how many of the 6 tests passed. Return 0 from `main` only if all 6 pass.
9. Create `w12/test_harness.sh`. It compiles the test program, runs it, and prints the result. It exits with a non-zero status if the test program fails.

#### Test

```bash
chmod +x w12/test_harness.sh
./w12/test_harness.sh
```

#### Expected

```
compiling raft_full_test...
running tests...
[test 1] election.................. PASS
[test 2] heartbeats................ PASS
[test 3] idempotency............... PASS
[test 4] redirect.................. PASS
[test 5] fencing................... PASS
[test 6] full pipeline............. PASS
-------------------------------
6/6 tests passed
```

### Prove — Deeper understanding

Answer in your own words:

1. Why is the full-pipeline test (test 6) more valuable than running tests 1–5 independently?
2. What would a [Jepsen](https://jepsen.io/)-style test add beyond what this harness covers?
3. Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the harness exit with a non-zero status on failure?

### Ship

```bash
git add w12/raft_full_test.c w12/test_harness.sh
git commit -m "w12-l06: regression harness for all Raft invariants"
```

---

## Done when

- `w12/raft_full_test.c` runs 6 test categories and prints results.
- `w12/test_harness.sh` compiles and runs the test, exits non-zero on failure.
- All 6 tests pass: election, heartbeats, idempotency, redirect, fencing, and full pipeline.
- The full-pipeline test includes a leader crash and re-election.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Running tests in parallel | Tests share global state (ports, sockets). Run them sequentially to avoid [race conditions](https://en.wikipedia.org/wiki/Race_condition). |
| Not cleaning up child processes between tests | A leftover process from test 1 [listening](https://man7.org/linux/man-pages/man2/listen.2.html) on a port causes test 2 to fail with `EADDRINUSE`. Kill all children after each test. |
| Hardcoding sleep durations | Use short, deterministic ticks in the test instead of `sleep()`. Real-time sleeps make tests slow and flaky. |
| Ignoring the exit code in `test_harness.sh` | If the script always exits 0, CI pipelines will not catch failures. Use `set -e` or check `$?` explicitly. |

## Proof

```bash
./w12/test_harness.sh
# → compiling raft_full_test...
# → running tests...
# → [test 1] election.................. PASS
# → [test 2] heartbeats................ PASS
# → [test 3] idempotency............... PASS
# → [test 4] redirect.................. PASS
# → [test 5] fencing................... PASS
# → [test 6] full pipeline............. PASS
# → -------------------------------
# → 6/6 tests passed
```

## 🖼️ Hero Visual

```
  Regression harness coverage:

  ┌──────────────────────────────────────────────────────────┐
  │                    test_harness.sh                       │
  │                                                          │
  │  ┌──────┐ ┌──────────┐ ┌───────────┐ ┌────────┐        │
  │  │ L01  │ │   L02    │ │    L03    │ │  L04   │        │
  │  │elect │ │heartbeat │ │ idemp.    │ │redirect│        │
  │  └──┬───┘ └────┬─────┘ └─────┬─────┘ └───┬────┘        │
  │     │          │              │            │             │
  │  ┌──┴───┐ ┌───┴──────────────┴────────────┴────┐       │
  │  │ L05  │ │           L06 full pipeline         │       │
  │  │fence │ │  elect → HB → request → redirect   │       │
  │  └──────┘ │  → dedup → kill leader → re-elect  │       │
  │           └─────────────────────────────────────┘       │
  │                                                          │
  │  result: 6/6 PASS                                       │
  └──────────────────────────────────────────────────────────┘
```

## 🔮 Future Lock

- In [W12 Quest](../w12/quest.md) you will extend this harness to cover the full integrated [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) system with [KV store (W09)](../w09/part.md) and [WAL (W10)](../w10/part.md) integration.
- In [W20](../w20/part.md) you will add [chaos engineering](https://en.wikipedia.org/wiki/Chaos_engineering) tests that inject random failures (process kills, network delays, disk errors) while the harness verifies the system remains correct.
- The harness pattern you build here will be reused in every subsequent week as the foundation for [continuous integration](https://en.wikipedia.org/wiki/Continuous_integration) testing.
