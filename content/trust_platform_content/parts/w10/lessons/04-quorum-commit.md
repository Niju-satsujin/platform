---
id: w10-l04
title: "Quorum commit"
order: 4
duration_minutes: 30
xp: 75
kind: lesson
part: w10
proof:
  type: paste
  instructions: "Paste leader output showing it waits for a quorum ACK before responding to the client, including the quorum count."
  regex_patterns:
    - "quorum|majority"
    - "committed|commit"
---
# Quorum commit

## Concept

Right now your leader sends AppendEntries to followers and immediately tells the client "OK, your write is done." But what if the AppendEntries message never reaches the followers? The client thinks the data is safe, but only the leader has it. If the leader crashes, the data is gone.

The fix is quorum commit. The leader does not respond to the client until a majority of nodes have the data. With 3 nodes, a majority (quorum) is 2. The leader counts itself as one, so it needs at least one follower ACK before it tells the client the write succeeded. The flow is: (1) client sends `put`, (2) leader writes to its own WAL, (3) leader sends AppendEntries to both followers, (4) leader waits for at least 1 ACK, (5) leader responds to client.

In C terms, think of it as a barrier. You have 3 workers and you wait until 2 of them finish before continuing. The formula is: `quorum = (num_nodes / 2) + 1`. For 3 nodes: `(3 / 2) + 1 = 2`. For 5 nodes: `(5 / 2) + 1 = 3`. The leader always counts itself, so it needs `quorum - 1` ACKs from followers.

What if one follower is slow or down? The leader still commits because it has itself plus the one fast follower — that is 2 out of 3, which meets the quorum. The slow follower will catch up later. This is the beauty of quorum-based replication: you tolerate failures without blocking.

## Task

1. After the leader sends AppendEntries to all followers, wait for ACKs before responding to the client
2. Track how many ACKs you have received for the current write: start at 1 (the leader itself counts)
3. When an ACK comes back from a follower, increment the count
4. When the count reaches quorum (`(num_nodes / 2) + 1`), respond to the client with success
5. Add a timeout — if quorum is not reached within 5 seconds, respond with an error
6. Log the quorum progress: `"[commit] quorum reached: 2/3 nodes committed LSN 42"`

## Hints

- The simplest approach: after writing to the local WAL, send AppendEntries to all followers, then loop reading ACKs from the follower connections until you have enough
- Use `poll()` or `select()` to wait on multiple follower connections with a timeout
- You can track pending commits in a `std::unordered_map<uint64_t, int>` — map from LSN to ACK count
- The timeout prevents the leader from hanging forever if followers are down: `if (elapsed > 5000ms) return error("quorum timeout");`
- For now, process one write at a time (no pipelining). This is simpler. You can optimize later
- The quorum calculation: `int quorum = (num_nodes / 2) + 1;` and `int acks_needed = quorum - 1;` (subtract 1 because the leader already wrote)

## Verify

```bash
# Start all 3 nodes as before

# Write to leader
./build/kv_client --port 9001 put qkey qvalue

# Check leader log for quorum message
# Expected: "[commit] quorum reached: 2/3 nodes committed LSN ..."

# Now stop one follower (Ctrl+C on terminal 3)
# Write to leader again — should still succeed (2 of 3 = quorum)
./build/kv_client --port 9001 put qkey2 qvalue2

# Stop the second follower (Ctrl+C on terminal 2)
# Write to leader — should timeout (only 1 of 3 = no quorum)
./build/kv_client --port 9001 put qkey3 qvalue3
# Expected: timeout or error message
```

Expected: writes succeed as long as 2 of 3 nodes are up. When only the leader is up, writes fail because quorum cannot be reached.

## Done When

The leader waits for quorum ACKs before confirming a write to the client. Writes succeed with 2 of 3 nodes up and fail with only 1 of 3 nodes up.
