---
id: w12
title: "Month 3 Demo — Full Cluster"
order: 12
description: "Demonstrate your replicated KV store: writes survive leader failure, elections happen automatically, and all nodes converge to the same state."
kind: part_intro
arc: arc-3-durability
---
# Week 12 — Month 3 Demo: Full Cluster

## Big Picture

This is the final week of Month 3. You have spent three weeks building serious distributed systems infrastructure — a persistent KV store with a write-ahead log, log replication across nodes, and leader election. Now you prove it all works together.

This week is not about writing new code. It is about running your system end-to-end and showing that it behaves correctly under failure. Think of it like a demo day at a job — you walk someone through the system, break something on purpose, and show that the system recovers.

## What you will demonstrate

By the end of this week you have:

- **A demo script** — a numbered list of steps with expected output for each step
- **3-node cluster** running your replicated KV store
- **Writes to the leader** — 50 key-value pairs stored and replicated
- **Leader failure** — kill the leader, watch the followers detect it
- **Automatic election** — a new leader is elected without human intervention
- **Writes to the new leader** — 50 more key-value pairs, replicated to the surviving follower
- **Full data verification** — all 100 keys present on every node, including the restarted old leader
- **State hash checks** — cryptographic proof that all nodes have identical data at every step
- **Month 3 report** — a one-page summary of what you built, key numbers, and next steps

## Schedule

- **Monday** (lessons 1-2): Plan the demo, run the first step (writes to leader)
- **Tuesday** (lessons 3-4): Kill the leader, observe the election
- **Wednesday** (lessons 5-6): Write to the new leader, verify all data on all nodes
- **Thursday** (lesson 7): Add state hash checks at every step
- **Friday** (lesson 8): Write the Month 3 report
- **Saturday** (lesson 9): Quality gate and git tag

## Done when

The full demo runs end-to-end: writes survive leader failure, elections happen automatically, all nodes converge to the same state, state hashes match, and the Month 3 report is written.
