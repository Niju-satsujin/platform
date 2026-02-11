---
id: w01-l05-overview
title: "TRUST_HOME Layout: where files live"
order: 9
duration: 120
kind: lesson_overview
part: w01
---
# Lesson 5 (5/6): TRUST_HOME Layout + `init`

## Goal

Make trustctl a real long-term tool with a persistent home:
- initialize directory layout under TRUST_HOME
- never pollute random places on disk
- keep paths deterministic in `--testing` mode

Reference:
- [The Twelve-Factor App — Config](https://12factor.net/config)

---

## What you will build

Add command:
- `trustctl init`

Behavior:
- resolves TRUST_HOME (same precedence as Lesson 1)
- creates these directories:
  - `<TRUST_HOME>/`
  - `<TRUST_HOME>/logs/`
  - `<TRUST_HOME>/store/`
  - `<TRUST_HOME>/keys/`
- on success → exit 0

Testing mode:
- If `--testing` and no TRUST_HOME provided, default to `./.trustctl-test` (inside repo)

---

## Practice

### Task 1 — Implement init

Do this:
1) Add `init` command.
2) Use `mkdir` / filesystem API to ensure directories exist.
3) If they already exist, do not crash (idempotent).

How to test:
```bash
rm -rf ./.trustctl-test
./trustctl --testing init
echo $?
find ./.trustctl-test -maxdepth 2 -type d | sort
```

Expected result:
- exit code 0
- directories include: `logs`, `store`, `keys`

---

### Task 2 — Add minimal status output

Do this:
- Print one line to stdout:
  - `initialized=true`
  - `trust_home=<path>`

How to test:
```bash
./trustctl --testing init
```

Expected:
- includes `initialized=true`

---

## Done when

- `trustctl --testing init` creates the 4 directories under `./.trustctl-test`
- running it twice still exits 0

---

## Common mistakes

- Creating directories relative to current working dir without TRUST_HOME.
- Failing when directory exists.
- Printing lots of logs to stdout.

---

## Future Lock

Week 2+ will store artifacts (logs, keys, snapshots). This layout prevents chaos and makes later persistence work possible.

---

## Proof

Paste:
- output of `find ./.trustctl-test -maxdepth 2 -type d | sort`
