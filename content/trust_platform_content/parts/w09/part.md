---
id: w09-part
title: "Key-Value Store — Core Operations"
order: 9
type: part
---

# Key-Value Store — Core Operations

A [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) is a [state machine](https://en.wikipedia.org/wiki/Finite-state_machine) with a [protocol](https://datatracker.ietf.org/doc/html/rfc2119) contract. Correctness comes first.

## 🖼️ Hero Visual

```
  client            TCP              KV server
  ┌──────┐     ┌──────────┐     ┌───────────────────────────────┐
  │ SET  │────▶│  frame   │────▶│  parse ──▶ validate ──▶ apply │
  │ GET  │◀────│  frame   │◀────│  lookup ──▶ serialize ──▶ send│
  │ DEL  │     └──────────┘     │                               │
  └──────┘      W02 framing     │  ┌─────────────────────────┐  │
                                │  │   hashmap (state)       │  │
                                │  │ ┌───┬───┬───┬───┬───┐   │  │
                                │  │ │k:v│k:v│   │k:v│   │   │  │
                                │  │ └───┴───┴───┴───┴───┘   │  │
                                │  └─────────────────────────┘  │
                                │  rwlock │ counters │ harness  │
                                └───────────────────────────────┘
```

## What you build

A single-node [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) that accepts [GET](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete), [SET](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete), and [DEL](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) commands over [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html). You model the store as a [state machine](https://en.wikipedia.org/wiki/Finite-state_machine), define a strict [protocol contract](https://datatracker.ietf.org/doc/html/rfc2119), prove [correctness](https://en.wikipedia.org/wiki/Correctness_(computer_science)) for every operation, protect concurrent access with [pthread_rwlock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html), add [observability](https://en.wikipedia.org/wiki/Observability_(software)) counters, and run a full [regression harness](https://en.wikipedia.org/wiki/Regression_testing) to prove nothing breaks.

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W02 | [Framing](../w02/part.md) – you parse length-prefixed messages off the wire |
| ← builds on | W03 | [Event loop](../w03/part.md) – the single-threaded reactor that dispatches commands |
| ← builds on | W05 | [Thread pool](../w05/part.md) – pool threads execute GET/SET/DEL concurrently |
| ← builds on | W06 | [Backpressure](../w06/part.md) – when the store is overloaded, you push back on clients |
| → leads to | W10 | [WAL](../w10/part.md) – you add a write-ahead log so SET/DEL survive crashes |
| → leads to | W11 | [Replication](../w11/part.md) – you replicate state changes to follower nodes |
| → leads to | W12 | [Raft consensus](../w12/part.md) – you elect a leader and agree on the operation order |

## Lessons

| # | Status | Lesson |
|---|--------|--------|
| 0/7 | ⬡ | Start here |
| 1/7 | ⬡ | [State Machine Model](lessons/01-state-machine-model.md) |
| 2/7 | ⬡ | [Protocol Contract](lessons/02-protocol-contract.md) |
| 3/7 | ⬡ | [Core Ops Correctness](lessons/03-core-ops-correctness.md) |
| 4/7 | ⬡ | [Concurrency Strategy](lessons/04-concurrency-strategy.md) |
| 5/7 | ⬡ | [Observability](lessons/05-observability.md) |
| 6/7 | ⬡ | [Regression Harness](lessons/06-regression-harness.md) |
| 7/7 | ⬡ | [Quest — Single-Node KV Store](quest.md) |

## Quest

[W09 Quest — Single-Node KV Store](quest.md)

## Quiz

[W09 Quiz](quiz.md)
