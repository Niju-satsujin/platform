---
id: w01-l20
title: "Week 1 quality gate"
order: 20
duration_minutes: 20
xp: 100
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste your completed 8-point checklist with each item marked PASS or FAIL, plus the git tag output."
  regex_patterns:
    - "PASS"
    - "v0\\.1|week-1"
---
# Week 1 quality gate

## Concept

A **quality gate** is a checklist you must pass before you move on. It prevents you from carrying bugs into the next week where they become harder to fix.

This is not optional. Every item must be PASS. If any item is FAIL, go back and fix it before proceeding to Week 2.

The 8-point checklist:

1. **Clean build** — `cmake --build build` produces zero warnings
2. **All tests pass** — `ctest` shows 100% pass rate
3. **Deterministic** — 3 consecutive ctest runs produce identical output
4. **Standalone** — `test_standalone` compiles and passes without CLI code
5. **Benchmark recorded** — ops/sec numbers for no-fsync and fsync modes are written down
6. **stderr/stdout correct** — `logger read 2>/dev/null | wc -l` returns the exact entry count
7. **CI green** — GitHub Actions shows a green checkmark on the latest push
8. **Project structure** — `include/`, `src/`, `tests/` layout is clean

After passing all 8, tag your repo:
```bash
git tag -a v0.1-logger -m "Week 1: Structured Logger complete"
```

This tag is your checkpoint. You can always come back to this exact state.

## Task

1. Run each check from the list above
2. For each item, write PASS or FAIL
3. Fix any FAIL items
4. When all 8 are PASS, create the git tag
5. Write a short `README.md` for the logger project (3-5 sentences: what it does, how to build, how to test)

## Hints

- For check 1: `cmake --build build 2>&1 | grep -i warning`
- For check 2: `cd build && ctest --output-on-failure`
- For check 3: run ctest 3 times, diff the outputs
- For check 7: go to your GitHub repo's Actions tab
- `git tag -a v0.1-logger -m "Week 1 complete"` creates an annotated tag
- `git push origin v0.1-logger` pushes the tag to GitHub

## Verify

```bash
cmake --build build 2>&1 | grep -ci warning
cd build && ctest --output-on-failure
git tag -l "v0.1*"
```

Expected:
- Warning count is 0
- All tests pass
- Tag `v0.1-logger` exists

## Done When

All 8 checklist items are PASS, the git tag exists, and you are ready for Week 2.
