---
id: w03-l06
title: "Regression Harness"
order: 6
duration_min: 120
type: lesson
---

# Lesson 6 (6/7): Regression Harness

**Goal:** Build an automated test harness that verifies every feature from Lessons 1–5 in one command.

**What you build:** A shell script (or set of scripts) that starts the server, connects multiple clients, sends messages, checks broadcast, triggers slow-client detection, verifies STATS output, and reports pass/fail.

**Why it matters:**
You will modify this server in W04, W05, and W09.
Without regression tests, every change risks breaking earlier work.
A harness that runs in seconds gives you confidence to refactor.
This is the same idea behind [continuous integration](https://en.wikipedia.org/wiki/Continuous_integration) — automated checks on every change.

---

## TRAINING SESSION

### Warmup (15 min)

1. List every testable behavior from Lessons 1–5: accept, disconnect, framing (partial, concatenated, oversized), broadcast, slow-client, STATS.
2. Read about shell `trap` for cleanup — how do you kill background processes on script exit?
3. Review `nc` flags: `-w` for timeout, `-q` for quit delay. How do you script `nc` to send data and disconnect?

### Work

#### Task 1 — Create the test runner skeleton

**Do:** Create `tests/w03_regression.sh`. It should: start the server in the background, store its PID, set a `trap` to kill the server on exit, define `pass()` and `fail()` functions that increment counters.

**Test:**
```bash
chmod +x tests/w03_regression.sh
bash tests/w03_regression.sh
```

**Expected:** Script starts server, prints `[HARNESS] server started pid=XXXX`, and exits cleanly with `0 passed, 0 failed`.

#### Task 2 — Test basic connect and echo

**Do:** Add a test case: connect with `nc`, send a framed message, read the response, compare. Use a timeout so the test does not hang.

**Test:**
```bash
bash tests/w03_regression.sh
```

**Expected:**
```
[TEST] basic_echo ... PASS
```

#### Task 3 — Test broadcast

**Do:** Open two `nc` connections. Send a framed message from client A. Read from client B. Verify client B received the broadcast.

**Test:**
```bash
bash tests/w03_regression.sh
```

**Expected:**
```
[TEST] broadcast_two_clients ... PASS
```

#### Task 4 — Test slow-client detection

**Do:** Open a client that connects but never reads. Send enough broadcast messages from another client to exceed the slow-client threshold. Verify the slow client's connection is closed (detect by checking the server log or trying to write to the fd).

**Test:**
```bash
bash tests/w03_regression.sh
```

**Expected:**
```
[TEST] slow_client_disconnect ... PASS
```

#### Task 5 — Test partial frame reassembly

**Do:** Send a frame in two parts with a sleep in between. Verify the server assembles and echoes the complete frame.

**Test:**
```bash
bash tests/w03_regression.sh
```

**Expected:**
```
[TEST] partial_frame_reassembly ... PASS
```

#### Task 6 — Test oversized frame rejection

**Do:** Send a frame header claiming a payload larger than `MAX_FRAME_SIZE`. Verify the connection is closed.

**Test:**
```bash
bash tests/w03_regression.sh
```

**Expected:**
```
[TEST] oversized_frame_rejected ... PASS
```

#### Task 7 — Test STATS command

**Do:** Connect 2 clients. Send some messages. Pipe `STATS` into the server's stdin. Capture stdout. Verify the output contains correct `active: 2` and non-zero byte counts.

**Test:**
```bash
bash tests/w03_regression.sh
```

**Expected:**
```
[TEST] stats_command ... PASS
```

### Prove

- [ ] `bash tests/w03_regression.sh` runs all tests and prints a summary.
- [ ] All tests pass on a clean build.
- [ ] Server is always killed on exit, even if a test fails.
- [ ] No zombie processes left after the script exits.

### Ship

```bash
git add -A && git commit -m "w03-l06: regression harness covering all W03 features"
```

---

## Done When

- One command runs all 6+ tests and reports pass/fail.
- The harness cleans up after itself (no orphan processes, no temp files).

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Not using `trap` for cleanup | Server process leaks if a test fails early. Always trap EXIT. |
| Hardcoded port conflicts | Use a random high port or let the OS assign one. Pass it to the test clients. |
| Tests depend on timing | Use retries with short sleeps instead of fixed delays. Or use `wait` on expected output. |
| No summary at the end | Always print total pass/fail count. A silent script is useless in CI. |

## Proof

```
Full output of bash tests/w03_regression.sh showing all tests passing.
Git log showing commit w03-l06.
```

## Hero Visual

```
  bash tests/w03_regression.sh
  ┌──────────────────────────────────┐
  │ [HARNESS] server started pid=123 │
  │ [TEST] basic_echo ........ PASS  │
  │ [TEST] broadcast ......... PASS  │
  │ [TEST] slow_client ....... PASS  │
  │ [TEST] partial_frame ..... PASS  │
  │ [TEST] oversized_frame ... PASS  │
  │ [TEST] stats_command ..... PASS  │
  │ ════════════════════════════════  │
  │  6 passed, 0 failed              │
  │ [HARNESS] server stopped         │
  └──────────────────────────────────┘
```

## Future Lock

In **W04** you add epoll-specific tests to this same harness: thousands of connections, edge-triggered correctness.
In **W05** you add thread pool tests: concurrent heavy requests, pool saturation.
In **W09** you add KV protocol tests: GET/SET/DEL correctness, pub/sub broadcast.
Each week extends the harness — it never gets rewritten from scratch.
