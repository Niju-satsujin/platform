---
id: w12-quest
title: "Quest — Simplified Raft"
order: 7
type: quest
duration_min: 90
---

# Quest — Simplified Raft

## Mission

Integrate all six lessons into a complete simplified [Raft consensus](https://en.wikipedia.org/wiki/Raft_(algorithm)) system. The cluster of three (or five) nodes holds [elections](https://en.wikipedia.org/wiki/Leader_election) using [term numbers](https://raft.github.io/raft.pdf) and [RequestVote RPCs](https://raft.github.io/raft.pdf). The elected [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) sends [AppendEntries](https://raft.github.io/raft.pdf) heartbeats to keep [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) in sync. Client requests carry [idempotency](https://en.wikipedia.org/wiki/Idempotence) keys so retries are safe. [Followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) redirect clients to the current [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)). [Split-brain](https://en.wikipedia.org/wiki/Split-brain_(computing)) is prevented with [fencing tokens](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) derived from the [term](https://raft.github.io/raft.pdf). The full [regression harness](https://en.wikipedia.org/wiki/Regression_testing) validates every invariant.

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | [Election](https://en.wikipedia.org/wiki/Leader_election) — one [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) elected per [term](https://raft.github.io/raft.pdf) via [RequestVote](https://raft.github.io/raft.pdf), no double votes | [Election test (L01)](lessons/01-terms-voting.md) — correct winner and term |
| R2 | [Heartbeats](https://raft.github.io/raft.pdf) — [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) sends [AppendEntries](https://raft.github.io/raft.pdf) at regular intervals, [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) reset timeout | [Heartbeat test (L02)](lessons/02-heartbeats.md) — no spurious elections in 20 ticks |
| R3 | [Idempotency](https://en.wikipedia.org/wiki/Idempotence) — duplicate requests detected and skipped, gaps rejected | [Idempotency test (L03)](lessons/03-client-idempotency.md) — DUPLICATE on retry, ERROR on gap |
| R4 | [Redirect](https://raft.github.io/raft.pdf) — [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) redirect clients to the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)), unknown-leader case handled | [Redirect test (L04)](lessons/04-redirect-rules.md) — client follows redirect successfully |
| R5 | [Fencing](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) — stale [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) commands rejected by [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) using [fencing tokens](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) | [Split-brain test (L05)](lessons/05-split-brain-defense.md) — stale leader fenced off |
| R6 | Full pipeline — [election](https://en.wikipedia.org/wiki/Leader_election) → heartbeats → client write with [redirect](https://raft.github.io/raft.pdf) and [idempotency](https://en.wikipedia.org/wiki/Idempotence) → leader crash → re-election → retry is deduplicated | [Full test (L06)](lessons/06-regression-harness.md) — end-to-end scenario passes |
| R7 | [Regression harness](https://en.wikipedia.org/wiki/Regression_testing) passes all 6 test categories | `./w12/test_harness.sh` → `6/6 tests passed` |
| R8 | Zero memory leaks, no [undefined behavior](https://en.wikipedia.org/wiki/Undefined_behavior) | [Valgrind](https://valgrind.org/docs/manual/manual.html) reports 0 leaks, 0 errors |

## Graded Objectives

| Grade | Criteria |
|-------|----------|
| **Pass** | R1–R3: election, heartbeats, and idempotency work correctly |
| **Merit** | R4–R5: redirect and split-brain defense work. R6 full pipeline passes. |
| **Distinction** | R7–R8: full harness passes and zero memory leaks |

## Constraints

- C only. No external [consensus](https://en.wikipedia.org/wiki/Consensus_(computer_science)) or [RPC](https://en.wikipedia.org/wiki/Remote_procedure_call) libraries.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) compile with `gcc -Wall -Wextra -Werror`.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reuse the [WAL record codec (W10)](../w10/lessons/01-record-format-checksum.md) and [replication layer (W11)](../w11/part.md) — do not rewrite them.
- All [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) connections [MUST](https://datatracker.ietf.org/doc/html/rfc2119) use [SO_REUSEADDR](https://man7.org/linux/man-pages/man7/socket.7.html).
- The [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) accept writes after its [term](https://raft.github.io/raft.pdf) has been superseded.
- Client requests [MUST](https://datatracker.ietf.org/doc/html/rfc2119) carry `client_id` and `sequence_number` for [deduplication](https://en.wikipedia.org/wiki/Data_deduplication).

## Bonus Challenges

| Bonus | Description |
|-------|-------------|
| B1 | Pre-vote — implement a [pre-vote phase](https://raft.github.io/raft.pdf) where a node checks if it can win before incrementing the [term](https://raft.github.io/raft.pdf), reducing disruptive elections. |
| B2 | Leader lease — the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) serves reads locally without contacting [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) if it has received heartbeat acks within the lease window. Measure read latency improvement. |
| B3 | Persistent state — write `current_term` and `voted_for` to disk before responding to any [RPC](https://en.wikipedia.org/wiki/Remote_procedure_call). Verify that a node that crashes and restarts does not vote twice. |
| B4 | Five-node cluster — scale the test to 5 nodes and verify that the system tolerates 2 simultaneous node failures (a [majority](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) of 3 still functions). |

## Verification

```bash
# Build everything
gcc -Wall -Wextra -Werror -o raft_full_test \
  w12/raft_full_test.c w12/fencing.c w12/raft_redirect.c \
  w12/dedup_table.c w12/raft_heartbeat.c w12/raft_state.c

# Run the harness
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

# Memory safety
valgrind --leak-check=full ./raft_full_test
# → All heap blocks were freed -- no leaks are possible
# → ERROR SUMMARY: 0 errors from 0 contexts
```

## Ship

```bash
git add w12/
git commit -m "w12 quest: simplified Raft with election, heartbeats, idempotency, redirect, and fencing"
```
