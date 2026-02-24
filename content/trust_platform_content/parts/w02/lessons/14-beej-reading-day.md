---
id: w02-l14
title: "Reading day — Beej's Guide chapters 5-6"
order: 14
duration_minutes: 30
xp: 25
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste your answers to the 5 questions below. One sentence each is fine."
  regex_patterns:
    - "."
---
# Reading day — Beej's Guide chapters 5-6

## Concept

Today you read, not code. Beej's Guide to Network Programming is the best free resource for learning Unix sockets. You have already built most of what chapters 5-6 cover — now read it to fill gaps and reinforce what you learned by doing.

Read these sections:
- **Chapter 5**: System Calls or Bust — `getaddrinfo()`, `socket()`, `bind()`, `connect()`, `listen()`, `accept()`, `send()`, `recv()`, `close()`
- **Chapter 6**: Client-Server Background — the full client-server flow explained

URL: https://beej.us/guide/bgnet/html/split/system-calls-or-bust.html

You will notice Beej uses `send()` and `recv()` instead of `write()` and `read()`. They are almost identical — `send(fd, buf, len, 0)` is the same as `write(fd, buf, len)`. The extra flags parameter is 0 for normal use.

## Task

1. Read Beej's Guide chapters 5 and 6 (about 30 minutes)
2. Answer these questions in writing (one sentence each):
   - What does `getaddrinfo()` do that manually filling `sockaddr_in` does not?
   - What is the difference between `SOCK_STREAM` and `SOCK_DGRAM`?
   - Why does Beej recommend `getaddrinfo()` over hard-coding `AF_INET`?
   - What happens if you call `send()` on a connection that the other side has closed?
   - What is the purpose of the `backlog` parameter in `listen()`?
3. Review your own code — is there anything Beej explains differently that you should adopt?

## Hints

- `getaddrinfo()` handles both IPv4 and IPv6 — your code currently only handles IPv4
- `SOCK_DGRAM` is UDP — no connection, no ordering guarantees
- On a closed connection, `send()` causes SIGPIPE (which kills your process unless you handle it)
- You might want to add `signal(SIGPIPE, SIG_IGN)` to your server to ignore SIGPIPE
- The backlog is NOT the max number of connections — it is the queue of connections waiting to be accepted

## Verify

Answer the 5 questions. No code to compile today.

## Done When

You can answer all 5 questions from memory, and you have identified at least one improvement to make in your own code.
