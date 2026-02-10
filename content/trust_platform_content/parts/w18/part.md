---
id: w18-part
title: "Transparency Log Anchoring"
order: 18
type: part
---

# Week 18 – Transparency Log Anchoring

Anchoring commits a [log head](../w15/lessons/02-checkpoint.md) to an external [witness](https://en.wikipedia.org/wiki/Witness_(transparency)), making rollback publicly detectable.

## Hero visual

```
 Log Server                       Anchor Service                     External Witness
    │                                  │                                    │
    │── latest STH(size=42) ─────────▶│                                    │
    │                                  │── format anchor checkpoint ──┐     │
    │                                  │◀─────────────────────────────┘     │
    │                                  │                                    │
    │                                  │── publish(anchor) ────────────────▶│
    │                                  │                                    │
    │                                  │◀── cosignature ───────────────────│
    │                                  │                                    │
    │◀─ anchor receipt ───────────────│                                    │
    │                                  │                                    │
    │                                  │                             Audit Client
    │                                  │                                    │
    │                                  │◀── get-anchor(42) ────────────────│
    │                                  │── anchor + consistency proof ─────▶│
    │                                  │                                    │
    │                                  │                           verify(local_root,
    │                                  │                            anchor_root, proof)
    │                                  │                             ✓ anchored
```

## What you build

A [log anchoring](https://en.wikipedia.org/wiki/Transparency_(behavior)) system that extends the [transparency log from W15](../w15/part.md) by:

1. Modelling [anchor records](lessons/01-append-only-model.md) as an [append-only](https://en.wikipedia.org/wiki/Append-only) sequence — each anchor captures a [log head](../w15/lessons/02-checkpoint.md) snapshot published to an external party.
2. Formatting [anchor checkpoints](lessons/02-checkpoint.md) in the [witness-compatible format](https://github.com/transparency-dev/formats/blob/main/log/README.md) so that any third-party [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) can verify them.
3. Generating [consistency proofs](lessons/03-consistency-proof.md) between the last anchored tree size and the current tree size, proving no entries changed between anchoring events.
4. Building a [cross-log audit client](lessons/04-audit-client.md) that fetches [anchors](https://datatracker.ietf.org/doc/html/rfc6962#section-3) from the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)), compares them against the local [transparency log](../w15/part.md), and flags any divergence.
5. Applying strict [anchor storage discipline](lessons/05-storage-discipline.md) — anchor records and [cosignatures](https://en.wikipedia.org/wiki/Witness_(transparency)) hit stable storage before any receipt is returned.
6. Running a [regression harness](lessons/06-regression-harness.md) that tests the full [anchor lifecycle](https://datatracker.ietf.org/doc/html/rfc6962#section-3) against known test vectors.

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W14 | [Merkle trees](../w14/part.md) — the [inclusion](../w14/lessons/03-generate-inclusion-proof.md) and [consistency proof](../w14/lessons/04-verify-consistency-proof.md) code powers anchor verification |
| ← builds on | W15 | [Transparency log](../w15/part.md) — W18 anchors the log heads that W15 produces; it does not rebuild the log itself |
| → leads to | W16 | [Monitoring](../w16/part.md) — monitors detect when an [anchor](lessons/01-append-only-model.md) is missing or a [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) fails to arrive on schedule |
| → leads to | W19 | [Trust bundles](../w19/part.md) — bundles carry [anchor receipts](lessons/02-checkpoint.md) so that offline clients can verify without contacting the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) |
| → leads to | W20 | [Chaos tests](../w20/part.md) — chaos scenarios exercise [anchor recovery](lessons/05-storage-discipline.md) after crashes and network partitions |

## Lessons

1. [Append-Only Anchor Model](lessons/01-append-only-model.md)
2. [Anchor Checkpoint](lessons/02-checkpoint.md)
3. [Anchor Consistency Proof](lessons/03-consistency-proof.md)
4. [Cross-Log Audit Client](lessons/04-audit-client.md)
5. [Anchor Storage Discipline](lessons/05-storage-discipline.md)
6. [Anchor Regression Harness](lessons/06-regression-harness.md)

## Quest

[W18 Quest – Full Log Anchoring System](quest.md)

## Quiz

[W18 Quiz](quiz.md)
