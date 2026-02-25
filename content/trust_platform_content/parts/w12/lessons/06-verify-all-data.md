---
id: w12-l06
title: "Demo step 5 — verify all data on all nodes"
order: 6
duration_minutes: 25
xp: 75
kind: lesson
part: w12
proof:
  type: paste
  instructions: "Paste output showing all 100 keys verified on all 3 nodes (including the restarted old leader), with key counts for each node."
  regex_patterns:
    - "100"
    - "verified|match|pass|correct"
    - "restart|rejoin|catch.?up"
---
# Demo step 5 — verify all data on all nodes

## Concept

This is the most important verification step in the entire demo. You are going to check that every node in the cluster has exactly the same data. But there is a twist — you are also going to restart the old leader and make sure it catches up.

When the old leader comes back online, it is behind. It has keys 1-50 in its WAL from before it was killed, but it missed keys 51-100 which were written to the new leader. The old leader needs to discover who the current leader is, connect to it, and replicate the missing entries. This is called "log catch-up" — the returning node asks the leader for all the log entries it missed, applies them, and becomes a fully caught-up follower.

This is similar to what happens in C when you have a file that is partially written. If you open the file, seek to the end, and compare your position to the expected size, you know how much data is missing. The returning node does the same thing with its replication log — it checks its last log index, tells the leader, and the leader sends everything after that index.

After the old leader catches up, all 3 nodes should have identical data. This is the definition of consistency in a replicated system — every node agrees on the same state. If any node is missing a key, or has a different value for a key, something is broken.

## Task

1. Verify all 100 keys on the current leader — read keys 1-100, check values match
2. Verify all 100 keys on the surviving follower — same check
3. Restart the old leader process (same command as step 1, same data directory)
4. Wait for the old leader to connect to the current leader and start catching up
5. Watch the logs for catch-up replication messages — you should see entries being replicated
6. After catch-up completes, verify all 100 keys on the restarted node
7. Compare the key counts on all 3 nodes — all should be 100
8. Do a spot check: pick 5 random keys and verify the values match across all 3 nodes
9. Save all output to `demo_step5.log`

## Hints

- Restart the old leader with the same data directory so it loads its existing WAL: `./kv_node --id 1 --port 9001 --peers "localhost:9002,localhost:9003" --data-dir ./data/node1`
- The old leader should come back as a follower because it will see a higher term number from the current leader
- Catch-up might take a moment if there are many entries to replicate — watch the log for progress
- If the old leader does not catch up, check that your AppendEntries handler sends missing entries when the follower's log is behind
- For the spot check, pick keys like key1, key25, key50, key75, key100 and verify the values on all 3 ports
- A quick way to count keys: `for i in $(seq 1 100); do ./kv_client get "key$i" --port <port>; done 2>&1 | grep -c "value"` should print 100

## Verify

```bash
# Count keys on all 3 nodes
echo "Node 1 (restarted):"
for i in $(seq 1 100); do ./kv_client get "key$i" --port 9001; done 2>&1 | grep -c "value"

echo "Node 2 (current leader or follower):"
for i in $(seq 1 100); do ./kv_client get "key$i" --port 9002; done 2>&1 | grep -c "value"

echo "Node 3:"
for i in $(seq 1 100); do ./kv_client get "key$i" --port 9003; done 2>&1 | grep -c "value"

# Spot check: key50 on all nodes
./kv_client get "key50" --port 9001
./kv_client get "key50" --port 9002
./kv_client get "key50" --port 9003
```

Expected: all 3 nodes report 100 keys. Spot checks show identical values across all nodes.

## Done When

All 3 nodes (including the restarted old leader) have all 100 keys with correct values. The old leader successfully caught up by replicating the entries it missed. A spot check of several keys shows identical values on every node.
