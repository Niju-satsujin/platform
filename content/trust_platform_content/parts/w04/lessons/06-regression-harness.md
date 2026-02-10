---
id: w04-l06
title: "Regression Harness"
order: 6
type: lesson
duration_min: 120
---

# Regression Harness

## Goal

Build an automated test harness that proves your [epoll server (L05)](05-epoll-readiness-model.md) behaves identically to the [poll() server from W03](../../../parts/w03/part.md) under load.

## What you build

A shell script (or small C program) that starts a server, fires a batch of concurrent clients, collects their outputs, and checks that every client got the correct response. If any client fails, the harness prints which one and exits non-zero.

## Why it matters

You replaced [poll()](https://man7.org/linux/man-pages/man2/poll.2.html) with [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html). That is a big change. Without a regression test, you cannot be sure you did not break something. Real systems test every change against known good behavior. You will reuse this harness in [W05](../../../parts/w05/part.md) when you add threads and in [W09](../../../parts/w09/part.md) when you build the KV store.

---

## Training Session

### Warmup

Run your epoll server manually and test with a few clients:

```bash
./epoll_server 9090 &
SERVER_PID=$!
echo "test1" | nc -q1 localhost 9090
echo "test2" | nc -q1 localhost 9090
kill $SERVER_PID
```

Confirm both clients got correct responses. Now automate this.

### Work

#### Do

1. Create `w04/test_harness.sh`.
2. The script takes one argument: the path to the server binary.
3. Start the server on a random high port. Save the PID.
4. Wait briefly for the server to start (use a small `sleep` or check the port).
5. Launch N concurrent clients (start with N=20). Each sends a unique message.
6. Capture each client's response to a temp file.
7. After all clients finish, check every response. Each must match the expected pattern.
8. Print `PASS` if all match. Print `FAIL: client X` and exit `1` if any differ.
9. Kill the server. Clean up temp files.
10. Run the harness against **both** your old [poll() server](../../../parts/w03/part.md) and your new [epoll server](05-epoll-readiness-model.md).

#### Test

```bash
chmod +x w04/test_harness.sh
./w04/test_harness.sh ./epoll_server
echo "Exit code: $?"
```

#### Expected

```
PASS (20/20 clients)
Exit code: 0
```

#### Prove

```bash
./w04/test_harness.sh ./epoll_server && echo "epoll: OK"
./w04/test_harness.sh ./poll_server  && echo "poll:  OK"
```

Both should print OK.

#### Ship

```bash
git add w04/test_harness.sh
git commit -m "w04: regression harness for server implementations"
```

---

## Done when

- The harness is a single runnable script.
- It starts the server, runs N clients, checks results, and cleans up.
- Exit code is `0` on success, `1` on failure.
- Both the [poll() server](../../../parts/w03/part.md) and [epoll server](05-epoll-readiness-model.md) pass.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not waiting for server to start | The server needs time to [bind()](https://man7.org/linux/man-pages/man2/bind.2.html) and [listen()](https://man7.org/linux/man-pages/man2/listen.2.html). Retry connect or sleep briefly. |
| Port conflict | Use a random high port: `PORT=$((RANDOM + 10000))`. |
| Zombie server process | Always `kill $SERVER_PID` in a cleanup trap: `trap "kill $SERVER_PID 2>/dev/null" EXIT`. |
| Not cleaning temp files | Use `mktemp -d` and remove the dir in the trap. |
| Race between clients | Launch all clients in background, then `wait`. Do not serialize them — the point is concurrency. |

## Proof

```bash
./w04/test_harness.sh ./epoll_server
# → PASS (20/20 clients)

./w04/test_harness.sh ./poll_server
# → PASS (20/20 clients)
```

## Hero visual

```
  test_harness.sh
       │
       ├── start server (PID saved)
       │
       ├── spawn 20 clients ─────┬── client 1 → response 1
       │                         ├── client 2 → response 2
       │                         ├── ...
       │                         └── client 20 → response 20
       │
       ├── wait for all
       │
       ├── check 20 responses
       │       all match? → PASS (exit 0)
       │       any differ? → FAIL (exit 1)
       │
       └── kill server, clean up
```

## Future Lock

- In [W05](../../../parts/w05/part.md) you will run this same harness against your thread-pool server to prove adding threads did not break anything.
- In [W09](../../../parts/w09/part.md) you will extend this harness to test [KV store](../../../parts/w09/part.md) operations (GET, SET, DEL) under concurrent load.
- The pattern — start, stress, verify, clean up — is the backbone of every integration test you will write.
