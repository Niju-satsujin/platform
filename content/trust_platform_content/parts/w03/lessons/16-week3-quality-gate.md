---
id: w03-l16
title: "Week 3 quality gate"
order: 16
duration_minutes: 20
xp: 100
kind: lesson
part: w03
proof:
  type: paste
  instructions: "Paste your completed quality gate checklist with each item marked PASS, plus the git tag output."
  regex_patterns:
    - "PASS"
    - "v0\\.3|week-3"
---
# Week 3 quality gate

## Concept

The 8-point checklist for Week 3:

1. **Clean build** — zero warnings
2. **Envelope round-trip** — serialize → deserialize preserves all fields
3. **Fuzz test** — 100,000+ iterations, 0 crashes, 0 sanitizer errors
4. **Malformed input** — all 4 types handled without server crash
5. **Slow client** — detected and disconnected within timeout
6. **Integration test** — 20 good clients pass, 3 bad clients handled
7. **Protocol documented** — docs/protocol.md is complete and accurate
8. **Benchmark recorded** — envelope overhead measured against Week 2 baseline

After all 8 pass:
```bash
git tag -a v0.3-protocol -m "Week 3: Protocol + Robustness complete"
```

## Task

1. Run each check
2. Mark PASS or FAIL
3. Fix any FAIL items
4. Tag the repo when all pass

## Hints

- For check 3: run with `-fsanitize=address` to catch memory bugs
- For check 6: run the integration test with `--with-bad-clients`
- For check 7: read your own protocol doc and try to find gaps
- Carry forward: you now have 3 git tags (v0.1, v0.2, v0.3)

## Verify

```bash
cmake --build build 2>&1 | grep -ci warning
./build/fuzz_envelope
./integration_test --port 9000 --clients 20 --frames 50 --with-bad-clients
git tag -l "v0.*"
```

Expected: zero warnings, fuzz passes, integration passes, three tags exist.

## Done When

All 8 checklist items are PASS and the v0.3 git tag exists.
