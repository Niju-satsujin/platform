---
id: w09-quest
title: "Week 9 Boss: Crash-Proof KV Store"
part: w09
kind: boss
proof:
  type: paste
  instructions: "Paste: (1) all 3 crash drill outputs showing data survived, (2) snapshot + replay timing, (3) quality gate checklist."
  regex_patterns:
    - "crash|recover"
    - "PASS"
---
# Week 9 Boss: Crash-Proof KV Store

## Goal

Prove your KV store survives crashes at every point in the write path.

## Requirements

1. KV store supports get/put/delete with version numbers
2. WAL append happens before memory update
3. Crash after WAL write: data recovers from the log
4. Crash mid-write: partial record is detected and skipped
5. Crash after apply: replay is idempotent (no duplicates)
6. Snapshots work: recovery from snapshot + remaining WAL is faster than full replay
7. Quality gate passes

## Done When

All 3 crash drills pass and the quality gate is green.
