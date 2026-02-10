---
id: w01-quest
title: "BOSS FIGHT — trustctl v0.1"
order: 7
duration_min: 240
type: quest
---

# BOSS FIGHT — trustctl v0.1

## Goal

Integrate all 6 lessons into one end-to-end workflow. Ship trustctl v0.1 as a working tool that a fresh machine can run and verify.

## What you ship

From the 6 lessons, you should have:

1. **CLI contract** — `--help`, `--version`, `config show`, `log demo`, `hold` commands
2. **Config precedence** — defaults < env (`TRUST_HOME`) < flags (`--trust-home`)
3. **Command router** — known commands dispatch, unknown → exit 64, oversize (>1KB) → exit 64
4. **Exit codes** — 0 (success), 64 (usage), 70 (internal), 130 (SIGINT)
5. **SIGINT handler** — Ctrl+C → clean exit 130 with log event
6. **Structured logs** — JSON events to stdout + `$TRUST_HOME/logs/trustctl.log`
7. **Correlation ID** — `request_id` in every event, overrideable with `--request-id`
8. **Regression harness** — 12 tests, all passing

## Practice

Run through this exact sequence on a clean TRUST_HOME:

```
export TRUST_HOME=$(mktemp -d)

# 1. Help and version
trustctl --help
trustctl --version

# 2. Config precedence
trustctl config show
TRUST_HOME=/tmp/boss-test trustctl config show
TRUST_HOME=/tmp/boss-test trustctl config show --trust-home /tmp/override

# 3. Normal commands
trustctl log demo "boss fight message"
trustctl hold --seconds 2

# 4. Error paths
trustctl gibberish
trustctl hold
python3 -c "print('A'*2000)" | xargs trustctl log demo

# 5. SIGINT
trustctl hold --seconds 30 &
PID=$!; sleep 1; kill -INT $PID; wait $PID; echo "exit: $?"

# 6. Logs
cat $TRUST_HOME/logs/trustctl.log | head -5

# 7. Correlation ID
trustctl config show --request-id BOSS-TRACE-1
grep "BOSS-TRACE-1" $TRUST_HOME/logs/trustctl.log

# 8. Full harness
make test
```

## Expected result

- Help and version exit 0.
- Config precedence: default → env → flag clearly shown.
- Normal commands succeed. Error commands exit 64.
- SIGINT exits 130.
- Log file has structured JSON events.
- request_id appears in every event. Override works.
- `make test` → 12/12 passed.

## Done when

- A fresh `TRUST_HOME` directory produces correct behavior for all commands.
- 12/12 tests pass.
- Log file contains structured events with request_id.
- SIGINT consistently exits 130.
- A teammate could clone your repo and run the same sequence.

## Proof

- Submit: full trustctl source code + test scripts
- Paste: `make test` output showing 12/12 passed
- Paste: one log snippet with request_id
- Paste: exit code 130 after SIGINT

## Hero Visual

```
┌────────────────────────────────────────────────────┐
│                 trustctl v0.1 — Boss                │
│                                                    │
│  User ──► trustctl ──► [Weeks 2-24 services]       │
│                │                                   │
│         ┌──────┼──────┐                            │
│         │      │      │                            │
│     config  router  logger                         │
│     (L1)    (L2)    (L4+L5)                        │
│         │      │      │                            │
│     exit codes  1KB guard  request_id              │
│      (L3)      (L2)       (L5)                     │
│                │                                   │
│           [12-test harness] (L6)                   │
│                │                                   │
│           12/12 ✓                                  │
└────────────────────────────────────────────────────┘
```

### What you should notice
- trustctl is the single entry point for everything you build next.
- The harness protects all 6 capabilities simultaneously.
- Every future week extends this tool — the contract keeps it stable.

## Future Lock
**Week 2** reuses trustctl to drive TCP echo tests. **Week 7** adds crypto subcommands. **Week 9** adds KV store commands. If trustctl's foundation is broken, every future week inherits the bugs. This boss fight is the checkpoint that proves the foundation is solid.
