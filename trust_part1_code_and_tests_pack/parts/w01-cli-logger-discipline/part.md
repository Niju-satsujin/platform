---
id: w01
slug: w01-cli-logger-discipline
title: CLI & Logger Discipline
order: 1
duration: 720
kind: part_intro
---
# Week 01 — CLI + Logger Discipline

## Big Picture

You are building **trustctl** — your “operator tool” for the next 6 months.

Think **kubectl** or **etcdctl**, but for *your* trust system. This is the tool you will use to run commands, inspect state, debug failures, and prove correctness later in the course.

Why this matters for distributed trust:
- Trust systems fail in **boring** ways: bad inputs, unclear errors, broken scripts, silent config surprises.
- A reliable CLI is the *human-to-system contract*. If the contract is sloppy, you cannot debug anything later.

Industry analogies:
- `kubectl` is the control plane remote for Kubernetes.
- `etcdctl` is the control tool for etcd.
- `openssl` CLI is a security toolbox (and its errors teach you a lot).

Links (skim, don’t deep-dive):
- [Command Line Interface Guidelines](https://clig.dev/)
- [The Twelve-Factor App — Config](https://12factor.net/config)
- [sysexits.h exit codes](https://man7.org/linux/man-pages/man3/sysexits.h.3head.html)

## What are we building?

By the end of this week, you ship **trustctl v0.1** with these properties:

- **Stable CLI contract**: `--help`, `--version`, predictable outputs.
- **Safe parsing**: reject dangerous inputs (1KB token limit).
- **Correct exit codes**: scripts can trust your tool.
- **Signal hygiene**: Ctrl+C exits cleanly with 130.
- **Structured logs**: you can debug the future distributed system.
- **Regression harness**: 12 tests that prevent backsliding.

### Testing mode (important)

To make tests reliable, `trustctl` supports a global flag:

- `--testing` → deterministic output (no random IDs, stable timestamps, stable paths).

This prevents “tests not working” because of changing timestamps or machine-specific paths.

## Your workflow

You will edit a real codebase (not a throwaway file):

- `starter/trustctl/src/main.cpp`
- `starter/trustctl/tests/run.sh`

Each lesson adds one capability and expands tests.

**Done when (Week 01):** `./tests/run.sh` passes all 12 tests.

Next week relies on this:
- Week 02 networking exercises will call `trustctl` as the control tool (like `kubectl`).
- Week 11–12 distributed debugging will rely on your structured logs.

