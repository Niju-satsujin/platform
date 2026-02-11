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
Integrate everything from Lessons 1–6 into one stable tool you can reuse for months.

## What you ship
- `trustctl` supports `--help`, `--version`, and `config` commands
- Config precedence: default → env (`TRUST_HOME`) → flag (`--trust-home`)
- Safe parsing: reject any token > 1KB
- Ctrl+C exits with code 130
- Structured logs with request_id
- Regression harness: exactly 12 tests

## Practice (run the full system)
1) Smoke test
- Run: `trustctl --help`
- Expected: usage text, exit 0

2) Config precedence
- Run: `trustctl config show`
- Run: `TRUST_HOME=/tmp/t1 trustctl config show`
- Run: `TRUST_HOME=/tmp/t1 trustctl config show --trust-home /tmp/t2`
- Expected: default → env → flag wins

3) Safety check
- Run: `python -c "print('A'*2000)" | trustctl config show`
- Expected: rejected with non-zero exit

4) Harness
- Run: `./tests/run.sh`
- Expected: 12 PASS lines, exit 0

## Done when
- All 12 tests pass.
- Help/version never trigger normal command logic.
- Errors have consistent exit codes.
- Logs always contain request_id.

## Proof
- Paste: `./tests/run.sh` full output
- Paste: the three `config show` outputs (default/env/flag)
- Paste: one log line with request_id override + one with auto request_id

## Hero Visual
Full trustctl pipeline: parse → validate → route → run → log → exit code

## Future Lock
Week 2–4 networking builds on this CLI contract and logging. If trustctl isn’t stable now, every later week becomes harder to debug.

## References
- [GNU: Command‑Line Interfaces](https://www.gnu.org/prep/standards/html_node/Command_002dLine-Interfaces.html)
- [12‑Factor Config](https://12factor.net/config)
- [12‑Factor Logs](https://12factor.net/logs)
- [IBM: exit code 130 = SIGINT](https://www.ibm.com/docs/sr/SSWRJV_10.1.0/lsf_admin/job_exit_codes_lsf.html)
- [CLI Guidelines](https://clig.dev/)
