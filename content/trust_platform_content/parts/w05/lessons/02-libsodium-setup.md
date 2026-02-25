---
id: w05-l02
title: "Installing and linking libsodium"
order: 2
duration_minutes: 20
xp: 50
kind: lesson
part: w05
proof:
  type: paste
  instructions: "Paste the output of your test program that prints the libsodium version and confirms sodium_init() succeeded."
  regex_patterns:
    - "sodium|libsodium"
    - "init.*success|initialized|version"
---
# Installing and linking libsodium

## Concept

libsodium is a C library that gives you cryptographic functions — hashing, encryption, signatures, and more. It is designed to be hard to misuse. Functions have safe defaults, and the API is small.

You are using it from C++ but calling its C API directly. This is normal — many C++ projects use C libraries. The headers are plain C, the functions use C types (`unsigned char*`, `size_t`), and you link the library at compile time.

In C, you are used to installing libraries with your package manager and adding `-l` flags to your compiler command. libsodium works the same way:

1. **Install** the library (package manager or build from source)
2. **Include** the header: `#include <sodium.h>`
3. **Initialize** the library: call `sodium_init()` before using any other function — it returns 0 on success, -1 on failure, 1 if already initialized
4. **Link** at compile time: add `-lsodium` to your compiler flags

One important rule: **always call `sodium_init()` once at program startup**. If you forget, some functions may silently produce wrong results. Call it in `main()` before anything else.

For CMake users, you will add `find_package` or link the library manually in your `CMakeLists.txt`. Either approach works — the goal is that `#include <sodium.h>` compiles and `sodium_init()` runs.

## Task

1. Install libsodium on your system using your package manager
2. Write a test program that includes `<sodium.h>` and calls `sodium_init()`
3. Print whether initialization succeeded or failed
4. Print the libsodium version string using `sodium_version_string()`
5. Update your CMakeLists.txt to link against libsodium
6. Build and run the test program

## Hints

- Ubuntu/Debian: `sudo apt install libsodium-dev`
- macOS: `brew install libsodium`
- Arch: `sudo pacman -S libsodium`
- CMake linking: `target_link_libraries(your_target PRIVATE sodium)`
- The version function: `sodium_version_string()` returns a `const char*`
- Return value of `sodium_init()`: 0 = success, -1 = failure, 1 = already initialized
- If the compiler cannot find `sodium.h`, check that the `-dev` or `-devel` package is installed

## Verify

```bash
cmake --build build
./build/sodium_test
```

Expected output (version number may differ):
```
sodium_init: success
libsodium version: 1.0.18
```

## Done When

Your program compiles with libsodium linked, `sodium_init()` returns 0, and the version string prints.
