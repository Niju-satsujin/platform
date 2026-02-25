---
id: w12-l03
title: "Demo step 2 — kill the leader"
order: 3
duration_minutes: 20
xp: 50
kind: lesson
part: w12
proof:
  type: paste
  instructions: "Paste the follower log output showing heartbeat timeout detection after the leader was killed."
  regex_patterns:
    - "timeout|timed out|no heartbeat"
    - "kill|SIGTERM|stopped|terminated"
---
# Demo step 2 — kill the leader

## Concept

This is the dramatic moment of the demo. You kill the leader on purpose and watch what happens. In a real system, the leader might crash because of a hardware failure, a kernel panic, or an out-of-memory kill. Your system should handle all of these the same way — the followers notice the leader is gone and start an election.

In C, when a process dies, its sockets close. The other side of each socket gets an error on the next read — either `read()` returns 0 (clean close) or -1 with `ECONNRESET` (dirty close). Your follower nodes should be checking for these conditions already from the replication protocol you built.

But your followers do not rely only on socket errors. They also have an election timeout — a timer that fires if the follower has not received a heartbeat from the leader within a certain time (typically 150-300ms). When this timer fires, the follower knows the leader might be dead and starts an election. This is the Raft approach, and it works even if the network partitions without closing the socket cleanly.

The key thing to watch in this step is the follower logs. You should see something like: "heartbeat timeout — no message from leader in 300ms" or "election timeout fired, becoming candidate." This is the trigger for everything that follows.

## Task

1. Identify the leader process from step 1 (note the PID or terminal)
2. Kill the leader with SIGTERM: `kill <pid>` or press Ctrl+C in the leader's terminal
3. Immediately watch the follower logs in the other two terminals
4. Look for messages about heartbeat timeout or leader disconnection
5. Note the timestamp when the leader was killed and the timestamp when followers detected it
6. Calculate the detection time (should be within your election timeout, e.g., 150-300ms)
7. Save the follower log output to `demo_step2.log`

## Hints

- To find the leader PID: `ps aux | grep kv_node` or `pgrep kv_node`
- SIGTERM is cleaner than SIGKILL — it lets the process handle the signal, but for this demo either works since you are simulating a crash
- If you use Ctrl+C, that sends SIGINT which is fine too
- The followers should detect the leader is gone within one election timeout period
- If the followers do not log anything about the leader being gone, check that your election timeout timer is running
- Keep the leader's terminal open — you will see the shutdown message, which is useful for the demo

## Verify

```bash
# Check that the leader process is gone
pgrep -f "kv_node.*--id 1" || echo "leader process is dead"

# Check follower logs for timeout detection
grep -i "timeout\|heartbeat\|leader.*down\|election" data/node2/node.log
grep -i "timeout\|heartbeat\|leader.*down\|election" data/node3/node.log
```

Expected: the leader process is no longer running. Follower logs show heartbeat timeout detection within 300ms of the kill.

## Done When

The leader process is dead. Both follower logs show that they detected the leader is gone (heartbeat timeout or connection error). You have the timestamps showing detection happened within the election timeout window.
