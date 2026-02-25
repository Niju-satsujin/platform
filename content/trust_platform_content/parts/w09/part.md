---
id: w09
title: "KV Store + Write-Ahead Log"
order: 9
description: "Build an in-memory key-value store with version tracking. Add a write-ahead log (WAL) for durability. Crash drills prove data survives power loss. Snapshots for fast recovery. fsync tuning for the speed-safety tradeoff."
kind: part_intro
arc: arc-3-durability
---
# Week 9 — KV Store + Write-Ahead Log

## Big Picture

You are entering the durability arc. The question: **does your data survive if the machine crashes?**

A hash map in memory is fast but fragile — kill the process and everything is gone. A write-ahead log (WAL) fixes this: before modifying memory, you write the operation to a file on disk. If the process crashes, you replay the log to rebuild the state.

Reading assignment: **DDIA chapters 5, 7, 9** (Designing Data-Intensive Applications by Martin Kleppmann). This is the bible for distributed systems. Read chapter 7 (Transactions) first — it explains WAL and crash recovery clearly.

## What you will build

- **In-memory KV store** with get/put/delete and version tracking
- **WAL format** — each record: LSN + operation + checksum
- **WAL append** — write to the log before applying to memory
- **WAL replay** — on startup, read the log and rebuild the hash map
- **Crash drills** — simulate crashes at different points and verify recovery
- **Snapshots** — periodically dump the full state for faster recovery
- **fsync tuning** — measure the cost of durability

## Schedule

- **Monday** (lessons 1-3): KV API, in-memory map, version tracking
- **Tuesday** (lessons 4-6): WAL format, WAL append, WAL replay
- **Wednesday** (lessons 7-9): Crash after WAL write, crash mid-write, crash after apply
- **Thursday** (lessons 10-12): Snapshots, fsync tuning, quality gate

## Done when

Crash drills pass: data survives simulated crashes at every point in the write path.
