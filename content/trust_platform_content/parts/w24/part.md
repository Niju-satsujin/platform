---
id: w24-part
title: "Portfolio & Launch"
order: 24
type: part
---

# Week 24 – Portfolio & Launch

Ship it. The final week turns 23 weeks of work into a portfolio piece that proves you can build trust systems.

## Hero visual

```
                     Trust Platform
                    23 Weeks of Work
                          │
                          ▼
              ┌───────────────────────┐
              │    Repo Polish        │
              │    (L01)              │
              │  clean │ tag │ CI     │
              └───────────┬───────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
   ┌──────────────┐ ┌──────────┐ ┌──────────────┐
   │ Release      │ │ Portfolio│ │ Interview    │
   │ Artifact     │ │ Page     │ │ Packet       │
   │ (L02)        │ │ (L03)    │ │ (L04)        │
   │ semver + tag │ │ live site│ │ STAR stories │
   └──────┬───────┘ └────┬─────┘ └──────┬───────┘
          │               │              │
          └───────────────┼──────────────┘
                          │
              ┌───────────┼───────────┐
              ▼                       ▼
   ┌──────────────────┐   ┌──────────────────┐
   │ Mock Interviews  │   │ Publish          │
   │ (L05)            │   │ (L06)            │
   │ practice & defend│   │ go live          │
   └──────────────────┘   └──────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Final Release       │
              │   (Quest)             │
              │  repo + release +     │
              │  portfolio + packet + │
              │  published & live     │
              └───────────────────────┘
```

## What you build

A complete [portfolio](https://en.wikipedia.org/wiki/Portfolio_(career)) package that proves you built every layer of the trust platform from [W01](../w01/part.md) through [W23](../w23/part.md):

1. A [polished repository (L01)](lessons/01-repo-polish.md) with a clean commit history, passing [CI](https://en.wikipedia.org/wiki/Continuous_integration), no dead code, and a clear [README (W23 L01)](../w23/lessons/01-readme-story.md) — ready for a stranger to clone and build.
2. A [release artifact (L02)](lessons/02-release-artifact.md) tagged with [semantic versioning](https://semver.org/) and published as a [GitHub release](https://docs.github.com/en/repositories/releasing-projects-on-github) with a changelog, binary or build instructions, and license.
3. A [portfolio page (L03)](lessons/03-portfolio-page.md) hosted on [GitHub Pages](https://pages.github.com/) that showcases the project — hero visual, feature list, architecture diagram from [W23 L03](../w23/lessons/03-architecture-diagram.md), and a link to the live release.
4. An [interview packet (L04)](lessons/04-interview-packet.md) that turns your work into [STAR method](https://en.wikipedia.org/wiki/Situation,_task,_action,_result) stories — one story per major system (networking, concurrency, storage, protocol, distributed, security, reliability).
5. A [mock interview session (L05)](lessons/05-mock-interviews.md) where you practice explaining the trust platform under time pressure — system design walk-through, trade-off defence, and live debugging demo.
6. A [publish step (L06)](lessons/06-publish.md) where everything goes live — repository public, release tagged, portfolio deployed, and packet ready to send.

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W01–W22 | All systems from [buffer safety (W01)](../w01/part.md) through [threat modelling (W22)](../w22/part.md) — every component is showcased in the [portfolio page (L03)](lessons/03-portfolio-page.md) and [interview packet (L04)](lessons/04-interview-packet.md) |
| ← builds on | W21 | [SLIs & SLOs (W21)](../w21/part.md) — [SLO dashboard](../w21/part.md) metrics appear on the [portfolio page (L03)](lessons/03-portfolio-page.md) as proof of production readiness |
| ← builds on | W22 | [Threat model (W22)](../w22/part.md) — the [threat model](../w22/part.md) and [mitigations](../w22/lessons/03-mitigations.md) feed into [interview packet (L04)](lessons/04-interview-packet.md) STAR stories about security decisions |
| ← builds on | W23 | [Documentation (W23)](../w23/part.md) — the [README (W23 L01)](../w23/lessons/01-readme-story.md), [demo script (W23 L02)](../w23/lessons/02-demo-script.md), [architecture diagram (W23 L03)](../w23/lessons/03-architecture-diagram.md), [ADRs (W23 L04)](../w23/lessons/04-decision-log.md), and [FAQ (W23 L05)](../w23/lessons/05-faq.md) are the raw material for this week |
| → leads to | Career | The [portfolio](lessons/03-portfolio-page.md), [release](lessons/02-release-artifact.md), and [interview packet](lessons/04-interview-packet.md) are what you send to employers, open-source communities, and conference reviewers |

## Lessons

1. [Repo Polish](lessons/01-repo-polish.md)
2. [Release Artifact](lessons/02-release-artifact.md)
3. [Portfolio Page](lessons/03-portfolio-page.md)
4. [Interview Packet](lessons/04-interview-packet.md)
5. [Mock Interviews](lessons/05-mock-interviews.md)
6. [Publish](lessons/06-publish.md)

## Quest

[W24 Quest – Final Release of the Trust Platform](quest.md)

## Quiz

[W24 Quiz](quiz.md)
