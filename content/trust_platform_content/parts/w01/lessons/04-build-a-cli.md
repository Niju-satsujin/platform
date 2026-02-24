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
  instructions: "Paste: (1) output of your program with --help, (2) output with 'write INFO main hello', (3) output with a bad command showing exit code."
  regex_patterns:
    - "Usage:"
    - "exit code"
    - "INFO|WARN|ERROR"
---
# Build a CLI with argc/argv

## Concept

In C, you already know `int main(int argc, char* argv[])`. C++ uses the exact same signature. The difference is what you do after you have the arguments.

In C, you might loop through argv comparing with `strcmp()`. In C++, you convert each `argv[i]` to a `std::string` and use `==` for comparison — no more `strcmp()`.

A proper CLI has:
- **Exit code 0** for success — scripts that call your tool check this
- **Exit code 1** for bad arguments — the user typed something wrong
- **Exit code 2** for file errors — the file cannot be opened or written
- **`--help`** prints usage to stdout and exits 0
- **Error messages** go to stderr, never stdout

In C:
```c
if (strcmp(argv[1], "--help") == 0) { printf("Usage: ...\n"); return 0; }
```

In C++:
```cpp
std::string cmd(argv[1]);
if (cmd == "--help") { std::cout << "Usage: ...\n"; return 0; }
```

Same logic, less boilerplate.

## Task

1. Rewrite `main.cpp` as a CLI with these commands:
   - `logger --help` → prints usage to stdout, exits 0
   - `logger write <LEVEL> <COMPONENT> <MESSAGE>` → writes one log entry to `log.txt`, exits 0
   - Any unknown command → prints error to stderr, exits 1
   - If the log file cannot be opened → prints error to stderr, exits 2
2. Parse `argv` into std::string values at the top of main
3. The help text should list all commands and exit codes

## Hints

- `std::cerr << "Error: ..." << std::endl;` for error output
- `std::cout << "Usage: ..." << std::endl;` for help output
- Check `argc` before accessing `argv[n]` to avoid out-of-bounds
- You can convert a string to a Level with a simple `if/else if` chain: `if (level_str == "INFO") return Level::INFO;`
- Return the exit code from `main()` — do not call `exit()`

## Verify

```bash
g++ -std=c++17 -o logger main.cpp
./logger --help; echo "exit code: $?"
./logger write INFO main "hello world"; echo "exit code: $?"
cat log.txt
./logger nope; echo "exit code: $?"
```

Expected:
- `--help` prints usage, exit code 0
- `write` appends to log.txt, exit code 0
- `nope` prints error to stderr, exit code 1

## Done When

Three different exit codes work correctly: 0 for success, 1 for bad args, 2 for file errors.
