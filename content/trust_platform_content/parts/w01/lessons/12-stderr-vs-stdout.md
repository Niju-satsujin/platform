---
id: w01-l12
title: "stderr vs stdout — audit all output"
order: 12
duration_minutes: 20
xp: 25
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste output of: (1) 'trustlog read --file log.txt > /dev/null' showing only stderr content, (2) 'trustlog read --file log.txt 2>/dev/null' showing only stdout content. Prove data and errors go to separate streams."
  regex_patterns:
    - "/dev/null"
---
# stderr vs stdout — audit all output

## Concept

Unix programs have two output streams:

- **stdout** — for data, the actual output the caller wants
- **stderr** — for errors, warnings, and diagnostic messages

This separation matters because callers pipe stdout to other programs. If you mix error messages into stdout, the next program in the pipe gets garbage.

Example:

```bash
# This should give only log entries to wc -l (line count)
./build/trustlog read --file log.txt | wc -l

# If errors go to stdout too, wc counts error messages as log entries — wrong!
```

The rule is simple:

- Data goes to `std::cout` (stdout)
- Errors and warnings go to `std::cerr` (stderr)
- Debug/status messages go to `std::cerr` (stderr)

Today you audit every `std::cout` and `std::cerr` call in your code and make sure each one is on the correct stream.

## Task

1. Go through every line of your code that prints anything
2. Make a list: for each print statement, decide if it is data (stdout) or diagnostic (stderr)
3. Move any misplaced output to the correct stream
4. These should be on stdout: help text, version, log entries from `read`, any machine-parseable output
5. These should be on stderr: error messages, warnings about skipped lines
6. Test by redirecting each stream to /dev/null and verifying what remains

## Hints

- `std::cout` goes to stdout (file descriptor 1)
- `std::cerr` goes to stderr (file descriptor 2)
- `> /dev/null` silences stdout — only stderr is visible
- `2>/dev/null` silences stderr — only stdout is visible
- `--help` output should go to stdout (so `trustlog --help | less` works)

## Verify

```bash
# Should show only errors/warnings (stderr), no data
./build/trustlog read --file log.txt > /dev/null

# Should show only data (stdout), no errors
./build/trustlog read --file log.txt 2>/dev/null

# Counting entries should be accurate
./build/trustlog read --file log.txt 2>/dev/null | wc -l
```

Expected: redirecting stdout hides log entries but shows warnings. Redirecting stderr hides warnings but shows log entries.

## Done When

`./build/trustlog read --file log.txt 2>/dev/null | wc -l` returns the exact number of valid log entries with zero error messages mixed in.
