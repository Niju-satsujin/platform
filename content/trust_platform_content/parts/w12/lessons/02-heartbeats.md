---
id: w12-l02
title: "Heartbeats"
order: 2
type: lesson
duration_min: 45
---

# Heartbeats

## Goal

Implement [AppendEntries](https://raft.github.io/raft.pdf) heartbeats so the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) proves it is alive and prevents [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) from starting unnecessary [elections](https://en.wikipedia.org/wiki/Leader_election).

## What you build

An `append_entries_send()` function that the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) calls on a timer to send heartbeat messages to every [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)). An `append_entries_handle()` function on the follower side that resets its [election timeout](https://raft.github.io/raft.pdf), validates the [term](https://raft.github.io/raft.pdf), and replies with an acknowledgment. A test that starts a three-node cluster, elects a [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)), and runs several heartbeat rounds without triggering a new [election](https://en.wikipedia.org/wiki/Leader_election).

## Why it matters

Without heartbeats, [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) have no way to know if the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) is still alive. They would time out and start new [elections](https://en.wikipedia.org/wiki/Leader_election) constantly, wasting time and disrupting the cluster. The [Raft paper](https://raft.github.io/raft.pdf) specifies that the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) send [AppendEntries RPCs](https://raft.github.io/raft.pdf) at regular intervals. Even when there are no new [log](https://en.wikipedia.org/wiki/Write-ahead_logging) entries to replicate, the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) sends empty [AppendEntries](https://raft.github.io/raft.pdf) as a heartbeat. Every production [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) implementation — [etcd/raft](https://github.com/etcd-io/raft), [hashicorp/raft](https://github.com/hashicorp/raft) — uses this mechanism.

---

## Training Session

### Warmup — Heartbeat concepts

1. Read Section 5.2 of the [Raft paper](https://raft.github.io/raft.pdf) on leader responsibilities. Write down the two purposes of [AppendEntries](https://raft.github.io/raft.pdf): heartbeat and [log replication](https://en.wikipedia.org/wiki/Replication_(computing)).
2. In the [Raft visualization](https://thesecretlivesofdata.com/raft/), watch how the leader sends periodic heartbeats and how the follower's timeout bar resets each time. Write down what happens when you pause the leader.
3. Read about [election timeouts](https://raft.github.io/raft.pdf) in Raft. Write down why the timeout [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be randomized (to avoid repeated split votes).
4. Review the [TCP keepalive](https://man7.org/linux/man-pages/man7/tcp.7.html) mechanism from [W11](../w11/part.md). Note the difference: [TCP keepalive](https://man7.org/linux/man-pages/man7/tcp.7.html) detects dead connections at the OS level, while [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) heartbeats detect dead leaders at the application level.

### Work — Build the heartbeat system

#### Do

1. Create `w12/raft_heartbeat.h`. Define `struct append_entries_msg` with fields: `uint64_t term`, `int leader_id`, `uint64_t prev_log_index`, `uint64_t prev_log_term`, `int entries_count` (0 for a heartbeat). Define `struct append_entries_reply` with fields: `uint64_t term`, `int success`.
2. Create `w12/raft_heartbeat.c`. Write `append_entries_send(state, followers, follower_count)`. For each online [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)), build an `append_entries_msg` with the leader's current [term](https://raft.github.io/raft.pdf) and `entries_count = 0`, and send it over the [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) connection.
3. Write `append_entries_handle(state, msg)`. If `msg.term` is less than the node's `current_term`, return `success = 0`. Otherwise, update `current_term` to `msg.term`, reset the role to [FOLLOWER](https://en.wikipedia.org/wiki/Raft_(algorithm)) if needed, record `msg.leader_id` as the current leader, reset the [election timeout](https://raft.github.io/raft.pdf) counter, and return `success = 1`.
4. Write `raft_tick(state)`. This function is called once per tick (for example, every 100 ms). If the node is the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)), it calls `append_entries_send`. If the node is a [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)), it decrements the [election timeout](https://raft.github.io/raft.pdf) counter. If the counter reaches zero, the node calls `raft_start_election` from [L01](01-terms-voting.md).
5. Add a `heartbeat_interval` field to `struct raft_state` (for example, 3 ticks). The [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) sends heartbeats every `heartbeat_interval` ticks.
6. Add an `election_timeout` field to `struct raft_state`. Initialize it to a random value between 10 and 20 ticks. The randomization prevents two [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) from timing out at the same moment and splitting the vote.
7. Create `w12/heartbeat_test.c`. Initialize three nodes. Elect node-0 as [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) using the logic from [L01](01-terms-voting.md). Then simulate 10 ticks: on each tick, call `raft_tick` on all three nodes. Verify that no [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) starts an [election](https://en.wikipedia.org/wiki/Leader_election) because the heartbeats keep resetting their timeouts.
8. Print the heartbeat count and confirm all nodes remain in their roles.

#### Test

```bash
gcc -Wall -Wextra -o heartbeat_test w12/heartbeat_test.c w12/raft_heartbeat.c w12/raft_state.c
./heartbeat_test
```

#### Expected

```
node-0: leader for term=1, sending heartbeats
tick 1: heartbeat sent to 2 followers
tick 2: heartbeat sent to 2 followers
tick 3: heartbeat sent to 2 followers
...
tick 10: heartbeat sent to 2 followers
node-1: still follower, timeout reset 10 times
node-2: still follower, timeout reset 10 times
heartbeat_test: PASS (no spurious elections in 10 ticks)
```

### Prove — Deeper understanding

Answer in your own words:

1. Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the heartbeat interval be shorter than the [election timeout](https://raft.github.io/raft.pdf)?
2. What happens if the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) receives an [AppendEntries](https://raft.github.io/raft.pdf) with a higher [term](https://raft.github.io/raft.pdf) than its own?
3. Why does [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) randomize the [election timeout](https://raft.github.io/raft.pdf) instead of using a fixed value?

### Ship

```bash
git add w12/raft_heartbeat.h w12/raft_heartbeat.c w12/heartbeat_test.c
git commit -m "w12-l02: AppendEntries heartbeats with election timeout"
```

---

## Done when

- `append_entries_send()` sends a heartbeat to all online [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)).
- `append_entries_handle()` resets the [election timeout](https://raft.github.io/raft.pdf) and validates the [term](https://raft.github.io/raft.pdf).
- `raft_tick()` drives the heartbeat loop for the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) and the timeout countdown for [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)).
- The 10-tick test completes with no spurious [elections](https://en.wikipedia.org/wiki/Leader_election).

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Heartbeat interval longer than the election timeout | [Followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) time out and start [elections](https://en.wikipedia.org/wiki/Leader_election) before the next heartbeat arrives. The interval [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be much shorter than the timeout. |
| Not resetting the timeout on heartbeat receipt | The [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) will time out even though the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) is alive, triggering a needless [election](https://en.wikipedia.org/wiki/Leader_election). |
| Using a fixed election timeout for all nodes | Two nodes time out simultaneously, both start [elections](https://en.wikipedia.org/wiki/Leader_election), and the vote splits. Randomize the timeout to avoid this. |
| Not stepping down when a higher [term](https://raft.github.io/raft.pdf) arrives in an AppendEntries | A [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) that ignores a higher [term](https://raft.github.io/raft.pdf) creates a [split-brain](https://en.wikipedia.org/wiki/Split-brain_(computing)). It [MUST](https://datatracker.ietf.org/doc/html/rfc2119) step down immediately. |

## Proof

```bash
./heartbeat_test
# → node-0: leader for term=1, sending heartbeats
# → tick 1: heartbeat sent to 2 followers
# → ...
# → tick 10: heartbeat sent to 2 followers
# → heartbeat_test: PASS (no spurious elections in 10 ticks)
```

## 🖼️ Hero Visual

```
  Heartbeat timeline:

  time ──────────────────────────────────────────▶
          HB    HB    HB    HB    HB
  leader  ├─────├─────├─────├─────├─────
          │     │     │     │     │
  f-1     ▼reset▼reset▼reset▼reset▼reset  (never times out)
  f-2     ▼reset▼reset▼reset▼reset▼reset  (never times out)

  HB = AppendEntries heartbeat (entries_count = 0)
```

## 🔮 Future Lock

- In [W12 L03](03-client-idempotency.md) the [AppendEntries](https://raft.github.io/raft.pdf) message will carry actual client requests alongside the heartbeat, not just empty messages.
- In [W12 L05](05-split-brain-defense.md) heartbeats will carry [fencing tokens](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) so that [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) can reject commands from stale [leaders](https://en.wikipedia.org/wiki/Raft_(algorithm)).
- In [W20](../w20/part.md) [chaos drills](https://en.wikipedia.org/wiki/Chaos_engineering) will freeze the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) and verify that [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) detect the missing heartbeats and elect a new [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) within the [election timeout](https://raft.github.io/raft.pdf) window.
