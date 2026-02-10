---
id: w09-l06
title: "Regression Harness"
order: 6
type: lesson
duration_min: 40
---

# Regression Harness

## Goal

Build a full [regression harness](https://en.wikipedia.org/wiki/Regression_testing) that tests the [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) end-to-end over [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html). Every future change [MUST](https://datatracker.ietf.org/doc/html/rfc2119) pass this harness before it ships.

## What you build

A shell-based test harness that starts the KV server, sends a scripted sequence of commands over [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) using [nc](https://man7.org/linux/man-pages/man1/ncat.1.html) or a small C test client, compares the responses against expected output, runs the [correctness suite (L03)](03-core-ops-correctness.md), checks the [stats counters (L05)](05-observability.md), runs [Helgrind](https://valgrind.org/docs/manual/hg-manual.html), and reports PASS or FAIL.

## Why it matters

Every lesson this week added a layer: [state machine (L01)](01-state-machine-model.md), [protocol (L02)](02-protocol-contract.md), [correctness (L03)](03-core-ops-correctness.md), [concurrency (L04)](04-concurrency-strategy.md), [observability (L05)](05-observability.md). Without a harness that tests all layers together, a fix in one layer can break another. [Regression testing](https://en.wikipedia.org/wiki/Regression_testing) catches this. In [W10](../../../parts/w10/part.md) you will extend this same harness to test crash recovery. In [W11](../../../parts/w11/part.md) it will test replication. The harness grows with the system.

---

## Training Session

### Warmup — Scripted testing

Review how your [W02 framing](../../../parts/w02/part.md) tests worked. Write down:

1. How you started the server in the background.
2. How you sent test data and captured the response.
3. How you compared the response against an expected string.
4. Read the man page for [read(2)](https://man7.org/linux/man-pages/man2/read.2.html) and [write(2)](https://man7.org/linux/man-pages/man2/write.2.html) — recall how the client sends and receives bytes.

### Work — Build the harness

#### Do

1. Create `w09/test_harness.sh`.
2. Write a `start_server()` function:
   - Compile the full KV server: `gcc -Wall -Wextra -Werror -pthread -o kv_server w09/kv_server.c w09/kv_store.c w09/kv_protocol.c w09/kv_concurrent.c w09/kv_stats.c`.
   - Start it on a test port in the background: `./kv_server 9099 &`.
   - Save the PID. Sleep 0.5 seconds to let it bind.
3. Write a `stop_server()` function:
   - Send `SIGTERM` to the server PID.
   - Wait for exit. Assert exit code is 0.
4. Write a `send_cmd()` helper that uses `echo "$1" | nc -q1 localhost 9099` and captures the response.
5. Write `test_basic_ops()`:
   - `send_cmd "SET foo bar"` — expect `OK`.
   - `send_cmd "GET foo"` — expect `VALUE bar`.
   - `send_cmd "DEL foo"` — expect `DELETED`.
   - `send_cmd "GET foo"` — expect `NOT_FOUND`.
6. Write `test_overwrite()`:
   - `send_cmd "SET x 1"` — expect `OK`.
   - `send_cmd "SET x 2"` — expect `OK`.
   - `send_cmd "GET x"` — expect `VALUE 2`.
7. Write `test_invalid_commands()`:
   - `send_cmd "BADCMD"` — expect `ERROR`.
   - `send_cmd "SET"` — expect `ERROR`.
   - `send_cmd "GET"` — expect `ERROR`.
   - `send_cmd ""` — expect `ERROR`.
8. Write `test_stats()`:
   - Run a known sequence of SET, GET, DEL.
   - `send_cmd "STATS"` — parse the counters and assert they match the expected totals.
9. Write `test_concurrent()`:
   - Launch 10 background subshells, each sending 100 SET commands.
   - Wait for all to finish.
   - `send_cmd "STATS"` — assert `sets` equals 1000 (plus any from earlier tests).
10. Write the main block:
    - Call `start_server`.
    - Run each test function. Print PASS or FAIL.
    - Call `stop_server`.
    - Print a summary: `N/N tests passed`.

#### Test

```bash
chmod +x w09/test_harness.sh
./w09/test_harness.sh
```

#### Expected

```
test_basic_ops        PASS
test_overwrite        PASS
test_invalid_commands PASS
test_stats            PASS
test_concurrent       PASS
---
5/5 tests passed
server exited cleanly
```

### Prove — Helgrind under load

Run the server under [Helgrind](https://valgrind.org/docs/manual/hg-manual.html) and repeat the concurrent test:

```bash
valgrind --tool=helgrind ./kv_server 9099 &
# run test_concurrent
# stop server
# check helgrind output: 0 errors
```

### Ship

```bash
git add w09/test_harness.sh
git commit -m "w09-l06: full regression harness for kv store"
```

---

## Done when

- The harness compiles, starts, tests, and stops the server in one command.
- All five test categories pass.
- The harness can be run repeatedly — it cleans up the server process even if a test fails.
- Adding a deliberate bug (like removing the [rwlock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) in [L04](04-concurrency-strategy.md)) makes `test_concurrent` fail.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not waiting for the server to bind before sending commands | Add a `sleep 0.5` or poll the port with `nc -z localhost 9099` in a retry loop. |
| Leaving the server running after a test failure | Use a [trap](https://man7.org/linux/man-pages/man1/trap.1p.html) to call `stop_server` on EXIT so the process is always cleaned up. |
| Hardcoding the port | Pass the port as an argument or use a random high port to avoid conflicts. |
| Not checking the exit code of [nc](https://man7.org/linux/man-pages/man1/ncat.1.html) | If [nc](https://man7.org/linux/man-pages/man1/ncat.1.html) cannot connect, it exits non-zero. Assert that the connection succeeded before comparing output. |

## Proof

```bash
./w09/test_harness.sh
# → test_basic_ops        PASS
# → test_overwrite        PASS
# → test_invalid_commands PASS
# → test_stats            PASS
# → test_concurrent       PASS
# → ---
# → 5/5 tests passed
# → server exited cleanly
```

## 🖼️ Hero Visual

```
  test_harness.sh
  ┌────────────────────────────────────────────────────┐
  │ 1. compile server                                  │
  │ 2. start server on port 9099                       │
  │ 3. test_basic_ops     → SET GET DEL        → PASS  │
  │ 4. test_overwrite     → SET SET GET        → PASS  │
  │ 5. test_invalid_cmds  → BADCMD, empty      → PASS  │
  │ 6. test_stats         → STATS counters     → PASS  │
  │ 7. test_concurrent    → 10×100 SETs        → PASS  │
  │ 8. stop server (SIGTERM)                           │
  │ 9. report: 5/5 passed                             │
  └────────────────────────────────────────────────────┘
```

## 🔮 Future Lock

- In [W10](../../../parts/w10/part.md) you will add a `test_crash_recovery` step: kill the server with `SIGKILL`, restart it, and confirm the [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) replays all committed operations.
- In [W11](../../../parts/w11/part.md) the harness will start multiple server instances and test that writes on the leader appear on followers.
- In [W12](../../../parts/w12/part.md) the harness will kill the leader, wait for a new election, and confirm the new leader serves the same data.
- Every week extends this harness — it never shrinks.
