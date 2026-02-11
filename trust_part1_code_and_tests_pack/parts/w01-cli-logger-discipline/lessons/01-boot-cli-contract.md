---
id: w01-l01-overview
title: "Boot: CLI Contract + Env Var Overrides"
order: 1
duration: 120
kind: lesson_overview
part: w01
---
# Lesson 1 (1/6): Boot — CLI Contract + Env Var Overrides

## Goal

Get a **real trustctl binary** compiling and behaving like a serious tool:
- `--help` and `--version` behave predictably (stdout + exit 0).
- `TRUST_HOME` can be set by **environment variable** and overridden by `--trust-home`.

This lesson is the foundation for everything.

---

## What you will build

You will implement these behaviors in code:

1) `trustctl --help`
- prints usage to **stdout**
- exit code `0`

2) `trustctl --version`
- prints version to **stdout**
- exit code `0`

3) `trustctl config show`
- prints:
  - `trust_home=<path>`
  - `source=<default|env|flag>`

4) Config precedence
- `default < env TRUST_HOME < --trust-home`

5) Testing mode (for stable tests)
- global flag `--testing` (recognized in help)
- makes output deterministic (this avoids “tests not working” due to timestamps/paths)

References:
- [CLI Guidelines](https://clig.dev/)
- [12-Factor Config](https://12factor.net/config)
- [getenv(3)](https://man7.org/linux/man-pages/man3/getenv.3.html)

---

## Practice (code-first)

### Setup

1) Open this project:
- `starter/trustctl/`

2) Build it:
```bash
cd starter/trustctl
make build
```

### Task 1 — Make help + version work

Do this:
1) Edit `src/main.cpp`.
2) Implement `--help` and `--version`:
   - output goes to stdout
   - exit 0
3) Add `--testing` to help text (even if it does nothing yet).

How to test:
```bash
./trustctl --help
echo $?
./trustctl --version
echo $?
```

Expected result:
- `--help` prints a “Usage:” block and `echo $?` prints `0`
- `--version` prints something like `trustctl 0.0.x` and `echo $?` prints `0`

---

### Task 2 — Resolve TRUST_HOME with precedence

Do this:
1) Add a function that resolves TRUST_HOME and also tracks the **source**:
   - default: `~/.trustctl` (or `.trustctl` if HOME missing)
   - env: `TRUST_HOME`
   - flag: `--trust-home PATH`

How to test:
```bash
./trustctl --testing config show
TRUST_HOME=/tmp/t1 ./trustctl --testing config show
TRUST_HOME=/tmp/t1 ./trustctl --testing --trust-home /tmp/t2 config show
```

Expected result:
- first run shows `source=default`
- second run shows `trust_home=/tmp/t1` and `source=env`
- third run shows `trust_home=/tmp/t2` and `source=flag`

---

## Done when

- `make build` succeeds
- help/version return exit 0
- `config show` prints **both** `trust_home=` and `source=`
- precedence works exactly: default < env < flag

---

## Common mistakes

- Printing help to stderr (help should go to stdout when requested).
- Printing logs to stdout (later we’ll keep stdout clean for machine output).
- Forgetting to make tests deterministic (add `--testing` now).

---

## Future Lock

You are building env-var config today so you can deploy and run trustctl inside containers in **Week 5**.

You are building `config show` today so you can debug distributed node state later (Weeks **9–12**).

---

## Proof (what you submit)

Paste these outputs:

1) `./trustctl --help` (first ~20 lines)
2) `./trustctl --version`
3) `TRUST_HOME=/tmp/t1 ./trustctl --testing config show`
