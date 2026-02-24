---
id: w02-l13
title: "Clean shutdown on Ctrl+C"
order: 13
duration_minutes: 25
xp: 50
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste server log showing Ctrl+C triggering shutdown: closing all client connections, then exiting with code 0."
  regex_patterns:
    - "shutdown|SIGINT|signal"
    - "closed|exit"
---
# Clean shutdown on Ctrl+C

## Concept

When you press Ctrl+C, the OS sends SIGINT to your process. The default behavior is to kill the process immediately — which means open file descriptors are not closed, partial writes are lost, and clients see a sudden "connection reset."

A proper server catches SIGINT and shuts down gracefully:
1. Stop accepting new connections
2. Close every client connection
3. Close the server socket
4. Exit with code 0

In C, you register a signal handler with `signal()` or `sigaction()`. The handler sets a flag, and your main loop checks the flag:

```cpp
volatile sig_atomic_t shutdown_requested = 0;

void handle_sigint(int) {
    shutdown_requested = 1;
}
```

In your main loop, check `shutdown_requested` after every `poll()` call. If set, break out of the loop and run the cleanup code.

Why `volatile sig_atomic_t`? Because the signal handler runs asynchronously — it can interrupt your code at any point. `volatile` tells the compiler not to cache the variable in a register, and `sig_atomic_t` is a type guaranteed to be read/written atomically.

## Task

1. Register a SIGINT handler that sets a `shutdown_requested` flag
2. In your main poll loop, check the flag after each `poll()` return
3. When shutdown is requested:
   - Log "shutdown requested, closing N clients"
   - Close every client fd
   - Close the server fd
   - Exit with code 0
4. Test by connecting 2 clients, pressing Ctrl+C in the server, and verifying all connections close

## Hints

- `#include <signal.h>` for `signal()` or `sigaction()`
- `signal(SIGINT, handle_sigint);` — registers the handler
- If `poll()` is interrupted by a signal, it returns -1 with `errno == EINTR` — treat this as "check the flag and continue"
- Do NOT do complex work inside the signal handler — just set the flag
- The handler must be a plain C function (no captures, no lambda, no std::function)

## Verify

```bash
# Terminal 1
./echo_server

# Terminal 2 and 3
nc localhost 9000

# Terminal 1: press Ctrl+C
```

Expected: server prints "shutdown requested, closing 2 clients" and exits cleanly. Both nc sessions disconnect.

## Done When

Ctrl+C triggers a graceful shutdown that closes all connections and exits with code 0.
