---
id: w01-l01
title: "From C struct to C++ class"
order: 1
duration_minutes: 25
xp: 50
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste your terminal output showing the constructor message, the log write, and the destructor message."
  regex_patterns:
    - "Logger opened"
    - "Logger closed"
---
# From C struct to C++ class

## Concept

In C, when you open a file you call `fopen()`, and when you are done you call `fclose()`. If you forget `fclose()`, the file handle leaks. Every C programmer has forgotten this at least once.

C++ has a pattern that fixes this permanently. You put the `fopen()` call inside a **constructor** — a special function that runs automatically when you create an object. You put the `fclose()` call inside a **destructor** — a special function that runs automatically when the object is destroyed (goes out of scope, or gets deleted).

In C you might write:
```c
FILE* f = fopen("log.txt", "a");
// ... use f ...
fclose(f);  // you must remember this
```

In C++, the destructor does the cleanup for you:
```cpp
{
    Logger log("log.txt");  // constructor opens the file
    // ... use log ...
}  // destructor runs here automatically — file is closed
```

You never forget to close the file because the language does it for you. This pattern is called **RAII** (Resource Acquisition Is Initialization). The name is confusing — just remember: **constructor acquires, destructor releases**.

A C++ `class` is almost identical to a C `struct`, except members are private by default. You already know structs. A class is a struct with a constructor and destructor bolted on.

## Task

1. Create a file `logger.h` with a `Logger` class
2. The constructor takes a file path (std::string) and opens it with `std::ofstream` in append mode
3. The destructor closes the file (std::ofstream does this automatically, but print a message like "Logger closed" to stderr so you can SEE it happen)
4. Add a constructor message too — print "Logger opened: <path>" to stderr
5. Add one method: `write(const std::string& message)` — writes the message followed by a newline to the file
6. Create a `main.cpp` that creates a Logger, writes one line, and exits — watch the destructor fire

## Hints

- `#include <fstream>` for `std::ofstream`
- `#include <string>` for `std::string`
- `#include <iostream>` for `std::cerr`
- The destructor syntax is `~Logger()` — the tilde means "destroy"
- `std::ofstream` has a method `.is_open()` to check if the file opened successfully
- Compile with: `g++ -std=c++17 -o logger main.cpp`

## Verify

```bash
g++ -std=c++17 -o logger main.cpp
./logger
cat log.txt
```

Expected:
- stderr shows "Logger opened: log.txt" then "Logger closed"
- `log.txt` contains your message

## Done When

The destructor message prints automatically without you calling any close function.
