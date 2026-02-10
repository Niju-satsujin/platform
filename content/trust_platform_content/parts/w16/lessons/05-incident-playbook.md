---
id: w16-l05
title: "Incident Playbook"
order: 5
type: lesson
duration_min: 40
---

# Incident Playbook

## Goal

Write a structured [incident playbook](https://en.wikipedia.org/wiki/Incident_management) that tells the on-call responder exactly what to do when each [alert (L04)](04-alert-rules.md) fires.

## What you build

An `incident_playbook` module. It defines a set of [playbook steps](https://en.wikipedia.org/wiki/Incident_management), each linked to one or more [alert rules (L04)](04-alert-rules.md). Each step has: a step ID, a description, an [escalation](https://en.wikipedia.org/wiki/Escalation_(project_management)) path, evidence to collect, and a resolution checklist. You also write a `run_playbook_step()` function that takes an [alert](https://en.wikipedia.org/wiki/Alert_messaging) and prints the matching [playbook](https://en.wikipedia.org/wiki/Incident_management) instructions.

## Why it matters

An [alert](https://en.wikipedia.org/wiki/Alert_messaging) without a response plan is just a notification. When a [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) fires at 3 AM, the on-call engineer needs a step-by-step guide — not a puzzle. The [playbook](https://en.wikipedia.org/wiki/Incident_management) tells them what evidence to save, who to notify, and how to confirm the issue. Without it, people panic, skip steps, and destroy evidence. Every production [monitoring system](https://en.wikipedia.org/wiki/System_monitor) needs a [runbook](https://en.wikipedia.org/wiki/Runbook).

---

## Training Session

### Warmup

Think about the worst [alert](https://en.wikipedia.org/wiki/Alert_messaging) from [L04](04-alert-rules.md) — a `CRITICAL` [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)). Write down:

1. What evidence you would need to prove the log lied.
2. Who needs to know.
3. What the first action should be.

### Work

#### Do

1. Create `w16/incident_playbook.h`.
2. Define `struct playbook_step` with fields: `const char *step_id`, `const char *alert_rule_name`, `const char *description`, `const char *evidence_to_collect`, `const char *escalation_target`, `const char *resolution_checklist`.
3. Define the following [playbook steps](https://en.wikipedia.org/wiki/Incident_management):
   - `P1` — stale [STH](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5): check if the log [endpoint](https://en.wikipedia.org/wiki/Web_API) is reachable. If reachable but stale, log a ticket. If unreachable, [escalate](https://en.wikipedia.org/wiki/Escalation_(project_management)) to infrastructure.
   - `P2` — [tree size](https://en.wikipedia.org/wiki/Merkle_tree) shrink: save both [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing). This is evidence of a [rollback](https://en.wikipedia.org/wiki/Rollback_(data_management)). [Escalate](https://en.wikipedia.org/wiki/Escalation_(project_management)) immediately.
   - `P3` — [consistency proof](../../../parts/w14/part.md) failure: save the proof bytes and both [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing). Retry the proof request. If it still fails, [escalate](https://en.wikipedia.org/wiki/Escalation_(project_management)).
   - `P4` — [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) detected: save both [vantage checkpoints](https://en.wikipedia.org/wiki/Gossip_protocol) as evidence. Notify the log operator. Notify all relying parties. Do NOT delete evidence.
   - `P5` — [inclusion](https://datatracker.ietf.org/doc/html/rfc6962#section-4.5) overdue: check the [MMD](https://datatracker.ietf.org/doc/html/rfc6962#section-3) promise. If overdue, log a ticket and notify the entry submitter.
4. Write `find_playbook_step(const char *alert_rule_name, struct playbook_step *steps, int step_count)` — returns a pointer to the matching step.
5. Write `run_playbook_step(struct alert *fired_alert, struct playbook_step *steps, int step_count)`:
   - Find the matching step. Print the step ID, description, evidence to collect, and [escalation](https://en.wikipedia.org/wiki/Escalation_(project_management)) target.
6. Write `log_incident(const char *incident_file, struct alert *fired_alert, struct playbook_step *step)`:
   - Append a timestamped entry to the [incident log](https://en.wikipedia.org/wiki/Incident_management) file with the [alert](https://en.wikipedia.org/wiki/Alert_messaging) details and the step taken.
7. Write a `main()` test. Create a `CRITICAL` [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) alert. Run the [playbook](https://en.wikipedia.org/wiki/Incident_management) and print the response instructions.

#### Test

```bash
gcc -Wall -Wextra -o playbook_test w16/incident_playbook.c
./playbook_test
```

#### Expected

Output shows step P4 with: description, evidence to collect (both [vantage checkpoints](https://en.wikipedia.org/wiki/Gossip_protocol)), [escalation](https://en.wikipedia.org/wiki/Escalation_(project_management)) target (log operator + relying parties), and a resolution checklist. The [incident log](https://en.wikipedia.org/wiki/Incident_management) file has one entry.

### Prove It

Check the [incident log](https://en.wikipedia.org/wiki/Incident_management) file:

```bash
cat w16/incidents.log
```

One timestamped entry with all fields populated. Run under [AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html):

```bash
gcc -fsanitize=address -Wall -Wextra -o playbook_test w16/incident_playbook.c
./playbook_test
```

Zero errors.

### Ship It

```bash
git add w16/incident_playbook.h w16/incident_playbook.c
git commit -m "w16-l05: incident playbook with five steps and incident logging"
```

---

## Done when

- Five [playbook steps](https://en.wikipedia.org/wiki/Incident_management) are defined, one per [alert rule (L04)](04-alert-rules.md).
- `run_playbook_step()` prints the correct response for a given [alert](https://en.wikipedia.org/wiki/Alert_messaging).
- `log_incident()` appends a timestamped record to the [incident log](https://en.wikipedia.org/wiki/Incident_management) file.
- The [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) step (P4) says to save evidence and notify relying parties.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Playbook says "investigate" without specifying what evidence to collect | Be specific: "save both [vantage checkpoints](https://en.wikipedia.org/wiki/Gossip_protocol) to `evidence/` folder." |
| No [escalation](https://en.wikipedia.org/wiki/Escalation_(project_management)) path | Every step [MUST](https://datatracker.ietf.org/doc/html/rfc2119) name who to notify. A step with no escalation is useless at 3 AM. |
| Deleting or overwriting evidence | [Equivocation evidence](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) is cryptographic proof. It [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) be deleted. Append to the incident log, never truncate. |
| Not logging the incident | If the [incident](https://en.wikipedia.org/wiki/Incident_management) is not logged, the post-mortem has no record. Always call `log_incident()`. |

## Proof

```bash
./playbook_test
# → ALERT: [CRITICAL] split_view at tree_size=1024
# → PLAYBOOK STEP P4:
# →   description: Split view detected — log presented different roots for same tree size
# →   evidence: save vantage-A checkpoint and vantage-B checkpoint to evidence/
# →   escalate: notify log operator and all relying parties
# →   checklist: 1) save evidence 2) notify operator 3) notify relying parties 4) open post-mortem
```

## Hero visual

```
  alert fires                playbook                        action
  ┌──────────────┐          ┌──────────────────┐           ┌──────────────────┐
  │ [CRITICAL]   │────P4───▶│ save evidence    │──────────▶│ evidence/ saved  │
  │ split_view   │          │ notify operator  │           │ operator notified│
  │              │          │ notify reliers   │           │ incident logged  │
  └──────────────┘          │ open post-mortem │           └──────────────────┘
                            └──────────────────┘
```

## Future Lock

- In [W16 L06](06-regression-harness.md) you will test that every [alert](https://en.wikipedia.org/wiki/Alert_messaging) triggers the correct [playbook step](https://en.wikipedia.org/wiki/Incident_management).
- In [W20](../../../parts/w20/part.md) you will run the full [playbook](https://en.wikipedia.org/wiki/Incident_management) during a [chaos drill](../../../parts/w20/part.md) with simulated [split views](https://en.wikipedia.org/wiki/Equivocation_(computer_science)).
- In [W21](../../../parts/w21/part.md) you will measure [alert-to-action latency](../../../parts/w21/part.md) as an [SLI](https://en.wikipedia.org/wiki/Service_level_indicator) and set an [SLO](https://en.wikipedia.org/wiki/Service-level_objective) for response time.
