---
id: w12-l02
title: "Demo step 1 — write to leader"
order: 2
duration_minutes: 20
xp: 50
kind: lesson
part: w12
proof:
  type: paste
  instructions: "Paste the output showing 3 nodes started, leader elected, and 50 key-value pairs written and verified on the leader."
  regex_patterns:
    - "leader|Leader"
    - "key50|key 50|50.*written|50.*stored"
---
# Demo step 1 — write to leader

## Concept

This is the first real step of your demo. You start 3 nodes, wait for one to become leader, write 50 key-value pairs to the leader, and verify they are all there.

Starting 3 nodes means opening 3 terminal windows (or using a tool like tmux to split one terminal). Each node needs its own port, its own data directory, and a list of peer addresses so it knows where the other nodes are. This is similar to starting 3 separate C programs that talk to each other — except your programs use the replication protocol you built in Weeks 10-11.

The 50 writes are the baseline data. Later, when you kill the leader and elect a new one, you need to verify these 50 keys survived. If you skip verification here, you will not know whether a missing key was lost during the crash or was never written in the first place.

Think of this step as setting up the "before" picture. You want clear proof that the system was working correctly before you break it.

## Task

1. Open 3 terminals (or use tmux with 3 panes)
2. Start node 1 on port 9001 with peers 9002 and 9003
3. Start node 2 on port 9002 with peers 9001 and 9003
4. Start node 3 on port 9003 with peers 9001 and 9002
5. Wait for the initial leader election — watch the logs for "elected as leader" or similar
6. Note which node became leader (you will need this in the next lesson)
7. Write 50 key-value pairs to the leader: keys "key1" through "key50" with values "value1" through "value50"
8. Read back all 50 keys from the leader and verify they are correct
9. Read back all 50 keys from each follower to verify replication worked
10. Save the terminal output to a file: `demo_step1.log`

## Hints

- If your nodes take command-line flags, something like: `./kv_node --id 1 --port 9001 --peers "localhost:9002,localhost:9003" --data-dir ./data/node1`
- For bulk writes, a bash loop works: `for i in $(seq 1 50); do ./kv_client put "key$i" "value$i" --port 9001; done`
- For bulk reads and verification: `for i in $(seq 1 50); do ./kv_client get "key$i" --port 9001; done | grep -c "value"` — the count should be 50
- If a follower is missing some keys, give it a moment — replication might still be in progress
- Redirect output to a log file: `./kv_client get "key1" --port 9001 2>&1 | tee -a demo_step1.log`

## Verify

```bash
# Check that all 50 keys are on the leader
for i in $(seq 1 50); do ./kv_client get "key$i" --port 9001; done 2>&1 | grep -c "value"
# Expected: 50

# Check that all 50 keys are on follower 1
for i in $(seq 1 50); do ./kv_client get "key$i" --port 9002; done 2>&1 | grep -c "value"
# Expected: 50

# Check that all 50 keys are on follower 2
for i in $(seq 1 50); do ./kv_client get "key$i" --port 9003; done 2>&1 | grep -c "value"
# Expected: 50
```

## Done When

All 3 nodes are running, one is the leader, 50 key-value pairs are written, and all 3 nodes return all 50 keys with correct values. You have the output saved in a log file.
