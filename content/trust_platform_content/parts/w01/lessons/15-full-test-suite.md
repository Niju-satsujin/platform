---
id: w01-l15
title: "Full test suite with ctest"
order: 15
duration_minutes: 30
xp: 75
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste the full output of 'cd build && ctest --output-on-failure' showing all tests pass."
  regex_patterns:
    - "tests? passed"
    - "100%"
---
# Full test suite with ctest

## Concept

So far you have been writing tests inside `main.cpp` or in a bash script. This works for a few tests, but it does not scale. You need a test runner that:

- Discovers all tests automatically
- Runs them independently (one failing test does not block others)
- Reports which passed and which failed
- Returns exit code 0 if all pass, non-zero if any fail

CMake includes a test runner called **ctest**. You add tests in your `CMakeLists.txt`, and ctest finds and runs them.

The pattern:

1. Each test is a small executable (or a script)
2. It returns exit code 0 if it passes, non-zero if it fails
3. CMake registers it with `add_test(NAME test_name COMMAND ./test_executable)`
4. `ctest` runs all registered tests and prints a summary

You already have the building blocks: the golden file tests from lesson 14, the validation tests, the error code tests. Now you package them so `ctest` runs everything.

## Task

1. Update your `CMakeLists.txt` to include test targets
2. Add your trustlog as a library target: `add_library(trustlog_lib trustlog.h trustlog.cpp)`
3. Create separate test executables for each test category:
   - `test_write` — tests the write path (validation, error codes)
   - `test_read` — tests the read/filter path
   - `test_golden` — runs the golden file comparisons
   - `test_clock` — tests the injectable clock
4. Register each with `add_test()`
5. Run `cmake --build build && cd build && ctest`

## Hints

- `add_executable(test_write tests/test_write.cpp)`
- `target_link_libraries(test_write trustlog_lib)`
- `add_test(NAME test_write COMMAND test_write)`
- `enable_testing()` must be called before `add_test()`
- Build: `cmake -B build && cmake --build build`
- Run tests: `cd build && ctest --output-on-failure`

## Verify

```bash
cmake -B build && cmake --build build
cd build && ctest --output-on-failure
cd build && ctest --output-on-failure
cd build && ctest --output-on-failure
```

Expected: all tests pass on all 3 runs. The output shows `100% tests passed`.

## Done When

`ctest` runs all tests, all pass, and 3 consecutive runs produce identical results.
