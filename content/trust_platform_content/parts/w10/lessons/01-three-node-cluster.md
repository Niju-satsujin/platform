---
id: w10-l01
title: "Three-node cluster"
order: 1
duration_minutes: 25
xp: 50
kind: lesson
part: w10
proof:
  type: paste
  instructions: "Paste the output showing all 3 KV store instances running on ports 9001, 9002, 9003."
  regex_patterns:
    - "9001|9002|9003"
    - "listening|started|ready"
---
# Three-node cluster

## Concept

A cluster is a group of machines (or processes) that work together as one system. In your case the cluster is three copies of your KV store running at the same time. Each copy is called a node. The nodes talk to each other over the network using the same TCP sockets you already know.

Why three nodes and not two? Because of voting. Later this week you will need a majority of nodes to agree before a write is confirmed. With two nodes, a majority is two — so both must be up. That is no better than one node. With three nodes, a majority is two — so you can lose one node and the system keeps working. Odd numbers give you a useful majority. This is why real systems use 3, 5, or 7 nodes.

For now you are running all three nodes on one machine, just on different ports. In C terms, think of it as calling `fork()` three times and each child binds to a different port. You are not actually forking — you just open three terminal windows and start the same program with different port numbers. Each instance has its own WAL file and its own data directory.

The key setup detail is that each node needs to know about the other nodes. The leader needs to know the follower addresses so it can send them data. The followers need to know the leader address so they can connect. You pass this information as command-line flags.

## Task

1. Make your KV store accept a `--port` flag (you probably already have this from earlier weeks)
2. Add a `--data-dir` flag so each instance uses a separate directory for its WAL and data files
3. Open 3 terminal windows
4. Start instance 1: `./build/kvstore --port 9001 --data-dir ./node1`
5. Start instance 2: `./build/kvstore --port 9002 --data-dir ./node2`
6. Start instance 3: `./build/kvstore --port 9003 --data-dir ./node3`
7. Verify each instance starts, listens, and can accept a client connection independently

## Hints

- Use a simple argument parser — loop over `argv` and check for `--port` and `--data-dir`
- Create the data directory if it does not exist: use `std::filesystem::create_directories()`
- Each node should log its port at startup: `"[node] listening on port 9001"`
- For the WAL file, use `data_dir + "/wal.bin"` instead of a hardcoded path
- Test each node independently first — just connect with your client and do a `put` / `get`

## Verify

```bash
# Terminal 1
./build/kvstore --port 9001 --data-dir ./node1

# Terminal 2
./build/kvstore --port 9002 --data-dir ./node2

# Terminal 3
./build/kvstore --port 9003 --data-dir ./node3

# Terminal 4: test each node
./build/kv_client --port 9001 put key1 value1
./build/kv_client --port 9001 get key1
./build/kv_client --port 9002 put key2 value2
./build/kv_client --port 9002 get key2
./build/kv_client --port 9003 put key3 value3
./build/kv_client --port 9003 get key3
```

Expected: each node runs independently. A key written to one node is NOT visible on the others (that is expected — replication comes later).

## Done When

Three KV store instances run simultaneously on ports 9001, 9002, and 9003, each with its own data directory, and each responds to client requests independently.
