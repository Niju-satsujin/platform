---
id: w01-l19
title: "Clean project structure"
order: 19
duration_minutes: 15
xp: 25
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste the output of 'find . -not -path './.git/*' -not -path './build/*' | sort' showing your project layout."
  regex_patterns:
    - "include/|src/|tests/"
---
# Clean project structure

## Concept

Before shipping, organize your files into a standard C++ project layout. This is not about aesthetics — it is about making it obvious where things are when you come back in 3 months (or when a coworker looks at your repo).

The standard layout:

```text
trustlog/
├── CMakeLists.txt
├── include/
│   └── trustlog.h         # public header (what other projects include)
├── src/
│   ├── trustlog.cpp        # library implementation
│   └── main.cpp            # CLI entry point
├── tests/
│   ├── test_write.cpp
│   ├── test_read.cpp
│   ├── test_clock.cpp
│   ├── test_standalone.cpp
│   ├── test_golden.cpp (or .sh)
│   └── golden/
│       ├── write_three.expected
│       └── read_three.expected
├── benchmark.cpp
└── .github/
    └── workflows/
        └── ci.yml
```

The key rules:

- `include/` has headers that other projects will `#include`
- `src/` has implementation files
- `tests/` has all test code
- Build artifacts go in `build/` (which is in .gitignore)

## Task

1. Move files to match the layout above
2. Update `CMakeLists.txt` paths to match the new locations
3. Update `#include` paths in source files
4. Run `cmake --build build && cd build && ctest` to verify nothing is broken
5. Make sure `build/` is in `.gitignore`

## Hints

- In CMakeLists.txt: `target_include_directories(trustlog_lib PUBLIC include/)`
- Then in source files: `#include "trustlog.h"` will find the header in `include/`
- Move files with `mv`, not copy — avoid duplicates
- After reorganizing, do a clean build: `rm -rf build && cmake -B build && cmake --build build`

## Verify

```bash
rm -rf build
cmake -B build && cmake --build build
cd build && ctest --output-on-failure
```

Expected: clean build succeeds, all tests pass.

## Done When

The project layout matches the standard structure and all tests still pass after the move.
