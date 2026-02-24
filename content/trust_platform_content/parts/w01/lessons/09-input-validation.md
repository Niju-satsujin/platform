---
id: w01-l09
title: "Input validation — reject before writing"
order: 9
duration_minutes: 25
xp: 50
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste output showing: (1) a message with a tab character being rejected, (2) a message over 1024 bytes being rejected, (3) an empty component being rejected."
  regex_patterns:
    - "rejected|invalid|error"
    - "1024|size|limit"
---
# Input validation — reject before writing

## Concept

The logger's job is to write clean, parseable log entries. If you accept garbage input, you get garbage output — and then your read/filter code breaks trying to parse it later.

The rule is: **validate at the boundary, before anything gets written**. Three specific checks:

1. **No tabs or newlines in fields** — tabs are your field separator, newlines are your record separator. If someone passes a message containing a tab, the read function will see an extra field and misparse the entry.

2. **Size limits** — a single log field should not be 10MB. Set a maximum: 1024 bytes per field. This prevents accidental memory bombs and keeps log files manageable.

3. **No empty required fields** — component and message must not be empty strings.

When validation fails, do NOT write anything. Return an error code. The caller decides what to do (retry with different input, or give up).

In C, you would return an error code from the function. In C++, you have the same option — or you can return a `std::optional` or throw an exception. For this project, return an error code (an enum value) because it is the simplest pattern and avoids exception overhead.

## Task

1. Add validation to the `write()` method — check BEFORE writing to the file:
   - Reject if component is empty
   - Reject if message is empty
   - Reject if component or message contains `\t` or `\n`
   - Reject if component or message is longer than 1024 bytes
2. Return a bool or error enum from `write()` (true = success, false = rejected)
3. In the CLI, if write is rejected: print the reason to stderr and exit 1
4. Write tests in main.cpp using assert: verify that bad inputs are rejected

## Hints

- `str.find('\t') != std::string::npos` checks if a string contains a tab
- `str.size() > 1024` checks the size limit
- `str.empty()` checks for empty string
- Do the validation in a separate function `validate_field(const std::string& value)` so you can reuse it for both component and message

## Verify

```bash
# Tab in message
./logger write INFO main "hello	world"; echo "exit code: $?"

# Oversized message (create 2000-byte string)
./logger write INFO main "$(python3 -c 'print("A"*2000)')"; echo "exit code: $?"

# Empty component
./logger write INFO "" "test"; echo "exit code: $?"
```

Expected:
- All three commands exit with code 1
- Each prints a clear error message explaining why the input was rejected
- Nothing is written to the log file

## Done When

All three validation rules fire correctly, no invalid data ever reaches the log file.
