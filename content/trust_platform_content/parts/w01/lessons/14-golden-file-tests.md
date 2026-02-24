---
id: w01-l14
title: "Golden file tests"
order: 14
duration_minutes: 25
xp: 75
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste: (1) the content of one .expected golden file, (2) the test output showing 'PASS' or a diff command showing zero differences."
  regex_patterns:
    - "PASS|identical|no differences"
---
# Golden file tests

## Concept

A **golden file test** works like this:
1. Run your program with known inputs (fake clock, fixed component names, fixed messages)
2. Capture the output to a file
3. Compare it byte-for-byte against a saved "golden" (expected) file
4. If they match, the test passes. If they differ, something changed.

This is the simplest form of regression testing. You do not write complex assertions for each field — you just say "the output should be exactly this" and let `diff` do the work.

The fake clock from lesson 13 is what makes this possible. With a real clock, timestamps change every run and the comparison fails. With a fake clock that returns 1000, 2000, 3000, the output is identical every time.

Golden files live in a `tests/golden/` directory. Each test case has:
- An input (command line arguments or input data)
- A `.expected` file (the golden output)

When you intentionally change the output format, you regenerate the golden files. This is normal — just make sure the new output is correct before saving it.

## Task

1. Create a directory `tests/golden/`
2. Write a test script or C++ test that:
   - Creates a Logger with a fake clock (1000, 2000, 3000)
   - Writes 3 entries with fixed level, component, and message
   - Captures the log file content as `actual_output`
   - Compares against `tests/golden/write_three_entries.expected`
3. Save the correct output as the `.expected` file
4. Write a second golden test: run `logger read` on the above log file, capture stdout, compare against `tests/golden/read_three_entries.expected`
5. If the comparison fails, print a diff showing what changed

## Hints

- `diff expected_file actual_file` returns 0 if identical, 1 if different
- In a bash test script: `diff tests/golden/write_three.expected /tmp/actual.log && echo "PASS" || echo "FAIL"`
- In C++: read both files into strings and compare with `==`
- Generate the golden file once: run the test, inspect the output manually, save it
- Request IDs are random — you need to either: (a) use a fake request ID generator too, or (b) strip the request_id column before comparison

## Verify

```bash
./run_golden_tests.sh
```

Expected: all golden file tests print PASS. Run it 3 times to confirm determinism.

## Done When

Golden file tests pass on 3 consecutive runs with zero diff output.
