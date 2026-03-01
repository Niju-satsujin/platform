---
id: w01-l17
title: "Standalone library proof"
order: 17
duration_minutes: 20
xp: 50
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste the build output of a test program that includes only trustlog.h and compiles without any CLI code."
  regex_patterns:
    - "compile|build|success"
---
# Standalone library proof

## Concept

Your trustlog should be a **library** — a reusable piece of code that any program can include. The CLI (main.cpp) is just one user of the library. Next week, your TCP server will be another user. Week 9, your KV store will be another.

To prove the trustlog is standalone, you need to show it compiles without any CLI code. If `trustlog.h` accidentally depends on something from `main.cpp` (like a global variable or a CLI-specific function), the standalone test will fail to compile.

This is a design discipline: **the library knows nothing about who uses it**. It does not know about argv, it does not know about the CLI commands, it does not print help text. It only knows how to open a file, write entries, and read entries.

In CMake terms, you already have `add_library(trustlog_lib ...)`. The standalone test is an executable that links only against `trustlog_lib` and does not include `main.cpp`.

## Task

1. Create `tests/test_standalone.cpp` that:
   - Includes only `trustlog.h`
   - Creates a TrustLog, writes 3 entries, reads them back
   - Asserts the count is 3
   - Does NOT include anything from main.cpp
2. Add it to CMakeLists.txt: `add_executable(test_standalone tests/test_standalone.cpp)`
3. Link it only to the trustlog library: `target_link_libraries(test_standalone trustlog_lib)`
4. Build and run it
5. If it compiles and passes, the library is standalone

## Hints

- If you get a linker error, it means trustlog.h/trustlog.cpp depends on something defined in main.cpp — move it to the library
- Common problem: `now_ms()` defined in main.cpp instead of trustlog.cpp — move it
- Common problem: `level_to_string()` defined in main.cpp — move it
- The test should be minimal — just enough to prove the library works alone

## Verify

```bash
cmake --build build
./build/test_standalone
echo "exit code: $?"
```

Expected: compiles with no errors, runs, exits 0.

## Done When

`test_standalone` compiles and passes without any CLI code in the link step.
