---
id: w01-l02-overview
title: "Router: Safe Parsing + 1KB Token Limit"
order: 2
duration: 120
kind: lesson_overview
part: w01
---
# Lesson 2 (2/7): Router: Safe Parsing + 1KB Token Limit

## Goal
Build a router that rejects any token longer than 1KB to build a memory-safety mindset before networking.

## Concept
Routing means: convert words into (command, subcommand, args). Safety means: reject surprising input sizes early.

## What you will build
- Command routing model (command → handler)
- Token size guard: any token > 1024 bytes is rejected
- Consistent error message + non-zero exit code for oversized input

## How to use it (examples)
- Run: `trustctl config show`
  - You should see: routes to `config show` handler
- Run: `trustctl config set trust_home /tmp/x`
  - You should see: routes to `config set` handler
- Run: `python -c \"print('A'*2000)\" | trustctl config show`
  - You should see: fails fast with 'token too long' and non-zero exit

## Start Training
Open the training page for step-by-step tasks:
- `parts/w01-cli-logger-discipline/training/02-*.md`

## Future Lock
Week 2–4 networking parses bytes from sockets. Size limits now prevent future hangs/crashes.

## References
- [POSIX Utility Conventions](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html)
- [CWE‑120 (classic overflow)](https://cwe.mitre.org/data/definitions/120.html)
- [Command Line Interface Guidelines](https://clig.dev/)
