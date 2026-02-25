---
id: w22-l06
title: "Week 22 Quality Gate"
order: 6
duration_minutes: 20
xp: 100
kind: lesson
part: w22
proof:
  type: paste
  instructions: "Paste the output of your full test suite and the git tag command."
  regex_patterns:
    - "pass"
    - "v0\\.22"
---

## Concept

Quality gate for Week 22. Your system now has a formal security analysis: attack surface mapped, defenses tested, dependencies audited, threats modeled, and hardening completed. This is the kind of security documentation that companies expect for production systems.

Next week: documentation and portfolio preparation for job interviews.

## Task

Verify this 6-point checklist:
1. Attack surface map documents all entry points and trust boundaries
2. All 5 defense tests pass — every attack vector is blocked
3. Dependency audit is complete with versions and CVE status
4. Threat model has at least 7 documented threats with STRIDE categories
5. Hardening checklist is completed (all items marked done or documented)
6. All tests pass

Run the full test suite. Tag your repo.

## Hints

- Run all tests: `cd build && ctest --output-on-failure`
- Tag with: `git tag v0.22-security`

## Verify

```bash
cd build && ctest --output-on-failure && git tag v0.22-security
```

All tests pass, tag created.

## Done When

All 6 checklist items pass, full test suite green, repo tagged `v0.22-security`.
