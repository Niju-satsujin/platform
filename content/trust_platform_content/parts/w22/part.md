---
id: w22-part
title: "Threat Modelling & Secure Defaults"
order: 22
type: part
---

# Week 22 – Threat Modelling & Secure Defaults

Security isn't a feature you bolt on. [Threat modelling](https://owasp.org/www-community/Threat_Modeling) maps what can go wrong before it does.

## Hero visual

```
                     Trust Platform
                          │
                          ▼
              ┌───────────────────────┐
              │    Asset & Actor      │
              │    Inventory (L01)    │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   STRIDE Threat       │
              │   Enumeration (L02)   │
              │  S │ T │ R │ I │ D │ E│
              └───────────┬───────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
   ┌──────────────┐ ┌──────────┐ ┌──────────────┐
   │ Mitigations  │ │ Secure   │ │ Key          │
   │ (L03)        │ │ Defaults │ │ Management   │
   │              │ │ (L04)    │ │ (L05)        │
   └──────┬───────┘ └────┬─────┘ └──────┬───────┘
          │               │              │
          └───────────────┼──────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Abuse-Case Tests    │
              │   (L06)               │
              │   attack → detect →   │
              │   block → verify      │
              └───────────────────────┘
```

## What you build

A complete [threat model](https://owasp.org/www-community/Threat_Modeling) for the trust platform that identifies every weak point and defends it before attackers arrive:

1. An [asset and actor inventory](lessons/01-assets-actors.md) that catalogs every piece of data, every service, and every [credential](https://en.wikipedia.org/wiki/Credential) the platform holds — then maps which [actors](https://en.wikipedia.org/wiki/Threat_actor) can touch each one and at what [privilege level](https://en.wikipedia.org/wiki/Principle_of_least_privilege).
2. A [STRIDE threat enumeration](lessons/02-threats.md) engine that walks through every [asset](lessons/01-assets-actors.md) and systematically checks for [Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, and Elevation of privilege](https://en.wikipedia.org/wiki/STRIDE_(security)) — producing a ranked threat registry.
3. A [mitigation planner](lessons/03-mitigations.md) that links every [threat](lessons/02-threats.md) to a concrete defence, tracks whether each defence is proposed, implemented, or verified, and computes [coverage](https://en.wikipedia.org/wiki/Code_coverage) percentage.
4. A [secure defaults engine](lessons/04-secure-defaults.md) that enforces the [principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege) out of the box — every setting starts in the most restrictive state and must be explicitly loosened.
5. A [key management registry](lessons/05-key-management.md) that tracks every [cryptographic key](https://en.wikipedia.org/wiki/Key_(cryptography)) the platform uses — its purpose, algorithm, length, rotation schedule — and flags overdue rotations.
6. An [abuse-case test suite](lessons/06-abuse-cases.md) that simulates real attacks — replaying the [STRIDE threats (L02)](lessons/02-threats.md) against the [mitigations (L03)](lessons/03-mitigations.md) and [secure defaults (L04)](lessons/04-secure-defaults.md) to prove they hold.

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W01 | [Buffer safety (W01)](../w01/part.md) — [CWE-120 buffer overflow](https://cwe.mitre.org/data/definitions/120.html) is a top threat in the [CWE Top 25](https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html); the [threat registry (L02)](lessons/02-threats.md) references it directly |
| ← builds on | W08 | [Signature trust model (W08)](../w08/part.md) — the [key management registry (L05)](lessons/05-key-management.md) tracks the signing keys first introduced in [W08](../w08/part.md) |
| ← builds on | W17 | [Credential issuance (W17)](../w17/part.md) — the [asset inventory (L01)](lessons/01-assets-actors.md) includes [credentials](https://en.wikipedia.org/wiki/Credential) issued by the [trust chain (W17)](../w17/part.md) |
| ← builds on | W19 | [Bundle verification (W19)](../w19/part.md) — the [mitigation planner (L03)](lessons/03-mitigations.md) references [bundle integrity checks (W19)](../w19/part.md) as a defence against [tampering](https://en.wikipedia.org/wiki/STRIDE_(security)) |
| ← builds on | W21 | [SLIs & SLOs (W21)](../w21/part.md) — [SLO scope (W21)](../w21/part.md) informs which [threats](lessons/02-threats.md) affect user-facing reliability the most |
| → leads to | W23 | [Documentation (W23)](../w23/part.md) — system [documentation (W23)](../w23/part.md) includes the [threat model](lessons/02-threats.md), [mitigation table](lessons/03-mitigations.md), and [key rotation policy (L05)](lessons/05-key-management.md) |

## Lessons

1. [Assets & Actors](lessons/01-assets-actors.md)
2. [Threats](lessons/02-threats.md)
3. [Mitigations](lessons/03-mitigations.md)
4. [Secure Defaults](lessons/04-secure-defaults.md)
5. [Key Management](lessons/05-key-management.md)
6. [Abuse Cases](lessons/06-abuse-cases.md)

## Quest

[Build the full threat model](quest.md) — integrate all six lessons into one deliverable that inventories assets, enumerates threats, plans mitigations, enforces defaults, audits keys, and proves every defence holds under simulated attack.
