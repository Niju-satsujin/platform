---
id: w01-l01-overview
title: "Boot: CLI Contract + Env Var Overrides"
order: 1
duration: 120
kind: lesson_overview
part: w01
---
# Lesson 1 (1/7): Boot: CLI Contract + Env Var Overrides

## Goal
Define trustctl’s stable interface and implement config precedence using default → env (TRUST_HOME) → flags.

## Concept
A CLI contract is the promise your tool makes: commands, flags, outputs, and exit codes. Config should be overrideable by environment variables for real deployments.

## What you will build
- CLI contract document (human readable)
- `trustctl --help` and `trustctl --version` behavior
- `trustctl config show` output
- Config precedence for `TRUST_HOME` and `--trust-home`

## How to use it (examples)
- Run: `trustctl --help`
  - You should see: usage text on stdout + exit code 0
- Run: `trustctl --version`
  - You should see: version string + exit code 0
- Run: `trustctl config show`
  - You should see: trust_home shown (default or resolved)
- Run: `TRUST_HOME=/tmp/t1 trustctl config show`
  - You should see: trust_home=/tmp/t1 (env wins)
- Run: `TRUST_HOME=/tmp/t1 trustctl config show --trust-home /tmp/t2`
  - You should see: trust_home=/tmp/t2 (flag beats env)

## Start Training
Open the training page for step-by-step tasks:
- `parts/w01-cli-logger-discipline/training/01-*.md`

## Future Lock
Week 5+ (containers/automation) depends on env-var config. If TRUST_HOME cannot be set from env, deployments become painful.

## References
- [12‑Factor Config](https://12factor.net/config)
- [GNU: Command‑Line Interfaces](https://www.gnu.org/prep/standards/html_node/Command_002dLine-Interfaces.html)
- [GNU: --help behavior](https://www.gnu.org/prep/standards/html_node/_002d_002dhelp.html)
- [RFC 2119 (MUST/SHOULD)](https://datatracker.ietf.org/doc/html/rfc2119)
- [Command Line Interface Guidelines](https://clig.dev/)
