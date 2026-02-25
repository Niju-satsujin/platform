---
id: w23-l06
title: "Week 23 Quality Gate"
order: 6
duration_minutes: 20
xp: 100
kind: lesson
part: w23
proof:
  type: paste
  instructions: "Paste the output of your full test suite and the git tag command."
  regex_patterns:
    - "pass"
    - "v0\\.23"
---

## Concept

Quality gate for Week 23. Your project is now portfolio-ready. You have professional documentation, a polished demo, prepared interview stories, and a portfolio entry. One more week to go.

## Task

Verify this 6-point checklist:
1. Architecture diagram shows all components and data flows
2. Demo script is polished, timed, and rehearsed (under 5 minutes)
3. Story bank has at least 6 STAR-format interview stories
4. README is professional with description, features, quick start, and architecture
5. Portfolio entry has a summary paragraph and 5 key metrics
6. All tests pass

Run the full test suite. Tag your repo.

## Hints

- Run all tests: `cd build && ctest --output-on-failure`
- Tag with: `git tag v0.23-portfolio`

## Verify

```bash
cd build && ctest --output-on-failure && git tag v0.23-portfolio
```

All tests pass, tag created.

## Done When

All 6 checklist items pass, full test suite green, repo tagged `v0.23-portfolio`.
