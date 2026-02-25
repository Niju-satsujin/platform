---
id: w21-l06
title: "Week 21 Quality Gate"
order: 6
duration_minutes: 20
xp: 100
kind: lesson
part: w21
proof:
  type: paste
  instructions: "Paste the output of your full test suite and the git tag command."
  regex_patterns:
    - "pass"
    - "v0\\.21"
---

## Concept

Quality gate for Week 21. Your system is now observable — you can measure how it is performing, see alerts when things go wrong, and view the overall health on a dashboard. This is the foundation of production operations.

Next week you focus on security: threat modeling, attack surface analysis, and hardening.

## Task

Verify this 6-point checklist:
1. SLIs are defined and documented for all operations
2. Metrics are automatically collected via ScopedTimer and success/error recording
3. All log entries are structured JSON with timestamp, level, and operation fields
4. Alert rules fire correctly when SLOs are violated
5. SLO dashboard shows all metrics with status indicators
6. All tests pass

Run the full test suite. Tag your repo.

## Hints

- Run all tests: `cd build && ctest --output-on-failure`
- Tag with: `git tag v0.21-observability`

## Verify

```bash
cd build && ctest --output-on-failure && git tag v0.21-observability
```

All tests pass, tag created.

## Done When

All 6 checklist items pass, full test suite green, repo tagged `v0.21-observability`.
