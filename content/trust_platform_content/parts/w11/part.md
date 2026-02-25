---
id: w11
title: "Leader Election + Client Safety"
order: 11
description: "Add leader election to your replicated KV store — when the leader dies, followers hold an election and a new leader takes over automatically."
kind: part_intro
arc: arc-3-durability
---
# Week 11 — Leader Election + Client Safety

## Big Picture

Last week you built a replicated KV store with a fixed leader and followers. The leader receives writes, logs them, and replicates them to followers. This works — until the leader crashes. Right now, if the leader dies, the whole system stops accepting writes. Nobody takes over. That is not acceptable for a real system.

This week you fix that. You add leader election: when followers stop hearing from the leader, one of them runs for election, collects votes, and becomes the new leader. The system recovers automatically — no human intervention needed.

You also handle client safety during failover. A client might send a write to the old leader right before it dies. Did that write get committed? The client does not know. You solve this with idempotent writes — every request has a unique ID, so the server can detect and deduplicate retries.

## What you will build

By the end of this week you have:

- **Election timeouts** — followers detect leader failure after a randomized timeout
- **Voting** — candidates request votes, nodes vote once per term for the most up-to-date candidate
- **Automatic election** — full state machine: follower -> candidate -> leader
- **Idempotent writes** — client ID + sequence number deduplication
- **Stale leader fencing** — old leaders step down when they see a higher term
- **Raft comparison** — you understand how your system relates to the Raft protocol
- **Election test** — automated test: kill leader, verify new leader elected, writes continue
- **Benchmark** — election time and write latency measurements

## Schedule

- **Monday** (lessons 1-2): Election timeouts, terms, and vote rules
- **Tuesday** (lessons 3-4): Full election flow and idempotent writes
- **Wednesday** (lessons 5-6): Stale leader fencing and Raft paper reading
- **Thursday** (lesson 7): Election integration test
- **Friday** (lessons 8-9): Benchmark and quality gate

## Done when

Leader dies, election happens automatically, new leader accepts writes, and the quality gate checklist is green. Tag: `v0.11-election`.
