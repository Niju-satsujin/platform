---
id: w20-quiz
title: "Week 20 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 20 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – Failure matrix purpose

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) you build a [failure matrix](lessons/01-failure-matrix.md) before running [chaos drills](lessons/02-chaos-drills.md)?

- A) Because the compiler requires it
- B) Because without a plan of expected failures and recovery paths, you cannot tell whether a drill passed or failed — you have no expected outcome to compare against
- C) Because [Netflix Chaos Monkey](https://netflix.github.io/chaosmonkey/) requires a matrix file as input
- D) Because the [failure matrix](lessons/01-failure-matrix.md) makes the system faster

---

### Q2 – SIGKILL vs SIGTERM

Why does the [chaos drill runner (L02)](lessons/02-chaos-drills.md) use [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html) instead of [SIGTERM](https://man7.org/linux/man-pages/man7/signal.7.html) for process crash injection?

- A) [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html) is faster
- B) [SIGTERM](https://man7.org/linux/man-pages/man7/signal.7.html) can be caught and handled gracefully — the process gets cleanup time. [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html) cannot be caught, simulating a real crash or [OOM kill](https://man7.org/linux/man-pages/man5/proc.5.html) where no cleanup runs
- C) [SIGTERM](https://man7.org/linux/man-pages/man7/signal.7.html) only works on root-owned processes
- D) [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html) uses less memory

---

### Q3 – kill(2) semantics

What does [kill(pid, 0)](https://man7.org/linux/man-pages/man2/kill.2.html) do?

- A) It kills the process with signal 0
- B) It sends no signal but checks whether the process exists and the caller has permission to signal it — used as a health check in the [chaos drill runner](lessons/02-chaos-drills.md)
- C) It pauses the process
- D) It restarts the process

---

### Q4 – RTO definition

What does [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) measure in the context of [recovery objectives (L03)](lessons/03-recovery-objectives.md)?

- A) The amount of data lost during a failure
- B) The maximum acceptable time between the fault injection and the system returning to steady state
- C) The number of processes restarted
- D) The size of the [WAL (W10)](../w10/part.md) in bytes

---

### Q5 – RPO and fsync

Why does setting [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) to zero records require [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) on every commit?

- A) Because [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) is the only way to write data
- B) Without [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html), committed data may sit in the OS buffer cache. A crash loses buffered data, violating the zero-loss guarantee
- C) Because [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) stands for "really persistent output"
- D) Because the [Merkle tree (W15)](../w15/part.md) requires it

---

### Q6 – Data safety check order

In the [data safety checker (L04)](lessons/04-data-safety-checks.md), why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the [WAL](../w10/part.md) be replayed before the [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree) is checked?

- A) Because the [WAL](../w10/part.md) is smaller than the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree)
- B) Because the [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree) is computed from the recovered data — if you check it before replaying the [WAL](../w10/part.md), the data is incomplete and the root will not match
- C) Because [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) requires it
- D) Because the [anchor chain (W18)](../w18/part.md) depends on the [WAL](../w10/part.md) order

---

### Q7 – Playbook drill_tested flag

What does the `drill_tested` flag in the [operator playbook (L05)](lessons/05-operator-playbook.md) prove?

- A) That the operator has read the playbook
- B) That the recovery procedure for this [failure mode](lessons/01-failure-matrix.md) has been validated by an actual [chaos drill](lessons/02-chaos-drills.md) — not just written down
- C) That the system has never failed
- D) That the [monitor (W16)](../w16/part.md) is configured

---

### Q8 – CLOCK_MONOTONIC

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the [chaos drill runner (L02)](lessons/02-chaos-drills.md) use [CLOCK_MONOTONIC](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) instead of [CLOCK_REALTIME](https://man7.org/linux/man-pages/man2/clock_gettime.2.html)?

- A) [CLOCK_MONOTONIC](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) is faster
- B) [CLOCK_REALTIME](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) can jump forward or backward due to [NTP](https://en.wikipedia.org/wiki/Network_Time_Protocol) adjustments, making elapsed time measurements unreliable. [CLOCK_MONOTONIC](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) only moves forward
- C) [CLOCK_REALTIME](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) does not work on Linux
- D) [CLOCK_MONOTONIC](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) measures CPU time only

---

### Q9 – Short answer: Chaos engineering principle

In one or two sentences, explain the first [principle of chaos engineering](https://principlesofchaos.org/): "Build a hypothesis around steady-state behavior." Why must you define steady state before injecting faults?

---

### Q10 – Short answer: Partial WAL entry

After a [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html) drill, the [data safety checker](lessons/04-data-safety-checks.md) finds a half-written entry at the end of the [WAL (W10)](../w10/part.md). Is this data corruption? Explain why or why not.

---

### Q11 – Short answer: Playbook coverage gap

The [operator playbook (L05)](lessons/05-operator-playbook.md) shows 4 out of 6 entries are drill-tested (67% coverage). The two untested entries are `network_partition` and `oom_kill`. What risk does this gap represent, and what should the team do?

---

### Q12 – Short answer: RTO vs RPO tradeoff

A team sets [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) to 100 ms and [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective) to 0 records. Their [WAL (W10)](../w10/part.md) has 10,000 entries to replay and each replay takes 0.1 ms. Can they meet both objectives? Explain the math.

---

### Q13 – Read the output

A developer runs the [chaos drill runner](lessons/02-chaos-drills.md) and sees:

```
[drill] fault=process_crash target_pid=54321
[drill] pre_state=OK
[drill] injected SIGKILL at t=0.000s
[drill] post_state=OK
[drill] elapsed=12ms verdict=UNEXPECTED
```

Why is the verdict `UNEXPECTED`? What went wrong?

---

### Q14 – Read the output

A developer runs the full [regression harness](lessons/06-regression-harness.md) and sees:

```
test_matrix_add            PASS
test_matrix_lookup         PASS
test_matrix_lookup_missing PASS
test_drill_sigkill         PASS
test_drill_disk_full       PASS
test_drill_corrupt         PASS
test_rto_pass              PASS
test_rto_fail              PASS
test_rpo_pass              PASS
test_rpo_fail              PASS
test_wal_replay_ok         PASS
test_merkle_root_ok        PASS
test_anchor_chain_ok       PASS
test_wal_corrupt_detected  FAIL
test_playbook_generate     PASS
test_playbook_coverage     PASS
15/16 passed, 1 failed
```

The `test_wal_corrupt_detected` test failed. What does this mean, and why is it dangerous to ignore?
