---
id: w01-l01
title: "Lesson 1 — Boot: CLI Contract + Env Var Overrides"
order: 1
duration_min: 120
type: lesson
---

# Lesson 1 (1/7): Boot — CLI Contract + Env Var Overrides

**Goal:** Define trustctl's stable interface and implement deterministic config precedence (defaults < env < flags).

**What you build:** trustctl skeleton that handles `--help`, `--version`, and resolves `TRUST_HOME` with [12-Factor Config](https://12factor.net/config) precedence.

## Why it matters

- A [CLI contract](https://www.gnu.org/prep/standards/html_node/Command_002dLine-Interfaces.html) is the first API your tool exposes. If `--help` misbehaves, operators stop trusting everything else.
- [12-Factor Config](https://12factor.net/config) says config comes from the environment. Your tool [MUST](https://datatracker.ietf.org/doc/html/rfc2119) support env var overrides so it works in containers and CI without rebuilding.
- `TRUST_HOME` is where all state lives (logs, data, config). Getting precedence wrong here breaks every future week.

## TRAINING SESSION

### Warmup (10 min)
- Q: What are the three config sources in order from weakest to strongest?
- Q: Why does [12-Factor](https://12factor.net/config) say "store config in the environment"?
- Recall: In one sentence, what does `TRUST_HOME` point to?

### Work

**Task 1: Write the CLI contract in plain English**

1. Do this: Create a file `docs/cli-contract.md` listing every command, flag, and expected behavior. Use [MUST/SHOULD language](https://datatracker.ietf.org/doc/html/rfc2119). Include at minimum: `trustctl --help`, `trustctl --version`, `trustctl config show`.
2. How to test it: Read it aloud. Every behavior is either MUST or SHOULD.
3. Expected result: A document with at least 8 lines of MUST rules.

**Task 2: Implement `--help` and `--version`**

1. Do this: `--help` prints usage to stdout and exits 0. `--version` prints the version string and exits 0. Both [MUST](https://datatracker.ietf.org/doc/html/rfc2119) short-circuit before any command routing.
2. How to test it:
   ```
   trustctl --help
   trustctl --version
   echo $?
   ```
3. Expected result: Help text on stdout. Exit code 0. No side effects.

**Task 3: Implement TRUST_HOME config precedence**

1. Do this: Resolve TRUST_HOME with this precedence: hard-coded default (`~/.trustctl`) → env var `TRUST_HOME` → flag `--trust-home`. The strongest source wins.
2. How to test it:
   ```
   trustctl config show
   TRUST_HOME=/tmp/t1 trustctl config show
   TRUST_HOME=/tmp/t1 trustctl config show --trust-home /tmp/t2
   ```
3. Expected result:
   ```
   trust_home: /home/<user>/.trustctl      (default)
   trust_home: /tmp/t1                     (env wins)
   trust_home: /tmp/t2                     (flag beats env)
   ```

### Prove (15 min)
- Run all three precedence tests and confirm output.
- Explain in 4 lines: Why must flag beat env? (Hint: operator override during incidents.)

### Ship (5 min)
- Submit: `trustctl` source files + `docs/cli-contract.md`
- Paste: output of all three `config show` commands showing precedence

## Done when
- `trustctl --help` exits 0 with usage text.
- `trustctl --version` exits 0 with version string.
- `config show` proves default < env < flag.
- No side effects before help/version.

## Common mistakes
- Help triggers side effects → Fix: Check help/version flags before any init.
- Precedence varies per command → Fix: Resolve once at startup, pass the result down.
- Missing env var crashes → Fix: Env lookup returns empty string, not error.
- Hard-coded home directory → Fix: Use default only when env and flag are both absent.

## Proof
- Submit: source code + cli-contract.md
- Paste: three `config show` outputs showing precedence cascade

## Hero Visual

```
┌────────────────────────────────────────┐
│          Config Precedence             │
│                                        │
│  defaults ──► env(TRUST_HOME) ──► flag │
│   weakest                    strongest │
│                                        │
│  ~/.trustctl   /tmp/t1      /tmp/t2    │
│      ↓            ↓            ↓       │
│   (used if     (used if    (always     │
│    alone)     no flag)      wins)      │
└────────────────────────────────────────┘
```

### What you should notice
- Precedence is a waterfall: each layer can override the previous.
- This pattern appears in every serious CLI tool (kubectl, docker, git).

## Future Lock
Later in **Week 5** (Thread Pool), container deployments rely on TRUST_HOME being set via env var. In **Week 9+** (KV Store), the data directory lives under TRUST_HOME. Get this wrong now and everything breaks later.
