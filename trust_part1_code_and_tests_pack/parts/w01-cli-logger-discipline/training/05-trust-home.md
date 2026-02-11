---
id: w01-t05
title: "Training: TRUST_HOME Layout: where files live"
order: 5
duration: 120
kind: training
part: w01
---
# Training 5: TRUST_HOME Layout: where files live

## Goal
Create a stable directory layout under TRUST_HOME and expose it via `config show`.

## Warmup (5–10 min)
- Why should tools avoid hard-coded paths?
- What files will live under TRUST_HOME later?

## Work (main)
### Step 1
**Do this:** Document TRUST_HOME layout: at minimum `config/` and `logs/`.

**How to test it:**
- Run: `grep -n "logs/" docs/cli-contract.md | head`

**Expected result:**
- Docs describe directories.

### Step 2
**Do this:** Make `trustctl config show` print trust_home and derived paths under it.

**How to test it:**
- Run: `trustctl config show`

**Expected result:**
- Output includes trust_home and paths under it.

### Step 3
**Do this:** Verify env override changes all derived paths.

**How to test it:**
- Run: `TRUST_HOME=/tmp/t1 trustctl config show`

**Expected result:**
- All shown paths start with `/tmp/t1`.


## Prove (10–20 min)
- Paste: `config show` output for default and env override.
- Explain in 4 lines: why stable layout matters for WAL recovery later.

## Ship (5 min)
- Submit: updated docs + config show output changes
- Paste: two `config show` outputs

## Done when
- Layout is documented and stable.
- config show prints derived paths.
- Env override changes derived paths.

## Common mistakes
- Paths computed in many places → centralize path builder.
- Directories not created when needed → create on first use (or document exactly when).

## Proof (what you submit)
- Paste `trustctl config show` output
- Paste `TRUST_HOME=/tmp/t1 trustctl config show` output

## Hero Visual
Filesystem map: TRUST_HOME/ → config/ + logs/ (+ future: wal/, kv/).

## Future Lock
Week 10–12 durability depends on stable file locations. Moving them breaks recovery.

## References
- [12‑Factor Config](https://12factor.net/config)
- [12‑Factor Logs](https://12factor.net/logs)
