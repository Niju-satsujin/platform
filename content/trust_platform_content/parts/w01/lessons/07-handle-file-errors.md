---
id: w01-l07
title: "Handle file errors without crashing"
order: 7
duration_minutes: 25
xp: 50
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste output of: (1) trying to read a nonexistent file, (2) trying to write to a read-only path, (3) reading a file with a malformed line. All must show an error message and exit code 2, or handle gracefully."
  regex_patterns:
    - "error|Error"
    - "exit code: 2"
---
# Handle file errors without crashing

## Concept

Three things go wrong with files:
1. The file does not exist (you try to read `data.log` but it was deleted)
2. You do not have permission to write (the file is read-only, or the directory is not yours)
3. The file contains garbage (a line is missing fields, or a timestamp is not a number)

In C, every file function returns a value you must check: `fopen()` returns NULL, `fwrite()` returns a short count, `fsync()` returns -1. Forgetting to check is a classic C bug.

In C++, `std::ofstream` and `std::ifstream` have the same problem — they fail silently unless you check. After opening, call `.is_open()`. After writing, check `.fail()`. These do not throw exceptions by default — you must check manually.

The rule is: **never crash on bad input**. Print a clear error message to stderr and return exit code 2 (file error).

For malformed lines during read, do not crash either. Skip the bad line, log a warning, and keep going. One corrupted line should not prevent you from reading the other 10,000 good lines.

## Task

1. In your `Logger` constructor: if the file fails to open, print an error to stderr and throw a `std::runtime_error`
2. In `main.cpp`: catch the exception and return exit code 2
3. In `read_log()`: if the input file does not exist, return an empty vector and print a warning to stderr
4. In `read_log()`: if a line has fewer than 4 tab-separated fields, skip it and print a warning to stderr (include the line number)
5. In `read_log()`: if the timestamp cannot be parsed as a number, skip the line and warn

## Hints

- `std::ofstream ofs(path, std::ios::app); if (!ofs.is_open()) { ... }`
- `#include <stdexcept>` for `std::runtime_error`
- `try { ... } catch (const std::runtime_error& e) { std::cerr << e.what(); return 2; }`
- `std::stoull()` throws `std::invalid_argument` if the string is not a number — catch it
- Track line numbers with a counter in your read loop

## Verify

```bash
# Test 1: read nonexistent file
./logger read --file /tmp/nope.log; echo "exit code: $?"

# Test 2: write to unwritable location
./logger write INFO main "test" --file /root/nope.log; echo "exit code: $?"

# Test 3: read file with malformed line
echo -e "not a valid line\n1708800000000\tINFO\tmain\tgood line" > /tmp/mixed.log
./logger read --file /tmp/mixed.log
```

Expected:
- Test 1: warning on stderr, exit code 2 or 0 with empty output
- Test 2: error on stderr, exit code 2
- Test 3: warning about line 1, then prints the good line

## Done When

No combination of missing/broken/unwritable files causes a crash — every failure produces a clear error message.
