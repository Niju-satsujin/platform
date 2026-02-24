---
id: w01-l08
title: "fsync — when flush is not enough"
order: 8
duration_minutes: 25
xp: 75
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste: (1) your FsyncPolicy enum class definition, (2) output showing logger works with both NONE and EVERY_WRITE policies."
  regex_patterns:
    - "FsyncPolicy"
    - "NONE|EVERY_WRITE"
---
# fsync — when flush is not enough

## Concept

When you write data to a file, it does not go directly to disk. It goes to a buffer in memory first (the OS page cache). If your program crashes, the buffer is usually fine — the OS flushes it. But if the **machine** crashes (power outage, kernel panic), that buffer is lost.

`flush()` pushes data from your C++ stream buffer to the OS page cache. But the data is still in RAM, not on disk.

`fsync()` pushes data from the OS page cache to the physical disk. After `fsync()` returns, the data survives a power outage.

In C:
```c
fflush(f);                    // C++ stream → OS cache
fsync(fileno(f));             // OS cache → disk
```

In C++, `std::ofstream` does not expose `fsync()`. You need the POSIX file descriptor. This is one of the few places where C++ makes you drop down to C-level APIs.

The tradeoff: `fsync()` is slow (can take milliseconds). For a logger, you usually want two modes:
- **No fsync** — fast, good enough for debug logs
- **fsync after every write** — slow but durable, for audit logs that must survive crashes

## Task

1. Define `enum class FsyncPolicy { NONE, EVERY_WRITE }` in `logger.h`
2. Add `FsyncPolicy` as a constructor parameter to Logger (default: `NONE`)
3. After writing each log entry:
   - Always call `.flush()` on the ofstream
   - If policy is `EVERY_WRITE`, also call `fsync()` on the underlying file descriptor
4. To get the file descriptor from an ofstream, you will need a POSIX-specific approach (see hints)
5. Add a `--fsync` flag to the CLI: `logger --fsync write INFO main "important"` enables `EVERY_WRITE`

## Hints

- On Linux, getting the fd from ofstream is not standard. A simpler approach: open the file with POSIX `open()` in the constructor, wrap it in a thin class, and use `write()` + `fsync()` directly
- Alternative: use `std::ofstream` for writing, then open the same path with `open()` just for `fsync()` — it works because fsync operates on the file, not the handle
- `#include <unistd.h>` for `fsync()`, `#include <fcntl.h>` for `open()`
- `int fd = open(path.c_str(), O_WRONLY); fsync(fd); close(fd);`
- This is intentionally messy — real systems have to mix C and C++ for low-level I/O

## Verify

```bash
g++ -std=c++17 -o logger main.cpp
./logger write INFO main "no fsync"
./logger --fsync write INFO main "with fsync"
cat log.txt
```

Expected: both entries appear in log.txt. The `--fsync` version is slower but you will not notice on a single write (the benchmark in lesson 18 will show the difference).

## Done When

FsyncPolicy enum exists, flush always happens, and fsync fires only when EVERY_WRITE is set.
