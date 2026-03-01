---
id: w01-quest
title: "Week 1 Boss: Ship the Structured Logger"
part: w01
kind: boss
proof:
  type: paste
  instructions: "Paste: (1) full ctest output showing all tests pass, (2) benchmark output showing ops/sec with and without fsync, (3) your 8-point quality gate checklist with each item marked PASS."
  regex_patterns:
    - "tests? passed"
    - "ops/sec"
    - "PASS"
---
# Week 1 Boss: Ship the Structured Logger

## Goal

Prove your trustlog is complete, tested, and production-quality. This is not a toy — it becomes the logging backbone for every system you build in the next 5 months.

## Requirements

You must demonstrate all of these:

1. **Clean build** — `cmake --build build` completes with zero warnings
2. **All tests pass** — `cd build && ctest` shows every test green, run it 3 times to prove determinism
3. **Benchmark recorded** — append ops/sec measured with fsync off and fsync on
4. **Standalone proof** — a test that includes only `trustlog.h` and compiles without CLI code
5. **Quality gate** — all 8 checkpoints from lesson 20 are PASS

## Verify

```bash
cmake --build build 2>&1 | tail -5
cd build && ctest --output-on-failure
cd build && ctest --output-on-failure
cd build && ctest --output-on-failure
./build/trustlog_benchmark
```

All three ctest runs must produce identical output.

## Done When

You can paste the terminal output and every test passes, the benchmark numbers are recorded, and the quality gate is fully green.
