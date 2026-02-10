---
id: w12-l01
title: "Terms & Voting"
order: 1
type: lesson
duration_min: 50
---

# Terms & Voting

## Goal

Implement [term numbers](https://raft.github.io/raft.pdf) and the [RequestVote RPC](https://raft.github.io/raft.pdf) so the cluster can hold an [election](https://en.wikipedia.org/wiki/Leader_election) and agree on exactly one [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) per [term](https://raft.github.io/raft.pdf).

## What you build

A `struct raft_state` that tracks the current [term](https://raft.github.io/raft.pdf), the node's role ([follower](https://en.wikipedia.org/wiki/Raft_(algorithm)), [candidate](https://en.wikipedia.org/wiki/Raft_(algorithm)), or [leader](https://en.wikipedia.org/wiki/Raft_(algorithm))), and who it voted for. A `RequestVote` handler that grants or denies votes based on [term](https://raft.github.io/raft.pdf) comparison and a one-vote-per-term rule. A test that starts a three-node cluster, triggers a timeout, runs an [election](https://en.wikipedia.org/wiki/Leader_election), and prints the winner.

## Why it matters

In [W11](../w11/part.md) the leader was picked manually. If that leader crashes, no one takes over. The [Raft consensus algorithm](https://en.wikipedia.org/wiki/Raft_(algorithm)) solves this by letting nodes vote. Every real [consensus](https://en.wikipedia.org/wiki/Consensus_(computer_science)) system — [etcd](https://etcd.io/), [CockroachDB](https://www.cockroachlabs.com/), [TiKV](https://tikv.org/) — uses some form of [leader election](https://en.wikipedia.org/wiki/Leader_election). The [term number](https://raft.github.io/raft.pdf) acts like a [logical clock](https://en.wikipedia.org/wiki/Lamport_timestamp): it grows monotonically so the cluster can always tell which leader is current and reject stale messages from old leaders.

---

## Training Session

### Warmup — Election concepts

1. Read Section 5.2 of the [Raft paper](https://raft.github.io/raft.pdf). Write down the three states a node can be in and what triggers the transition between them.
2. Watch the first two minutes of the [Raft visualization](https://thesecretlivesofdata.com/raft/). Observe how a timeout causes a [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) to become a [candidate](https://en.wikipedia.org/wiki/Raft_(algorithm)) and request votes.
3. Read the definition of [MUST](https://datatracker.ietf.org/doc/html/rfc2119) from [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119). Note that a node [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) vote twice in the same [term](https://raft.github.io/raft.pdf).
4. Read the introduction of [Lamport timestamps](https://en.wikipedia.org/wiki/Lamport_timestamp). Understand why a [logical clock](https://en.wikipedia.org/wiki/Lamport_timestamp) that only goes up is enough to order events in a distributed system.

### Work — Build the election

#### Do

1. Create `w12/raft_state.h`. Define `enum raft_role` with values `FOLLOWER`, `CANDIDATE`, `LEADER`. Define `struct raft_state` with fields: `uint64_t current_term`, `int voted_for` (-1 means no vote yet), `enum raft_role role`, `int node_id`, `int cluster_size`.
2. Create `w12/raft_state.c`. Write `raft_init(state, node_id, cluster_size)` that sets [term](https://raft.github.io/raft.pdf) to 0, role to [FOLLOWER](https://en.wikipedia.org/wiki/Raft_(algorithm)), and `voted_for` to -1.
3. Write `raft_start_election(state)`. It increments `current_term` by 1, changes the role to [CANDIDATE](https://en.wikipedia.org/wiki/Raft_(algorithm)), and votes for itself by setting `voted_for` to `node_id`. Return the new [term](https://raft.github.io/raft.pdf).
4. Write `raft_handle_request_vote(state, candidate_term, candidate_id)`. If `candidate_term` is less than `current_term`, deny the vote. If `candidate_term` is greater than `current_term`, update `current_term`, reset `voted_for` to -1, and step down to [FOLLOWER](https://en.wikipedia.org/wiki/Raft_(algorithm)). Then, if `voted_for` is -1 or already equals `candidate_id`, grant the vote and set `voted_for`. Otherwise deny. Return a struct with `vote_granted` and `term`.
5. Write `raft_become_leader(state)` that sets the role to [LEADER](https://en.wikipedia.org/wiki/Raft_(algorithm)). This is called only after a [candidate](https://en.wikipedia.org/wiki/Raft_(algorithm)) receives votes from a [majority](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)).
6. Write `raft_step_down(state, new_term)` that sets the role to [FOLLOWER](https://en.wikipedia.org/wiki/Raft_(algorithm)), updates `current_term` to `new_term`, and resets `voted_for` to -1.
7. Create `w12/election_test.c`. Initialize three `raft_state` structs for nodes 0, 1, 2 with `cluster_size = 3`. Simulate a timeout on node 0: call `raft_start_election` on node 0, then send the [RequestVote](https://raft.github.io/raft.pdf) to nodes 1 and 2 by calling `raft_handle_request_vote` on each. Count the granted votes. If votes (including self-vote) reach a [majority](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)), call `raft_become_leader`.
8. Print the election result: the winning node ID, the [term](https://raft.github.io/raft.pdf), and the vote count.

#### Test

```bash
gcc -Wall -Wextra -o election_test w12/election_test.c w12/raft_state.c
./election_test
```

#### Expected

```
node-0: election started, term=1
node-1: vote granted to node-0 for term=1
node-2: vote granted to node-0 for term=1
node-0: elected leader for term=1 (votes: 3/3)
```

### Prove — Deeper understanding

Answer in your own words:

1. Why does the [Raft paper](https://raft.github.io/raft.pdf) require that a node [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) vote for two different [candidates](https://en.wikipedia.org/wiki/Raft_(algorithm)) in the same [term](https://raft.github.io/raft.pdf)?
2. What happens if two nodes start an [election](https://en.wikipedia.org/wiki/Leader_election) at the same [term](https://raft.github.io/raft.pdf)? How does [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) resolve a split vote?
3. Why is `current_term` a [monotonically increasing](https://en.wikipedia.org/wiki/Monotonic_function) counter and never decremented?

### Ship

```bash
git add w12/raft_state.h w12/raft_state.c w12/election_test.c
git commit -m "w12-l01: term numbers and RequestVote election"
```

---

## Done when

- `struct raft_state` tracks [term](https://raft.github.io/raft.pdf), role, and `voted_for`.
- `raft_start_election()` increments the [term](https://raft.github.io/raft.pdf) and votes for self.
- `raft_handle_request_vote()` grants or denies based on [term](https://raft.github.io/raft.pdf) comparison and one-vote-per-term rule.
- The three-node [election](https://en.wikipedia.org/wiki/Leader_election) test prints the winner with the correct [term](https://raft.github.io/raft.pdf) and vote count.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not resetting `voted_for` when a higher [term](https://raft.github.io/raft.pdf) arrives | A node [MUST](https://datatracker.ietf.org/doc/html/rfc2119) clear its vote when it discovers a new [term](https://raft.github.io/raft.pdf). Otherwise it might refuse valid [candidates](https://en.wikipedia.org/wiki/Raft_(algorithm)). |
| Forgetting the self-vote | The [candidate](https://en.wikipedia.org/wiki/Raft_(algorithm)) always votes for itself. Without the self-vote, the [majority](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) count is wrong. |
| Using `>=` instead of `>` for [term](https://raft.github.io/raft.pdf) comparison in vote denial | If the [candidate](https://en.wikipedia.org/wiki/Raft_(algorithm)) has the same [term](https://raft.github.io/raft.pdf) as the voter, the vote [MUST](https://datatracker.ietf.org/doc/html/rfc2119) still be considered — only a strictly lower [term](https://raft.github.io/raft.pdf) causes denial. |
| Not stepping down when a higher [term](https://raft.github.io/raft.pdf) is seen | Any node — even the current [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) — [MUST](https://datatracker.ietf.org/doc/html/rfc2119) revert to [FOLLOWER](https://en.wikipedia.org/wiki/Raft_(algorithm)) upon seeing a higher [term](https://raft.github.io/raft.pdf). |

## Proof

```bash
./election_test
# → node-0: election started, term=1
# → node-1: vote granted to node-0 for term=1
# → node-2: vote granted to node-0 for term=1
# → node-0: elected leader for term=1 (votes: 3/3)
```

## 🖼️ Hero Visual

```
  Election timeline (3 nodes):

  time ──────────────────────────────────────────▶

  node-0  ──[follower]──timeout──[candidate t=1]──wins──[LEADER t=1]──
  node-1  ──[follower]──────────vote-yes────────────────[follower t=1]──
  node-2  ──[follower]──────────vote-yes────────────────[follower t=1]──
```

## 🔮 Future Lock

- In [W12 L02](02-heartbeats.md) the new [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) will begin sending [AppendEntries](https://raft.github.io/raft.pdf) heartbeats to prevent followers from starting a new [election](https://en.wikipedia.org/wiki/Leader_election).
- In [W12 L05](05-split-brain-defense.md) [fencing tokens](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) tied to the [term](https://raft.github.io/raft.pdf) will prevent an old [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) from corrupting state after a new [election](https://en.wikipedia.org/wiki/Leader_election).
- In [W20](../w20/part.md) [chaos drills](https://en.wikipedia.org/wiki/Chaos_engineering) will kill the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) and verify that the cluster re-elects within a bounded time.
