---
id: w12-part
title: "Consensus — Simplified Raft"
order: 12
type: part
---

# Consensus — Simplified Raft

Consensus means the cluster agrees on one truth, even when nodes fail.

## 🖼️ Hero Visual

```
  cluster (3 nodes)         election                 steady state

  ┌───────────┐            ┌───────────┐            ┌───────────┐
  │ follower  │ timeout    │ candidate │  wins      │  LEADER   │
  │ term=1    │──────────▶ │ term=2    │──────────▶ │  term=2   │
  └───────────┘            │ votes=2/3 │            └─────┬─────┘
                           └───────────┘              heartbeat
  ┌───────────┐                                       AppendEntries
  │ follower  │◀──────── RequestVote ────────────▶ ┌─────┴─────┐
  │ term=1    │  grant                              │ follower  │
  └───────────┘                                     │ term=2    │
                                                    └───────────┘
  ┌───────────┐
  │ follower  │◀──────── AppendEntries (heartbeat) ──────────────
  │ term=2    │  ack
  └───────────┘

  client ──▶ leader ──▶ AppendEntries ──▶ followers
                   ◀── ack ◀── quorum reached ──▶ commit ──▶ reply OK
```

## What you build

A simplified [Raft consensus algorithm](https://en.wikipedia.org/wiki/Raft_(algorithm)) on top of the [replicated KV store (W11)](../w11/part.md). Instead of manually picking a leader, the cluster elects one using [term numbers](https://raft.github.io/raft.pdf) and [RequestVote RPCs](https://raft.github.io/raft.pdf). The leader proves it is alive with [AppendEntries](https://raft.github.io/raft.pdf) heartbeats. Client requests carry unique IDs for [idempotency](https://en.wikipedia.org/wiki/Idempotence). Followers redirect writes to the current leader. [Split-brain](https://en.wikipedia.org/wiki/Split-brain_(computing)) is prevented with [fencing tokens](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html). A full [regression harness](https://en.wikipedia.org/wiki/Regression_testing) validates every invariant.

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W09 | [KV store](../w09/part.md) – the store being coordinated |
| ← builds on | W10 | [Write-ahead log](../w10/part.md) – WAL records are the unit of replication |
| ← builds on | W11 | [Replication](../w11/part.md) – leader-follower replication upgraded with consensus |
| → leads to | W20 | [Chaos drills](../w20/part.md) – tests Raft under injected failures |

## Lessons

| # | Status | Lesson |
|---|--------|--------|
| 0/7 | ⬡ | Start here |
| 1/7 | ⬡ | [Terms & Voting](lessons/01-terms-voting.md) |
| 2/7 | ⬡ | [Heartbeats](lessons/02-heartbeats.md) |
| 3/7 | ⬡ | [Client Idempotency](lessons/03-client-idempotency.md) |
| 4/7 | ⬡ | [Redirect Rules](lessons/04-redirect-rules.md) |
| 5/7 | ⬡ | [Split-Brain Defense](lessons/05-split-brain-defense.md) |
| 6/7 | ⬡ | [Regression Harness](lessons/06-regression-harness.md) |
| 7/7 | ⬡ | [Quest — Simplified Raft](quest.md) |

## Quest

[W12 Quest — Simplified Raft](quest.md)

## Quiz

[W12 Quiz](quiz.md)
