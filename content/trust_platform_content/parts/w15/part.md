---
id: w15-part
title: "Transparency Log"
order: 15
type: part
---

# Week 15 – Transparency Log

An [append-only log](https://en.wikipedia.org/wiki/Append-only) with [Merkle proofs](https://en.wikipedia.org/wiki/Merkle_tree) lets anyone audit that no entry was changed or removed.

## Hero visual

```
 Client A                          Log Server                         Auditor
    │                                  │                                 │
    │──── append(entry) ──────────────▶│                                 │
    │                                  │── recompute root ──┐            │
    │                                  │◀───────────────────┘            │
    │◀─── signed tree head (STH) ──────│                                 │
    │                                  │                                 │
    │                                  │◀── get-sth ─────────────────────│
    │                                  │── STH(size=5, root=abc…) ──────▶│
    │                                  │                                 │
    │                                  │◀── get-consistency(3,5) ────────│
    │                                  │── proof[ h0, h1 ] ────────────▶│
    │                                  │                                 │
    │                                  │                          verify(old_root,
    │                                  │                           new_root, proof)
    │                                  │                            ✓ consistent
```

## What you build

An [append-only](https://en.wikipedia.org/wiki/Append-only) [transparency log](https://datatracker.ietf.org/doc/html/rfc6962) that:

1. Models log entries as an ordered, immutable sequence — once written, entries cannot be edited or deleted.
2. Computes a [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) head (called a [Signed Tree Head](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5)) after every append.
3. Generates [consistency proofs](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) between two tree sizes, proving the smaller tree is a prefix of the larger tree.
4. Provides an audit client that fetches the latest tree head and a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2), then verifies the log has not been tampered with.
5. Follows strict [storage discipline](https://man7.org/linux/man-pages/man2/fsync.2.html) — entries hit stable storage before the tree head is published.
6. Passes a [regression harness](lessons/06-regression-harness.md) with known test vectors from [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962).

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W10 | [WAL append discipline](../w10/part.md) — the same [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html)-then-advance pattern protects log entries before the tree head moves forward |
| ← builds on | W13 | [Content-addressable store](../w13/part.md) — [CAS](../w13/part.md) stores the raw entry data; the log indexes entries by sequence number |
| ← builds on | W14 | [Merkle trees](../w14/part.md) — the tree-building and [inclusion proof](../w14/lessons/03-generate-inclusion-proof.md) code from W14 is the engine inside this log |
| → leads to | W16 | [Monitoring](../w16/part.md) — monitors poll the log for new tree heads and raise alerts when a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) fails |
| → leads to | W18 | [Anchoring](../w18/part.md) — anchoring extends this log by cross-signing tree heads into an external ledger |

## Lessons

1. [Append-Only Model](lessons/01-append-only-model.md)
2. [Checkpoint](lessons/02-checkpoint.md)
3. [Consistency Proof](lessons/03-consistency-proof.md)
4. [Audit Client](lessons/04-audit-client.md)
5. [Storage Discipline](lessons/05-storage-discipline.md)
6. [Regression Harness](lessons/06-regression-harness.md)

## Quest

[W15 Quest – Full Transparency Log](quest.md)

## Quiz

[W15 Quiz](quiz.md)
