---
id: w11-l05
title: "Failure Handling"
order: 5
type: lesson
duration_min: 50
---

# Failure Handling

## Goal

Handle follower crashes and rejoins. When a follower goes down, the leader continues shipping to the remaining followers. When the failed follower comes back, it tells the leader its last applied [LSN](https://en.wikipedia.org/wiki/Write-ahead_logging), and the leader re-ships all records from that point forward.

## What you build

A `repl_follower_rejoin()` function where the rejoining follower sends its last applied LSN to the leader. A `repl_catch_up()` function on the leader that reads its WAL from that LSN offset forward and ships every missed record. You also add [TCP keepalive](https://man7.org/linux/man-pages/man7/tcp.7.html) to detect dead connections and a heartbeat timeout to mark followers as offline.

## Why it matters

Machines crash. Networks drop. A replication system that cannot handle follower failure is useless in production. [PostgreSQL streaming replication](https://www.postgresql.org/docs/current/warm-standby.html) keeps track of each replica's replay position and sends the gap when a replica reconnects. [Redis](https://redis.io/) uses partial resynchronization with a replication offset. The core idea is the same: the follower tells the leader where it left off, and the leader sends everything after that point. [TCP keepalive](https://man7.org/linux/man-pages/man7/tcp.7.html) detects connections that go silent without a proper close, so the leader does not wait forever for a dead follower's ACK.

---

## Training Session

### Warmup — Failure detection

1. Read the TCP KEEPALIVE section of [tcp(7)](https://man7.org/linux/man-pages/man7/tcp.7.html). Write down what `TCP_KEEPIDLE`, `TCP_KEEPINTVL`, and `TCP_KEEPCNT` control.
2. Read the first two paragraphs of [Heartbeat (computing)](https://en.wikipedia.org/wiki/Heartbeat_(computing)). Write down the difference between [TCP keepalive](https://man7.org/linux/man-pages/man7/tcp.7.html) (OS-level) and an application-level heartbeat.
3. Sketch a timeline: follower-2 crashes at record 10. The leader ships records 11–15 to follower-1 only. Follower-2 restarts, reconnects, sends `last_lsn=10`, and the leader re-ships records 11–15.

### Work — Build failure handling

#### Do

1. Add [TCP keepalive](https://man7.org/linux/man-pages/man7/tcp.7.html) to every replication socket. In `repl_connect()` and after [accept(2)](https://man7.org/linux/man-pages/man2/accept.2.html), call [setsockopt(2)](https://man7.org/linux/man-pages/man2/setsockopt.2.html) with `SO_KEEPALIVE` enabled, `TCP_KEEPIDLE` = 5, `TCP_KEEPINTVL` = 1, `TCP_KEEPCNT` = 3.
2. Add a `uint8_t online` flag to `struct repl_node`. Set it to 1 on successful connect, 0 when a [send(2)](https://man7.org/linux/man-pages/man2/send.2.html) or [recv(2)](https://man7.org/linux/man-pages/man2/recv.2.html) returns an error or 0.
3. Modify `repl_ship_record()` to skip followers where `online == 0`. Modify `repl_wait_quorum()` to only include online followers in the [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html) set.
4. Create `w11/repl_rejoin.h` and `w11/repl_rejoin.c`. Implement `repl_follower_rejoin(leader_fd, last_applied_lsn)` on the follower side. It opens a new [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) connection to the leader and sends a rejoin message containing its `last_applied_lsn`.
5. Implement `repl_catch_up(config, follower_index, follower_lsn)` on the leader side. It opens the leader's WAL file, seeks to the byte offset corresponding to `follower_lsn`, and ships every record from that point forward using `repl_ship_record()` targeted at just the rejoining follower.
6. After catch-up is complete, set the follower's `online` flag to 1 and include it in future quorum calculations.
7. Create `w11/repl_rejoin_test.c`. Start a leader and 2 followers. Ship 5 records to both. Kill follower-2 (close its socket). Ship 5 more records to follower-1 only.
8. Restart follower-2. It reconnects, sends `last_lsn=5`, and the leader re-ships records 6–10. Verify follower-2's store has all 10 keys matching the leader.
9. Verify that during the time follower-2 was down, the leader still committed writes with follower-1 alone. With 2 followers and Q = 2, the leader [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have blocked or degraded — note this and document the tradeoff.

#### Test

```bash
gcc -Wall -Wextra -o repl_rejoin_test \
  w11/repl_rejoin_test.c w11/repl_rejoin.c w11/repl_quorum.c \
  w11/repl_ship.c w11/repl_conflict.c w11/repl_config.c \
  w10/wal_record.c w10/wal_writer.c w10/wal_recovery.c \
  w10/crc32.c w09/kv_store.c
./repl_rejoin_test
```

#### Expected

```
leader: shipped records 1-5 to both followers
leader: follower-2 connection lost, marking offline
leader: shipped records 6-10 to follower-1 only
follower-2: reconnected, sent last_lsn=5
leader: catching up follower-2 from LSN 5
leader: shipped records 6-10 to follower-2
follower-2: store has 10 keys — matches leader ✓
```

### Prove — Failure tradeoffs

Answer in your own words:

1. With 2 followers and Q = 2, what happens to write [availability](https://en.wikipedia.org/wiki/Availability) when one follower is down? How would adding a third follower change this?
2. Why is [TCP keepalive](https://man7.org/linux/man-pages/man7/tcp.7.html) not enough on its own for failure detection? When would an application-level heartbeat catch a failure faster?
3. What happens if the leader's WAL has been truncated or compacted and no longer has the records the follower needs? How would you handle this?

### Ship

```bash
git add w11/repl_rejoin.h w11/repl_rejoin.c w11/repl_rejoin_test.c
git commit -m "w11-l05: follower failure detection and WAL-based catch-up rejoin"
```

---

## Done when

- [TCP keepalive](https://man7.org/linux/man-pages/man7/tcp.7.html) is enabled on every replication socket with idle=5, interval=1, count=3.
- Dead followers are marked `online = 0` and excluded from shipping and quorum.
- `repl_follower_rejoin()` sends the follower's last applied LSN to the leader.
- `repl_catch_up()` re-ships all WAL records from the follower's LSN forward.
- The rejoin test shows follower-2 catching up and matching the leader.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not checking [send(2)](https://man7.org/linux/man-pages/man2/send.2.html) return value for errors | [send(2)](https://man7.org/linux/man-pages/man2/send.2.html) returns -1 and sets `errno` to `EPIPE` or `ECONNRESET` when the connection is dead. Check the return and mark the follower offline. |
| Seeking to the wrong WAL offset | The LSN [MUST](https://datatracker.ietf.org/doc/html/rfc2119) map to a byte offset in the WAL file. If your LSN is a record count, you need an index or must scan from the start. |
| Including offline followers in [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html) | Polling a closed [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) gives `POLLNVAL`. Skip offline followers in the [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html) array. |
| Not closing the old socket before rejoin | The dead socket leaks a [file descriptor](https://en.wikipedia.org/wiki/File_descriptor). Call [close(2)](https://man7.org/linux/man-pages/man2/close.2.html) before accepting the new connection. |

## Proof

```bash
./repl_rejoin_test
# → leader: shipped records 1-5 to both followers
# → leader: follower-2 connection lost, marking offline
# → leader: shipped records 6-10 to follower-1 only
# → follower-2: reconnected, sent last_lsn=5
# → leader: catching up follower-2 from LSN 5
# → leader: shipped records 6-10 to follower-2
# → follower-2: store has 10 keys — matches leader ✓
```

## 🖼️ Hero Visual

```
  Follower failure and rejoin timeline:

  time ──────────────────────────────────────────────▶

  leader:    ┌─ship 1-5──┬─ship 6-10──┬─catch-up 6-10─┐
             │  to f1,f2  │  to f1 only │  to f2        │
             └────────────┴────────────┴───────────────┘

  follower-1: ┌─recv 1-5──┬─recv 6-10──┬───────────────┐
              │ ack 1-5   │ ack 6-10   │  10 keys ✓    │
              └────────────┴────────────┴───────────────┘

  follower-2: ┌─recv 1-5──┐  ╳ CRASH   ┌─rejoin────────┐
              │ ack 1-5   │            │ send lsn=5    │
              └────────────┘            │ recv 6-10     │
                                        │ 10 keys ✓    │
                                        └───────────────┘
```

## 🔮 Future Lock

- In [W11 L06](06-regression-harness.md) you will build a harness that tests the entire replication pipeline including failure and rejoin scenarios.
- In [W12](../../../parts/w12/part.md) the [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) protocol will handle leader failure too — not just follower failure — using elections.
- In [W20](../../../parts/w20/part.md) [chaos drills](https://en.wikipedia.org/wiki/Chaos_engineering) will randomly kill and restart followers while the leader is under load, verifying the rejoin logic works under pressure.
- A future snapshot-based rejoin could send a full checkpoint instead of replaying the entire WAL, bounding catch-up time for followers that were down for a long time.
