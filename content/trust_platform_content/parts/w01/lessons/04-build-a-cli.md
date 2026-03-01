---
id: w01-l04
title: "Build a CLI with argc/argv"
order: 4
duration_minutes: 30
xp: 50
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste: (1) output of your program with --help, (2) output with 'trustlog append --file log.txt --level INFO --component main --message hello', (3) output with a bad command showing exit code."
  regex_patterns:
    - "Usage:"
    - "exit code"
    - "INFO|WARN|ERROR"
---
# Build a CLI with argc/argv

## Concept

In C, you already know `int main(int argc, char* argv[])`. C++ uses the exact same signature. The difference is what you do after you have the arguments.

In C, you might loop through argv comparing with `strcmp()`. In C++, you convert each `argv[i]` to a `std::string` and use `==` for comparison — no more `strcmp()`.

A proper CLI uses **named flags** instead of positional arguments. Positional arguments are fragile — if you forget one, all the others shift and break silently. Named flags are self-documenting and order-independent.

Bad (positional): `trustlog write INFO main "hello"`
Good (flags): `trustlog append --file log.txt --level INFO --component main --message "hello"`

A proper CLI also has:

- **Exit code 0** for success — scripts that call your tool check this
- **Exit code 1** for bad arguments — the user typed something wrong
- **Exit code 2** for file errors — the file cannot be opened or written
- **`--help`** prints usage to stdout and exits 0
- **Error messages** go to stderr, never stdout

## Task

1. Rewrite `main.cpp` as a CLI with these commands:
   - `trustlog --help` → prints usage to stdout, exits 0
   - `trustlog append --file PATH --level LEVEL --component NAME --message TEXT` → writes one log entry to PATH, exits 0
   - Any unknown command → prints error to stderr, exits 1
   - If the log file cannot be opened → prints error to stderr, exits 2
2. All flags are required for `append`. If any flag is missing, print an error and exit 1.
3. Parse flags by walking through argv looking for `--file`, `--level`, `--component`, `--message` and grabbing the next element as the value.
4. The help text should list all commands, flags, and exit codes.

## Hints

- `std::cerr << "Error: ..." << std::endl;` for error output
- `std::cout << "Usage: ..." << std::endl;` for help output
- Check `i + 1 < argc` before reading `argv[i + 1]` — missing flag values should be an error (exit 1)
- You can convert a string to a Level with a simple `if/else if` chain: `if (level_str == "INFO") return Level::INFO;`
- Return the exit code from `main()` — do not call `exit()`

## Verify

```bash
cmake --build build
./build/trustlog --help; echo "exit code: $?"
./build/trustlog append --file log.txt --level INFO --component main --message "hello world"; echo "exit code: $?"
cat log.txt
./build/trustlog nope; echo "exit code: $?"
```

Expected:

- `--help` prints usage, exit code 0
- `append` writes to log.txt, exit code 0
- `nope` prints error to stderr, exit code 1

## Done When

Three different exit codes work correctly: 0 for success, 1 for bad args, 2 for file errors. All flags are parsed by name, not position.
