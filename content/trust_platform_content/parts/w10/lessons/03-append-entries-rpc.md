---
id: w10-l03
title: "AppendEntries RPC"
order: 3
duration_minutes: 30
xp: 75
kind: lesson
part: w10
proof:
  type: paste
  instructions: "Paste output showing the leader sending an AppendEntries message and a follower receiving and applying it."
  regex_patterns:
    - "AppendEntries|append_entries|replicate"
    - "applied|received|ack|ACK"
---
# AppendEntries RPC

## Concept

Now you connect the leader to the followers. When the leader receives a write, it needs to send that write to every follower so they can apply it too. The message the leader sends is called AppendEntries. This name comes from the Raft consensus protocol, but the idea is simple: the leader says "here are some new entries (WAL records) — append them to your log."

Think of it like a C program where one process writes a struct to a pipe and another process reads it. You already have length-prefix framing from Week 2. You already have WAL records from Week 9. AppendEntries is just a new message type that wraps one or more WAL records and sends them over a TCP connection from the leader to a follower.

The AppendEntries message needs a few fields: a message type tag so the follower knows this is a replication message (not a client command), the WAL records to replicate (each record has a sequence number, a command type, a key, and a value), and optionally the leader's current commit index (the highest sequence number that has been committed). For now, focus on the records — you will add the commit index in the next lesson.

The follower receives the AppendEntries message, deserializes the WAL records, writes them to its own WAL file, and applies them to its in-memory hash map. Then it sends back an ACK to the leader so the leader knows the follower got them. The ACK is a small message: just the message type and the last sequence number the follower successfully wrote.

## Task

1. Define the AppendEntries message format — reuse your existing framing and serialization
2. Add a message type enum value: alongside your existing `PUT`, `GET`, `DELETE` types, add `APPEND_ENTRIES` and `APPEND_ENTRIES_ACK`
3. On the leader side: after writing a WAL record locally, serialize it into an AppendEntries message and send it to each follower
4. The leader needs a TCP connection to each follower — add a `--peers` flag: `--peers=9002,9003`
5. On the follower side: add a handler for `APPEND_ENTRIES` messages — write the records to the local WAL, apply to the hash map, send back an ACK
6. The follower needs to accept connections from the leader on a separate "replication port" or on the same port with message type routing

## Hints

- The simplest approach: the leader opens a persistent TCP connection to each follower at startup. Keep these connections alive — do not reconnect for every message
- Reuse your length-prefix framing: `[4-byte length][payload]`. The payload starts with a 1-byte message type, then the data
- For AppendEntries payload: `[type=APPEND_ENTRIES][num_records (4 bytes)][record1][record2]...`
- Each record: `[lsn (8 bytes)][cmd_type (1 byte)][key_len (4 bytes)][key][value_len (4 bytes)][value]`
- For the ACK payload: `[type=APPEND_ENTRIES_ACK][last_lsn (8 bytes)]`
- Handle connection failures gracefully — if a follower is not reachable, log a warning and continue. Do not crash the leader because one follower is down
- Use a `std::vector<int>` or `std::vector<TcpConnection>` to track follower connections on the leader

## Verify

```bash
# Terminal 1: start leader
./build/kvstore --port 9001 --data-dir ./node1 --role=leader --peers=9002,9003

# Terminal 2: start follower
./build/kvstore --port 9002 --data-dir ./node2 --role=follower --leader=9001

# Terminal 3: start follower
./build/kvstore --port 9003 --data-dir ./node3 --role=follower --leader=9001

# Terminal 4: write to leader, then read from follower
./build/kv_client --port 9001 put hello world
./build/kv_client --port 9002 get hello
```

Expected: writing to the leader on port 9001 makes the data appear on the follower on port 9002. The follower logs something like `"[replication] received AppendEntries, applied 1 record(s)"`.

## Done When

A `put` command sent to the leader is replicated to both followers via AppendEntries. Reading the same key from any follower returns the correct value.
