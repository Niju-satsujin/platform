---
id: w20-l02
title: "Partition Test"
order: 2
duration_minutes: 30
xp: 75
kind: lesson
part: w20
proof:
  type: paste
  instructions: "Paste the output showing: documents issued during partition, partition healed, all replicas consistent."
  regex_patterns:
    - "partition|disconnect"
    - "consistent|match|catch.up"
---

## Concept

A network partition happens when one or more nodes in your cluster cannot communicate with the others. In Week 10 you tested partitions with the KV store. Now you test partitions with the full CivicTrust system — including document issuance, the transparency log, and receipts.

The key question: if you issue documents while a replica is partitioned, what happens when the partition heals? The partitioned replica needs to catch up on all the documents it missed. After catch-up, all replicas should have identical data — same log entries, same CAS objects, same state hash.

This test verifies the end-to-end integrity of your replication system under real failure conditions. If the state hashes match after partition recovery, you know that replication is working correctly and no data was lost or duplicated.

## Task

1. Start a 3-node cluster with CivicTrust running
2. Disconnect node 3 (simulate partition by refusing its connections)
3. Issue 20 documents to the leader — should succeed (quorum of 2 out of 3)
4. Verify all 20 documents are on nodes 1 and 2 but not on node 3
5. Reconnect node 3 — it should catch up automatically
6. After catch-up, compute state hash on all 3 nodes — they should match
7. Verify receipts generated during the partition are valid on all nodes

## Hints

- Simulate partition by closing the connection to node 3 and rejecting reconnection attempts
- The leader should continue issuing with quorum (leader + 1 follower = majority)
- After reconnecting, node 3 sends its last LSN and the leader sends all WAL records since then
- State hash: sort all keys in the KV store, concatenate key-value pairs, compute SHA-256
- Generate a receipt for document #10 and verify it on all 3 nodes after catch-up

## Verify

```bash
cd build && ctest --output-on-failure -R partition
```

All 3 nodes have matching state hashes after partition recovery.

## Done When

Documents issued during a partition are fully replicated to all nodes after the partition heals, with matching state hashes.
