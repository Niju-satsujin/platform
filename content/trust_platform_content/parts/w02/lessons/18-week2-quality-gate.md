---
id: w02-l18
title: "Week 2 quality gate"
order: 18
duration_minutes: 20
xp: 100
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste your completed quality gate checklist with each item marked PASS, plus the git tag output."
  regex_patterns:
    - "PASS"
    - "v0\\.2|week-2"
---
# Week 2 quality gate

## Concept

Same drill as Week 1 — pass every checkpoint before moving on.

The 8-point checklist for Week 2:

1. **Clean build** — `cmake --build build` with zero warnings
2. **Echo server works** — framed echo with poll-based multi-client
3. **Stress test passes** — 50 clients × 100 frames, 0 failures, 3 consecutive runs
4. **Timeouts work** — idle clients get disconnected
5. **Connection limits work** — excess clients get a clear rejection message
6. **Clean shutdown** — Ctrl+C closes all connections and exits 0
7. **Benchmark recorded** — throughput and latency for 1, 10, 50 clients
8. **Logger integrated** — server uses your Week 1 logger for all stderr output

After passing all 8, tag your repo:
```bash
git tag -a v0.2-tcp -m "Week 2: TCP echo server complete"
```

## Task

1. Run each check from the list above
2. For each item, write PASS or FAIL
3. Fix any FAIL items
4. When all 8 are PASS, create the git tag
5. Verify the Week 1 logger is used for server logging (not raw std::cerr)

## Hints

- For check 3: run the stress test 3 times back-to-back
- For check 8: grep your server code for `std::cerr` — replace direct cerr calls with Logger writes
- `git tag -a v0.2-tcp -m "Week 2 complete"`
- `git push origin v0.2-tcp`

## Verify

```bash
cmake --build build 2>&1 | grep -ci warning
./stress_test --port 9000 --clients 50 --frames 100
git tag -l "v0.*"
```

Expected: zero warnings, stress test passes, both v0.1 and v0.2 tags exist.

## Done When

All 8 checklist items are PASS, the git tag exists, and you are ready for Week 3.
