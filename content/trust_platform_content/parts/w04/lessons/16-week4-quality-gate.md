---
id: w04-l16
title: "Week 4 quality gate — Month 1 complete"
order: 16
duration_minutes: 20
xp: 100
kind: lesson
part: w04
proof:
  type: paste
  instructions: "Paste your completed 10-point Month 1 quality gate checklist with each item marked PASS, plus the git tag."
  regex_patterns:
    - "PASS"
    - "v1\\.0|month-1"
---
# Week 4 quality gate — Month 1 complete

## Concept

This is the Month 1 quality gate — bigger than the weekly gates because it covers the entire first month.

The 10-point Month 1 checklist:

1. **Logger** — standalone library, all tests pass, benchmarks recorded (Week 1)
2. **TCP echo** — framed echo server with poll, stress test 50×100 passes (Week 2)
3. **Protocol** — envelope serialize/deserialize, fuzz test passes (Week 3)
4. **Robustness** — malformed input, slow clients, connection churn all handled (Week 3)
5. **Thread pool** — bounded queue, graceful shutdown, contention measured (Week 4)
6. **Backpressure** — server-busy response, client retry with backoff (Week 4)
7. **Integration test** — 20 good + 3 bad clients, all handled correctly (Week 3)
8. **Benchmarks** — throughput and latency for all configurations documented (Week 4)
9. **Demo** — demo.sh runs cleanly 3 times (Week 4)
10. **CI** — GitHub Actions passes on the latest commit (Week 1)

After all 10 pass:
```bash
git tag -a v1.0-month1 -m "Month 1: Networking Foundations complete"
```

This is a major milestone. You built a networking stack from scratch.

## Task

1. Run every check from the list
2. Mark PASS or FAIL
3. Fix any failures
4. Tag the repo
5. Look back at Week 1 — you now have: a logger, a TCP server, a binary protocol, a thread pool, and a complete test suite. All of this runs in CI.

## Hints

- Run each week's quality gate checks to verify nothing regressed
- `git tag -l` should show: v0.1-logger, v0.2-tcp, v0.3-protocol, v1.0-month1
- This is a good time to push all tags: `git push origin --tags`

## Verify

```bash
git tag -l "v*"
./demo.sh
```

Expected: all 4 tags exist, demo runs cleanly.

## Done When

All 10 checklist items are PASS, v1.0-month1 tag exists, and Month 1 is complete. You are ready for cryptography.
