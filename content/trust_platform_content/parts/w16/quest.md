---
id: w16-quest
title: "Quest – Full Log Monitor with Equivocation Detection"
order: 7
type: quest
duration_min: 90
---

# Quest – Full Log Monitor with Equivocation Detection

## Mission

Build a complete [log monitor](https://datatracker.ietf.org/doc/html/rfc6962#section-5). It polls [transparency log](../w15/part.md) [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing) from two [vantage points](https://en.wikipedia.org/wiki/Gossip_protocol), checks all four [monitoring signals (L01)](lessons/01-signals-to-monitor.md), detects [equivocation (L03)](lessons/03-detect-equivocation.md) through [gossip](https://en.wikipedia.org/wiki/Gossip_protocol), fires [alerts (L04)](lessons/04-alert-rules.md) with correct severity, runs the [incident playbook (L05)](lessons/05-incident-playbook.md), and passes the full [regression harness (L06)](lessons/06-regression-harness.md).

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | [Polling loop (L02)](lessons/02-collect-checkpoints.md) fetches [STH](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) from two simulated [vantage points](https://en.wikipedia.org/wiki/Gossip_protocol) | [Checkpoint store](https://en.wikipedia.org/wiki/Application_checkpointing) file has entries from both vantages |
| R2 | [Signature verification (L02)](lessons/02-collect-checkpoints.md) rejects tampered [STH](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) | Tampered STH is not stored; monitor logs a rejection |
| R3 | All four [signals (L01)](lessons/01-signals-to-monitor.md) are evaluated every poll cycle | Log output shows four signal checks per cycle |
| R4 | [Equivocation detection (L03)](lessons/03-detect-equivocation.md) compares [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing) across vantages via [gossip](https://en.wikipedia.org/wiki/Gossip_protocol) | Planted [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) is detected and evidence is saved |
| R5 | [Alert rules (L04)](lessons/04-alert-rules.md) fire with correct [severity](https://en.wikipedia.org/wiki/Syslog#Severity_level): `WARN` for stale/overdue, `CRITICAL` for shrink/consistency/split | [Regression harness (L06)](lessons/06-regression-harness.md) verifies severities |
| R6 | Every fired [alert](https://en.wikipedia.org/wiki/Alert_messaging) triggers the correct [playbook step (L05)](lessons/05-incident-playbook.md) | Harness verifies P1–P5 mapping |
| R7 | [Incident log](https://en.wikipedia.org/wiki/Incident_management) file records every fired [alert](https://en.wikipedia.org/wiki/Alert_messaging) with timestamp and playbook step | `wc -l incidents.log` matches expected alert count |
| R8 | Full [regression harness (L06)](lessons/06-regression-harness.md) passes: 6/6 scenarios | `./test_harness` prints `6/6 passed` |

## Constraints

- C only. No external [HTTP](https://en.wikipedia.org/wiki/HTTP) or [JSON](https://en.wikipedia.org/wiki/JSON) libraries.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) compile with `gcc -Wall -Wextra -Werror`.
- [Checkpoint store](https://en.wikipedia.org/wiki/Application_checkpointing) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be [append-only](https://en.wikipedia.org/wiki/Append-only) — never overwrite previous entries.
- [Equivocation evidence](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) be deleted.
- Every [alert](https://en.wikipedia.org/wiki/Alert_messaging) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reference a [playbook step](https://en.wikipedia.org/wiki/Incident_management).

## Bonus challenges

| Bonus | Description |
|-------|-------------|
| B1 | Add a third [vantage point](https://en.wikipedia.org/wiki/Gossip_protocol) and detect [equivocation](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) across all three pairs |
| B2 | Implement real [HTTP GET](https://en.wikipedia.org/wiki/HTTP#Request_methods) against a local mock server instead of reading from files |
| B3 | Add a `RESOLVED` state to [incidents](https://en.wikipedia.org/wiki/Incident_management) — a responder can mark an incident as handled and the log tracks resolution time |
| B4 | Generate a summary report: number of polls, alerts fired per severity, mean time between [checkpoint](https://en.wikipedia.org/wiki/Application_checkpointing) fetches, evidence files saved |

## Verification

```bash
# Build
gcc -Wall -Wextra -Werror -o log_monitor \
  w16/monitor_signals.c w16/checkpoint_collector.c \
  w16/equivocation_detector.c w16/alert_rules.c \
  w16/incident_playbook.c w16/log_monitor_main.c

gcc -Wall -Wextra -Werror -o test_harness \
  w16/test_harness.c w16/monitor_signals.c \
  w16/checkpoint_collector.c w16/equivocation_detector.c \
  w16/alert_rules.c w16/incident_playbook.c

# R1: two vantage points
./log_monitor --vantages 2 --cycles 3
cat w16/checkpoints.store | grep "vantage-A" | wc -l
# → 3
cat w16/checkpoints.store | grep "vantage-B" | wc -l
# → 3

# R2: reject tampered STH
./log_monitor --inject-tampered
grep "REJECTED" w16/monitor.log
# → REJECTED: invalid signature on STH from vantage-B

# R4: split view detection
./log_monitor --inject-split-view
grep "SPLIT VIEW" w16/monitor.log
# → SPLIT VIEW DETECTED at tree_size=1024

# R5 + R6: alert severities and playbook mapping
./test_harness
# → 6/6 passed

# R7: incident log
wc -l w16/incidents.log
# → matches expected count

# Memory safety
valgrind --leak-check=full ./test_harness
# → 0 errors from 0 contexts
```

## Ship

```bash
git add w16/
git commit -m "w16 quest: full log monitor with equivocation detection and incident playbook"
```
