---
id: w01
slug: w01-cli-logger-discipline
title: CLI & Logger Discipline
order: 1
duration: 720
kind: part_intro
---
# Part 1 (0/7): CLI & Logger Discipline

## Big Picture
You are building **trustctl**. It is your long‑lived control tool (like `kubectl` / `etcdctl`). It must stay stable for months.

In trust systems, failures are normal. Your advantage is: you can **see** what happened and **prove** what happened. That starts with a good CLI contract, safe input handling, and clean logs.

### Why this matters for distributed trust
- If the CLI changes shape every week, you lose time and automation breaks.
- If logs are messy, you cannot debug replication, leader election, or WAL bugs later.
- If exit codes are random, scripts cannot tell “usage error” vs “internal crash”.

### Real world analogies (read, don’t memorize)
- `kubectl` is a stable operator interface for a complex system.
- `etcdctl` is a simple admin tool that must work even when the cluster is sick.

### What are we building in this part?
By the end of Part 1, **trustctl v0.1** can:
- print `--help` and `--version` correctly (and exit cleanly)
- resolve config with precedence: **default → env → flags**
- reject unsafe inputs (any token > **1KB**)
- handle Ctrl+C (SIGINT) and exit **130**
- emit structured logs with a `request_id`
- run a regression harness with **12 exact tests**

## How to use this part
You will do **6 lessons** + **1 boss**:
1. Boot: CLI contract + env var overrides  
2. Router: safe parsing + 1KB rule  
3. Exit codes + signals  
4. Structured logging + request_id  
5. TRUST_HOME layout (files live somewhere)  
6. Regression harness (12 tests)  
7. Boss: integrate and ship trustctl v0.1

## Hero Visual
**Diagram:** `argv/stderr/stdout` → parse → validate → route → run → log → exit code

**What you should notice**
- One entry point: the CLI.
- Every failure returns a clear exit code.
- Every run has logs you can correlate (request_id).

## Start
Go to **Lesson 1 (1/7)**: Boot — CLI Contract + Env Var Overrides.
