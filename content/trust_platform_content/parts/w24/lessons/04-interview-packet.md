---
id: w24-l04
title: "Interview Packet"
order: 4
type: lesson
duration_min: 50
---

# Interview Packet

## Goal

Build an [interview](https://en.wikipedia.org/wiki/Job_interview) packet that turns 24 weeks of trust platform work into structured stories you can tell in a technical interview. Every story [MUST](https://datatracker.ietf.org/doc/html/rfc2119) follow the [STAR method](https://en.wikipedia.org/wiki/Situation,_task,_action,_result): Situation, Task, Action, Result.

## What you build

A document called `docs/interview-packet.md` containing seven [STAR method](https://en.wikipedia.org/wiki/Situation,_task,_action,_result) stories — one for each major system layer of the trust platform. Each story references specific weeks, lessons, and [ADRs (W23 L04)](../../w23/lessons/04-decision-log.md). The packet also includes a trade-off table listing key design decisions and your defence of each, plus a quick-reference section with system metrics from the [SLO dashboard (W21)](../../w21/part.md) and [threat model coverage (W22)](../../w22/part.md).

## Why it matters

Technical interviews ask "Tell me about a project you built." Most candidates give a vague, rambling answer. The [STAR method](https://en.wikipedia.org/wiki/Situation,_task,_action,_result) forces structure: what was the situation, what was your task, what action did you take, and what was the result. A prepared packet means you never freeze. You have seven stories ready, each backed by real code, real metrics, and real design decisions. The [interview packet](https://en.wikipedia.org/wiki/Job_interview) is the difference between "I built a server" and "I built a production-grade server that handles 10K concurrent connections with p99 latency under 5ms — here is how."

---

## Training Session

### Warmup

Read the [STAR method](https://en.wikipedia.org/wiki/Situation,_task,_action,_result) description. Write down:

1. One sentence defining each letter: **S**ituation, **T**ask, **A**ction, **R**esult.
2. Pick one week from [W01](../../w01/part.md) through [W10](../../w10/part.md). Draft a rough STAR story for it in four bullet points.

### Work

#### Do

1. **Create `docs/interview-packet.md`** in the trust platform repository.
2. Write **seven [STAR](https://en.wikipedia.org/wiki/Situation,_task,_action,_result) stories**, one for each system layer:
   - **Networking** — covering [W02 (sockets)](../../w02/part.md), [W03 (event loop)](../../w03/part.md), [W04 (epoll)](../../w04/part.md).
   - **Concurrency** — covering [W05 (thread pool)](../../w05/part.md), [W06 (backpressure)](../../w06/part.md).
   - **Storage** — covering [W07 (file I/O)](../../w07/part.md), [W08 (B-tree)](../../w08/part.md), [W09 (concurrent store)](../../w09/part.md), [W10 (WAL)](../../w10/part.md).
   - **Protocol** — covering [W11 (parsing)](../../w11/part.md), [W12 (commands)](../../w12/part.md), [W13 (pipelining)](../../w13/part.md), [W14 (pub/sub)](../../w14/part.md).
   - **Distributed** — covering [W15 (replication)](../../w15/part.md), [W16 (consensus/Raft)](../../w16/part.md).
   - **Security** — covering [W17 (auth)](../../w17/part.md), [W18 (TLS)](../../w18/part.md), [W19 (access control)](../../w19/part.md), [W22 (threat model)](../../w22/part.md).
   - **Reliability** — covering [W20 (chaos engineering)](../../w20/part.md), [W21 (SLOs)](../../w21/part.md).
3. Each story [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have four clearly labelled sections: `#### Situation`, `#### Task`, `#### Action`, `#### Result`.
4. Each **Result** section [MUST](https://datatracker.ietf.org/doc/html/rfc2119) include a measurable outcome — a metric, a test result, or a before/after comparison.
5. Write a **trade-off table** with at least five rows. Each row has: Decision, Alternatives Considered, Why You Chose This, Reference to [ADR (W23 L04)](../../w23/lessons/04-decision-log.md).
6. Write a **quick-reference section** with key system metrics from the [SLO dashboard (W21)](../../w21/part.md) and [threat model (W22)](../../w22/part.md). Format as a table: Metric, Target, Measured.
7. Write a **30-second elevator pitch** at the top of the document — a spoken summary of the entire project in three sentences.

#### Test

```bash
# Verify seven STAR stories
grep -c "#### Situation" docs/interview-packet.md
# → 7

# Verify trade-off table has at least 5 entries
grep -c "ADR" docs/interview-packet.md
# → at least 5

# Verify metrics reference
grep -c "p99\|latency\|error rate\|throughput" docs/interview-packet.md
# → at least 3

# Verify all system layers are covered
grep -c "Networking\|Concurrency\|Storage\|Protocol\|Distributed\|Security\|Reliability" docs/interview-packet.md
# → 7
```

#### Expected

The packet has seven [STAR](https://en.wikipedia.org/wiki/Situation,_task,_action,_result) stories with four sections each. The trade-off table has at least five entries referencing [ADRs](https://adr.github.io/). The quick-reference section lists measurable metrics. All seven system layers are named.

### Prove It

Read one [STAR](https://en.wikipedia.org/wiki/Situation,_task,_action,_result) story aloud. Time yourself — it [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) take 60–90 seconds. If it takes longer, cut words. If the Result has no number, add one.

### Ship It

```bash
git add docs/interview-packet.md
git commit -m "w24-l04: interview packet — 7 STAR stories, trade-off table, metrics"
```

---

## Done when

- `docs/interview-packet.md` exists with a 30-second elevator pitch, seven [STAR](https://en.wikipedia.org/wiki/Situation,_task,_action,_result) stories, a trade-off table, and a quick-reference metrics section.
- Each [STAR](https://en.wikipedia.org/wiki/Situation,_task,_action,_result) story covers one system layer and has Situation, Task, Action, Result sections.
- Each Result includes a measurable outcome.
- The trade-off table has at least five entries referencing [ADRs (W23 L04)](../../w23/lessons/04-decision-log.md).
- The quick-reference section lists key [SLO metrics (W21)](../../w21/part.md) and [threat model coverage (W22)](../../w22/part.md).

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Writing a story with no measurable Result | Every Result [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a number: latency, throughput, test count, coverage percentage. "It worked" is not a result. |
| Stories that are too long | Each story [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) fit in 60–90 seconds spoken. Cut background details. Start with the Task, not the history of computing. |
| Missing trade-off defence | Interviewers ask "Why did you choose X over Y?" If you cannot answer, you did not understand the decision. Reference the [ADR (W23 L04)](../../w23/lessons/04-decision-log.md). |
| Generic stories that could apply to any project | Every Action [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reference specific code, weeks, or lessons from the trust platform. Generic = forgettable. |
| Forgetting the elevator pitch | The elevator pitch is the answer to "Tell me about your project." Practise it until you can say it without reading. |

## Proof

```bash
grep -c "#### Situation" docs/interview-packet.md
# → 7

grep -c "#### Result" docs/interview-packet.md
# → 7

grep -c "ADR" docs/interview-packet.md
# → 5 or more
```

## Hero visual

```
  ┌─────────────────────────────────────────────┐
  │       docs/interview-packet.md              │
  ├─────────────────────────────────────────────┤
  │                                             │
  │  ## Elevator Pitch (30 seconds)             │
  │                                             │
  │  ## STAR Stories                             │
  │  ┌─────────────┐  ┌─────────────┐          │
  │  │ Networking  │  │ Concurrency │          │
  │  │ S─T─A─R    │  │ S─T─A─R    │          │
  │  └─────────────┘  └─────────────┘          │
  │  ┌─────────────┐  ┌─────────────┐          │
  │  │ Storage     │  │ Protocol   │          │
  │  │ S─T─A─R    │  │ S─T─A─R    │          │
  │  └─────────────┘  └─────────────┘          │
  │  ┌─────────────┐  ┌─────────────┐          │
  │  │ Distributed │  │ Security   │          │
  │  │ S─T─A─R    │  │ S─T─A─R    │          │
  │  └─────────────┘  └─────────────┘          │
  │  ┌─────────────┐                            │
  │  │ Reliability │                            │
  │  │ S─T─A─R    │                            │
  │  └─────────────┘                            │
  │                                             │
  │  ## Trade-Off Table (5+ decisions)          │
  │  ## Quick Reference (SLOs + threats)        │
  └─────────────────────────────────────────────┘
```

## Future Lock

- The [interview packet](https://en.wikipedia.org/wiki/Job_interview) is what you review the night before every technical interview. Update it as you gain experience — add new stories, refine the metrics, sharpen the pitch.
- The [STAR method](https://en.wikipedia.org/wiki/Situation,_task,_action,_result) works for every project, not just this one. Every significant project you build from now on deserves a STAR story.
- Senior engineers maintain a "brag document" — a running list of accomplishments with metrics. This packet is your first one. Keep adding to it throughout your career.
