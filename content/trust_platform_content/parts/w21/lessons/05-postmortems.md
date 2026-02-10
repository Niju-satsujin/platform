---
id: w21-l05
title: "Postmortems"
order: 5
type: lesson
duration_min: 45
---

# Postmortems

## Goal

Build a [blameless postmortem](https://sre.google/sre-book/postmortem-culture/) writer that captures the full story of an incident — timeline, root cause, impact, and action items — and links it to the [SLO](https://sre.google/sre-book/service-level-objectives/) that was breached. Every postmortem [MUST](https://datatracker.ietf.org/doc/html/rfc2119) produce concrete action items. Every action item [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have an owner and a deadline.

## What you build

A `struct postmortem` that holds eight fields: `char title[128]` (short incident name), `char slo_breached[32]` (which [SLO](https://sre.google/sre-book/service-level-objectives/) was violated), `uint64_t start_ts` (when the incident began), `uint64_t end_ts` (when the system recovered), `char root_cause[256]` (the deepest technical reason for the failure), `char impact[256]` (how users were affected — for example, "p99 [latency](https://en.wikipedia.org/wiki/Latency_(engineering)) reached 800 ms for 12 minutes"), `char timeline[512]` (step-by-step sequence of events), and `struct action_item actions[8]` with a `int action_count`. A `struct action_item` that holds: `char description[128]`, `char owner[32]`, and `int done` (0 or 1). A `postmortem_create()` function that initializes a postmortem with the incident metadata. A `postmortem_add_action()` function that appends an action item. A `postmortem_print()` function that renders the full postmortem in a readable format. A `postmortem_actions_done()` function that returns the percentage of completed action items.

## Why it matters

The [Google SRE book on postmortem culture](https://sre.google/sre-book/postmortem-culture/) says: "A postmortem is an opportunity to learn, not to blame." Without postmortems, the same incidents repeat. Without action items, the postmortem is just a story — nothing changes. Linking the postmortem to a specific [SLO](https://sre.google/sre-book/service-level-objectives/) breach makes the impact measurable: you know exactly how much [error budget](https://sre.google/sre-book/embracing-risk/) was consumed.

---

## Training Session

### Warmup

Read the [postmortem culture chapter of the Google SRE book](https://sre.google/sre-book/postmortem-culture/). Write down:

1. Why postmortems [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be [blameless](https://sre.google/sre-book/postmortem-culture/) — what happens to incident reporting when people fear blame.
2. The three required parts of every postmortem: root cause, impact, and action items.

### Work

#### Do

1. Create `w21/postmortem.h`.
2. Define `struct action_item` with three fields: `description`, `owner`, and `done`.
3. Define `struct postmortem` with the eight fields described above.
4. Create `w21/postmortem.c`.
5. Write `postmortem_create()`:
   - Accept title, [SLO](https://sre.google/sre-book/service-level-objectives/) name, start timestamp, end timestamp, root cause, impact, and timeline.
   - Copy each field using [strncpy()](https://man7.org/linux/man-pages/man3/strncpy.3.html).
   - Set `action_count` to 0.
   - Return the initialized `struct postmortem`.
6. Write `postmortem_add_action()`:
   - Accept a pointer to the postmortem, a description string, and an owner string.
   - If `action_count` is at capacity (8), return -1.
   - Copy the description and owner. Set `done` to 0.
   - Increment `action_count`. Return 0.
7. Write `postmortem_complete_action()`:
   - Accept a pointer to the postmortem and an action index.
   - If the index is out of range, return -1.
   - Set `done` to 1. Return 0.
8. Write `postmortem_print()`:
   - Print the title, [SLO](https://sre.google/sre-book/service-level-objectives/) breached, duration (end minus start), root cause, impact, and timeline.
   - Print each action item with its status: `[DONE]` or `[TODO]`, description, and owner.
9. Write `postmortem_actions_done()`:
   - Count actions where `done == 1`.
   - Return `(done_count * 100) / action_count`. If `action_count` is 0, return 0.
10. Write a `main()` test that:
    - Creates a postmortem for a [latency](https://en.wikipedia.org/wiki/Latency_(engineering)) [SLO](https://sre.google/sre-book/service-level-objectives/) breach.
    - Adds three action items with different owners.
    - Prints the postmortem (all actions show `[TODO]`).
    - Completes one action item.
    - Prints completion percentage (should be 33%).

#### Test

```bash
gcc -Wall -Wextra -Werror -o postmortem_test w21/postmortem.c
./postmortem_test
```

#### Expected

A full postmortem printout with title, [SLO](https://sre.google/sre-book/service-level-objectives/) breached, timeline, root cause, impact, and three action items. One is `[DONE]`, two are `[TODO]`. Completion is 33%. No crashes, no leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./postmortem_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w21/postmortem.h w21/postmortem.c
git commit -m "w21-l05: blameless postmortem writer with action tracking"
```

---

## Done when

- `postmortem_create()` initializes a postmortem with all incident metadata.
- `postmortem_add_action()` appends action items up to the capacity limit.
- `postmortem_complete_action()` marks an action as done.
- `postmortem_print()` renders a readable postmortem with all fields and action statuses.
- `postmortem_actions_done()` returns the correct completion percentage.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Writing a postmortem that blames a person | [Blameless postmortems](https://sre.google/sre-book/postmortem-culture/) focus on systems, not people. Write "the deploy pipeline lacked a canary check" — not "Alice broke production." |
| No action items | A postmortem without action items is just a story. Every postmortem [MUST](https://datatracker.ietf.org/doc/html/rfc2119) produce at least one concrete action with an owner and a deadline. |
| Action items with no owner | An action item that says "fix the thing" with no owner will never be done. Every action [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a named owner. |
| Not linking to the breached [SLO](https://sre.google/sre-book/service-level-objectives/) | Without the [SLO](https://sre.google/sre-book/service-level-objectives/) link, you cannot measure the [error budget](https://sre.google/sre-book/embracing-risk/) impact. Always record which [SLO](https://sre.google/sre-book/service-level-objectives/) was breached and by how much. |

## Proof

```bash
./postmortem_test
# → ═══════════════════════════════════════
# → POSTMORTEM: Latency spike during deploy
# → SLO breached: latency_ms
# → Duration: 720000 ms (12 minutes)
# → Root cause: New query path lacked index, full table scan on every request
# → Impact: p99 latency reached 800 ms for 12 minutes, error budget consumed 40%
# → Timeline:
# →   t+0m    Deploy rolled out to 100% of instances
# →   t+2m    Dashboard shows latency_ms p99 = 450 ms
# →   t+5m    BREACH alert fires, on-call paged
# →   t+8m    Root cause identified: missing index
# →   t+10m   Rollback initiated
# →   t+12m   Latency returns to normal, SLO met again
# → ═══════════════════════════════════════
# → Action items:
# →   [TODO] Add index to query path – owner: backend-team
# →   [DONE] Add latency canary to deploy pipeline – owner: platform-team
# →   [TODO] Write regression test for slow-query detection – owner: qa-team
# →
# → Actions complete: 33% (1/3)
```

## Hero visual

```
  Incident: Latency spike
       │
       ▼
  ┌─────────────────────────────────────┐
  │         Blameless Postmortem        │
  │                                     │
  │  SLO breached: latency_ms          │
  │  Duration: 12 minutes               │
  │  Root cause: missing DB index       │
  │  Impact: p99 = 800 ms, 40% budget  │
  │                                     │
  │  Timeline:                          │
  │    deploy → spike → alert →         │
  │    diagnose → rollback → recover    │
  │                                     │
  │  Action items:                      │
  │    [TODO] Add index                 │
  │    [DONE] Add canary                │
  │    [TODO] Add regression test       │
  └─────────────────────────────────────┘
```

## Future Lock

- In [W21 L06](06-drills.md) the [game-day drill runner](06-drills.md) will generate a postmortem automatically after each drill, capturing the simulated incident timeline and results.
- In [W21 L04](04-runbooks.md) the [runbook](04-runbooks.md) referenced during the incident will be linked from the postmortem, showing whether it was followed correctly.
- In [W23](../../w23/part.md) the [documentation](../../w23/part.md) will include a postmortem archive so future engineers can learn from past incidents.
- In [W22](../../w22/part.md) the [threat model](../../w22/part.md) will use postmortem root causes as input — past failures reveal which components are most fragile.
