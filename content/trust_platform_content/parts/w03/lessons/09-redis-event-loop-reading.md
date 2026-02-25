---
id: w03-l09
title: "Code reading day — Redis event loop"
order: 9
duration_minutes: 30
xp: 25
kind: lesson
part: w03
proof:
  type: paste
  instructions: "Paste your answers to the 5 questions about Redis ae.c."
  regex_patterns:
    - "."
---
# Code reading day — Redis event loop

## Concept

Today you read production code instead of writing code. Redis is a famous in-memory database. Its networking layer is a single-threaded event loop — similar to what you built, but more mature.

The file to read: **src/ae.c** in the Redis source code.

GitHub: https://github.com/redis/redis/blob/unstable/src/ae.c

This file is about 400 lines. It implements an event loop that supports multiple backends: `select()`, `epoll`, `kqueue`, depending on the OS. The abstraction layer is clean and worth studying.

Key things to notice:
- How Redis registers file events (read/write callbacks per fd)
- How it handles time events (periodic tasks)
- How the main loop processes events
- How it handles the case where no events are ready (timeout)

You do not need to understand every line. Focus on the overall structure and compare it to your poll-based loop.

## Task

1. Read `src/ae.c` and `src/ae.h` from the Redis source
2. Answer these questions:
   - How does Redis register interest in a file descriptor? (What function, what parameters?)
   - What is the difference between `AE_READABLE` and `AE_WRITABLE`?
   - How does Redis handle the case where poll/epoll returns with no ready events?
   - What are "time events" and how are they different from file events?
   - What would you change in YOUR event loop based on what you learned from Redis?

## Hints

- `aeCreateFileEvent()` is the function that registers interest in an fd
- `aeProcessEvents()` is the main loop body — it calls the OS-specific poll function
- `aeSearchNearestTimer()` determines the poll timeout based on upcoming time events
- Redis supports `select`, `epoll`, `kqueue` via separate files: `ae_select.c`, `ae_epoll.c`, `ae_kqueue.c`
- The abstraction is: each backend implements `aeApiCreate`, `aeApiAddEvent`, `aeApiPoll`, etc.

## Verify

Answer the 5 questions. No code to compile today.

## Done When

You can explain how Redis structures its event loop and identify at least one design idea to adopt in your own server.
