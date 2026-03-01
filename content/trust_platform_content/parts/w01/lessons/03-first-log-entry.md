---
id: w01-l03
title: "Write your first real log entry"
order: 3
duration_minutes: 30
xp: 50
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste the content of your log file showing at least 3 entries with timestamps, levels, components, messages, and a request_id field separated by tabs."
  regex_patterns:
    - "\\d{13}"
    - "\\t"
    - "INFO|WARN|ERROR"
---
# Write your first real log entry

## Concept

A useful log entry has five pieces of information:

1. **When** — a timestamp (when did this happen?)
2. **Severity** — the level (how important is it?)
3. **Where** — a component name (which part of the system produced this?)
4. **What** — the message (what happened?)
5. **Correlation** — a request ID (which operation does this belong to?)

For timestamps, we use milliseconds since January 1, 1970 (Unix epoch). This is a single number like `1708800000000`. It is unambiguous — no timezone confusion, no date format arguments. Every language and every tool can parse it.

In C, you would use `time()` or `gettimeofday()`. In C++, you use `std::chrono`:

```cpp
auto now = std::chrono::system_clock::now();
auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
    now.time_since_epoch()
).count();
```

This gives you a `uint64_t` (a large integer) representing the current time in milliseconds. It looks ugly, but you write it once and wrap it in a function.

The format is tab-separated with 5 fields: `timestamp\tlevel\tcomponent\tmessage\trequest_id\n`

We include the request_id field from the start (empty string `""` for now) so the format never changes later. In lesson 11 you will generate real request IDs — but the format stays the same.

We use tabs because:

- They almost never appear in log messages (unlike spaces or commas)
- `cut -f2` extracts the second field instantly
- No quoting or escaping rules needed

## Task

1. Add a `component` parameter to your `write()` method: `write(Level lvl, const std::string& component, const std::string& message)`
2. Write a helper function `uint64_t now_ms()` that returns the current time in milliseconds using `std::chrono`
3. Each log line should be: `<timestamp_ms>\t<LEVEL>\t<component>\t<message>\t\n` (the 5th field is an empty string for now — a placeholder for request IDs)
4. Write a test in `main.cpp` using `assert()`:
   - Write 3 entries with different levels and components
   - Read the file back line by line
   - Assert each line has exactly 5 tab-separated fields
   - Assert the timestamp is a number with 13 digits

## Hints

- `#include <chrono>` for std::chrono
- `#include <cassert>` for assert()
- `#include <sstream>` and `std::istringstream` with `std::getline(stream, token, '\t')` to split by tab
- To check digit count: convert the timestamp string to a number and check it is between 1000000000000 and 9999999999999
- The 5th field (request_id) is empty for now — just write the tab delimiter so the field count is consistent

## Verify

```bash
cmake --build build
./build/trustlog
cat log.txt
```

Expected — 3 lines, each with 5 tab-separated fields:

```
1708800012345	INFO	main	Application started
1708800012346	WARN	config	Missing optional setting
1708800012347	ERROR	network	Connection refused
```

(Your timestamps will be different — that is correct. The 5th field is empty.)

## Done When

The assert passes: each line has exactly 5 tab-separated fields and the timestamp is a 13-digit number.
