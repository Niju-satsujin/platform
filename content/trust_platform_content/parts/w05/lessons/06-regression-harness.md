---
id: w05-l06
title: "Regression Harness"
order: 6
type: lesson
duration_min: 120
---

# Regression Harness

## Goal

Extend the [W04 regression harness](../../../parts/w04/lessons/06-regression-harness.md) to prove the [thread pool server (L04)](04-io-cpu-handoff.md) behaves identically to the single-threaded [epoll server (W04)](../../../parts/w04/part.md) under concurrent load — and that [error propagation (L05)](05-error-propagation.md) works correctly.

## What you build

A test script that starts the [thread pool server](04-io-cpu-handoff.md), fires N concurrent clients (some with good input, some with bad input), collects all responses, and checks that every client got the correct result. Good inputs get success responses. Bad inputs get error responses. No client hangs. No response is missing.

## Why it matters

You added threads. Threads add [data races](https://en.wikipedia.org/wiki/Race_condition), [deadlocks](https://en.wikipedia.org/wiki/Deadlock), and timing bugs that do not show up in manual testing. A regression harness runs the same workload hundreds of times and catches intermittent failures. You built this harness in [W04 L06](../../../parts/w04/lessons/06-regression-harness.md) for the [epoll server](../../../parts/w04/part.md). Now you run it again — if the thread pool changed any client-visible behavior, the harness catches it.

---

## Training Session

### Warmup

Review your [W04 test harness](../../../parts/w04/lessons/06-regression-harness.md). List what it checks:

1. All N clients get a response.
2. Every response matches the expected pattern.
3. The server does not crash.
4. Cleanup happens (server killed, temp files removed).

Now list what you need to add for W05:

1. Mix of good and bad inputs.
2. Error responses checked (not just success).
3. Run against both the [epoll-only server (W04)](../../../parts/w04/part.md) and the [thread pool server (W05)](04-io-cpu-handoff.md).

### Work

#### Do

1. Create `w05/test_harness.sh`.
2. The script takes one argument: the path to the server binary.
3. Start the server on a random high port. Save the PID. Set a [trap](https://man7.org/linux/man-pages/man1/trap.1p.html) to kill the server and clean up on exit.
4. Wait for the server to be ready (retry [connect](https://man7.org/linux/man-pages/man2/connect.2.html) or sleep briefly).
5. Launch N concurrent clients (N=30). Each sends a unique message. 20 send good input. 10 send bad input.
6. Capture each client's response to a temp file.
7. After all clients finish, check every response:
   - Good-input clients [MUST](https://datatracker.ietf.org/doc/html/rfc2119) get a success response.
   - Bad-input clients [MUST](https://datatracker.ietf.org/doc/html/rfc2119) get an `ERROR:` response.
8. Print `PASS` if all match. Print `FAIL: client X` and exit `1` if any differ.
9. Kill the server. Clean up temp files.
10. Run the harness against the [thread pool server](04-io-cpu-handoff.md).
11. Run the harness against the old [epoll-only server (W04)](../../../parts/w04/part.md) (good-input tests only — the old server may not have error handling).

#### Test

```bash
chmod +x w05/test_harness.sh
./w05/test_harness.sh ./handoff_server
echo "Exit code: $?"
```

#### Expected

```
PASS (30/30 clients — 20 success, 10 error)
Exit code: 0
```

#### Prove

Run the harness 5 times in a loop to catch intermittent race conditions:

```bash
for i in $(seq 1 5); do
  ./w05/test_harness.sh ./handoff_server || { echo "FAIL on run $i"; exit 1; }
done
echo "All 5 runs passed"
```

#### Ship

```bash
git add w05/test_harness.sh
git commit -m "w05-l06: regression harness for thread pool server"
```

---

## Done when

- The harness is a single runnable script.
- It tests both success and error paths.
- All 30 clients get the correct response.
- The harness cleans up (kills server, removes temp files) even on failure.
- It passes 5 consecutive runs without failure.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not testing error paths | Only testing good input misses [error propagation (L05)](05-error-propagation.md) bugs. Always mix good and bad inputs. |
| Not running multiple times | [Data races](https://en.wikipedia.org/wiki/Race_condition) are intermittent. One pass proves nothing. Run at least 5 times. |
| Race between clients and response check | Launch all clients in background with `&`, then `wait` for all to finish before checking. |
| Port conflict between runs | Use a random high port: `PORT=$((RANDOM + 10000))`. |
| Zombie server on failure | Use `trap "kill $SERVER_PID 2>/dev/null; rm -rf $TMPDIR" EXIT` to always clean up. |

## Proof

```bash
./w05/test_harness.sh ./handoff_server
# → PASS (30/30 clients — 20 success, 10 error)

./w05/test_harness.sh ./epoll_server
# → PASS (20/20 clients — good input only)
```

## Hero visual

```
  test_harness.sh
       │
       ├── start server (PID saved, trap set)
       │
       ├── spawn 30 clients ─────┬── client  1 (good) → success response
       │                         ├── client  2 (good) → success response
       │                         ├── ...
       │                         ├── client 20 (good) → success response
       │                         ├── client 21 (bad)  → ERROR response
       │                         ├── ...
       │                         └── client 30 (bad)  → ERROR response
       │
       ├── wait for all
       │
       ├── check 30 responses
       │       20 success + 10 error? → PASS (exit 0)
       │       any wrong?             → FAIL (exit 1)
       │
       └── kill server, clean up
```

## Future Lock

- In [W06](../../../parts/w06/part.md) you will extend this harness to test [backpressure](../../../parts/w06/part.md) — flood the server with more tasks than the queue can hold and verify it pushes back.
- In [W09](../../../parts/w09/part.md) you will adapt this harness for [KV store](../../../parts/w09/part.md) operations — GET, SET, DEL — under concurrent load.
- In [W10](../../../parts/w10/part.md) you will add durability checks — after a crash, the harness verifies that committed [WAL writes](../../../parts/w10/part.md) survived.
- The pattern — start, stress, verify, clean up — is the backbone of every integration test you will write.
