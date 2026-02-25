---
id: w12-l04
title: "Demo step 3 — observe the election"
order: 4
duration_minutes: 20
xp: 50
kind: lesson
part: w12
proof:
  type: paste
  instructions: "Paste the election log output showing: term increment, vote request sent, vote granted, and new leader announced."
  regex_patterns:
    - "term|Term"
    - "vote|Vote"
    - "leader|elected"
---
# Demo step 3 — observe the election

## Concept

After the followers detect the leader is gone, one of them starts an election. This is the Raft leader election protocol you implemented in Week 11. The sequence should be:

1. A follower's election timeout fires
2. That follower increments its term number (e.g., from term 1 to term 2)
3. It transitions from follower to candidate
4. It votes for itself
5. It sends RequestVote messages to the other node(s)
6. The other follower grants its vote (because the candidate's log is at least as up-to-date)
7. The candidate receives a majority of votes (2 out of 3 nodes, since one is dead)
8. The candidate becomes the new leader
9. The new leader sends a heartbeat to announce itself

This whole sequence should happen within a second or two. The logs should show each step clearly. If your logs are not detailed enough, this is a good time to add more logging — you want the demo to tell a clear story.

In C terms, this is like watching a state machine transition through states: FOLLOWER -> CANDIDATE -> LEADER. Each transition should produce a log line. If you think of your node as a `struct` with a `state` field, each time the state changes you should print it.

The term number is important. Every message in your system carries a term number. When a node sees a higher term, it knows a new election has happened. This prevents stale leaders from causing confusion — similar to how sequence numbers prevent old packets from being accepted in TCP.

## Task

1. Watch the follower terminals right after killing the leader (this follows directly from the previous step)
2. Identify which follower becomes the candidate first
3. In the logs, find and mark these events:
   - Election timeout fired
   - Term incremented (from N to N+1)
   - Transitioned to candidate state
   - Voted for self
   - Sent RequestVote to peer
   - Received vote granted from peer
   - Won election with majority
   - Transitioned to leader state
   - Sent first heartbeat as new leader
4. Note the time from election timeout to leader announcement — this is your election time
5. Save the relevant log output to `demo_step3.log`
6. Verify the new leader is accepting connections by doing a simple read

## Hints

- The election might happen very fast — within 10-50ms after the timeout fires
- If both followers start an election at the same time (split vote), the term increments again and one wins in the next round — this is normal Raft behavior
- Look for log lines containing words like "candidate", "vote", "granted", "elected", "leader"
- If you do not see enough detail, add more logging to your election code and restart the demo
- The new leader's first action should be sending heartbeats to establish authority

## Verify

```bash
# Check that exactly one node reports being leader
grep -c "became leader\|elected as leader\|state.*leader" data/node2/node.log data/node3/node.log

# Do a test read to confirm the new leader is working
./kv_client get "key1" --port 9002
# or
./kv_client get "key1" --port 9003
```

Expected: exactly one of the two surviving nodes reports becoming leader. A test read returns "value1" confirming the new leader has the data.

## Done When

The logs clearly show the full election sequence: timeout, term increment, vote request, vote granted, leader elected. You know which node is the new leader, and a test read confirms it is working with the existing data.
