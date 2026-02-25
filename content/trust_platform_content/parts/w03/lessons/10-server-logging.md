---
id: w03-l10
title: "Server-side logging with your logger"
order: 10
duration_minutes: 20
xp: 50
kind: lesson
part: w03
proof:
  type: paste
  instructions: "Paste server log output showing structured entries for accept, frame received, frame sent, disconnect, and error events."
  regex_patterns:
    - "accept|connect"
    - "frame|recv|send"
    - "disconnect|close"
---
# Server-side logging with your logger

## Concept

Your server currently prints messages to stderr with `std::cerr`. That was fine for development. Now replace every `std::cerr` call with your Week 1 Logger.

Why? Because your logger produces structured, timestamped, tab-separated entries. When you have 50 clients sending frames, you need to filter logs by component, by level, by time range — exactly what your logger was built for.

The component names for the server:

| Component | Events |
|---|---|
| `net.accept` | New client connected |
| `net.recv` | Frame received from client |
| `net.send` | Frame sent to client |
| `net.close` | Client disconnected (normal, timeout, error) |
| `net.error` | Malformed input, write timeout, etc. |
| `protocol` | Version mismatch, unknown msg_type |

Each log entry includes the client fd (so you can trace one client's activity) and a request_id (so you can match requests to responses).

## Task

1. Include your Week 1 logger in the server project
2. Create a Logger instance at server startup, writing to `server.log`
3. Replace every `std::cerr` call with a Logger write at the appropriate level and component
4. For INFO level: accept, frame received, frame sent
5. For WARN level: timeout, connection limit reached
6. For ERROR level: malformed input, write failure, protocol error
7. Every log entry for a specific client should include `client_fd=<N>` in the message

## Hints

- Your logger is in `include/logger.h` — add it to the server's include path in CMakeLists.txt
- `target_include_directories(server PRIVATE ../week1/include/)` — adjust the path to your Week 1 project
- Or copy the logger files into a shared `lib/` directory
- Use the injectable clock in tests so log timestamps are deterministic

## Verify

```bash
./server --port 9000 &
./client --port 9000 send "hello"
kill %1
cat server.log
```

Expected: structured log entries with timestamps, levels, components, and client-specific details.

## Done When

Every server event is logged through the structured logger, with no raw std::cerr calls remaining.
