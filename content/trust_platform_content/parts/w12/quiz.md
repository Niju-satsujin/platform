---
id: w12-quiz
title: "Week 12 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 12 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – Term purpose

What is the role of the [term number](https://raft.github.io/raft.pdf) in [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm))?

- A) It counts the number of records in the [log](https://en.wikipedia.org/wiki/Write-ahead_logging)
- B) It acts as a [logical clock](https://en.wikipedia.org/wiki/Lamport_timestamp) that increases with each [election](https://en.wikipedia.org/wiki/Leader_election), allowing the cluster to identify which [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) is current and reject stale messages
- C) It measures wall-clock time between heartbeats
- D) It tracks the number of [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) in the cluster

---

### Q2 – Vote rule

Why [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) a node vote for two different [candidates](https://en.wikipedia.org/wiki/Raft_(algorithm)) in the same [term](https://raft.github.io/raft.pdf)?

- A) Because voting is slow and should be minimized
- B) Because allowing double votes could let two [candidates](https://en.wikipedia.org/wiki/Raft_(algorithm)) both reach a [majority](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)), creating two [leaders](https://en.wikipedia.org/wiki/Raft_(algorithm)) in the same [term](https://raft.github.io/raft.pdf) — a [split-brain](https://en.wikipedia.org/wiki/Split-brain_(computing))
- C) Because [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) only allows one message per connection
- D) Because the [Raft paper](https://raft.github.io/raft.pdf) says so without a reason

---

### Q3 – Heartbeat interval

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the heartbeat interval be shorter than the [election timeout](https://raft.github.io/raft.pdf)?

- A) To save network bandwidth
- B) So that [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) reset their timeout before it expires — if the heartbeat is slower than the timeout, [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) will start unnecessary [elections](https://en.wikipedia.org/wiki/Leader_election) even though the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) is alive
- C) Because the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) runs out of memory if it sends too slowly
- D) Because [AppendEntries](https://raft.github.io/raft.pdf) messages expire after a fixed time

---

### Q4 – Randomized timeout

Why does [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) randomize the [election timeout](https://raft.github.io/raft.pdf) on each node?

- A) To make the system unpredictable to attackers
- B) If all nodes used the same timeout, they would all time out at the same moment, all start [elections](https://en.wikipedia.org/wiki/Leader_election), all vote for themselves, and no one would get a [majority](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) — a split vote repeating forever
- C) Because the OS timer is inaccurate
- D) To reduce CPU usage on idle nodes

---

### Q5 – Idempotency key

A client sends `SET balance=500` with `client_id=7, sequence_number=3`. The [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) crashes after committing but before replying. The new [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) receives the same request. What happens?

- A) The new [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) applies it again, setting balance to 500 twice (harmless for SET, dangerous for INCR)
- B) The new [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) checks the [deduplication table](https://en.wikipedia.org/wiki/Data_deduplication), finds `client_id=7` already has `sequence_number=3` applied, and returns the cached result without re-applying
- C) The new [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) rejects it because the old [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) already handled it
- D) The client must register a new `client_id` before retrying

---

### Q6 – Redirect purpose

Why does a [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) redirect client write requests to the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) instead of processing them locally?

- A) Because [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) cannot open [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) connections
- B) Only the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) can append entries to the [replicated log](https://en.wikipedia.org/wiki/Write-ahead_logging) and coordinate [quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) — a [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) accepting writes would bypass [consensus](https://en.wikipedia.org/wiki/Consensus_(computer_science)) and break [consistency](https://en.wikipedia.org/wiki/Consistency_(database_systems))
- C) Because the [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) does not have enough memory
- D) Because the client already knows the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm))

---

### Q7 – Fencing token

A stale [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) with [term](https://raft.github.io/raft.pdf) 3 sends a command to a [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) whose `highest_seen_token` is 5. What does the [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) do?

- A) Accept the command because the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) has authority
- B) Reject the command because the [fencing token](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) 3 is less than the highest seen token 5 — the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) is stale
- C) Forward the command to the current [leader](https://en.wikipedia.org/wiki/Raft_(algorithm))
- D) Store the command and apply it later

---

### Q8 – Majority and partition

A 5-node cluster is partitioned into groups {A, B} and {C, D, E}. Why can only the {C, D, E} side elect a new [leader](https://en.wikipedia.org/wiki/Raft_(algorithm))?

- A) Because C, D, E have more data
- B) Because a [majority](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) is `(5 / 2) + 1 = 3`, and the {A, B} side only has 2 nodes — not enough to win a [RequestVote](https://raft.github.io/raft.pdf)
- C) Because the [Raft paper](https://raft.github.io/raft.pdf) assigns priorities to nodes
- D) Because A and B are followers and cannot start [elections](https://en.wikipedia.org/wiki/Leader_election)

---

### Q9 – Short answer: Step-down rule

Explain in one or two sentences what happens when a [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) receives a message with a [term](https://raft.github.io/raft.pdf) higher than its own, and why this rule is essential for safety.

---

### Q10 – Short answer: Deduplication table durability

Explain why the [deduplication table](https://en.wikipedia.org/wiki/Data_deduplication) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) survive [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) failover. What happens if it is lost?

---

### Q11 – Short answer: Unknown leader

Explain what a [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) reply when a client sends a write request, but the follower has not yet received any [AppendEntries](https://raft.github.io/raft.pdf) heartbeat and does not know who the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) is.

---

### Q12 – Short answer: Regression harness value

Explain why the full-pipeline test (test 6 in the [regression harness](https://en.wikipedia.org/wiki/Regression_testing)) is more valuable than running the five individual tests separately.

---

### Q13 – Read the output: Election with rejection

A 3-node cluster produces this output:

```
node-1: election started, term=5
node-0: vote denied to node-1 for term=5 (already voted for node-2)
node-2: vote granted to node-1 for term=5
node-1: election failed for term=5 (votes: 2/3, needed 2) — wait, this says 2...
```

Wait — node-1 got its own vote plus node-2's vote, so it has 2 out of 3. Did node-1 become [leader](https://en.wikipedia.org/wiki/Raft_(algorithm))? Explain what happened with node-0's denial and why the [election](https://en.wikipedia.org/wiki/Leader_election) still succeeded.

---

### Q14 – Read the output: Stale heartbeat

A [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) logs the following:

```
recv: AppendEntries term=3 leader=node-0 token=3
  fence_check: token=3 >= highest=2 → ACCEPT, update highest=3
  timeout reset
recv: AppendEntries term=2 leader=node-X token=2
  fence_check: token=2 < highest=3 → REJECT
  warning: stale leader detected (term=2 < current=3)
```

Explain why the second message was rejected. Who is "node-X" and what likely happened to it?

---

## Answer Key

| Q | Answer |
|---|--------|
| 1 | B |
| 2 | B |
| 3 | B |
| 4 | B |
| 5 | B |
| 6 | B |
| 7 | B |
| 8 | B |
| 9 | When a [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) receives a message with a higher [term](https://raft.github.io/raft.pdf), it immediately reverts to [FOLLOWER](https://en.wikipedia.org/wiki/Raft_(algorithm)), updates its `current_term`, and resets `voted_for` to -1. This is essential because a higher [term](https://raft.github.io/raft.pdf) means a new [election](https://en.wikipedia.org/wiki/Leader_election) has occurred and another node may be the legitimate [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) — continuing to act as [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) would create a [split-brain](https://en.wikipedia.org/wiki/Split-brain_(computing)). |
| 10 | The [deduplication table](https://en.wikipedia.org/wiki/Data_deduplication) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) survive failover because the client will retry its last request to the new [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)). If the table is lost, the new [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) does not know which requests were already applied and will apply the retry again — violating [exactly-once semantics](https://en.wikipedia.org/wiki/Exactly-once_delivery). The table can be made durable by including it in the [replicated log](https://en.wikipedia.org/wiki/Write-ahead_logging) so all nodes have a copy. |
| 11 | The [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) reply with a message indicating that no [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) is known (for example, `leader_known=0`) and the client [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) wait briefly and retry. The [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) process the write itself or redirect to a stale address. Eventually a heartbeat will arrive and the [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) will learn the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm))'s address. |
| 12 | The full-pipeline test exercises the interaction between all features in a single scenario: an [election](https://en.wikipedia.org/wiki/Leader_election) followed by heartbeats, a client request with [idempotency](https://en.wikipedia.org/wiki/Idempotence) and [redirect](https://raft.github.io/raft.pdf), a [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) crash, a re-election, and a deduplication check. Bugs often hide at the boundaries between features — for example, the [deduplication table](https://en.wikipedia.org/wiki/Data_deduplication) not being replicated to the new [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)). Individual tests cannot catch these integration issues. |
| 13 | Node-1 started an [election](https://en.wikipedia.org/wiki/Leader_election) in [term](https://raft.github.io/raft.pdf) 5, voting for itself (1 vote). Node-0 denied the vote because it had already voted for node-2 in [term](https://raft.github.io/raft.pdf) 5 (the one-vote-per-term rule). Node-2 granted the vote. So node-1 has 2 votes: its own plus node-2's. In a 3-node cluster, [majority](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) is 2, so node-1 wins the [election](https://en.wikipedia.org/wiki/Leader_election) despite node-0's denial. Node-0's vote for node-2 does not matter because node-2 apparently did not start its own [election](https://en.wikipedia.org/wiki/Leader_election) — it just voted for node-1 when asked. |
| 14 | The second [AppendEntries](https://raft.github.io/raft.pdf) was rejected because its [fencing token](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) (2) is less than the [follower](https://en.wikipedia.org/wiki/Raft_(algorithm))'s `highest_seen_token` (3), which was updated by the first message. "Node-X" was the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) in [term](https://raft.github.io/raft.pdf) 2 — it was likely partitioned from the cluster, missed the [election](https://en.wikipedia.org/wiki/Leader_election) that produced [term](https://raft.github.io/raft.pdf) 3, and is now sending stale heartbeats after the partition healed. The [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) correctly rejects it because node-0 in [term](https://raft.github.io/raft.pdf) 3 is the legitimate [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)). |
