---
id: w11-quest
title: "Week 11 Boss: Automatic Failover"
part: w11
kind: boss
proof:
  type: paste
  instructions: "Paste output showing: leader killed, election happens, new leader elected, writes continue."
  regex_patterns:
    - "election|elected|new leader"
    - "write|put"
---
# Week 11 Boss: Automatic Failover

## Goal

Prove your replicated KV store survives leader failure: the leader dies, an election happens, a new leader takes over, and clients can write to the new leader without data loss.

## Requirements

1. **Start a 3-node cluster** — one leader, two followers, all connected and replicating
2. **Write some data** — put at least 3 key-value pairs through the leader
3. **Kill the leader** — send SIGTERM or SIGKILL to the leader process
4. **Election happens** — within 500ms, one of the followers becomes a candidate and wins the election
5. **New leader accepts writes** — put at least 2 more key-value pairs through the new leader
6. **Data is intact** — read all 5 keys from a follower, all values are correct
7. **Idempotent retry** — send a duplicate write (same client_id + seq_num), verify the server returns the cached result without applying it twice
8. **Stale leader** — if the old leader comes back, it sees a higher term and steps down to follower

## Verify

```bash
# Terminal 1: start node 1 (initial leader)
./build/kvstore --id 1 --port 9001 --peers 9002,9003

# Terminal 2: start node 2
./build/kvstore --id 2 --port 9002 --peers 9001,9003

# Terminal 3: start node 3
./build/kvstore --id 3 --port 9003 --peers 9001,9002

# Terminal 4: write data, kill leader, write more data
./build/kv_client --port 9001 put key1 value1
./build/kv_client --port 9001 put key2 value2
./build/kv_client --port 9001 put key3 value3
kill $(pgrep -f "kvstore --id 1")
sleep 1
# find new leader port from logs, then:
./build/kv_client --port <new_leader_port> put key4 value4
./build/kv_client --port <new_leader_port> put key5 value5
./build/kv_client --port <new_leader_port> get key1
./build/kv_client --port <new_leader_port> get key5
```

## Done When

Leader is killed, election completes, new leader is elected, writes continue on the new leader, and all data (old and new) is readable from followers.
