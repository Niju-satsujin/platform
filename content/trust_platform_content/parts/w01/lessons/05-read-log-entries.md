---
id: w01-l05
title: "Read log entries back"
order: 5
duration_minutes: 25
xp: 50
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste the output of 'trustlog read --file log.txt' showing at least 3 parsed entries printed to stdout."
  regex_patterns:
    - "INFO|WARN|ERROR"
    - "\\d{13}"
---
# Read log entries back

## Concept

Writing logs is half the job. The other half is reading them back so you can debug problems.

In C, you would use `fgets()` to read lines and `strtok()` to split by tabs. Both are painful — `fgets()` needs buffer size management, and `strtok()` mutates the string.

In C++, `std::getline()` reads one line at a time into a `std::string` — no buffer size to manage. To split by tabs, you wrap the string in a `std::istringstream` and use `std::getline(stream, field, '\t')`.

You also need a place to store the parsed data. Define a struct:

```cpp
struct LogEntry {
    uint64_t timestamp;
    Level level;
    std::string component;
    std::string message;
    std::string request_id;
};
```

A `std::vector<LogEntry>` holds all the entries. In C you would use `malloc()` and `realloc()` for a growing array. `std::vector` handles this automatically — it grows when you `push_back()`.

## Task

1. Define a `LogEntry` struct in `trustlog.h`
2. Write a function `std::vector<LogEntry> read_log(const std::string& path)` that:
   - Opens the file with `std::ifstream`
   - Reads each line with `std::getline`
   - Splits each line by `\t` into 5 fields (timestamp, level, component, message, request_id)
   - Parses the timestamp string to `uint64_t` with `std::stoull()`
   - Parses the level string back to a `Level` enum value
   - Returns a vector of LogEntry
3. Add a `read` command to your CLI: `trustlog read --file log.txt` — reads the file and prints all entries to stdout, one per line

## Hints

- `#include <vector>` for std::vector
- `#include <fstream>` for std::ifstream
- `#include <sstream>` for std::istringstream
- `std::stoull("1234")` converts a string to `uint64_t`
- If a line has fewer than 4 fields, skip it (do not crash). Lines with 4 fields (old format without request_id) are valid — treat request_id as empty.
- Print each entry as: `[<timestamp>] <LEVEL> [<component>] <message>`

## Verify

```bash
# First write a few entries
./build/trustlog append --file log.txt --level INFO --component main --message "started"
./build/trustlog append --file log.txt --level WARN --component config --message "missing key"
./build/trustlog append --file log.txt --level ERROR --component db --message "connection lost"
# Now read them back
./build/trustlog read --file log.txt
```

Expected stdout:

```text
[1708800012345] INFO [main] started
[1708800012346] WARN [config] missing key
[1708800012347] ERROR [db] connection lost
```

## Done When

`trustlog read --file log.txt` prints every entry from the log file with all fields correctly parsed.
