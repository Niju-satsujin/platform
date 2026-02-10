---
id: w06-quest
title: "Quest — Survive the Flood"
order: 7
type: quest
duration_min: 90
---

# Quest — Survive the Flood

## Boss Fight: Survive the Flood

Your server has all five [backpressure](https://en.wikipedia.org/wiki/Back_pressure) controls wired in. Now prove they work together under a realistic overload scenario. This quest simulates a flash-crowd event: traffic spikes to 10× normal, stays there for 60 seconds, and then drops back. Your server must survive without crashing, without leaking [file descriptors](https://en.wikipedia.org/wiki/File_descriptor), and without lying to any client.

## Scenario

A load generator fires traffic in three waves:

| Wave | Duration | Request rate | Retry % | Slow requests |
|------|----------|-------------|---------|---------------|
| 1 — Ramp | 10 s | 1× → 10× baseline | 0% | 0% |
| 2 — Sustain | 40 s | 10× baseline | 20% retries | 5% hit the slow handler |
| 3 — Drain | 10 s | 10× → 0 | 10% retries | 0% |

## Objectives

1. **Admission gate holds** — [inflight counter](https://en.cppreference.com/w/c/atomic) never exceeds `max_inflight` from [Lesson 01](lessons/01-define-limits.md). Verify by checking every stats line.

2. **Shedding is clean** — every shed request receives [HTTP 503](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503) with [Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) from [Lesson 02](lessons/02-load-shedding.md). No silent drops. Count shed responses on the client side and compare with server-side `shed_count`.

3. **Timeouts fire** — the slow requests are killed by the [timerfd](https://man7.org/linux/man-pages/man2/timerfd_create.2.html) deadline from [Lesson 03](lessons/03-timeout-strategy.md). `timeout_count` in stats must be > 0 during Wave 2.

4. **Retry budget enforced** — during Wave 2 (20% retries), the [retry budget](https://sre.google/sre-book/handling-overload/) from [Lesson 04](lessons/04-retry-budget.md) rejects excess retries. `retry_reject` must be > 0.

5. **Telemetry accurate** — the [stats line](lessons/05-telemetry-for-overload.md) from [Lesson 05](lessons/05-telemetry-for-overload.md) reports every metric correctly throughout all three waves. p99 during Wave 2 must be below `request_timeout_ms + 100 ms`.

6. **No resource leaks** — at the end of Wave 3, after all connections drain:
   - `inflight` returns to 0.
   - [File descriptor](https://en.wikipedia.org/wiki/File_descriptor) count returns to the idle baseline (check with `ls /proc/<pid>/fd | wc -l`).
   - No zombie [threads](https://en.wikipedia.org/wiki/Thread_(computing)).

7. **Regression harness passes** — run the [regression harness](lessons/06-regression-harness.md) from [Lesson 06](lessons/06-regression-harness.md) after the flood. It must exit 0, confirming all controls are still intact.

## Rules

- Use the same server binary and config from Lessons 01–06. No special "quest mode."
- The load generator can be a shell script, a small C program, or any tool you can script. You must explain how it produces the three waves.
- You must capture all stats lines during the flood and include them in your proof.
- You must not modify the server's limits mid-run. The controls you configured must hold.

## Steps

1. Write the three-wave load generator. It must accept the server address and produce traffic matching the table above.
2. Configure the server with the limits from [Lesson 06](lessons/06-regression-harness.md)'s harness: `--max-inflight 10 --max-queue-depth 5 --request-timeout-ms 500 --max-retry-ratio 0.10 --stats-interval-ms 500`.
3. Start the server. Record the idle [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) count.
4. Run the load generator. Capture all server logs and stats lines to a file.
5. After the generator finishes, wait 5 seconds for drain.
6. Record the post-flood [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) count. Compare with idle.
7. Run the [regression harness](lessons/06-regression-harness.md). Capture its output.
8. Compile all evidence into your proof submission.

## Grading

| Criterion | Weight |
|-----------|--------|
| Admission gate never exceeded | 20% |
| All shed requests got 503 + Retry-After | 15% |
| Timeouts fired for slow requests | 15% |
| Retry budget rejected excess retries | 15% |
| Telemetry accurate across all waves | 15% |
| No resource leaks after drain | 10% |
| Regression harness passes | 10% |

## Done when

- All seven objectives met.
- Proof file submitted with stats logs, fd counts, harness output, and a one-paragraph summary of what you learned.

## 🖼️ Hero Visual

A ship in a storm. Waves crash over the deck (traffic spikes). The crew activates bilge pumps ([load-shedding](https://en.wikipedia.org/wiki/Load_shedding)), seals hatches ([admission gate](lessons/01-define-limits.md)), cuts the anchor chain before it snaps ([timeouts](lessons/03-timeout-strategy.md)), and the radar shows the storm passing (the [telemetry](lessons/05-telemetry-for-overload.md) dashboard). The ship does not sink.
