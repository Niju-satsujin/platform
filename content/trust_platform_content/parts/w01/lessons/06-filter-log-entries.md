---
id: w01-l06
title: "Filter log entries by level and component"
order: 6
duration_minutes: 25
xp: 50
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste output of 'logger read --level ERROR' showing only ERROR entries, and 'logger read --component main' showing only main entries."
  regex_patterns:
    - "ERROR"
    - "\\[main\\]"
---
# Filter log entries by level and component

## Concept

When you have thousands of log entries, you need to filter. The two most common filters are:

1. **By level** — "show me only ERRORs"
2. **By component** — "show me only entries from the network module"

In C, you would parse `argv` looking for `--level` and grab the next element. Same in C++ — there is no magic. But you store the filter values in `std::string` instead of `char*`, and comparison is just `==` instead of `strcmp()`.

The filtering itself is simple: loop through entries, check if each one matches, print it if it does. In C++ you could use `std::copy_if` with a lambda, but a plain `for` loop is clearer when you are learning.

## Task

1. Add CLI flags to the `read` command:
   - `logger read --level ERROR` — only show entries with level ERROR
   - `logger read --component main` — only show entries with component "main"
   - Both flags can be combined: `logger read --level WARN --component config`
   - No flags means show everything (existing behavior)
2. Parse these flags from argv before calling the filter
3. Filter entries after reading them: loop through the vector and skip entries that do not match

## Hints

- Walk through argv looking for `--level` and `--component`, grab the value that follows each
- Check `i + 1 < argc` before reading `argv[i + 1]` — missing values should be an error (exit 1)
- For level filter: compare `entry.level == parse_level(filter_level_str)`
- For component filter: compare `entry.component == filter_component`
- If both filters are set, both must match (AND logic)

## Verify

```bash
# Write some diverse entries first
./logger write INFO main "starting up"
./logger write ERROR db "connection failed"
./logger write WARN main "slow query"
./logger write ERROR main "crash"
# Filter by level
./logger read --level ERROR
# Filter by component
./logger read --component main
# Combine
./logger read --level ERROR --component main
```

Expected:
- `--level ERROR` shows 2 entries (db error + main crash)
- `--component main` shows 3 entries (all "main" entries)
- Combined shows 1 entry (main crash only)

## Done When

Both filter flags work individually and combined, and missing flag values print an error.
