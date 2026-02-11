---
id: w01-l04-overview
title: Structured Logging + request_id
order: 4
duration: 120
kind: lesson_overview
part: w01
---
# Lesson 4 (4/6): Structured Logging (Debug Power)

## Goal

Add logs you can trust later:
- logs go to **stderr**
- logs have structure (key=value or JSON lines)
- logs are deterministic in `--testing` mode

Reference:
- [CLI Guidelines — Output](https://clig.dev/#output)

---

## What you will build

1) A tiny logger that supports levels:
- INFO, WARN, ERROR

2) Logging contract:
- **stdout** is for command output (machine-friendly)
- **stderr** is for logs and errors

3) `--testing` mode:
- no random IDs
- stable timestamp (or omit timestamp)

---

## Practice

### Task 1 — Add logger module (minimal)

Do this:
1) Create a logger function like:
- `log(level, msg, keyvals...)`
2) Output format (KV example):
- `level=INFO msg="..." event=...`
3) Send logs to stderr.

How to test:
```bash
./trustctl --testing config show 1>/tmp/out.txt 2>/tmp/err.txt
cat /tmp/out.txt
cat /tmp/err.txt
```

Expected result:
- `/tmp/out.txt` contains only `trust_home=` and `source=`
- `/tmp/err.txt` contains logs (if you log in that command)

---

### Task 2 — Add one log line to a command

Do this:
- Add a log line when `config show` runs:
  - event name (e.g., `event=config_show`)
  - trust_home source

How to test:
```bash
./trustctl --testing config show 2>&1 | head -n 5
```

Expected result:
- output contains a structured log line (level + event)

---

## Done when

- logs go to stderr
- stdout stays clean for command output
- `--testing` mode makes log output stable enough for grep-based tests

---

## Common mistakes

- Mixing logs with stdout (breaks scripts).
- Logging huge blobs (log small facts: event, source, outcome).
- Random IDs without a testing mode (tests will flake).

---

## Future Lock

Structured logging today is what lets you debug leader election and replication in Weeks 11–12 without going blind.

---

## Proof

Paste:
- A sample log line produced by `./trustctl --testing config show` (stderr)
