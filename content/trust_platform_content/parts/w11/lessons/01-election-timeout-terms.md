---
id: w11-l01
title: "Election timeout and terms"
order: 1
duration_minutes: 25
xp: 50
kind: lesson
part: w11
proof:
  type: paste
  instructions: "Paste log output showing a follower's election timeout firing and the current term number being printed."
  regex_patterns:
    - "timeout|election"
    - "term"
---
# Election timeout and terms

## Concept

Right now your replicated KV store has a fixed leader. You start node 1 as the leader and nodes 2 and 3 as followers. If the leader crashes, nothing happens — followers just sit there waiting forever. To fix this, you need two ideas: **terms** and **election timeouts**.

A **term** is a logical clock. Think of it like a generation counter in C — every time a new election starts, the term number goes up by one. Term 1 means "the first leader's reign." Term 2 means "someone called a new election." All nodes track the current term. When a node sees a message with a higher term than its own, it updates its term to match. Terms give you a simple way to tell which leader is newer: higher term wins.

An **election timeout** is a watchdog timer. Every follower sets a random timer between 150ms and 300ms. If the follower receives an AppendEntries heartbeat from the leader before the timer fires, it resets the timer. If the timer fires without hearing from the leader, the follower assumes the leader is dead and starts an election. The randomness is important — if all followers used the same timeout, they would all start elections at the same moment and split the vote. By randomizing, usually one follower times out first and wins before the others even start.

If you have written watchdog timers in embedded C, this is the same idea. The leader sends periodic heartbeats (empty AppendEntries messages). Each heartbeat resets the follower's watchdog. If the watchdog fires, something is wrong — time to elect a new leader.

## Task

1. Add a `current_term` field to your node state (start at term 0 or 1)
2. Add an `election_timeout_ms` field — set it to a random value between 150 and 300 on startup
3. In your main event loop, track the last time you received an AppendEntries from the leader
4. Each loop iteration, check: has more than `election_timeout_ms` passed since the last heartbeat? If yes, print a log message like `"election timeout fired, term=1"`
5. For now, just print the message — do not start the actual election yet (that comes in lesson 3)
6. Make the leader send empty AppendEntries heartbeats every 50ms so followers can reset their timers

## Hints

- Use `std::chrono::steady_clock::now()` to track time — do not use `time()` from C, it only has second-level resolution
- For the random timeout: `std::mt19937 rng(node_id);` and `std::uniform_int_distribution<int> dist(150, 300);` — seed with node_id so each node gets a different value
- Re-randomize the timeout every time it fires or every time you reset it — this prevents repeated collisions
- The leader does not need an election timeout — only followers do
- Store `last_heartbeat_time` as a `std::chrono::steady_clock::time_point`

## Verify

```bash
# Start 3 nodes — make the leader NOT send heartbeats (or start only followers)
# to see the election timeout fire
./build/kvstore --id 2 --port 9002 --peers 9001,9003 --role follower

# Wait 300ms+ and check the log output
```

Expected: the follower prints something like `"[node 2] election timeout fired at term 1"` within a few hundred milliseconds.

## Done When

Each follower has a randomized election timeout. When no heartbeats arrive, the timeout fires and a log message is printed showing the current term.
