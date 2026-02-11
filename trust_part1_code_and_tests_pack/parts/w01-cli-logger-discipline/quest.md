---
id: w01-quest
title: "Boss (7/7): Ship trustctl v0.1"
order: 7
duration: 240
kind: boss
part: w01
---
# Boss Project (7/7): Ship trustctl v0.1 (Operator‑Ready)

## Goal

Ship **trustctl v0.1** as a tool you will reuse for months.
This is not a toy. It must be predictable, testable, and safe.

---

## What you ship

Inside `starter/trustctl/`:

- `src/main.cpp` (your implementation)
- `tests/run.sh` + `tests/helpers.sh`
- `Makefile`

And your CLI supports:

- `--help`, `--version`
- `config show`
- `init`
- `wait`
- `--testing` deterministic mode
- structured logs to stderr
- safe parsing (1KB token cap)
- correct exit codes (0, 64, 130)

---

## Practice (integration)

### Step 1 — Clean build

Run:
```bash
cd starter/trustctl
make clean
make build
```

Expected:
- build succeeds with no warnings you ignore

---

### Step 2 — Run full regression

Run:
```bash
make test
```

Expected:
- **12/12 PASS**

---

### Step 3 — Operator demo (manual)

Run:
```bash
./trustctl --help | head -n 15
./trustctl --version
./trustctl --testing config show
rm -rf ./.trustctl-test
./trustctl --testing init
./trustctl --testing wait
```

Expected:
- help/version look clean
- config show prints `trust_home=` and `source=`
- init creates directories
- wait exits 130 on Ctrl+C

---

## Done when

- `make test` passes all 12 tests
- stdout is clean (command outputs only)
- stderr contains errors/logs only
- behavior is stable across runs (`--testing`)

---

## Proof

Submit:
1) Screenshot or paste of `make test` showing `12/12 PASS`
2) Paste `./trustctl --testing config show` output
3) Paste `find ./.trustctl-test -maxdepth 2 -type d | sort`

Optional (strong):
- Git commit hash that contains the finished Week 01 tool.
