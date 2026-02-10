---
id: w20-quest
title: "Quest – Full Chaos Testing Framework"
order: 7
type: quest
duration_min: 90
---

# Quest – Full Chaos Testing Framework

## Mission

Build a complete [chaos testing framework](part.md). A [failure matrix](lessons/01-failure-matrix.md) catalogues every fault. A [chaos drill runner](lessons/02-chaos-drills.md) injects each fault into a running system. A [recovery objectives validator](lessons/03-recovery-objectives.md) enforces [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) and [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective). A [data safety checker](lessons/04-data-safety-checks.md) verifies the [WAL (W10)](../w10/part.md), [Merkle roots (W15)](../w15/part.md), and [anchor chain (W18)](../w18/part.md) after every drill. An [operator playbook](lessons/05-operator-playbook.md) is generated from the results. The [regression harness](lessons/06-regression-harness.md) gates the build on 100% drill pass rate and 100% playbook coverage.

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | [Failure matrix](lessons/01-failure-matrix.md) contains at least 6 failure modes covering [WAL (W10)](../w10/part.md), [log (W15)](../w15/part.md), [anchors (W18)](../w18/part.md), and [event loop (W03)](../w03/part.md) | `failure_matrix_print()` shows 6+ rows with all fields filled |
| R2 | [SIGKILL drill](lessons/02-chaos-drills.md) kills a child process using [kill(2)](https://man7.org/linux/man-pages/man2/kill.2.html) and records timestamps | Fork child, run drill, verify child is dead and timestamps are non-zero |
| R3 | [Disk-full drill](lessons/02-chaos-drills.md) fills a directory and verifies writes fail | Create a small tmpfs, fill it, attempt write → `ENOSPC` |
| R4 | [Corrupt-write drill](lessons/02-chaos-drills.md) flips a byte and the [data safety checker](lessons/04-data-safety-checks.md) detects it | Flip byte in WAL file → `data_safety_check_wal()` returns `FAIL` |
| R5 | [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) validation passes when recovery time is within the limit | Simulated 120 ms recovery vs 500 ms RTO → `rto_pass=1` |
| R6 | [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) validation fails when recovery time exceeds the limit | Simulated 800 ms recovery vs 500 ms RTO → `rto_pass=0` |
| R7 | [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) validation passes with zero data loss after [WAL](../w10/part.md) recovery | 10 committed entries, 10 recovered → `rpo_pass=1` |
| R8 | [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) validation fails when committed records are missing | 10 committed, 7 recovered → `rpo_pass=0` |
| R9 | [WAL replay](../w10/part.md) safety check passes on a clean WAL | `data_safety_check_wal()` returns `wal_replay_ok=1` |
| R10 | [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree) safety check passes when roots match | `data_safety_check_merkle()` returns `merkle_root_ok=1` |
| R11 | [Anchor chain](../w18/lessons/03-consistency-proof.md) safety check passes on a consistent chain | `data_safety_check_anchors()` returns `anchor_chain_ok=1` |
| R12 | [Operator playbook](lessons/05-operator-playbook.md) is generated with one entry per failure mode | `playbook.count == failure_matrix.count` |
| R13 | [Playbook coverage](lessons/05-operator-playbook.md) reaches 100% after all drills pass | `playbook_coverage()` returns 100 |
| R14 | Full [regression harness](lessons/06-regression-harness.md) passes (16/16 tests) | `./chaos_harness` exits 0 |
| R15 | End-to-end cycle: inject fault → recover → validate data → update playbook → verify coverage | Single function call runs the full pipeline for one failure mode |
| R16 | [strace](https://man7.org/linux/man-pages/man1/strace.1.html) confirms [kill(2)](https://man7.org/linux/man-pages/man2/kill.2.html) is called with signal 9 during the SIGKILL drill | `strace -e kill ./chaos_harness 2>&1 | grep 'kill.*9'` shows the syscall |

## Constraints

- C only. No external chaos engineering libraries.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) compile with `gcc -Wall -Wextra -Werror -lcrypto`.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) use [kill(2)](https://man7.org/linux/man-pages/man2/kill.2.html) for process fault injection — no wrapper scripts.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) use [clock_gettime(CLOCK_MONOTONIC)](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) for all timing measurements.
- Drills [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) affect the parent (harness) process — only fork children or use isolated directories.
- The [WAL (W10)](../w10/part.md), [transparency log (W15)](../w15/part.md), and [anchor store (W18)](../w18/part.md) from earlier weeks are reused as libraries — do not rewrite them.

## Bonus challenges

| Bonus | Description |
|-------|-------------|
| B1 | Network partition drill — use [iptables](https://man7.org/linux/man-pages/man8/iptables.8.html) to block traffic to the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) and verify the [anchor store (W18)](../w18/part.md) handles the timeout correctly |
| B2 | Slow-disk drill — inject [sleep()](https://man7.org/linux/man-pages/man3/sleep.3.html) into the IO path using [LD_PRELOAD](https://man7.org/linux/man-pages/man8/ld.so.8.html) and measure whether [backpressure (W06)](../w06/part.md) engages |
| B3 | Cascading failure — inject two faults simultaneously (process crash + disk full) and verify the system recovers from both |
| B4 | Playbook export — write the [operator playbook](lessons/05-operator-playbook.md) to a [Markdown](https://en.wikipedia.org/wiki/Markdown) file with a table of contents, so it can be published as documentation |

## Verification

```bash
# Build
gcc -Wall -Wextra -Werror -o chaos_harness \
  w20/chaos_harness.c w20/failure_matrix.c w20/chaos_drill.c \
  w20/recovery_objectives.c w20/data_safety.c w20/playbook.c \
  w10/wal.c w15/log.c w15/merkle.c w18/anchor_record.c \
  w18/anchor_consistency.c w18/anchor_storage.c -lcrypto

# R1: failure matrix
./chaos_harness matrix-print
# → NAME            | COMPONENT       | METHOD    | IMPACT                  | RECOVERY
# → process_crash   | wal (w10)       | SIGKILL   | incomplete WAL entry    | wal_recover()
# → disk_full       | anchor (w18)    | fallocate | anchor write fails      | anchor_recover()
# → network_partition| witness         | iptables  | cosignature timeout     | retry_publish()
# → corrupt_write   | log (w15)       | byte flip | Merkle root mismatch   | log_rebuild()
# → slow_disk       | wal (w10)       | sleep     | write latency spike     | backpressure (w06)
# → oom_kill        | event_loop (w03)| cgroup    | process terminated      | restart + wal_recover()

# R2: SIGKILL drill
./chaos_harness drill process_crash
# → [drill] fault=process_crash target_pid=54321
# → [drill] pre_state=OK
# → [drill] injected SIGKILL at t=0.000s
# → [drill] post_state=DEAD
# → [drill] elapsed=0ms

# R3: disk-full drill
./chaos_harness drill disk_full
# → [drill] fault=disk_full target=/tmp/chaos_test_XXXXXX
# → [drill] disk filled, write attempt → ENOSPC
# → [drill] cleaned up fill file

# R4: corrupt-write + safety check
./chaos_harness drill corrupt_write
# → [drill] flipped byte at offset 42
# → [safety] WAL replay: FAIL (CRC mismatch at entry 4)

# R5 + R6: RTO validation
./chaos_harness rto-check process_crash
# → [rto/rpo] RTO objective=500ms actual=120ms PASS

# R7 + R8: RPO validation
./chaos_harness rpo-check process_crash
# → [rto/rpo] RPO objective=0 actual=0 PASS

# R9–R11: data safety checks
./chaos_harness safety-check /tmp/chaos_data
# → [safety] WAL replay: OK
# → [safety] Merkle root: OK
# → [safety] Anchor chain: OK
# → [safety] overall: PASS

# R12 + R13: playbook generation and coverage
./chaos_harness playbook
# → Generated 6 playbook entries
# → [running all drills...]
# → coverage: 100% (6/6 tested)

# R14: full regression
./chaos_harness
# → 16/16 passed

# R15: end-to-end cycle
./chaos_harness e2e process_crash
# → [e2e] inject process_crash → recover → validate data → update playbook
# → [e2e] result: PASS

# R16: strace verification
strace -e kill ./chaos_harness drill process_crash 2>&1 | grep 'kill.*9'
# → kill(54321, SIGKILL) = 0
```

## Ship

```bash
git add w20/
git commit -m "w20 quest: full chaos testing framework with recovery validation"
```
