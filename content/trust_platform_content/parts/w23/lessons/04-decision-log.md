---
id: w23-l04
title: "Decision Log"
order: 4
type: lesson
duration_min: 45
---

# Decision Log

## Goal

Write a [decision log](https://adr.github.io/) of [Architecture Decision Records](https://adr.github.io/) for the trust platform. Each [ADR](https://adr.github.io/) captures one design choice — the context, the options you considered, the decision you made, and the consequences. The log [MUST](https://datatracker.ietf.org/doc/html/rfc2119) contain at least five ADRs covering choices from different layers of the system.

## What you build

A `docs/decisions/` directory containing numbered [ADR](https://adr.github.io/) files: `001-bounded-task-queue.md`, `002-epoll-over-poll.md`, `003-wal-for-durability.md`, `004-slo-targets.md`, `005-threat-model-first.md`, and an `index.md` that lists all ADRs with status and date. Each [ADR](https://adr.github.io/) follows the [standard ADR template](https://adr.github.io/): Title, Status (proposed / accepted / deprecated / superseded), Context, Decision, Consequences.

## Why it matters

Code shows what you built. [ADRs](https://adr.github.io/) show why you built it that way. Six months from now, a new teammate asks "Why not use [poll()](https://man7.org/linux/man-pages/man2/poll.2.html) instead of [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html)?" Without an [ADR](https://adr.github.io/), the answer is lost. With one, the context, the trade-offs, and the reasoning are preserved. In interviews, the ability to explain trade-offs is the difference between "I used epoll" and "I chose epoll over poll because of O(1) vs O(n) scaling, and here is the [ADR](https://adr.github.io/) that documents that choice." [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) keywords in ADRs make the strength of each requirement explicit.

---

## Training Session

### Warmup

Read the [ADR GitHub page](https://adr.github.io/) and the example template. Write down:

1. The five sections of the [standard ADR template](https://adr.github.io/).
2. Why the Status field matters — what does it mean for an ADR to be "superseded"?

### Work

#### Do

1. Create `docs/decisions/index.md`.
2. Add a table with columns: Number, Title, Status, Date.
3. Create `docs/decisions/001-bounded-task-queue.md`.
   - **Title:** Use a bounded [task queue (W05)](../../w05/part.md) instead of an unbounded list.
   - **Status:** Accepted.
   - **Context:** The [event loop (W03)](../../w03/part.md) pushes tasks to the [thread pool (W05)](../../w05/part.md). If the queue is unbounded, a burst of requests can exhaust memory.
   - **Decision:** Use a fixed-capacity [circular buffer](https://en.wikipedia.org/wiki/Circular_buffer) protected by a [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html). Producers block when the queue is full, creating [backpressure (W06)](../../w06/part.md).
   - **Consequences:** Memory use is bounded. Producers may stall under load. This is acceptable because stalling is safer than crashing.
4. Create `docs/decisions/002-epoll-over-poll.md`.
   - **Context:** The server needs to handle thousands of [connections (W04)](../../w04/part.md).
   - **Decision:** Use [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) instead of [poll()](https://man7.org/linux/man-pages/man2/poll.2.html).
   - **Consequences:** O(1) readiness checks instead of O(n). Linux-only — portability is traded for performance.
5. Create `docs/decisions/003-wal-for-durability.md`.
   - **Context:** The [KV store (W09)](../../w09/part.md) needs to survive crashes without losing committed writes.
   - **Decision:** Use a [write-ahead log (W10)](../../w10/part.md). Every mutation is appended to the [WAL](../../w10/part.md) before updating in-memory state.
   - **Consequences:** Writes are slower because of the [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) call. Crash recovery replays the log. Durability is guaranteed.
6. Create `docs/decisions/004-slo-targets.md`.
   - **Context:** Without numeric targets, "the system is reliable" is an opinion, not a fact.
   - **Decision:** Define [SLO targets (W21)](../../w21/part.md) — latency ≤ 200ms at p99, error rate < 0.1%, throughput ≥ 100 req/s.
   - **Consequences:** Every change is measured against the [SLOs](../../w21/part.md). A change that breaches an [SLO](../../w21/part.md) is rolled back. The [error budget (W21)](../../w21/part.md) limits risk.
7. Create `docs/decisions/005-threat-model-first.md`.
   - **Context:** Security features added after the system is built often miss edge cases.
   - **Decision:** Build the [threat model (W22)](../../w22/part.md) before the [portfolio (W24)](../../w24/part.md) — enumerate [assets](../../w22/lessons/01-assets-actors.md), [threats](../../w22/lessons/02-threats.md), and [mitigations](../../w22/lessons/03-mitigations.md) while the system is fresh.
   - **Consequences:** Every [mitigation](../../w22/lessons/03-mitigations.md) is linked to a [threat](../../w22/lessons/02-threats.md). No defence is added without a reason. [Abuse-case tests (W22 L06)](../../w22/lessons/06-abuse-cases.md) prove each defence holds.
8. Update `docs/decisions/index.md` with all five entries.

#### Test

```bash
# Check that the index exists and lists 5 ADRs
grep -c "|" docs/decisions/index.md
# → at least 6 (header + separator + 5 rows)

# Check that each ADR has the five required sections
for f in docs/decisions/00[1-5]-*.md; do
  echo "$f:"
  grep -c "^## " "$f"
done
# → each file: at least 4 (Title is the H1, so Status + Context + Decision + Consequences = 4)

# Check RFC 2119 keyword usage
grep -c "MUST\|SHOULD\|MUST NOT" docs/decisions/*.md
# → at least 5
```

#### Expected

Five [ADR](https://adr.github.io/) files exist. Each has Status, Context, Decision, and Consequences sections. The index lists all five with status and date.

### Prove It

Read each [ADR](https://adr.github.io/) and ask: "Could a new teammate understand why this choice was made without talking to me?" If the answer is no, the Context section needs more detail.

### Ship It

```bash
git add docs/decisions/
git commit -m "w23-l04: decision log with 5 ADRs covering queue, epoll, WAL, SLOs, threat model"
```

---

## Done when

- `docs/decisions/index.md` lists at least 5 [ADRs](https://adr.github.io/) with Number, Title, Status, and Date.
- Each [ADR](https://adr.github.io/) file has Status, Context, Decision, and Consequences sections.
- The five ADRs cover choices from at least three different system layers.
- Each [ADR](https://adr.github.io/) uses [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) keywords to express requirement strength.
- A new teammate can understand each decision without asking the author.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Writing "We decided to use X" without explaining why | The Context section [MUST](https://datatracker.ietf.org/doc/html/rfc2119) state the problem and the alternatives considered. Without context, the [ADR](https://adr.github.io/) is useless. |
| Missing the Consequences section | Every decision has trade-offs. If you cannot name a downside, you have not thought hard enough. |
| All ADRs are from the same layer | Spread across layers — network, storage, reliability, security. This shows you understand the full system. |
| Not linking to the relevant week | Each [ADR](https://adr.github.io/) [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) link to the week where the decision was implemented so the reader can see the code. |
| Using "proposed" status for everything | If the system is built and running, the decision is "accepted." Reserve "proposed" for choices not yet implemented. |

## Proof

```bash
ls docs/decisions/
# → index.md  001-bounded-task-queue.md  002-epoll-over-poll.md
# → 003-wal-for-durability.md  004-slo-targets.md  005-threat-model-first.md

grep -c "|" docs/decisions/index.md
# → 7 or more

for f in docs/decisions/00[1-5]-*.md; do
  echo "$f: $(grep -c '^## ' "$f") sections"
done
# → each: 4 sections
```

## Hero visual

```
  ┌─────────────────────────────────────────────┐
  │             DECISION LOG (ADRs)             │
  ├─────┬──────────────────────────┬────────────┤
  │ 001 │ Bounded task queue       │ Accepted   │
  │ 002 │ epoll over poll          │ Accepted   │
  │ 003 │ WAL for durability       │ Accepted   │
  │ 004 │ SLO targets              │ Accepted   │
  │ 005 │ Threat model first       │ Accepted   │
  ├─────┴──────────────────────────┴────────────┤
  │ Each ADR:                                   │
  │   Status → Context → Decision → Consequences│
  └─────────────────────────────────────────────┘
```

## Future Lock

- In [W23 L02](02-demo-script.md) the [demo script](02-demo-script.md) references one [ADR](https://adr.github.io/) in its Design Decision section.
- In [W23 L05](05-faq.md) the [FAQ](05-faq.md) will link to specific ADRs when answering "Why did you choose X?"
- In [W23 L06](06-interview-practice.md) the [interview practice](06-interview-practice.md) will use these ADRs as the basis for trade-off discussion questions.
- In [W24](../../w24/part.md) the [portfolio](../../w24/part.md) will include the decision log as evidence of engineering judgement.
