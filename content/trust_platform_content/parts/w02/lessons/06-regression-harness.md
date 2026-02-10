---
id: w02-l06
title: "Lesson 6 — Regression Harness: The Exact 10 Tests"
order: 6
duration_min: 120
type: lesson
---

# Lesson 6 (6/7): Regression Harness — The Exact 10 Tests

**Goal:** Lock every TCP echo behavior from Lessons 1–5 with exactly 10 regression tests. One command runs all 10. If any fail, you know immediately.

**What you build:** A test runner (`make test-echo` or `./tests/run_echo_tests.sh`) that executes 10 specific tests covering socket lifecycle, framing, partial IO, disconnects, timeouts, error mapping, and load.

## Why it matters

- You will modify the echo server every week from now through Week 9. Without a harness, you will break framing in Week 3 and not notice until Week 5.
- Each test checks one [MUST](https://datatracker.ietf.org/doc/html/rfc2119) rule from this week's lessons. If the test passes, the rule holds. If it fails, you broke a promise.
- This is contract testing. You start the real server, connect real clients, check real bytes on the wire. No mocks.
- The Week 1 harness tested trustctl's CLI. This harness tests trustctl's network behavior. Both run together: `make test` should now pass 22 tests (12 from Week 1 + 10 from Week 2).

## TRAINING SESSION

### Warmup (10 min)
- Q: Why is it important that tests start the server on a random port instead of a fixed port?
- Q: If test #4 (disconnect handling) passes locally but fails in CI, what is the most likely cause?
- Recall: List the five error types the echo server must survive (from Lesson 4).

### Work

**Task 1: Create the echo test runner**

1. Do this: Create a script that starts the echo server on a random high port, runs all 10 tests in sequence, then kills the server. Each test prints PASS or FAIL with the test name. Summary at the end: `10/10 passed` or `N/10 passed, M failed`.
2. How to test it:
   ```
   make test-echo
   ```
3. Expected result: All 10 tests run. Summary at the end.

**Task 2: Implement the exact 10 tests**

Here are the 10 tests. Implement every one:

| # | Test Name | What it checks | Expected |
|---|-----------|---------------|----------|
| 1 | `test_listen` | Server binds and listens on the given port | `ss -tlnp` shows LISTEN on the port |
| 2 | `test_echo_raw` | Raw bytes echo via nc (pre-framing sanity) | `echo "hi" \| nc localhost PORT` returns bytes |
| 3 | `test_framed_echo` | Framed message echoes with correct header + payload | echo-client sends 1 message, receives exact match |
| 4 | `test_two_messages` | Two back-to-back framed messages produce two separate echoes | echo-client sends 2 messages, receives 2 separate echoes |
| 5 | `test_disconnect_recovery` | Client disconnects, next client connects successfully | Two sequential echo-client runs both succeed |
| 6 | `test_oversize_reject` | Payload > 65536 bytes rejected, connection closed | echo-client sends 70000-byte payload, server closes connection |
| 7 | `test_recv_timeout` | Idle client triggers timeout after N seconds | nc connects, sends nothing, server closes after timeout |
| 8 | `test_partial_header_timeout` | Client sends 2 of 4 header bytes, then idles | Server times out and closes, does not crash |
| 9 | `test_sigpipe_survival` | Client disconnects mid-send, server survives | Kill client during large echo, next client still works |
| 10 | `test_load_50_clients` | 50 sequential clients, 5 messages each, 0 failures | Load test reports 250/250 ok |

For each test:
1. Do this: Write the test as a shell function. Start with setup (connect), perform the action, check the result, print PASS/FAIL.
2. How to test it: Run the individual test.
3. Expected result: PASS with correct behavior.

**Task 3: Use random ports for isolation**

1. Do this: The test runner picks a random port (e.g., `PORT=$((10000 + RANDOM % 50000))`). All tests use that port. This prevents conflicts when multiple developers run tests or CI runs parallel jobs.
2. How to test it: Run `make test-echo` twice simultaneously in two terminals.
3. Expected result: Both runs pass. No port conflicts.

**Task 4: Integrate with Week 1 harness**

1. Do this: Update `make test` to run both the Week 1 harness (12 tests) and the Week 2 harness (10 tests). Print a combined summary.
2. How to test it:
   ```
   make test
   ```
3. Expected result:
   ```
   === CLI Tests ===
   12/12 passed

   === Echo Server Tests ===
   10/10 passed

   === Total: 22/22 passed ===
   ```

**Task 5: Run twice back-to-back**

1. Do this: Run `make test` twice. Both runs [MUST](https://datatracker.ietf.org/doc/html/rfc2119) produce 22/22. No state leaks between runs.
2. How to test it:
   ```
   make test && make test
   ```
3. Expected result: `22/22 passed` both times.

### Prove (15 min)
- Run `make test`. Confirm 22/22.
- Break something intentionally (remove the oversize payload check). Run tests. Confirm test #6 fails.
- Fix it. Run tests again. Confirm 22/22.
- Explain in 4 lines: Why use random ports? (Hint: [TIME_WAIT](https://datatracker.ietf.org/doc/html/rfc793#section-3.5) can hold a port for 60 seconds after the test server exits.)

### Ship (5 min)
- Submit: test runner + all test scripts
- Paste: full `make test` output showing 22/22 passed

## Done when
- `make test-echo` runs 10 named tests against a live echo server.
- All 10 pass on a clean run.
- `make test` runs 22 total tests (12 CLI + 10 echo).
- Tests use random ports.
- Tests are repeatable (no state leaks).

## Common mistakes
- Fixed port 9900 in tests → Fix: Random port. Fixed ports break in CI.
- Not waiting for server to start → Fix: Sleep 1 second after starting the server, or poll the port.
- Timeout test too slow → Fix: Use `--timeout 1` for test speed. 1 second is enough.
- Test runner exits on first failure → Fix: Run all 10, report summary at end.
- Not killing the server after tests → Fix: Trap EXIT in the test script and kill the server PID.

## Proof
- Submit: test runner + test scripts
- Paste: full `make test` output showing 22/22 passed

## Hero Visual

```
┌──────────────────────────────────────────────────┐
│        Regression Harness (22 tests)              │
│                                                  │
│  === CLI Tests (Week 1) ===                      │
│  #1-12  help, version, config, router,           │
│         exit codes, logs, request_id, SIGINT     │
│  Result: 12/12 ✓                                 │
│                                                  │
│  === Echo Server Tests (Week 2) ===              │
│  #1  listen             ✓  #6  oversize reject ✓│
│  #2  raw echo           ✓  #7  recv timeout    ✓│
│  #3  framed echo        ✓  #8  partial header  ✓│
│  #4  two messages       ✓  #9  sigpipe survive ✓│
│  #5  disconnect recover ✓  #10 load 50 clients ✓│
│  Result: 10/10 ✓                                 │
│                                                  │
│  === Total: 22/22 passed ===                     │
└──────────────────────────────────────────────────┘
```

### What you should notice
- 22 tests = 22 promises. Every MUST rule from Weeks 1 and 2 is locked.
- The harness grows each week. Week 3 adds event loop tests. Week 4 adds HTTP tests.
- Random ports and clean shutdown make tests reliable in any environment.

## Future Lock
In **Week 3** (Event Loop), you add concurrent client tests. In **Week 4** (HTTP), you add HTTP parsing tests. By **Week 9**, the harness has 60+ tests covering the entire stack. Every test you write now is a regression guard for the next 22 weeks. The harness is not extra work — it is the work.
