---
id: w10-l02
title: "Leader and follower roles"
order: 2
duration_minutes: 25
xp: 50
kind: lesson
part: w10
proof:
  type: paste
  instructions: "Paste output showing the leader accepting a put command and a follower rejecting a put command with a redirect or error message."
  regex_patterns:
    - "leader|LEADER"
    - "follower|FOLLOWER|redirect|read.only"
---
# Leader and follower roles

## Concept

In a replicated system, not every node does the same job. One node is the leader and the rest are followers. The leader is the only node that accepts write commands — `put` and `delete`. The followers are read-only copies. If a client sends a write to a follower, the follower rejects it or redirects the client to the leader.

If you have used C programs that follow a master/worker pattern — where one process coordinates and the others do work — this is the same idea. The leader coordinates all writes and makes sure every follower gets a copy. The followers just apply what the leader tells them.

Why not let every node accept writes? Because then two clients could write different values for the same key at the same time on different nodes, and the nodes would disagree about what the key contains. This is called a conflict. By funneling all writes through one leader, you avoid conflicts entirely. The leader decides the order of operations and every follower applies them in that same order.

For now the role is set at startup with a command-line flag. You pass `--role=leader` or `--role=follower`. Later in more advanced systems the nodes elect a leader automatically, but fixed roles are simpler and good enough for this week.

## Task

1. Add a `Role` enum to your KV store: `enum class Role { LEADER, FOLLOWER };`
2. Add a `--role=leader` or `--role=follower` command-line flag
3. Store the role in your server's state
4. When the role is `FOLLOWER`, reject `put` and `delete` commands — return an error message like `"ERR read-only: this node is a follower"`
5. When the role is `LEADER`, handle `put`, `get`, and `delete` as before
6. Both roles handle `get` normally — followers can always serve reads
7. Log the role at startup: `"[node] starting as LEADER on port 9001"`

## Hints

- Parse the `--role` flag alongside `--port` and `--data-dir`
- In your command handler, check the role before executing a write: `if (role_ == Role::FOLLOWER) { return error("read-only"); }`
- Use `std::string` comparison: `if (role_arg == "leader") role = Role::LEADER;`
- A good error message tells the client where the leader is: `"ERR read-only, leader is on port 9001"` — this requires adding a `--leader` flag to followers
- Keep it simple — do not over-engineer. An enum and an if-check is all you need right now

## Verify

```bash
# Terminal 1: start leader
./build/kvstore --port 9001 --data-dir ./node1 --role=leader

# Terminal 2: start follower
./build/kvstore --port 9002 --data-dir ./node2 --role=follower

# Terminal 3: test
./build/kv_client --port 9001 put testkey testvalue   # should succeed
./build/kv_client --port 9001 get testkey              # should return "testvalue"
./build/kv_client --port 9002 get testkey              # no data yet (replication not implemented)
./build/kv_client --port 9002 put testkey testvalue    # should fail with "read-only" error
```

Expected: leader accepts writes, follower rejects writes with a clear error message.

## Done When

The leader node accepts all commands. Follower nodes accept `get` but reject `put` and `delete` with a clear error message indicating the node is read-only.
