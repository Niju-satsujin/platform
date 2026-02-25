---
id: w10-quest
title: "Week 10 Boss: Replicated KV Store"
part: w10
kind: boss
proof:
  type: paste
  instructions: "Paste output showing: write to leader, read from follower, data matches."
  regex_patterns:
    - "replicated|follower"
    - "match|identical|verified"
---
# Week 10 Boss: Replicated KV Store

## Goal

Prove your KV store replicates data across a 3-node cluster. Writes go to the leader, reads from any follower return the same data, and state hashes match across all nodes.

## Requirements

1. **3 nodes start** on ports 9001, 9002, 9003 — one leader, two followers
2. **Write 100 keys** to the leader using your client
3. **Read all 100 keys** from each follower — every key is present with the correct value
4. **State hashes match** — the hash from each node is identical
5. **Partition recovery** — disconnect one follower, write 10 more keys, reconnect, verify the follower catches up
6. **Replication test passes** — automated test covers the full flow

## Verify

```bash
# Terminal 1: start leader
./build/kvstore --port 9001 --role=leader --peers=9002,9003

# Terminal 2: start follower 1
./build/kvstore --port 9002 --role=follower --leader=9001

# Terminal 3: start follower 2
./build/kvstore --port 9003 --role=follower --leader=9001

# Terminal 4: write to leader, read from followers
./build/kv_client --port 9001 put mykey myvalue
./build/kv_client --port 9002 get mykey
./build/kv_client --port 9003 get mykey

# Run full replication test
./build/replication_test --leader=9001 --followers=9002,9003
```

## Done When

The replication test passes, state hashes match across all 3 nodes, and partition recovery works. Your KV store is no longer a single point of failure.
