---
id: w06-l06
title: "Regression Harness"
order: 6
type: lesson
duration_min: 50
---

# Regression Harness

## Goal

Build an automated [load test](https://en.wikipedia.org/wiki/Load_testing) harness that proves your [backpressure](https://en.wikipedia.org/wiki/Back_pressure) controls still work after every code change. The harness runs, checks pass/fail criteria, and exits with a clear verdict.

## What you build

A script (or small program) that:
- starts the server with known limits,
- fires a controlled burst of traffic exceeding those limits,
- collects the stats output,
- asserts that shed count, timeout count, and retry-budget rejections match expected ranges,
- asserts that [p99 latency](https://en.wikipedia.org/wiki/Percentile) stays below the timeout value,
- and exits 0 (pass) or 1 (fail).

## Why it matters

Manual testing only proves things work right now. A [regression test](https://en.wikipedia.org/wiki/Regression_testing) proves they still work after you refactor, add features, or update dependencies. Without one, a small change in the accept path could silently disable [load-shedding](https://en.wikipedia.org/wiki/Load_shedding) and you would not know until production traffic spikes.

## Training Session

### Warmup — test design

1. List the five [backpressure](https://en.wikipedia.org/wiki/Back_pressure) controls you built in Lessons [01](01-define-limits.md)–[05](05-telemetry-for-overload.md). For each, write one sentence describing what "working" looks like.
2. Read about [smoke tests](https://en.wikipedia.org/wiki/Smoke_testing_(software)) versus [load tests](https://en.wikipedia.org/wiki/Load_testing). Your harness is a load test that doubles as a smoke test.
3. Decide your pass/fail criteria. Example: "shed count must be > 0 when traffic exceeds max_queue_depth."

### Work — building the harness

#### Do

1. Write a shell script or C program called `regression_harness`.
2. The harness starts the server with fixed flags: `--max-inflight 10 --max-queue-depth 5 --request-timeout-ms 500 --max-retry-ratio 0.10 --stats-interval-ms 500`.
3. Wait 1 second for the server to be ready (check by connecting to the port).
4. Phase 1 — **Normal load**: send 10 requests at a steady pace. Assert all return HTTP 200.
5. Phase 2 — **Overload**: send 30 concurrent requests. Assert that at least some return [HTTP 503](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503).
6. Phase 3 — **Slow requests**: send 5 requests to the slow handler. Assert that the server times them out (check `timeout_count` in the stats line).
7. Phase 4 — **Retry storm**: send 20 fresh requests then 10 retries (with `X-Retry: true`). Assert that at least some retries are rejected.
8. After all phases, send a shutdown signal to the server (e.g., `SIGTERM`).
9. Parse the final stats line. Assert:
   - `shed` > 0
   - `timeout` > 0
   - `retry_reject` > 0
   - `p99` < 600 (timeout + some margin)
10. Print PASS or FAIL and exit with the appropriate code.

#### Test

1. Run the harness against the current server.
2. Intentionally break one control (e.g., comment out the shed check) and run the harness again.
3. Confirm that the harness catches the regression and prints FAIL.

#### Expected

- Healthy server: harness prints PASS and exits 0.
- Broken server: harness prints FAIL with the specific assertion that failed, and exits 1.

### Prove — deeper understanding

1. Why is it important that the harness uses fixed configuration values instead of the server's defaults?
2. What is a [flaky test](https://en.wikipedia.org/wiki/Software_testing#Flaky_tests)? Identify one part of your harness that could be flaky and describe how to make it deterministic.
3. Should the harness run in [CI](https://en.wikipedia.org/wiki/Continuous_integration)? Discuss the tradeoff between test time and confidence.

### Ship — what to commit

- `regression_harness` script or program.
- A README section explaining how to run it.
- Evidence of one PASS run and one forced-FAIL run.

## Done when

- The harness runs end-to-end without manual intervention.
- It exits 0 when all controls work.
- It exits 1 when any control is disabled.
- It prints which assertion failed on failure.

## Common mistakes

| Mistake | Why it hurts |
|---------|-------------|
| Hard-coding [sleep](https://man7.org/linux/man-pages/man3/sleep.3.html) instead of waiting for the server port | Flaky on slow machines; wastes time on fast ones |
| Not killing the server on harness failure | Orphan processes block the port for the next run |
| Checking only that "some 503s appeared" without counting | A single lucky 503 could mask a broken budget |
| Ignoring the [exit code](https://en.wikipedia.org/wiki/Exit_status) | CI cannot tell pass from fail if exit code is always 0 |

## Proof

- Terminal output of a PASS run.
- Terminal output of a FAIL run (with one control intentionally broken).
- The harness script itself, committed and documented.

## 🖼️ Hero Visual

A factory quality-control line. Finished products ([servers](https://en.wikipedia.org/wiki/Server_(computing))) ride a conveyor belt through a testing station. A robot arm presses each product with increasing force (load). A green light means PASS; a red light and a buzzer mean FAIL. The robot arm is the [regression harness](https://en.wikipedia.org/wiki/Regression_testing).

## 🔮 Future Lock

In [Week 09](../../w09/part.md) you will extend this harness to include [key-value](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) read/write operations under load, verifying [data integrity](https://en.wikipedia.org/wiki/Data_integrity) alongside performance. In [Week 20](../../w20/part.md) the harness becomes the foundation of your [chaos engineering](https://en.wikipedia.org/wiki/Chaos_engineering) suite, where faults are injected automatically during the load test.
