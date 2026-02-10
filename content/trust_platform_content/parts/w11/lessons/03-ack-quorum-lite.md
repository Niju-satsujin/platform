---
id: w11-l03
title: "Ack & Quorum Lite"
order: 3
type: lesson
duration_min: 45
---

# Ack & Quorum Lite

## Goal

Add acknowledgment messages from followers to the leader. The leader waits until a [quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) of followers have acknowledged a record before confirming the write to the client.

## What you build

An `ACK` message that each follower sends after it appends and applies a shipped [WAL record](https://en.wikipedia.org/wiki/Write-ahead_logging). A `repl_wait_quorum()` function on the leader that blocks until at least Q followers have sent their ACK for a given [log sequence number](https://en.wikipedia.org/wiki/Write-ahead_logging). Q is computed as `(follower_count / 2) + 1` — a simple majority.

## Why it matters

Shipping data without acknowledgment gives you no durability guarantee — the follower might have crashed before it wrote the record. Waiting for every follower makes the system slow and unavailable when one follower is down. A [quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) is the middle ground: you know the record exists on a majority of nodes, so even if a minority fails, the data survives. This is the same idea behind [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) commit rules and [Paxos](https://en.wikipedia.org/wiki/Paxos_(computer_science)) accept phases. The [CAP theorem](https://en.wikipedia.org/wiki/CAP_theorem) tells us that requiring a [quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) trades some [availability](https://en.wikipedia.org/wiki/Availability) for stronger [consistency](https://en.wikipedia.org/wiki/Consistency_(database_systems)).

---

## Training Session

### Warmup — Quorum arithmetic

1. Read the first three paragraphs of [Quorum (distributed computing)](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)). Write down why a majority quorum guarantees overlap between any two quorums.
2. Calculate: with 1 leader and 2 followers, Q = `(2 / 2) + 1 = 2`. Both followers [MUST](https://datatracker.ietf.org/doc/html/rfc2119) acknowledge. With 1 leader and 4 followers, Q = `(4 / 2) + 1 = 3`. Only 3 of 4 need to acknowledge.
3. Read the DESCRIPTION section of [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html). Write down how to wait for data on multiple [file descriptors](https://en.wikipedia.org/wiki/File_descriptor) with a timeout.

### Work — Build quorum acknowledgment

#### Do

1. Define `struct repl_ack` in `w11/repl_ack.h` with fields: `uint64_t lsn` (the [log sequence number](https://en.wikipedia.org/wiki/Write-ahead_logging) being acknowledged) and `uint8_t status` (0 for success, 1 for CRC failure).
2. On the follower side, after `repl_receive_record()` succeeds, encode a `struct repl_ack` with the record's LSN and status 0. Send it back to the leader using `send_full()`.
3. If `wal_record_decode()` fails the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) check, send an ACK with status 1 so the leader knows the record was corrupted.
4. Create `w11/repl_quorum.h` and `w11/repl_quorum.c`. Define `repl_wait_quorum(config, lsn, timeout_ms)`.
5. Inside `repl_wait_quorum()`, set up a [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html) array with one entry per follower socket. Loop calling [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html) with the given timeout. For each ready socket, read a `struct repl_ack`. If the LSN matches and status is 0, increment an ack counter.
6. Return success when the ack counter reaches Q. Return a timeout error if [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html) expires before Q acks arrive.
7. Modify the leader's write path: after shipping a record, call `repl_wait_quorum()`. Only reply OK to the client after quorum is reached.
8. Create `w11/repl_quorum_test.c`. Start a leader and 2 followers. The leader ships 5 records. Both followers ack each record. Verify the leader prints `quorum reached` for all 5.
9. Add a second test: make follower-2 delay its ack by 500 ms. With Q = 2, the leader [MUST](https://datatracker.ietf.org/doc/html/rfc2119) still wait for both acks since there are only 2 followers. Verify the write takes at least 500 ms.

#### Test

```bash
gcc -Wall -Wextra -o repl_quorum_test \
  w11/repl_quorum_test.c w11/repl_quorum.c w11/repl_ship.c \
  w11/repl_config.c w10/wal_record.c w10/wal_writer.c \
  w10/crc32.c w09/kv_store.c
./repl_quorum_test
```

#### Expected

```
leader: shipped record LSN=1, waiting for quorum (Q=2)
follower-1: ack LSN=1 status=OK
follower-2: ack LSN=1 status=OK
leader: quorum reached for LSN=1 (2/2 acks)
...
leader: shipped record LSN=5, waiting for quorum (Q=2)
leader: quorum reached for LSN=5 (2/2 acks)
5/5 records committed with quorum
```

### Prove — Quorum guarantees

Answer in your own words:

1. With 1 leader and 4 followers (Q = 3), what happens if 2 followers crash permanently? Can the system still commit new writes?
2. Why does the leader need a timeout on [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html)? What should it do when the timeout fires?
3. If a follower sends an ACK with status 1 (CRC failure), what should the leader do?

### Ship

```bash
git add w11/repl_ack.h w11/repl_quorum.h w11/repl_quorum.c w11/repl_quorum_test.c
git commit -m "w11-l03: quorum acknowledgment with poll-based waiting"
```

---

## Done when

- Followers send `struct repl_ack` with LSN and status after every received record.
- `repl_wait_quorum()` uses [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html) to collect acks until Q is reached or timeout fires.
- Q is calculated as `(follower_count / 2) + 1`.
- The leader does not reply OK to the client until quorum is reached.
- The delayed-ack test shows the write blocks until the slow follower responds.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Replying OK to the client before quorum | The client believes the write is durable. If the only follower that received it crashes, the data is lost. [MUST](https://datatracker.ietf.org/doc/html/rfc2119) wait for Q acks first. |
| Not handling CRC failure acks | A status-1 ack means the record was corrupted in transit. The leader [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) re-ship the record to that follower. |
| Using [select(2)](https://man7.org/linux/man-pages/man2/select.2.html) instead of [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html) | [select(2)](https://man7.org/linux/man-pages/man2/select.2.html) has a 1024 fd limit. [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html) has no such limit and is simpler for this use case. |
| Not decrementing the timeout across loop iterations | Each [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html) call may return after receiving one ack. Subtract the elapsed time before the next [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html) call, or you may wait much longer than intended. |

## Proof

```bash
./repl_quorum_test
# → leader: shipped record LSN=1, waiting for quorum (Q=2)
# → follower-1: ack LSN=1 status=OK
# → follower-2: ack LSN=1 status=OK
# → leader: quorum reached for LSN=1 (2/2 acks)
# → ...
# → 5/5 records committed with quorum
```

## 🖼️ Hero Visual

```
  Quorum acknowledgment flow (Q=2):

  client       leader               follower-1       follower-2
    │            │                      │                │
    │──SET k=v──▶│                      │                │
    │            │──ship WAL rec───────▶│                │
    │            │──ship WAL rec────────┼───────────────▶│
    │            │                      │                │
    │            │◀──ACK LSN=1──────────│                │
    │            │         ack_count=1  │                │
    │            │◀──ACK LSN=1──────────┼────────────────│
    │            │         ack_count=2  │                │
    │            │  Q=2 reached!        │                │
    │◀───OK──────│                      │                │
    │            │                      │                │
```

## 🔮 Future Lock

- In [W11 L04](04-conflict-handling.md) you will handle the case where two writes arrive close together and followers apply them in different orders.
- In [W11 L05](05-failure-handling.md) you will deal with what happens when a follower never sends its ACK because it crashed.
- In [W12](../../../parts/w12/part.md) the [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) protocol will formalize quorum rules with term numbers and a proper commit index.
- In [W20](../../../parts/w20/part.md) [chaos drills](https://en.wikipedia.org/wiki/Chaos_engineering) will kill followers mid-ack to verify the quorum logic handles partial failures.
