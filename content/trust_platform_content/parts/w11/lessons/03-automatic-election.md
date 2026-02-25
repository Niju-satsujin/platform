---
id: w11-l03
title: "Automatic election"
order: 3
duration_minutes: 30
xp: 75
kind: lesson
part: w11
proof:
  type: paste
  instructions: "Paste log output showing: follower timeout, candidate state, votes collected, leader elected, first heartbeat sent."
  regex_patterns:
    - "candidate|election"
    - "elected|leader|won"
    - "heartbeat|AppendEntries"
---
# Automatic election

## Concept

Now you put the pieces together. You have election timeouts (lesson 1) and vote rules (lesson 2). The full election flow is a state machine with three states: **follower**, **candidate**, and **leader**.

A node starts as a follower. It listens for heartbeats from the leader. If the election timeout fires, it transitions to candidate. As a candidate, it increments its term, votes for itself, and sends RequestVote messages to all other nodes. Then it waits. Three things can happen: (1) it receives votes from a majority of nodes and becomes the leader, (2) it receives an AppendEntries from a node with an equal or higher term, meaning someone else won — it goes back to follower, (3) the election timeout fires again with no winner — it starts a new election with an even higher term. Once a node becomes leader, it immediately sends an AppendEntries heartbeat to all followers to establish authority and prevent further elections.

The majority rule is what makes this safe. In a 3-node cluster, a candidate needs 2 votes to win (including its own self-vote). In a 5-node cluster, it needs 3. Because a majority is always more than half, two different candidates cannot both win in the same term — there are not enough votes for both. This is the same math behind quorum writes from last week.

One tricky detail: when a candidate starts an election, it resets its own election timeout. If it does not win before the new timeout fires, it starts another election with term+1. The randomized timeout means that eventually one candidate will time out earlier than the others and win cleanly. In practice, elections resolve within a few hundred milliseconds.

## Task

1. Add a `role` field to your node state with values: `FOLLOWER`, `CANDIDATE`, `LEADER`
2. Implement the follower-to-candidate transition:
   - Increment `current_term`
   - Set `voted_for = self_id` (vote for yourself)
   - Set `role = CANDIDATE`
   - Reset election timeout to a new random value
   - Send `RequestVote` to all peers
3. Implement vote counting:
   - Track how many votes you received (start at 1 because you voted for yourself)
   - When a `VoteResponse` arrives with `vote_granted = true`, increment the count
   - If count >= majority (total_nodes / 2 + 1), become leader
4. Implement the candidate-to-leader transition:
   - Set `role = LEADER`
   - Immediately send an AppendEntries heartbeat to all peers
   - Start the heartbeat timer (send heartbeats every 50ms)
5. Implement the candidate-to-follower fallback:
   - If you receive an AppendEntries with term >= your term, step down to follower
   - If you receive a RequestVote with a higher term, step down to follower
6. Log every state transition: `"[node X] became candidate for term Y"`, `"[node X] elected leader for term Y"`, `"[node X] stepped down to follower, term Y"`

## Hints

- Use an enum for roles: `enum class Role { FOLLOWER, CANDIDATE, LEADER };`
- Majority in a 3-node cluster is 2, in a 5-node cluster is 3. Formula: `(num_nodes / 2) + 1`
- When you become leader, clear `voted_for` — it is only used during elections
- The heartbeat interval (50ms) must be much shorter than the election timeout (150-300ms). If heartbeats are too slow, followers will keep timing out and starting elections
- If two candidates split the vote (neither gets a majority), both will time out and try again. The randomized timeout makes this resolve quickly
- Test with 3 nodes first. Kill the leader and watch the logs — you should see one follower become candidate, collect votes, and become leader

## Verify

```bash
# Terminal 1: start node 1 as leader
./build/kvstore --id 1 --port 9001 --peers 9002,9003

# Terminal 2: start node 2
./build/kvstore --id 2 --port 9002 --peers 9001,9003

# Terminal 3: start node 3
./build/kvstore --id 3 --port 9003 --peers 9001,9002

# Terminal 4: kill the leader
kill $(pgrep -f "kvstore --id 1")

# Watch terminals 2 and 3 — one should print:
# "election timeout fired"
# "became candidate for term 2"
# "received vote from node X"
# "elected leader for term 2"
# "sending heartbeat"
```

Expected: within 500ms of killing the leader, a new leader is elected and starts sending heartbeats.

## Done When

Killing the leader causes an automatic election. One follower becomes candidate, collects a majority of votes, becomes leader, and starts sending heartbeats. The other follower recognizes the new leader. No manual intervention needed.
