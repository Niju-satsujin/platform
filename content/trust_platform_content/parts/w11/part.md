---
id: w11-part
title: "Replication & Consistency"
order: 11
type: part
---

# Replication & Consistency

Availability requires copies. Copies require consistency discipline.

## 🖼️ Hero Visual

```
  clients         leader                         followers
  ┌──────┐    ┌──────────────────────┐     ┌──────────────────────┐
  │ SET  │───▶│  parse ──▶ WAL append│     │  follower-1          │
  │ DEL  │    │           │          │     │  ┌────────────────┐  │
  │ GET  │◀───│  apply ◀──┘          │     │  │ WAL receiver   │  │
  └──────┘    │                      │  TCP│  │  append ──▶ apply │
              │  ┌────────────────┐  │────▶│  └────────────────┘  │
              │  │ WAL shipper    │  │ ACK │  │ hashmap (replica) │
              │  │  read ──▶ send │  │◀────│  └────────────────┘  │
              │  └────────────────┘  │     └──────────────────────┘
              │                      │
              │  ┌────────────────┐  │     ┌──────────────────────┐
              │  │ quorum tracker │  │     │  follower-2          │
              │  │ ack_count >= Q │  │     │  ┌────────────────┐  │
              │  └────────────────┘  │  TCP│  │ WAL receiver   │  │
              │                      │────▶│  │  append ──▶ apply │
              │  hashmap (primary)   │ ACK │  └────────────────┘  │
              │  ┌───┬───┬───┬───┐  │◀────│  │ hashmap (replica) │
              │  │k:v│k:v│k:v│   │  │     │  └────────────────┘  │
              │  └───┴───┴───┴───┘  │     └──────────────────────┘
              └──────────────────────┘
```

## What you build

A [leader-follower replication](https://en.wikipedia.org/wiki/Replication_(computing)) system for the [KV store (W09)](../w09/part.md). The leader accepts writes, appends each operation to its [write-ahead log (W10)](../w10/part.md), and ships the [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) records over [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) to one or more followers. Followers receive the records, verify the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check), append them to their own WAL, apply them to their local [hash table](https://en.wikipedia.org/wiki/Hash_table), and send an acknowledgment back. The leader waits for a [quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) of acknowledgments before confirming the write to the client. You handle [conflicts](https://en.wikipedia.org/wiki/Eventual_consistency) with a [last-writer-wins](https://en.wikipedia.org/wiki/Eventual_consistency) strategy, manage follower failure and rejoin, and verify everything with a [regression harness](https://en.wikipedia.org/wiki/Regression_testing).

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W09 | [KV store](../w09/part.md) – the store being replicated |
| ← builds on | W10 | [Write-ahead log](../w10/part.md) – WAL records are the unit of replication |
| → leads to | W12 | [Raft consensus](../w12/part.md) – replaces manual leader election with an algorithm |
| → leads to | W20 | [Chaos drills](../w20/part.md) – tests replication under injected failures |

## Lessons

| # | Status | Lesson |
|---|--------|--------|
| 0/7 | ⬡ | Start here |
| 1/7 | ⬡ | [Replication Goal](lessons/01-replication-goal.md) |
| 2/7 | ⬡ | [Log Shipping](lessons/02-log-shipping.md) |
| 3/7 | ⬡ | [Ack & Quorum Lite](lessons/03-ack-quorum-lite.md) |
| 4/7 | ⬡ | [Conflict Handling](lessons/04-conflict-handling.md) |
| 5/7 | ⬡ | [Failure Handling](lessons/05-failure-handling.md) |
| 6/7 | ⬡ | [Regression Harness](lessons/06-regression-harness.md) |
| 7/7 | ⬡ | [Quest — Replicated KV Store](quest.md) |

## Quest

[W11 Quest — Replicated KV Store](quest.md)

## Quiz

[W11 Quiz](quiz.md)
