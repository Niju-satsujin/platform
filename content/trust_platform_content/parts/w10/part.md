---
id: w10
title: "Replication"
order: 10
description: "Add replication to your KV store — a 3-node cluster where the leader replicates writes to followers using an AppendEntries RPC."
kind: part_intro
arc: arc-3-durability
---
# Week 10 — Replication

## Big Picture

Your KV store works on a single machine. It accepts connections, stores data, and replays from the WAL after a crash. But one machine is a single point of failure. If it dies, your data is gone until you restart it. This week you fix that by running three copies of your KV store and keeping them in sync.

This is called replication. One node is the leader — it accepts all writes. The other two nodes are followers — they receive copies of every write from the leader. If the leader goes down, the followers still have all the data. This is the same pattern used by real databases like PostgreSQL, MySQL, and Redis.

## What you will build

By the end of this week you have:

- **A 3-node cluster** — three instances of your KV store running on different ports
- **Leader/follower roles** — one node accepts writes, the others replicate
- **AppendEntries RPC** — the leader sends WAL records to followers over the network
- **Quorum commit** — a write is confirmed only when a majority (2 of 3) nodes have it
- **Follower catch-up** — a follower that was offline gets all the records it missed
- **Partition recovery** — a disconnected follower catches up when it reconnects
- **State hash verification** — compare the full state across all nodes to prove they match
- **Replication test** — automated test proving 100 keys replicate correctly

## Schedule

- **Monday** (lessons 1-3): Cluster setup, leader/follower roles, AppendEntries RPC
- **Tuesday** (lessons 4-5): Quorum commit, follower catch-up
- **Wednesday** (lessons 6-7): Partition behavior, state hash verification
- **Thursday** (lesson 8): Full replication test
- **Friday** (lessons 9-10): Benchmark + quality gate

## Done when

All 3 nodes start, the leader replicates writes to both followers, state hashes match across the cluster, and the quality gate checklist is green.
