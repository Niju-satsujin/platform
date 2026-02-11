---
id: w01-t01
title: "Training: Boot: CLI Contract + Env Var Overrides"
order: 2
duration: 120
kind: training
part: w01
---
# Training 1: Boot: CLI Contract + Env Var Overrides

## Goal
Implement `--help`, `--version`, and config precedence (default → env → flag) for TRUST_HOME.

## Warmup (5–10 min)
- In one line: what is a CLI contract?
- Which is stronger: env or flag? Why?

## Work (main)
### Step 1
**Do this (optional):** If you like docs, write a short CLI contract (8+ MUST/SHOULD rules). Include: `trustctl --help`, `trustctl --version`, `trustctl config show`.
Main work is code + tests, not documents.

**How to test it:**
- Run (optional): `cat docs/cli-contract.md | wc -l`

**Expected result:**
- Optional file exists with short rules. If you skip docs, continue to Step 2.

### Step 2
**Do this:** Make `--help` print usage and exit 0. It must not run any normal command logic after printing help.

**How to test it:**
- Run: `trustctl --help; echo $?`

**Expected result:**
- Exit code `0`. Output includes `Usage:` (or similar).

### Step 3
**Do this:** Make `--version` print version and exit 0. It must not run normal command logic.

**How to test it:**
- Run: `trustctl --version; echo $?`

**Expected result:**
- Exit code `0`. Output matches `trustctl v0.1` (pattern is OK).

### Step 4
**Do this:** Implement TRUST_HOME resolution: default `~/.trustctl` → env `TRUST_HOME` → flag `--trust-home`. Strongest wins.

**How to test it:**
- Run: `trustctl config show && TRUST_HOME=/tmp/t1 trustctl config show && TRUST_HOME=/tmp/t1 trustctl config show --trust-home /tmp/t2`

**Expected result:**
- Three outputs show default, then env, then flag wins (last shows `/tmp/t2`).


## Prove (10–20 min)
- Paste the outputs of the three `config show` runs (default / env / flag).
- Explain in 4 lines: why do we want config in env vars for deployments?

## Ship (5 min)
- Submit: code changes in `src/main.cpp` + passing/updated tests.
- Paste: outputs for `--help`, `--version`, and the three `config show` runs.

## Done when
- `trustctl --help` exits 0 and prints usage.
- `trustctl --version` exits 0 and prints version.
- `config show` demonstrates precedence: default → env → flag.

## Common mistakes
- Help/version triggers side effects → Check help/version before routing commands.
- Env var missing causes crash → Treat missing env as ‘not set’.
- Precedence computed inconsistently → Resolve once per run.

## Proof (what you submit)
- Optional: submit `docs/cli-contract.md` only if you created it.
- Paste `trustctl --help; echo $?` output
- Paste `trustctl --version; echo $?` output
- Paste the three `config show` outputs

## Hero Visual
Config precedence waterfall: default → env(TRUST_HOME) → flag(--trust-home). Strongest source wins.

## Future Lock
Week 10+ stores WAL/KV under TRUST_HOME; wrong precedence breaks recovery and tests.

## References
- [12‑Factor Config](https://12factor.net/config)
- [GNU: --help behavior](https://www.gnu.org/prep/standards/html_node/_002d_002dhelp.html)
- [GNU: Command‑Line Interfaces](https://www.gnu.org/prep/standards/html_node/Command_002dLine-Interfaces.html)
- [Command Line Interface Guidelines](https://clig.dev/)
