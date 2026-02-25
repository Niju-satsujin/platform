---
id: w10-l06
title: "Partition behavior"
order: 6
duration_minutes: 25
xp: 50
kind: lesson
part: w10
proof:
  type: paste
  instructions: "Paste output showing: writes succeed with one follower down, then the reconnected follower catches up and has all data."
  regex_patterns:
    - "partition|disconnect|reconnect"
    - "catch.up|caught up|synced"
---
# Partition behavior

## Concept

A network partition happens when one node cannot reach the others. Maybe the network cable was unplugged, maybe the process crashed, maybe the OS killed it. Whatever the reason, the leader tries to send AppendEntries to that follower and the connection fails.

What should the leader do? Crash? No. Stop accepting writes? No (as long as quorum is still reachable). The leader keeps going. It logs a warning like "follower on port 9003 is unreachable" and stops sending to that follower. Writes still commit because quorum only needs 2 of 3 nodes. The leader and the remaining follower are enough.

In C terms, you have dealt with this before. When `write()` or `send()` returns an error on a socket, you close that socket and clean up. Same thing here — except you also keep track of the follower so you can reconnect later. You do not remove the follower from your peer list. You mark it as "disconnected" and periodically try to reconnect.

When the partitioned follower comes back (you restart it, or the network recovers), it reconnects to the leader and sends its `FOLLOWER_HELLO` with its last LSN. The leader sees that this follower is behind and sends all the missing records. The follower catches up, and from that point on it receives new writes in real time again. This is the same catch-up mechanism you built in the previous lesson — partition recovery is just catch-up after a disconnect.

## Task

1. Make the leader handle follower disconnection gracefully — catch connection errors when sending AppendEntries
2. When a follower connection fails, mark it as "disconnected" in the leader's peer list
3. The leader should periodically try to reconnect to disconnected followers (every 5 seconds)
4. When a follower reconnects, the normal catch-up handshake runs automatically
5. Test the full partition scenario: disconnect a follower, write data, reconnect, verify catch-up

## Hints

- When `send()` fails with `EPIPE`, `ECONNRESET`, or similar: close the socket, set the peer's state to `DISCONNECTED`
- Add a reconnection timer: every 5 seconds, try `connect()` to each disconnected peer
- When the reconnection succeeds, the follower sends `FOLLOWER_HELLO` as part of the normal startup flow
- Keep your leader's main loop using `poll()` — add the reconnection timer alongside your existing event handling
- For testing: simply Ctrl+C the follower process to simulate a partition. Then restart it to simulate recovery
- Log clearly: `"[leader] follower 9003 disconnected"`, `"[leader] reconnecting to 9003..."`, `"[leader] follower 9003 reconnected, sending catch-up"`

## Verify

```bash
# Start all 3 nodes
./build/kvstore --port 9001 --data-dir ./node1 --role=leader --peers=9002,9003
./build/kvstore --port 9002 --data-dir ./node2 --role=follower --leader=9001
./build/kvstore --port 9003 --data-dir ./node3 --role=follower --leader=9001

# Write 5 keys (all 3 nodes in sync)
for i in $(seq 1 5); do
  ./build/kv_client --port 9001 put "before$i" "val$i"
done

# Kill follower 2 (Ctrl+C on terminal 3)

# Write 5 more keys (only leader + follower 1)
for i in $(seq 1 5); do
  ./build/kv_client --port 9001 put "during$i" "val$i"
done

# Restart follower 2
./build/kvstore --port 9003 --data-dir ./node3 --role=follower --leader=9001

# Wait a few seconds, then verify catch-up
./build/kv_client --port 9003 get during1
./build/kv_client --port 9003 get during5
```

Expected: follower 2 catches up after reconnecting. Both `during1` and `during5` return correct values from follower 2.

## Done When

A follower can be disconnected and reconnected. After reconnection, it automatically catches up on all missed writes. The leader continues accepting writes during the partition as long as quorum is met.
