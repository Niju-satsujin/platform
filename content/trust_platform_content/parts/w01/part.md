---
id: w01-part
title: "CLI & Logger Discipline"
order: 1
type: part
---

# CLI & Logger Discipline

**Theme:** Build repeatable tools and evidence capture before networking complexity.

## Big Picture

Every production distributed system starts with a control tool that operators trust. Think [kubectl](https://kubernetes.io/docs/reference/kubectl/) for Kubernetes or [etcdctl](https://etcd.io/docs/v3.3/dev-guide/interacting_v3/) for etcd. These tools share common traits: deterministic config, clean exit codes, structured logs, and predictable behavior under all conditions.

**trustctl** is your version. You build it this week. You use it for the next 6 months. Every feature you add to the distributed trust platform ships through trustctl.

## How it connects

This is Part 1. Weeks 2–24 all reuse trustctl's config, logging, exit codes, and regression harness.

## What are we building? (0/7)

**trustctl v0.1** — a CLI control tool with:

- Deterministic [config precedence](https://12factor.net/config): defaults → env → flags
- Safe command router with [POSIX-style](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html) dispatch
- 1 KB token guardrail ([CWE-120](https://cwe.mitre.org/data/definitions/120.html) buffer safety)
- [SIGINT](https://man7.org/linux/man-pages/man2/sigaction.2.html) handling → exit 130
- [Structured logs](https://12factor.net/logs) to stdout + file under TRUST_HOME
- request_id correlation for every run
- 12-test regression harness locking all behavior

## Hero Visual

```
┌──────────────────────────────────────────────────┐
│                  trustctl v0.1                    │
│                                                  │
│  args/env ──► parse ──► validate ──► route        │
│                           │           │          │
│                       [1KB guard]     ▼          │
│                           │       execute        │
│                           ▼           │          │
│                        reject     log(stdout+file)│
│                           │           │          │
│                           ▼           ▼          │
│                    exit(64)    exit(0/70/130)     │
└──────────────────────────────────────────────────┘
```

### What you should notice
- Every input passes validation before work.
- Logging fires on success AND failure.
- Exit codes are the automation API.

## Lessons

- Lesson 1 (1/7): Boot — CLI Contract + Env Var Overrides
- Lesson 2 (2/7): Router — Safe Dispatch + 1 KB Buffer Guard
- Lesson 3 (3/7): Exit Codes + SIGINT (Ctrl+C → 130)
- Lesson 4 (4/7): Structured Logging — Evidence, Not Vibes
- Lesson 5 (5/7): Correlation IDs — Trace One Run
- Lesson 6 (6/7): Regression Harness — The Exact 12 Tests
- Boss Project (7/7): Ship trustctl v0.1
- Quiz: Practical Debugging Quiz
