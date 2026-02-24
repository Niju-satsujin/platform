---
id: w01-l13
title: "Injectable clock for deterministic tests"
order: 13
duration_minutes: 30
xp: 75
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste: (1) your Logger constructor showing it accepts a clock function, (2) a test that uses a fake clock and asserts the exact timestamp in the output."
  regex_patterns:
    - "std::function"
    - "fake|mock|test"
    - "assert"
---
# Injectable clock for deterministic tests

## Concept

Your logger calls `now_ms()` to get the current time. That means every time you run a test, the timestamps are different. You cannot write a test that says "the output should be exactly this" because the timestamp changes every run.

The fix is called **dependency injection**. Instead of hardcoding the clock call inside the logger, you pass the clock function in from the outside. In production, you pass the real clock. In tests, you pass a fake clock that always returns the same value.

In C, you might use a function pointer:
```c
typedef uint64_t (*clock_fn)(void);
void logger_init(clock_fn get_time);
```

In C++, you use `std::function`, which is like a function pointer but can also hold a **lambda** (an anonymous function defined inline):

```cpp
std::function<uint64_t()> clock_fn;
```

A lambda looks like this:
```cpp
auto fake_clock = []() -> uint64_t { return 1000000000000; };
```

The `[]` captures nothing from the outside. The `()` takes no arguments. The `-> uint64_t` is the return type. The body returns a fixed value. This gives you a deterministic clock you can use in tests.

## Task

1. Change the Logger constructor to accept an optional clock function: `std::function<uint64_t()> clock = nullptr`
2. If no clock is provided, default to `now_ms()` (the real clock)
3. If a clock is provided, call it instead of `now_ms()` when writing entries
4. Write a test that:
   - Creates a Logger with a fake clock that returns a sequence: 1000, 2000, 3000, ...
   - Writes 3 entries
   - Reads them back
   - Asserts the timestamps are exactly 1000, 2000, 3000

## Hints

- `#include <functional>` for `std::function`
- A lambda with mutable state: `uint64_t counter = 0; auto fake = [counter]() mutable -> uint64_t { return ++counter * 1000; };`
- Alternatively, use a simple counter variable captured by reference: `uint64_t t = 0; auto fake = [&t]() -> uint64_t { return t += 1000; };`
- In your constructor: `m_clock = clock ? clock : now_ms;` (where `now_ms` is your real clock function)
- This is the same pattern used in production code — Google, Meta, and every serious C++ codebase injects clocks for testing

## Verify

```bash
g++ -std=c++17 -o test_clock test_clock.cpp
./test_clock
echo "exit code: $?"
```

Expected: exit code 0 (all asserts pass). The timestamps in the log file are exactly 1000, 2000, 3000.

## Done When

Tests with a fake clock produce bit-identical output every run, and the real clock still works in the CLI.
