---
id: w01-l02
title: "Type-safe constants with enum class"
order: 2
duration_minutes: 20
xp: 50
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste your code showing the enum class definition and one usage of it in your Logger write method."
  regex_patterns:
    - "enum class"
    - "Level"
---
# Type-safe constants with enum class

## Concept

In C, you define log levels like this:
```c
#define LOG_INFO  0
#define LOG_WARN  1
#define LOG_ERROR 2
```

The problem: these are just integers. Nothing stops you from writing `log_write(f, 42, "oops")` — the compiler won't complain, but 42 is not a valid log level.

C++ has **enum class**, which fixes this. An enum class creates a new type. The compiler will reject any value that is not in the list.

```cpp
enum class Level { INFO, WARN, ERROR };
```

Now `Level::INFO` is type `Level`, not type `int`. You cannot accidentally pass `42` where a `Level` is expected — the compiler will refuse.

To convert a Level to a string for display, you write a small function (there is no built-in way in C++). This is a one-time cost you pay once and never think about again.

## Task

1. Define `enum class Level { INFO, WARN, ERROR }` in `logger.h`
2. Write a helper function `std::string level_to_string(Level lvl)` that returns "INFO", "WARN", or "ERROR"
3. Change your `write()` method signature to `write(Level lvl, const std::string& message)`
4. The output line should now include the level: e.g. `INFO\tsome message`
5. In `main.cpp`, write one entry at each level

## Hints

- Use a `switch` statement inside `level_to_string` — the compiler warns if you forget a case
- The `\t` character is the tab separator — we use tabs because they are unambiguous and easy to split
- `std::string` concatenation uses `+`: `level_to_string(lvl) + "\t" + message`

## Verify

```bash
g++ -std=c++17 -o logger main.cpp
./logger
cat log.txt
```

Expected output in `log.txt`:
```
INFO	some message
WARN	a warning
ERROR	an error
```

## Done When

Passing an integer like `42` to `write()` instead of a `Level` value causes a compile error.
