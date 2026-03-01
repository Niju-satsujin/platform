---
id: w01-l10
title: "Specific error codes with ErrorCode enum"
order: 10
duration_minutes: 20
xp: 50
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste your ErrorCode enum class definition showing the 1xxx/2xxx/3xxx ranges, and one test that checks a specific error code is returned."
  regex_patterns:
    - "ErrorCode"
    - "1\\d{3}|2\\d{3}|3\\d{3}"
---
# Specific error codes with ErrorCode enum

## Concept

Right now your trustlog returns true/false or exit codes 0/1/2. That tells you "something went wrong" but not exactly what. When you have a system with 10 components all writing logs, "error" is not enough — you need to know the category.

A numbering scheme helps:

- **1xxx** — input validation errors (bad data from the caller)
- **2xxx** — file system errors (cannot open, write, or sync)
- **3xxx** — parse errors (corrupted log file during read)

Specific codes:

- `1001` — empty field
- `1002` — field contains tab or newline
- `1003` — field exceeds size limit
- `2001` — file open failed
- `2002` — file write failed
- `2003` — fsync failed
- `3001` — malformed line (wrong number of fields)
- `3002` — unparseable timestamp

You represent these as an `enum class ErrorCode` with explicit integer values. This is better than bare integers because the compiler tracks the type.

## Task

1. Define `enum class ErrorCode : int` with the codes listed above, plus `OK = 0`
2. Change your `write()` method to return `ErrorCode` instead of bool
3. Change your validation function to return the specific `ErrorCode`
4. Change your `read_log()` to track parse errors by `ErrorCode` (3001, 3002)
5. Update the CLI to print the error code number in the error message: `"Error 1003: field exceeds 1024 byte limit"`

## Hints

- `enum class ErrorCode : int { OK = 0, EMPTY_FIELD = 1001, ... };`
- To get the integer value: `static_cast<int>(code)`
- You can format: `std::cerr << "Error " << static_cast<int>(code) << ": " << message << std::endl;`
- Write a helper `std::string error_message(ErrorCode code)` that maps each code to a human-readable string

## Verify

```bash
./build/trustlog append --file log.txt --level INFO --component "" --message "test" 2>&1
./build/trustlog append --file log.txt --level INFO --component main --message "$(python3 -c 'print("A"*2000)')" 2>&1
echo "bad line" >> log.txt
./build/trustlog read --file log.txt 2>&1
```

Expected:

- First command shows "Error 1001"
- Second command shows "Error 1003"
- Third command shows "Error 3001" for the bad line, then prints good entries

## Done When

Every error situation returns a specific numbered ErrorCode, and the CLI prints the code number in its error message.
