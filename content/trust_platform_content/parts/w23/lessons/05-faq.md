---
id: w23-l05
title: "FAQ"
order: 5
type: lesson
duration_min: 35
---

# FAQ

## Goal

Build a structured [FAQ](https://en.wikipedia.org/wiki/FAQ) for the trust platform that anticipates the questions a reviewer, interviewer, or teammate will ask. Each answer [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be two to four sentences, link to the relevant week or lesson, and end with a concrete claim that can be verified.

## What you build

A `docs/faq.md` file containing at least twelve questions grouped into four categories: **Architecture** (how the system is structured), **Decisions** (why you made specific choices), **Reliability** (how you know it works), and **Security** (how you protect it). Each question has a short answer with links to the relevant [lesson](../part.md), [ADR (L04)](04-decision-log.md), [SLO (W21)](../../w21/part.md), or [threat (W22)](../../w22/part.md).

## Why it matters

A [FAQ](https://en.wikipedia.org/wiki/FAQ) is a trust accelerator. When a reviewer reads the [README (L01)](01-readme-story.md) and thinks "But what about X?" — the [FAQ](https://en.wikipedia.org/wiki/FAQ) answers before they have to ask. In interviews, having pre-prepared answers to common questions shows that you have thought deeply about your system. Unanticipated questions are the ones that trip you up. The [FAQ](https://en.wikipedia.org/wiki/FAQ) turns them into anticipated ones.

---

## Training Session

### Warmup

Think about the trust platform from the perspective of three audiences. Write down:

1. Two questions a **teammate** joining the project would ask.
2. Two questions a **technical interviewer** would ask.
3. Two questions a **security reviewer** would ask.

### Work

#### Do

1. Create `docs/faq.md`.
2. Add an **Architecture** section with at least three questions:
   - "What is the overall structure of the system?" → Answer with a reference to the [architecture diagram (L03)](03-architecture-diagram.md) and the eight layers.
   - "How does a client request flow through the system?" → Answer with a reference to the [data-flow diagram (L03)](03-architecture-diagram.md).
   - "Why are there so many layers?" → Answer: each layer solves one problem. The [event loop (W03)](../../w03/part.md) handles IO, the [thread pool (W05)](../../w05/part.md) handles CPU, the [WAL (W10)](../../w10/part.md) handles durability. Separation keeps each layer testable.
3. Add a **Decisions** section with at least three questions:
   - "Why [epoll](../../w04/part.md) instead of [poll](https://man7.org/linux/man-pages/man2/poll.2.html)?" → Answer with a reference to [ADR-002 (L04)](04-decision-log.md).
   - "Why a bounded [task queue](../../w05/part.md) instead of an unbounded list?" → Answer with a reference to [ADR-001 (L04)](04-decision-log.md) and [backpressure (W06)](../../w06/part.md).
   - "Why [write-ahead log (W10)](../../w10/part.md) instead of writing directly to the database?" → Answer with a reference to [ADR-003 (L04)](04-decision-log.md).
4. Add a **Reliability** section with at least three questions:
   - "How do you know the system is reliable?" → Answer: [SLO targets (W21)](../../w21/part.md) define the bar — latency, error rate, throughput. The [dashboard (W21 L03)](../../w21/lessons/03-dashboards.md) shows current status.
   - "What happens when an [SLO](../../w21/part.md) is breached?" → Answer: the [runbook (W21 L04)](../../w21/lessons/04-runbooks.md) activates. The [postmortem (W21 L05)](../../w21/lessons/05-postmortems.md) captures the root cause.
   - "Have you tested failure scenarios?" → Answer: [chaos drills (W20)](../../w20/part.md) simulate crashes, slow networks, and overload. The [game-day drill (W21 L06)](../../w21/lessons/06-drills.md) verifies that alerts fire.
5. Add a **Security** section with at least three questions:
   - "How do you protect against attacks?" → Answer: the [threat model (W22)](../../w22/part.md) enumerates every [STRIDE threat](https://en.wikipedia.org/wiki/STRIDE_(security)). The [mitigation planner (W22 L03)](../../w22/lessons/03-mitigations.md) links each threat to a defence.
   - "What about [buffer overflows](https://cwe.mitre.org/data/definitions/120.html)?" → Answer: [buffer safety (W01)](../../w01/part.md) uses bounds-checked functions. The [threat registry (W22 L02)](../../w22/lessons/02-threats.md) tracks [CWE-120](https://cwe.mitre.org/data/definitions/120.html) as a named threat.
   - "How are [cryptographic keys](https://en.wikipedia.org/wiki/Key_(cryptography)) managed?" → Answer: the [key management registry (W22 L05)](../../w22/lessons/05-key-management.md) tracks every key, its rotation schedule, and compliance status.
6. End with a **Still have questions?** line that points to the [README (L01)](01-readme-story.md) and [architecture diagram (L03)](03-architecture-diagram.md).

#### Test

```bash
# Check that four category headers exist
grep -c "^## " docs/faq.md
# → at least 5 (title + 4 categories + closing)

# Check question count
grep -c "^### " docs/faq.md
# → at least 12

# Check that links exist
grep -c "\[.*\](.*)" docs/faq.md
# → at least 12
```

#### Expected

The [FAQ](https://en.wikipedia.org/wiki/FAQ) has at least four category headers, at least twelve questions, and at least twelve links to weeks, lessons, or ADRs.

### Prove It

Give the [FAQ](https://en.wikipedia.org/wiki/FAQ) to someone unfamiliar with the project. Ask them to pick any three questions and read the answers. If they can understand the answer without reading the linked lesson, the answer is good. If they cannot, add more context.

### Ship It

```bash
git add docs/faq.md
git commit -m "w23-l05: FAQ with 12+ questions across architecture, decisions, reliability, security"
```

---

## Done when

- `docs/faq.md` has at least four category sections: Architecture, Decisions, Reliability, Security.
- Each category has at least three questions.
- Each answer is two to four sentences with at least one [markdown link](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#links) to the relevant week, lesson, or [ADR](https://adr.github.io/).
- Each answer ends with a verifiable claim — something the reader can check.
- A reader unfamiliar with the project can understand each answer without reading the linked source.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Answers that are too long | Two to four sentences. If you need more, you are explaining a concept that [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) live in a lesson — link to it instead. |
| No links in answers | Every answer [MUST](https://datatracker.ietf.org/doc/html/rfc2119) link to the relevant week, lesson, or [ADR](https://adr.github.io/). Plain-text references are not navigable. |
| Questions only from your own perspective | Think from three perspectives: teammate, interviewer, security reviewer. Each audience asks different questions. |
| Answers that say "it works" without evidence | End each answer with a verifiable claim. "The [SLO dashboard (W21)](../../w21/part.md) shows p99 latency under 200ms" is verifiable. "The system is fast" is not. |
| Missing the security category | Security questions [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be included. If the [FAQ](https://en.wikipedia.org/wiki/FAQ) ignores security, a reviewer will assume you did too. |

## Proof

```bash
grep -c "^## " docs/faq.md
# → 5 or more

grep -c "^### " docs/faq.md
# → 12 or more

grep -c "\[.*\](.*)" docs/faq.md
# → 12 or more
```

## Hero visual

```
  ┌─────────────────────────────────────────────┐
  │                 FAQ                         │
  ├─────────────────────────────────────────────┤
  │ ## Architecture                             │
  │   Q: How does a request flow?               │
  │   A: See data-flow diagram (L03) → ...      │
  │                                             │
  │ ## Decisions                                │
  │   Q: Why epoll over poll?                   │
  │   A: See ADR-002 (L04) → O(1) vs O(n)      │
  │                                             │
  │ ## Reliability                              │
  │   Q: How do you know it works?              │
  │   A: SLO targets (W21) → dashboard          │
  │                                             │
  │ ## Security                                 │
  │   Q: How do you protect against attacks?    │
  │   A: Threat model (W22) → STRIDE → defend   │
  └─────────────────────────────────────────────┘
```

## Future Lock

- In [W23 L01](01-readme-story.md) the [README](01-readme-story.md) links to this [FAQ](https://en.wikipedia.org/wiki/FAQ) as further reading.
- In [W23 L06](06-interview-practice.md) the [interview practice](06-interview-practice.md) will use these questions as warmup material before mock interviews.
- In [W24](../../w24/part.md) the [portfolio](../../w24/part.md) will include the [FAQ](https://en.wikipedia.org/wiki/FAQ) as evidence that you can anticipate and answer technical questions.
