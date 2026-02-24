---
id: w02-l16
title: "Stress test run — 50 clients × 100 frames"
order: 16
duration_minutes: 25
xp: 75
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste the full stress test output showing 50 clients × 100 frames with 0 failures."
  regex_patterns:
    - "50 clients"
    - "0 failures|5000.*pass"
---
# Stress test run — 50 clients × 100 frames

## Concept

Now you run the stress test for real. Start your server, then run the stress test against it. This is where bugs appear — race conditions, partial reads that were not handled, connections dropped under load.

Common failures you might see:
- **Connection refused** — server hit the max-clients limit. Increase it or add retry logic in the client.
- **Frame mismatch** — framing bug. The server sent back the wrong bytes, or two frames got merged.
- **Timeout** — server is too slow. Check if you are doing something blocking in the poll loop.
- **Broken pipe** — server closed the connection unexpectedly. Check your error handling.

Debug approach: if the stress test fails, reduce to 1 client and 1 frame. Get that working, then increase gradually: 1×10, 5×10, 10×100, 50×100.

This is the real test of your server. If 50×100 passes, your networking code is solid.

## Task

1. Start your echo server with `--max-clients 100`
2. Run the stress test: `./stress_test --clients 50 --frames 100`
3. If any failures: debug, fix, re-run
4. Run the stress test 3 times to confirm it is stable
5. Record the elapsed time for the full run

## Hints

- If you get "connection refused", add a small delay (10ms) between client thread launches: `usleep(10000)`
- If frames mismatch, add logging to the client that prints the expected vs actual payload
- If the server crashes, check for SIGPIPE — add `signal(SIGPIPE, SIG_IGN)` at server startup
- Run with `--max-clients` set higher than `--clients` to avoid capacity rejections during the test

## Verify

```bash
# Terminal 1
./echo_server --port 9000 --max-clients 100

# Terminal 2
./stress_test --port 9000 --clients 50 --frames 100
./stress_test --port 9000 --clients 50 --frames 100
./stress_test --port 9000 --clients 50 --frames 100
```

Expected: all 3 runs show "50 clients, 5000 frames, 0 failures."

## Done When

The stress test passes 3 consecutive times with zero failures.
