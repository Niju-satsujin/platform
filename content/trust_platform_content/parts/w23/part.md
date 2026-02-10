---
id: w23-part
title: "Documentation & Demo Craft"
order: 23
type: part
---

# Week 23 – Documentation & Demo Craft

Code that can't be explained can't be trusted. Great [documentation](https://diataxis.fr/) is a trust signal.

## Hero visual

```
                     Trust Platform
                          │
                          ▼
              ┌───────────────────────┐
              │    README Story       │
              │    (L01)              │
              │  what │ why │ how     │
              └───────────┬───────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
   ┌──────────────┐ ┌──────────┐ ┌──────────────┐
   │ Demo Script  │ │ Arch     │ │ Decision     │
   │ (L02)        │ │ Diagram  │ │ Log / ADRs   │
   │ 3-min walk   │ │ (L03)    │ │ (L04)        │
   └──────┬───────┘ └────┬─────┘ └──────┬───────┘
          │               │              │
          └───────────────┼──────────────┘
                          │
              ┌───────────┼───────────┐
              ▼                       ▼
   ┌──────────────────┐   ┌──────────────────┐
   │ FAQ              │   │ Interview        │
   │ (L05)            │   │ Practice (L06)   │
   │ anticipate doubt │   │ explain & defend │
   └──────────────────┘   └──────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Documentation Pack  │
              │   (Quest)             │
              │  README + demo +      │
              │  diagram + ADRs +     │
              │  FAQ + interview prep │
              └───────────────────────┘
```

## What you build

A complete [documentation](https://diataxis.fr/) package for the trust platform that proves you understand every system you built from [W01](../w01/part.md) through [W22](../w22/part.md):

1. A [README story (L01)](lessons/01-readme-story.md) that follows [README best practices](https://www.makeareadme.com/) — what the project is, why it exists, how to run it, and what the reader will learn — using the [Diátaxis framework](https://diataxis.fr/) to separate tutorials, how-to guides, references, and explanations.
2. A [demo script (L02)](lessons/02-demo-script.md) that walks through the trust platform in three minutes — start the system, show a key feature, explain a design decision, end with a result the audience can verify.
3. An [architecture diagram (L03)](lessons/03-architecture-diagram.md) drawn in [Mermaid](https://mermaid.js.org/) that maps every major component from the [event loop (W03)](../w03/part.md) to the [threat model (W22)](../w22/part.md), showing data flow, dependencies, and trust boundaries.
4. A [decision log (L04)](lessons/04-decision-log.md) of [Architecture Decision Records](https://adr.github.io/) that captures the why behind key choices — bounded queue over unbounded, [epoll](../w04/part.md) over [poll](https://man7.org/linux/man-pages/man2/poll.2.html), [SLOs (W21)](../w21/part.md) over ad-hoc monitoring — using the [ADR format](https://adr.github.io/).
5. A [FAQ (L05)](lessons/05-faq.md) that anticipates the questions a reviewer, interviewer, or teammate will ask — and answers each one clearly with links to the relevant week or lesson.
6. An [interview practice guide (L06)](lessons/06-interview-practice.md) that prepares you to explain the trust platform in a technical interview — system design walk-through, trade-off analysis, and defence of your decisions under pressure.

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W01–W20 | All systems from [buffer safety (W01)](../w01/part.md) through [chaos drills (W20)](../w20/part.md) — every component is documented in the [architecture diagram (L03)](lessons/03-architecture-diagram.md) and [decision log (L04)](lessons/04-decision-log.md) |
| ← builds on | W21 | [SLIs & SLOs (W21)](../w21/part.md) — [SLO targets](../w21/part.md) appear in the [README (L01)](lessons/01-readme-story.md) and [FAQ (L05)](lessons/05-faq.md) as proof of production readiness |
| ← builds on | W22 | [Threat model (W22)](../w22/part.md) — the [threat model](../w22/part.md), [mitigation table](../w22/lessons/03-mitigations.md), and [key rotation policy](../w22/lessons/05-key-management.md) are referenced in the [architecture diagram (L03)](lessons/03-architecture-diagram.md) and [decision log (L04)](lessons/04-decision-log.md) |
| → leads to | W24 | [Portfolio packaging (W24)](../w24/part.md) — the [documentation pack](quest.md) becomes a core artifact in the [portfolio (W24)](../w24/part.md), showing reviewers that you can build and explain production systems |

## Lessons

1. [README Story](lessons/01-readme-story.md)
2. [Demo Script](lessons/02-demo-script.md)
3. [Architecture Diagram](lessons/03-architecture-diagram.md)
4. [Decision Log](lessons/04-decision-log.md)
5. [FAQ](lessons/05-faq.md)
6. [Interview Practice](lessons/06-interview-practice.md)

## Quest

[Build the full documentation pack](quest.md) — integrate all six lessons into one deliverable that a reviewer can read from start to finish, understanding what you built, why you made each choice, and how every component fits together.

## Quiz

[W23 Quiz](quiz.md)
