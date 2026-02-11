---
id: w01-l04-overview
title: Structured Logging + request_id
order: 4
duration: 120
kind: lesson_overview
part: w01
---
# Lesson 4 (4/7): Structured Logging + request_id

## Goal
Add structured logs and a request_id so you can debug future distributed features.

## Concept
Treat logs as a stream of events. Structured logs make it possible to filter and correlate runs.

## What you will build
- Structured log format (key=value or JSON)
- Required fields: ts, level, msg, cmd, request_id, exit_code
- request_id override via `--request-id`

## How to use it (examples)
- Run: `trustctl config show --request-id abc123`
  - You should see: logs contain request_id=abc123
- Run: `trustctl config show`
  - You should see: logs contain non-empty request_id

## Start Training
Open the training page for step-by-step tasks:
- `parts/w01-cli-logger-discipline/training/04-*.md`

## Future Lock
Week 9–12 (replication + leader election) depends on request_id to trace flows across nodes.

## References
- [12‑Factor Logs](https://12factor.net/logs)
- [Command Line Interface Guidelines](https://clig.dev/)
