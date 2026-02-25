---
id: w12-quest
title: "Week 12 Boss: Full Cluster Demo"
part: w12
kind: boss
proof:
  type: paste
  instructions: "Paste your full demo output showing: writes to leader, leader killed, election, writes to new leader, all data verified."
  regex_patterns:
    - "election|elected"
    - "verified|match|pass"
---
# Week 12 Boss: Full Cluster Demo

## Goal

Prove your replicated KV store works end-to-end: data survives leader failure, elections happen automatically, and every node converges to the same state.

## Requirements

1. **3-node cluster starts** — all three nodes are running and one is elected leader
2. **50 writes to leader** — keys 1-50 stored and replicated to both followers
3. **Leader killed** — the leader process is terminated with SIGTERM
4. **Election succeeds** — one follower becomes the new leader within the election timeout
5. **50 more writes** — keys 51-100 written to the new leader, replicated to the surviving follower
6. **All data verified** — every live node has all 100 keys with correct values
7. **Old leader restarted** — it catches up and also has all 100 keys
8. **State hashes match** — hash computed on each node is identical after every step
9. **Month 3 report written** — one-page summary with benchmark numbers

## Verify

```bash
# Run your demo script end-to-end
./demo_cluster.sh

# Or run each step manually and capture output
# Step 1: start cluster
# Step 2: write 50 keys
# Step 3: kill leader
# Step 4: observe election
# Step 5: write 50 more keys
# Step 6: verify all data
# Step 7: check state hashes
```

## Done When

Full demo output shows: 50 writes to leader succeed, leader killed, election completes, 50 writes to new leader succeed, all 100 keys verified on all nodes, state hashes match, and Month 3 report is complete.
