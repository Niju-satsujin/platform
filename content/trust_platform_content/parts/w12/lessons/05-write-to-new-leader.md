---
id: w12-l05
title: "Demo step 4 — write to new leader"
order: 5
duration_minutes: 20
xp: 50
kind: lesson
part: w12
proof:
  type: paste
  instructions: "Paste output showing 50 new keys (key51-key100) written to the new leader and replicated to the surviving follower."
  regex_patterns:
    - "key100|key 100|100.*written|100.*stored"
    - "replicated|follower"
---
# Demo step 4 — write to new leader

## Concept

The new leader is elected. Now you prove it actually works as a leader — it accepts writes and replicates them. This is the moment that proves your system is truly fault-tolerant. The old leader is dead, but the cluster continues to serve reads and writes without any manual intervention.

This step is almost identical to step 1, but with an important difference: you are writing to a different node. Your client needs to connect to the new leader's port, not the old one. In a production system, clients would discover the new leader automatically through a redirect or a service discovery mechanism. For your demo, you just change the port number in your commands.

You are writing keys 51-100 now. This means after this step, the cluster has 100 total keys: the first 50 from before the crash, and 50 new ones written to the new leader. The surviving follower should have all 100 keys — the first 50 from replication before the crash, and the new 50 from replication after the election.

Think of it like a C program where you have two arrays. The first array was filled before a function pointer changed (the leader changed). The second array is being filled after. Both arrays need to end up in the same place — the follower's data store.

## Task

1. Identify the new leader's port number from the previous step
2. Write 50 new key-value pairs to the new leader: keys "key51" through "key100" with values "value51" through "value100"
3. Read back keys 51-100 from the new leader — verify all 50 are present
4. Read back keys 1-50 from the new leader — verify the old data is still there
5. Read back all 100 keys from the surviving follower — verify replication works
6. Count the total keys on each live node — both should report 100
7. Save the output to `demo_step4.log`

## Hints

- Change the port in your write loop to point to the new leader: `for i in $(seq 51 100); do ./kv_client put "key$i" "value$i" --port <new_leader_port>; done`
- If the new leader rejects writes, check that it has fully transitioned to leader state — it should be sending heartbeats
- If the follower is missing some of the new keys, check the replication logs — there might be a connection issue between the new leader and the follower
- The follower should have all 100 keys: 50 from the old leader and 50 from the new leader
- If you see keys from the old leader missing on the new leader, check your WAL replay — the new leader should have loaded its WAL on startup

## Verify

```bash
# Write keys 51-100 to new leader (example: port 9002)
for i in $(seq 51 100); do ./kv_client put "key$i" "value$i" --port 9002; done

# Verify all 100 keys on new leader
for i in $(seq 1 100); do ./kv_client get "key$i" --port 9002; done 2>&1 | grep -c "value"
# Expected: 100

# Verify all 100 keys on follower
for i in $(seq 1 100); do ./kv_client get "key$i" --port 9003; done 2>&1 | grep -c "value"
# Expected: 100
```

## Done When

50 new keys are written to the new leader. Both the new leader and the surviving follower have all 100 keys (1-100) with correct values. Replication is confirmed working after the election.
