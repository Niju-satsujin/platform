---
id: w20-l02
title: "Chaos Drills"
order: 2
type: lesson
duration_min: 45
---

# Chaos Drills

## Goal

Build a [chaos drill](https://principlesofchaos.org/) runner that takes a [failure mode](01-failure-matrix.md) from the matrix, injects the real fault into a running system, waits for the system to recover, and records the outcome.

## What you build

A `struct chaos_drill` that holds six fields: `struct failure_mode mode` (the fault to inject, from the [failure matrix (L01)](01-failure-matrix.md)), `pid_t target_pid` (the process to attack), `int pre_state_ok` (whether a steady-state check passed before injection), `int post_state_ok` (whether the steady-state check passed after recovery), `struct timespec inject_time` (when the fault was injected), and `struct timespec recover_time` (when recovery completed). A `chaos_drill_run()` function that: (1) captures steady state by running a health check, (2) injects the fault using the method named in the [failure mode](01-failure-matrix.md), (3) waits for the system to recover or times out, (4) captures steady state again, and (5) returns the completed `chaos_drill` struct. A `chaos_inject_sigkill()` helper that sends [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html) to the target using [kill(2)](https://man7.org/linux/man-pages/man2/kill.2.html). A `chaos_inject_disk_full()` helper that fills the target directory using [fallocate()](https://man7.org/linux/man-pages/man2/fallocate.2.html). A `chaos_inject_corrupt_write()` helper that flips a byte in a target file. A `chaos_drill_report()` function that prints the drill result: fault name, injection time, recovery time, elapsed milliseconds, and pass/fail.

## Why it matters

Reading about failure is not the same as experiencing it. [Netflix Chaos Monkey](https://netflix.github.io/chaosmonkey/) kills random production instances to prove that services survive. Your drill runner does the same thing in a controlled test environment. By automating fault injection, you turn "I think recovery works" into "I proved recovery works in 47 ms with zero data loss." The results feed directly into [recovery objective validation (L03)](03-recovery-objectives.md).

---

## Training Session

### Warmup

Read the [kill(2)](https://man7.org/linux/man-pages/man2/kill.2.html) man page. Write down:

1. What happens when a process receives [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html) — can it be caught or ignored?
2. Why [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html) is a realistic fault injection — it simulates a power loss or [OOM kill](https://man7.org/linux/man-pages/man5/proc.5.html).

### Work

#### Do

1. Create `w20/chaos_drill.h`.
2. Define `struct chaos_drill` with the six fields described above.
3. Create `w20/chaos_drill.c`.
4. Write `chaos_inject_sigkill()`:
   - Accept a [pid_t](https://man7.org/linux/man-pages/man2/kill.2.html).
   - Call [kill(pid, SIGKILL)](https://man7.org/linux/man-pages/man2/kill.2.html).
   - Return 0 on success, -1 on failure (check [errno](https://man7.org/linux/man-pages/man3/errno.3.html)).
5. Write `chaos_inject_disk_full()`:
   - Accept a directory path.
   - Create a large file using [fallocate()](https://man7.org/linux/man-pages/man2/fallocate.2.html) to consume all free space on the target [filesystem](https://en.wikipedia.org/wiki/File_system).
   - Return 0 on success.
6. Write `chaos_inject_corrupt_write()`:
   - Accept a file path and an offset.
   - Open the file, seek to the offset, flip one byte using XOR `0xFF`, close the file.
   - Return 0 on success.
7. Write `chaos_check_steady_state()`:
   - Accept a [pid_t](https://man7.org/linux/man-pages/man2/kill.2.html).
   - Send signal 0 with [kill(pid, 0)](https://man7.org/linux/man-pages/man2/kill.2.html) to check the process is alive.
   - Return 1 if alive, 0 if not.
8. Write `chaos_drill_run()`:
   - Record `inject_time` using [clock_gettime(CLOCK_MONOTONIC)](https://man7.org/linux/man-pages/man2/clock_gettime.2.html).
   - Run `chaos_check_steady_state()` and store in `pre_state_ok`.
   - Call the appropriate injection function based on `mode.signal_or_method`.
   - Poll for recovery: in a loop, sleep 10 ms and re-check steady state. Time out after a configurable limit.
   - Record `recover_time`.
   - Run `chaos_check_steady_state()` again and store in `post_state_ok`.
   - Return the filled `chaos_drill` struct.
9. Write `chaos_drill_report()`:
   - Print the drill result as one structured block: fault name, component, injection time, recovery time, elapsed milliseconds, pre/post state, and a `PASS` or `FAIL` verdict.
10. Write a `main()` test:
    - Fork a child process that writes to a temporary file in a loop.
    - Run a `process_crash` drill against the child using [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html).
    - Print the drill report.

#### Test

```bash
gcc -Wall -Wextra -Werror -o chaos_drill_test \
  w20/chaos_drill.c w20/failure_matrix.c
./chaos_drill_test
```

#### Expected

The child process is killed. The drill report shows `pre_state_ok=1`, `post_state_ok=0` (the process did not restart itself), injection and recovery timestamps, and elapsed time. No crashes in the parent.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./chaos_drill_test
```

Zero errors, zero leaks (excluding the killed child).

### Ship It

```bash
git add w20/chaos_drill.h w20/chaos_drill.c
git commit -m "w20-l02: chaos drill runner with SIGKILL and disk-full injection"
```

---

## Done when

- `chaos_inject_sigkill()` sends [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html) to a target process using [kill(2)](https://man7.org/linux/man-pages/man2/kill.2.html).
- `chaos_inject_disk_full()` fills a directory to capacity.
- `chaos_inject_corrupt_write()` flips a byte at a given offset.
- `chaos_drill_run()` captures steady state before and after injection and records timestamps.
- `chaos_drill_report()` prints a readable drill result with elapsed time and verdict.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Sending [SIGTERM](https://man7.org/linux/man-pages/man7/signal.7.html) instead of [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html) | [SIGTERM](https://man7.org/linux/man-pages/man7/signal.7.html) can be caught and handled gracefully. Real crashes are [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html) — the process gets no cleanup. Use [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html) for realistic drills. |
| Not recording timestamps | Without timestamps you cannot compute [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective). Use [clock_gettime(CLOCK_MONOTONIC)](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) — not wall clock — to avoid [NTP](https://en.wikipedia.org/wiki/Network_Time_Protocol) jumps. |
| Forgetting to clean up the disk-full file | After the drill, remove the fill file. Otherwise the next drill fails because the disk is still full. |
| Injecting faults in the parent process | The chaos runner [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) kill itself. Always inject into a child or a separate process. |

## Proof

```bash
./chaos_drill_test
# → [drill] fault=process_crash component=wal target_pid=12345
# → [drill] pre_state=OK
# → [drill] injected SIGKILL at t=0.000s
# → [drill] post_state=DEAD
# → [drill] elapsed=0ms verdict=EXPECTED (process stayed down)
```

## Hero visual

```
  Chaos Drill Runner
  ┌──────────────────────────────────────────────┐
  │ 1. Steady-state check  ──▶  process alive ✓  │
  │ 2. Inject fault        ──▶  kill(pid, 9)     │
  │ 3. Wait for recovery   ──▶  poll loop        │
  │ 4. Steady-state check  ──▶  process dead ✗   │
  │ 5. Record timestamps   ──▶  elapsed: 0 ms    │
  │ 6. Report              ──▶  verdict: EXPECTED │
  └──────────────────────────────────────────────┘
```

## Future Lock

- In [W20 L03](03-recovery-objectives.md) the [recovery objectives validator](03-recovery-objectives.md) will wrap `chaos_drill_run()` and compare the elapsed time against [RTO](https://en.wikipedia.org/wiki/Recovery_time_objective) and data loss against [RPO](https://en.wikipedia.org/wiki/Recovery_point_objective).
- In [W20 L04](04-data-safety-checks.md) the [data safety checker](04-data-safety-checks.md) will run after each drill to verify zero corruption in the [WAL (W10)](../../w10/part.md), [log (W15)](../../w15/part.md), and [anchors (W18)](../../w18/part.md).
- In [W20 L06](06-regression-harness.md) the [regression harness](06-regression-harness.md) will automate running every drill in the [failure matrix](01-failure-matrix.md) in sequence.
- In [W21](../../w21/part.md) [SLO validation](../../w21/part.md) will measure whether drill recovery times stay within [SLO](https://en.wikipedia.org/wiki/Service-level_objective) budgets.
