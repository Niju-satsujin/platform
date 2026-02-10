---
id: w02-quest
title: "BOSS FIGHT — trustctl echo-server v0.1"
order: 7
duration_min: 240
type: quest
---

# BOSS FIGHT — trustctl echo-server v0.1

## Goal

Integrate all 6 lessons into one end-to-end workflow. Ship a TCP echo server that uses length-prefix framing, handles partial IO, survives disconnects and timeouts, and passes 22 regression tests.

## What you ship

From the 6 lessons, you should have:

1. **Socket lifecycle** — [socket](https://man7.org/linux/man-pages/man2/socket.2.html) → [bind](https://man7.org/linux/man-pages/man2/bind.2.html) → [listen](https://man7.org/linux/man-pages/man2/listen.2.html) → [accept](https://man7.org/linux/man-pages/man2/accept.2.html) → serve → close, with [SO_REUSEADDR](https://man7.org/linux/man-pages/man7/socket.7.html)
2. **Length-prefix framing** — 4-byte big-endian header + payload, max 64 KB
3. **recv_exact / send_exact** — loop until all bytes transfer or error
4. **Disconnect handling** — recv returns 0 → log, close fd, accept next client
5. **SIGPIPE suppression** — MSG_NOSIGNAL or SIG_IGN prevents server crash
6. **Timeouts** — [SO_RCVTIMEO](https://man7.org/linux/man-pages/man7/socket.7.html) / [SO_SNDTIMEO](https://man7.org/linux/man-pages/man7/socket.7.html) via `--timeout` flag
7. **Error mapping** — errno → structured log event + action
8. **Load test** — 100 sequential clients, 1000 messages, 0 failures
9. **Regression harness** — 22 tests (12 CLI + 10 echo), all passing

## Practice

Run through this exact sequence on a clean TRUST_HOME:

```
export TRUST_HOME=$(mktemp -d)

# 1. Start the server
trustctl echo-server --port 9900 --timeout 5 &
SERVER_PID=$!
sleep 1

# 2. Verify it listens
ss -tlnp | grep 9900

# 3. Raw echo (pre-framing sanity)
echo "raw test" | nc localhost 9900

# 4. Framed echo
./echo-client localhost 9900 "hello framed"

# 5. Two messages (framing boundary test)
./echo-client localhost 9900 "MSG_A" "MSG_B"

# 6. Disconnect recovery
./echo-client localhost 9900 "first-client"
./echo-client localhost 9900 "second-client"

# 7. Timeout test
nc localhost 9900 &
NC_PID=$!
sleep 6
# Server should have closed the connection after 5s
./echo-client localhost 9900 "after-timeout"

# 8. Oversize rejection
./echo-client localhost 9900 --payload-size 70000
echo "exit: $?"

# 9. Server restart
kill $SERVER_PID
wait $SERVER_PID
trustctl echo-server --port 9900 --timeout 5 &
SERVER_PID=$!
sleep 1
./echo-client localhost 9900 "restarted"

# 10. Load test
./echo-load-test --host localhost --port 9900 --clients 100 --messages 10

# 11. File descriptor check
echo "server fds: $(ls /proc/$SERVER_PID/fd | wc -l)"

# 12. Structured logs
cat $TRUST_HOME/logs/trustctl.log | head -10

# 13. Kill server
kill $SERVER_PID

# 14. Full harness
make test
```

## Expected result

- Server listens on port 9900. `ss` confirms LISTEN state.
- Raw echo returns bytes. Framed echo returns exact payload.
- Two messages produce two separate echoes.
- Sequential clients both succeed after disconnect.
- Idle client times out after 5 seconds. Server continues.
- Oversize payload is rejected. Connection closed.
- Server restarts immediately (SO_REUSEADDR). No "address in use" error.
- Load test: 100 clients × 10 messages = 1000 round-trips, 0 failures.
- File descriptor count is stable (no leaks).
- Log file contains structured JSON events with request_id.
- `make test` → 22/22 passed.

## Done when

- A fresh `TRUST_HOME` directory produces correct behavior for all steps.
- 22/22 tests pass (12 CLI + 10 echo).
- Load test: 1000 messages, 0 failures, fd count stable.
- Server survives timeout, disconnect, oversize, and restart.
- Log file contains structured events for every connection lifecycle.
- A teammate could clone your repo and run the same sequence.

## Proof

- Submit: full source code (echo-server, echo-client, echo-load-test, test scripts)
- Paste: `make test` output showing 22/22 passed
- Paste: load test summary showing 1000/1000 ok
- Paste: fd count before and after load test
- Paste: one log snippet showing framed echo with request_id

## Hero Visual

```
┌──────────────────────────────────────────────────────────┐
│              trustctl echo-server v0.1 — Boss             │
│                                                          │
│  Client                              Server              │
│  ┌──────────┐  [4B len][payload]  ┌────────────────┐     │
│  │echo-client│ ─────────────────► │ socket/bind/    │     │
│  │          │ ◄───────────────── │ listen/accept   │     │
│  └──────────┘  [4B len][payload]  │                │     │
│                                   │  recv_exact()  │     │
│  ┌──────────┐                     │  send_exact()  │     │
│  │ load-test │  100 clients       │  timeout(5s)   │     │
│  │ 1000 msgs │ ─────────────────► │  error_map()   │     │
│  └──────────┘                     │  SO_REUSEADDR  │     │
│                                   │                │     │
│                                   │  [log.json]    │     │
│                                   └────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────┐              │
│  │ make test  →  22/22 passed             │              │
│  │  CLI: 12/12 ✓   Echo: 10/10 ✓         │              │
│  └────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────┘
```

### What you should notice
- The echo server is a real networked service built on trustctl's Week 1 foundation.
- Every edge case (timeout, disconnect, oversize, SIGPIPE) is tested, not just the happy path.
- 22 regression tests guard everything built so far across both weeks.

## Future Lock
**Week 3** upgrades this server to handle multiple simultaneous clients using [select](https://man7.org/linux/man-pages/man2/select.2.html)/[poll](https://man7.org/linux/man-pages/man2/poll.2.html). The socket lifecycle, framing, recv_exact, send_exact, and error mapping all carry forward unchanged. **Week 4** adds HTTP parsing over these same sockets. **Week 9** replaces the echo protocol with a KV get/put/delete protocol — same framing, same IO loops. If this boss fight passes cleanly, you have a solid network IO foundation for the next 22 weeks.
