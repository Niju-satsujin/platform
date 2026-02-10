---
id: w12-l05
title: "Split-Brain Defense"
order: 5
type: lesson
duration_min: 55
---

# Split-Brain Defense

## Goal

Prevent [split-brain](https://en.wikipedia.org/wiki/Split-brain_(computing)) — a situation where two nodes both believe they are the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) — by using [fencing tokens](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) derived from the [term number](https://raft.github.io/raft.pdf).

## What you build

A `fencing_token` field in every request the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) sends. The token equals the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm))'s current [term](https://raft.github.io/raft.pdf). [Followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) track the highest token they have seen and reject any request with a lower token. A test that simulates a [network partition](https://en.wikipedia.org/wiki/Network_partition), creates two [leaders](https://en.wikipedia.org/wiki/Raft_(algorithm)), heals the partition, and shows that the stale leader's requests are fenced off.

## Why it matters

[Split-brain](https://en.wikipedia.org/wiki/Split-brain_(computing)) is the most dangerous failure in a distributed system. If two [leaders](https://en.wikipedia.org/wiki/Raft_(algorithm)) accept writes at the same time, the [log](https://en.wikipedia.org/wiki/Write-ahead_logging) diverges and data is lost or corrupted. The [Raft paper](https://raft.github.io/raft.pdf) prevents this by design — only a node with a [majority](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) of votes becomes [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)), so at most one [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) exists per [term](https://raft.github.io/raft.pdf). But during a [network partition](https://en.wikipedia.org/wiki/Network_partition), the old [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) may not know it has been replaced. [Fencing tokens](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) — a concept described by [Martin Kleppmann](https://martin.kleppmann.com/) — add an extra safety layer: even if a stale [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) sends a command, the receiver rejects it because the token is outdated.

---

## Training Session

### Warmup — Split-brain concepts

1. Read the first section of [Split-brain (computing)](https://en.wikipedia.org/wiki/Split-brain_(computing)). Write down the definition and why it leads to data corruption.
2. Read Martin Kleppmann's blog post on [fencing tokens](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html). Write down why a [monotonically increasing](https://en.wikipedia.org/wiki/Monotonic_function) token is enough to detect stale leaders.
3. Read Section 5.1 of the [Raft paper](https://raft.github.io/raft.pdf). Note the guarantee: "at most one leader can be elected in a given [term](https://raft.github.io/raft.pdf)." Understand why this guarantee depends on the [majority](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) vote rule.
4. Think about the scenario: 5 nodes, a partition splits them 2-3. The side with 3 nodes elects a new [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)). The old [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) on the other side still thinks it is [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) because it has not received any message. Draw this on paper.

### Work — Build the fencing layer

#### Do

1. Add a `uint64_t fencing_token` field to `struct append_entries_msg` from [L02](02-heartbeats.md). The [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) sets this to its `current_term` before sending.
2. Add a `uint64_t highest_seen_token` field to `struct raft_state`. Initialize it to 0.
3. Create `w12/fencing.h`. Define `fence_check(state, incoming_token)` that returns 1 (accept) if `incoming_token >= highest_seen_token`, and 0 (reject) if `incoming_token < highest_seen_token`. On accept, update `highest_seen_token`.
4. Create `w12/fencing.c`. Implement `fence_check`. Also implement `fence_tag(state)` that returns the current [term](https://raft.github.io/raft.pdf) as the fencing token — the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) calls this before every message.
5. Update `append_entries_handle()` from [L02](02-heartbeats.md) to call `fence_check` before processing the heartbeat. If the check fails, log a warning and return `success = 0`.
6. Create `w12/split_brain_test.c`. Set up five nodes (0–4). Elect node-0 as [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) in [term](https://raft.github.io/raft.pdf) 1. Simulate a [network partition](https://en.wikipedia.org/wiki/Network_partition): nodes 0 and 1 are on one side, nodes 2, 3, and 4 are on the other. Node-2 times out and starts an [election](https://en.wikipedia.org/wiki/Leader_election). Nodes 3 and 4 vote for node-2. Node-2 becomes [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) in [term](https://raft.github.io/raft.pdf) 2.
7. Heal the partition. Node-0 (the stale [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) with [term](https://raft.github.io/raft.pdf) 1) tries to send a heartbeat to node-3. Node-3's `highest_seen_token` is 2 (from node-2's heartbeats). The `fence_check` rejects node-0's token of 1.
8. Node-0 receives the rejection, sees [term](https://raft.github.io/raft.pdf) 2 in the reply, and steps down to [FOLLOWER](https://en.wikipedia.org/wiki/Raft_(algorithm)). Print the entire sequence.

#### Test

```bash
gcc -Wall -Wextra -o split_brain_test w12/split_brain_test.c w12/fencing.c \
  w12/raft_heartbeat.c w12/raft_state.c
./split_brain_test
```

#### Expected

```
node-0: leader term=1, sending to 4 followers
--- PARTITION: {0,1} | {2,3,4} ---
node-2: election started, term=2
node-3: vote granted to node-2 for term=2
node-4: vote granted to node-2 for term=2
node-2: elected leader for term=2 (votes: 3/5)
--- PARTITION HEALED ---
node-0: heartbeat to node-3, token=1
node-3: FENCED — token 1 < highest 2, rejected
node-0: received term=2 in reply, stepping down to follower
split_brain_test: PASS (stale leader fenced off)
```

### Prove — Deeper understanding

Answer in your own words:

1. Why can't the old [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) (node-0) get a [majority](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) on its side of a 2-3 partition?
2. Why is the [fencing token](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) set to the [term](https://raft.github.io/raft.pdf) rather than a random number?
3. In a real system, what happens to the writes the old [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) accepted during the partition? Are they lost?

### Ship

```bash
git add w12/fencing.h w12/fencing.c w12/split_brain_test.c
git commit -m "w12-l05: split-brain defense with fencing tokens"
```

---

## Done when

- `fence_tag()` returns the current [term](https://raft.github.io/raft.pdf) as a [fencing token](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html).
- `fence_check()` rejects tokens lower than the highest seen.
- The split-brain test simulates a [partition](https://en.wikipedia.org/wiki/Network_partition), a new [election](https://en.wikipedia.org/wiki/Leader_election), and a stale leader being fenced off.
- The stale [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) steps down upon seeing a higher [term](https://raft.github.io/raft.pdf) in the reply.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Comparing tokens with `>` instead of `>=` | A token equal to the highest is valid — it comes from the same [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)). Use `>=` to accept, `<` to reject. |
| Not updating `highest_seen_token` on accept | If the token is not recorded, the same stale token could pass later after a legitimate higher token was seen. |
| Allowing the stale leader to continue after a rejected heartbeat | The stale [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) step down when the reply contains a higher [term](https://raft.github.io/raft.pdf). Ignoring the reply breaks safety. |
| Testing with only 3 nodes | With 3 nodes, a 1-2 partition always has a [majority](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) on one side. Use 5 nodes (2-3 split) to clearly demonstrate split-brain. |

## Proof

```bash
./split_brain_test
# → node-0: leader term=1, sending to 4 followers
# → --- PARTITION: {0,1} | {2,3,4} ---
# → node-2: elected leader for term=2 (votes: 3/5)
# → --- PARTITION HEALED ---
# → node-0: heartbeat to node-3, token=1
# → node-3: FENCED — token 1 < highest 2, rejected
# → node-0: received term=2 in reply, stepping down to follower
# → split_brain_test: PASS (stale leader fenced off)
```

## 🖼️ Hero Visual

```
  Split-brain timeline:

  time ──────────────────────────────────────────────────▶

  node-0  ──[LEADER t=1]──partition──[stale leader t=1]──heal──FENCED──[follower t=2]
  node-1  ──[follower t=1]──────────[isolated follower]──heal──[follower t=2]
  --------  PARTITION  -----------------------------------------------
  node-2  ──[follower t=1]──timeout──[LEADER t=2]───────────────[LEADER t=2]
  node-3  ──[follower t=1]──vote-yes─[follower t=2]────────────[follower t=2]
  node-4  ──[follower t=1]──vote-yes─[follower t=2]────────────[follower t=2]
```

## 🔮 Future Lock

- In [W12 L06](06-regression-harness.md) the [regression harness](https://en.wikipedia.org/wiki/Regression_testing) will include a split-brain scenario as one of its mandatory test cases.
- In [W12 Quest](../w12/quest.md) you will integrate [fencing tokens](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) into the full [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) pipeline so that every client write is protected end to end.
- In [W20](../w20/part.md) [chaos drills](https://en.wikipedia.org/wiki/Chaos_engineering) will inject [network partitions](https://en.wikipedia.org/wiki/Network_partition) at random and verify no stale [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) can corrupt committed data.
