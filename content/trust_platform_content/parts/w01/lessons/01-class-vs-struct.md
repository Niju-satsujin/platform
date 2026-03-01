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
  instructions: "Paste the content of log.txt showing your message was written, and paste the code showing your destructor does NOT call any explicit close function."
  regex_patterns:
    - "~TrustLog"
    - "ofstream"
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
    TrustLog log("log.txt");  // constructor opens the file
    // ... use log ...
}  // destructor runs here automatically — file is closed
```

You never forget to close the file because the language does it for you. This pattern is called **RAII** (Resource Acquisition Is Initialization). The name is confusing — just remember: **constructor acquires, destructor releases**.

A C++ `class` is almost identical to a C `struct`, except members are private by default. You already know structs. A class is a struct with a constructor and destructor bolted on.

## Setup — CMake build system

Before writing any code, set up CMake so every lesson uses the same build system. Create a `CMakeLists.txt` at the root of your project:

```cmake
cmake_minimum_required(VERSION 3.16)
project(trustlog)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(trustlog_lib trustlog.h)
set_target_properties(trustlog_lib PROPERTIES LINKER_LANGUAGE CXX)

add_executable(trustlog main.cpp)
target_link_libraries(trustlog trustlog_lib)
```

Build with:
```bash
cmake -B build && cmake --build build
```

You will use this for every lesson going forward. As you add source files and tests, you update this `CMakeLists.txt`.

## Task

1. Create a `CMakeLists.txt` as shown above
2. Create a file `trustlog.h` with a `TrustLog` class
3. The constructor takes a file path (std::string) and opens it with `std::ofstream` in append mode
4. The destructor closes the file — `std::ofstream` does this automatically when the object is destroyed, so the destructor body can be empty (or default). The point is: you never call close manually.
5. Add one method: `write(const std::string& message)` — writes the message followed by a newline to the file
6. Create a `main.cpp` that creates a TrustLog, writes one line, and exits — the file is closed automatically when the object goes out of scope

## Hints

- `#include <fstream>` for `std::ofstream`
- `#include <string>` for `std::string`
- The destructor syntax is `~TrustLog()` — the tilde means "destroy"
- `std::ofstream` has a method `.is_open()` to check if the file opened successfully
- `std::ofstream` automatically closes the file in its own destructor — this is RAII in action

## Verify

```bash
cmake -B build && cmake --build build
./build/trustlog
cat log.txt
```

Expected:
- `log.txt` contains your message
- No explicit close call anywhere in your code — the destructor handles it

## Done When

The file is written and closed properly without you ever calling a close function. RAII does the work.
