---
id: w11-l05
title: "Stale leader fencing"
order: 5
duration_minutes: 25
xp: 50
kind: lesson
part: w11
proof:
  type: paste
  instructions: "Paste log output showing a stale leader receiving a higher term and stepping down to follower."
  regex_patterns:
    - "step.*down|stepping down|became follower"
    - "higher term|term.*>"
---
# Stale leader fencing

## Concept

There is a dangerous scenario you need to handle. Imagine node 1 is the leader in term 1. A network partition cuts node 1 off from nodes 2 and 3. Nodes 2 and 3 do not hear heartbeats, so they hold an election. Node 2 wins and becomes the leader of term 2. Now you have two nodes that think they are the leader: node 1 (term 1, partitioned) and node 2 (term 2, connected to node 3). If a client sends a write to node 1, and node 1 accepts it, that write will never be replicated to the majority — node 1 can only reach itself. Meanwhile, node 2 is accepting writes and replicating them to node 3 normally.

When the network heals and node 1 reconnects, it will receive an AppendEntries or RequestVote message from the new term (term 2). At this point, node 1 must **step down**. It sees that the term in the incoming message is higher than its own term, which means a new election happened and someone else won. Node 1 updates its term to 2, sets its role to follower, and stops accepting writes. Any writes it accepted while partitioned (that were not replicated to a majority) are effectively rolled back.

The rule is simple: **any time you see a message with a term higher than your own, update your term and become a follower.** And the reverse: **any time you receive a message with a term lower than your own, reject it.** A message from term 1 arriving at a node in term 2 is stale — ignore it. This is called "fencing" because you are fencing off the old leader, preventing it from doing damage.

## Task

1. Add term checking to every message handler (AppendEntries, RequestVote, and their responses):
   - If the message's term is greater than your current term: update your term, set role to FOLLOWER, reset voted_for to -1
   - If the message's term is less than your current term: reject the message (send a response with success=false)
   - If the terms are equal: process normally
2. When the leader receives a response to AppendEntries with a higher term, it must step down
3. When a candidate receives a VoteResponse with a higher term, it must step down
4. Log every step-down: `"[node X] stepping down: saw term Y > my term Z"`
5. When the leader steps down, stop sending heartbeats and start the election timeout
6. Reject client write requests if you are not the leader — return an error like `"not leader, try node Y"`

## Hints

- Create a helper function `check_term(incoming_term)` that handles the step-down logic. Call it at the start of every message handler
- The step-down function should: set `current_term = incoming_term`, set `role = FOLLOWER`, set `voted_for = -1`, reset election timeout
- For rejecting stale messages, check the term first before doing anything else in the handler
- When a leader steps down, it should redirect clients to the new leader if it knows who won. Store `leader_id` and update it when you see a valid AppendEntries from a new leader
- Test this by starting a leader, partitioning it (just stop sending heartbeats to it), letting an election happen, then reconnecting. The old leader should step down

## Verify

```bash
# Start 3 nodes, node 1 is leader in term 1
./build/kvstore --id 1 --port 9001 --peers 9002,9003
./build/kvstore --id 2 --port 9002 --peers 9001,9003
./build/kvstore --id 3 --port 9003 --peers 9001,9002

# Kill node 1's network (or just kill the process)
kill $(pgrep -f "kvstore --id 1")

# Wait for election — node 2 or 3 becomes leader in term 2
# Restart node 1
./build/kvstore --id 1 --port 9001 --peers 9002,9003

# Watch node 1's log — it should show:
# "stepping down: saw term 2 > my term 1"
# "became follower"
```

Expected: the restarted node 1 sees a higher term from the new leader's heartbeats and steps down to follower immediately.

## Done When

A stale leader (or any node with an outdated term) steps down to follower when it sees a higher term. Messages from lower terms are rejected. The system never has two active leaders accepting writes in the same term.
