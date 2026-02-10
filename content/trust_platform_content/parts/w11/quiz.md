---
id: w11-quiz
title: "Week 11 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 11 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – Replication purpose

Why does the [KV store (W09)](../w09/part.md) need [replication](https://en.wikipedia.org/wiki/Replication_(computing))?

- A) To make the code more complex
- B) A single server is a single point of failure — if it crashes, the data is unavailable until recovery finishes. Replication keeps copies on other machines so the system stays available.
- C) Because [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) requires multiple servers
- D) Because the [hash table](https://en.wikipedia.org/wiki/Hash_table) only works on one machine

---

### Q2 – CAP tradeoff

According to the [CAP theorem](https://en.wikipedia.org/wiki/CAP_theorem), a distributed system can guarantee at most two of three properties. In a [leader-follower](https://en.wikipedia.org/wiki/Replication_(computing)) setup with [quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) writes, which property is sacrificed during a [network partition](https://en.wikipedia.org/wiki/Network_partition)?

- A) [Consistency](https://en.wikipedia.org/wiki/Consistency_(database_systems)) — replicas may return stale data
- B) [Availability](https://en.wikipedia.org/wiki/Availability) — the leader blocks writes because it cannot reach enough followers for a quorum
- C) [Partition tolerance](https://en.wikipedia.org/wiki/Network_partition) — the system shuts down entirely
- D) None — all three are maintained

---

### Q3 – Length prefix purpose

Why does [log shipping (L02)](lessons/02-log-shipping.md) send a 4-byte length prefix before each [WAL record](https://en.wikipedia.org/wiki/Write-ahead_logging)?

- A) Because [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) requires a header on every message
- B) [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) is a byte stream with no message boundaries — the receiver needs the length to know how many bytes to read for the current record before the next one begins
- C) The length prefix replaces the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) checksum
- D) It tells the follower which key is being updated

---

### Q4 – Quorum formula

With 1 leader and 4 followers, the [quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) Q = `(4 / 2) + 1 = 3`. What does this mean for write durability?

- A) The leader stores 3 copies of each record
- B) At least 3 of 4 followers [MUST](https://datatracker.ietf.org/doc/html/rfc2119) acknowledge the record before the leader confirms the write — so even if 1 follower crashes, 2 of the remaining 3 still have the record
- C) The leader sends each record 3 times
- D) The followers vote on which records to keep

---

### Q5 – CRC on receive

Why does the follower verify the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) of a shipped record even though [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) has its own checksums?

- A) [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) checksums are always wrong
- B) The [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) catches bugs in the encoding or shipping code — [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) only catches corruption on the wire, not corruption caused by software errors before sending
- C) The [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) is faster than the TCP checksum
- D) The follower does not trust the leader

---

### Q6 – Last-writer-wins tiebreaker

Two records arrive for the same key with identical [timestamps](https://en.wikipedia.org/wiki/Timestamp): `SET x=aaa (t=100)` and `SET x=zzz (t=100)`. What value does the store keep?

- A) `aaa` because it arrived first
- B) `zzz` because it is lexicographically larger — the tiebreaker uses [memcmp(3)](https://man7.org/linux/man-pages/man3/memcmp.3.html) and the larger value wins
- C) Both values are stored
- D) The record is discarded

---

### Q7 – TCP keepalive role

What is the purpose of enabling [TCP keepalive](https://man7.org/linux/man-pages/man7/tcp.7.html) on replication sockets?

- A) It makes [send(2)](https://man7.org/linux/man-pages/man2/send.2.html) faster
- B) It detects dead connections where the remote process crashed or the network went down without sending a proper [FIN](https://en.wikipedia.org/wiki/Transmission_Control_Protocol#Connection_termination) — the OS sends probe packets and closes the socket if no response comes
- C) It encrypts the connection
- D) It increases the buffer size

---

### Q8 – Rejoin catch-up

When a failed follower restarts and reconnects, it sends its `last_applied_lsn = 5` to the leader. The leader's WAL has 15 records. What does the leader do?

- A) Send all 15 records from the beginning
- B) Seek to the WAL offset corresponding to LSN 5 and ship records 6 through 15 — only the records the follower missed
- C) Delete the follower's data and start over
- D) Ignore the follower until the next restart

---

### Q9 – Short answer: Single-leader write ordering

Explain in one or two sentences why a [leader-follower](https://en.wikipedia.org/wiki/Replication_(computing)) model with a single leader has fewer conflicts than a multi-leader model.

---

### Q10 – Short answer: Quorum and availability

With 1 leader and 2 followers (Q = 2), explain what happens to write [availability](https://en.wikipedia.org/wiki/Availability) when one follower crashes. Why does adding a third follower (making Q = 2 out of 3) improve the situation?

---

### Q11 – Short answer: Deterministic convergence

Explain why [last-writer-wins](https://en.wikipedia.org/wiki/Eventual_consistency) with a lexicographic tiebreaker guarantees that all replicas converge to the same value, even if they receive records in different orders.

---

### Q12 – Short answer: WAL-based catch-up vs full resync

Explain the difference between WAL-based catch-up (shipping missed records) and a full resync (sending a snapshot). When would WAL-based catch-up be impractical?

---

### Q13 – Read the output: Quorum timeout

A leader ships a record to 3 followers with Q = 2. The output is:

```
leader: shipped record LSN=7 to 3 followers
follower-1: ack LSN=7 status=OK
leader: quorum reached for LSN=7 (1/2 → waiting)
follower-3: ack LSN=7 status=OK
leader: quorum reached for LSN=7 (2/2 acks)
leader: OK sent to client
```

Follower-2 never sent an ack. Why did the leader still commit? What happened to follower-2?

---

### Q14 – Read the output: Conflict resolution

A follower's log shows:

```
recv: SET x=old (t=100) — applied
recv: SET x=new (t=200) — applied
recv: SET x=stale (t=150) — SKIPPED (existing t=200 > incoming t=150)
store: x=new (t=200)
```

Explain why the third record was skipped. What would happen if the conflict resolver was missing and all records were applied in order?

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
| 9 | In a single-leader model, all writes go through one node, which assigns a total order ([LSN](https://en.wikipedia.org/wiki/Write-ahead_logging)) to every record. Two clients writing the same key get sequential LSNs, so there is no true concurrency conflict. In a multi-leader model, two leaders can accept writes for the same key at the same time with no coordination, creating genuine conflicts that must be resolved after the fact. |
| 10 | With Q = 2 and only 2 followers, both [MUST](https://datatracker.ietf.org/doc/html/rfc2119) acknowledge every write. If one crashes, the leader cannot reach quorum and writes block — the system loses [availability](https://en.wikipedia.org/wiki/Availability). Adding a third follower makes Q = `(3 / 2) + 1 = 2`. Now only 2 of 3 followers need to ack. If one crashes, the remaining 2 still form a quorum, and writes continue without blocking. |
| 11 | [Last-writer-wins](https://en.wikipedia.org/wiki/Eventual_consistency) uses only the timestamp and value to decide which record wins. The decision does not depend on arrival order — given the same set of records, every replica computes the same comparison and keeps the same winner. The lexicographic tiebreaker makes the decision deterministic even when timestamps are equal, so no replica can end up with a different value than any other. |
| 12 | WAL-based catch-up ships only the records the follower missed, starting from its last applied [LSN](https://en.wikipedia.org/wiki/Write-ahead_logging). It is efficient when the gap is small. A full resync sends a complete snapshot of the store. WAL-based catch-up becomes impractical when the follower was down so long that the leader has compacted or deleted the old WAL segments — the needed records no longer exist, so the leader must send a snapshot instead. |
| 13 | The leader committed because it only needs Q = 2 acks, and it received acks from follower-1 and follower-3. That satisfies the [quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) requirement. Follower-2 either crashed, is experiencing a network issue, or is processing the record slowly. The leader does not need to wait for it. Follower-2 will catch up later when it reconnects and sends its last applied LSN — the leader will re-ship the missed records. |
| 14 | The third record `SET x=stale (t=150)` was skipped because the store already had `x=new` with timestamp 200, which is higher than the incoming timestamp 150. The [last-writer-wins](https://en.wikipedia.org/wiki/Eventual_consistency) resolver keeps the higher timestamp. Without the conflict resolver, records would be applied in arrival order: `x=old`, then `x=new`, then `x=stale`. The final value would be `x=stale` — a regression to an older value, which is incorrect. |
