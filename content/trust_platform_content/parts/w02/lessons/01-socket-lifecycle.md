---
id: w02-l01
title: "What is a socket?"
order: 1
duration_minutes: 20
xp: 50
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste the output of your program that creates a socket and prints its file descriptor number."
  regex_patterns:
    - "fd|file descriptor|socket"
---
# What is a socket?

## Concept

A socket is a file descriptor — the same kind of integer you get from `open()` in C. The difference is that instead of reading and writing bytes to a file on disk, you are reading and writing bytes to another computer over the network.

The lifecycle of a TCP server socket has 6 steps:

1. `socket()` — create the file descriptor
2. `setsockopt()` — set options (like SO_REUSEADDR so you can restart quickly)
3. `bind()` — attach the socket to a port number (e.g., port 9000)
4. `listen()` — tell the OS you want to accept incoming connections
5. `accept()` — wait for a client to connect, returns a NEW file descriptor for that client
6. `close()` — shut it down

In C, you already know `open()` returns an `int`. Socket functions work the same way — `socket()` returns an `int`, and you pass that int to every other function.

The key insight: after `accept()` gives you a client fd, you use `read(fd, buf, size)` and `write(fd, buf, size)` — the exact same system calls you use for files. The network is just another file.

## Task

1. Write a program that calls `socket(AF_INET, SOCK_STREAM, 0)` and prints the returned file descriptor
2. Check that the return value is not -1 (that would mean the call failed)
3. Print the fd number to stdout
4. Call `close(fd)` to clean up
5. This is a throwaway test — just prove you can create a socket

## Hints

- `#include <sys/socket.h>` for `socket()`
- `#include <unistd.h>` for `close()`
- `AF_INET` means IPv4, `SOCK_STREAM` means TCP
- The third argument `0` means "let the OS choose the protocol" (it picks TCP for SOCK_STREAM)
- If you get a compile error about missing headers on Linux, make sure you are compiling with `g++` not a cross-compiler

## Verify

```bash
g++ -std=c++17 -o test_socket test_socket.cpp
./test_socket
```

Expected: prints something like `socket fd: 3` (the exact number depends on your system, but it should be a small positive integer).

## Done When

The program prints a valid file descriptor number (positive integer) and exits cleanly.
