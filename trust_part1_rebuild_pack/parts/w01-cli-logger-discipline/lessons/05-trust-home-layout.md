---
id: w01-l05-overview
title: "TRUST_HOME Layout: where files live"
order: 5
duration: 120
kind: lesson_overview
part: w01
---
# Lesson 5 (5/7): TRUST_HOME Layout: where files live

## Goal
Define TRUST_HOME layout so future weeks can store WAL, KV state, and logs safely.

## Concept
A serious tool needs a stable home directory layout for config and logs. TRUST_HOME makes it relocatable.

## What you will build
- Directory layout under TRUST_HOME (config/, logs/)
- config show prints resolved TRUST_HOME and derived paths

## How to use it (examples)
- Run: `trustctl config show`
  - You should see: prints trust_home + config path + log path
- Run: `TRUST_HOME=/tmp/t1 trustctl config show`
  - You should see: paths are under /tmp/t1

## Start Training
Open the training page for step-by-step tasks:
- `parts/w01-cli-logger-discipline/training/05-*.md`

## Future Lock
Week 10+ stores WAL/KV files under TRUST_HOME. If layout changes later, old data becomes unreadable.

## References
- [12‑Factor Config](https://12factor.net/config)
- [12‑Factor Logs](https://12factor.net/logs)
