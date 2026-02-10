---
id: w11-l02
title: "Log Shipping"
order: 2
type: lesson
duration_min: 45
---

# Log Shipping

## Goal

Ship [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) records from the leader to each follower over [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html). Each follower receives the encoded record, verifies its [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check), appends it to its own WAL file, and applies it to its local [hash table](https://en.wikipedia.org/wiki/Hash_table).

## What you build

A `repl_ship_record()` function on the leader side that sends a length-prefixed [WAL record](../../../parts/w10/lessons/01-record-format-checksum.md) to every connected follower. A `repl_receive_record()` function on the follower side that reads the length prefix, reads that many bytes, calls `wal_record_decode()` to verify the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check), appends the record to the follower's local WAL, and applies the operation to the follower's [KV store (W09)](../../../parts/w09/part.md).

## Why it matters

[Log shipping](https://en.wikipedia.org/wiki/Replication_(computing)) is how every [leader-follower](https://en.wikipedia.org/wiki/Replication_(computing)) system moves data. [PostgreSQL streaming replication](https://www.postgresql.org/docs/current/warm-standby.html) ships WAL records over [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html). [MySQL](https://dev.mysql.com/doc/refman/8.0/en/replication.html) ships binary log events. The [write-ahead log (W10)](../../../parts/w10/part.md) you already built produces the exact records you need — this lesson connects the WAL to the network. The encoded record format with [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) means the follower can detect corruption introduced by the network or by a bug in the shipping code.

---

## Training Session

### Warmup — Network framing

1. Read the DESCRIPTION section of [send(2)](https://man7.org/linux/man-pages/man2/send.2.html). Note that [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) is a byte stream — it does not preserve message boundaries.
2. Read the DESCRIPTION section of [recv(2)](https://man7.org/linux/man-pages/man2/recv.2.html). Note that a single [recv(2)](https://man7.org/linux/man-pages/man2/recv.2.html) call may return fewer bytes than requested.
3. Write down why you need a length prefix: the receiver reads 4 bytes to learn the record size, then reads exactly that many bytes. Without a length prefix, the receiver cannot tell where one record ends and the next begins.

### Work — Build log shipping

#### Do

1. Create `w11/repl_ship.h`. Declare `repl_ship_record(config, encoded_buf, encoded_len)` and `repl_receive_record(fd, wal_writer, kv_store)`.
2. Create `w11/repl_ship.c`. Implement `send_full(fd, buf, len)` — a helper that loops on [send(2)](https://man7.org/linux/man-pages/man2/send.2.html) until all bytes are sent, handling [short writes](https://en.wikipedia.org/wiki/Short_(finance)).
3. Implement `recv_full(fd, buf, len)` — a helper that loops on [recv(2)](https://man7.org/linux/man-pages/man2/recv.2.html) until all bytes are received.
4. Implement `repl_ship_record()`. For each connected follower in the config, send a 4-byte [network byte order](https://en.wikipedia.org/wiki/Endianness) length prefix followed by the encoded record bytes. Use `send_full()` for both sends.
5. Implement `repl_receive_record()`. Read 4 bytes for the length. Allocate a buffer of that size. Call `recv_full()` to read the record bytes. Call `wal_record_decode()` to verify the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check). If the [CRC](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) fails, log an error and discard the record. If valid, append the record to the follower's WAL file using the [WAL writer (W10 L02)](../../../parts/w10/lessons/02-append-discipline.md) and apply the operation to the follower's [KV store](../../../parts/w09/part.md).
6. Create `w11/repl_ship_test.c`. Fork one follower process. The leader encodes 5 SET records using the [record codec (W10 L01)](../../../parts/w10/lessons/01-record-format-checksum.md), ships each one, and waits.
7. The follower receives all 5 records, applies them, and prints the contents of its local store.
8. After the follower exits, the leader verifies both stores have the same 5 keys by reading the follower's WAL file and replaying it into a fresh store.

#### Test

```bash
gcc -Wall -Wextra -o repl_ship_test \
  w11/repl_ship_test.c w11/repl_ship.c w11/repl_config.c \
  w10/wal_record.c w10/wal_writer.c w10/wal_recovery.c \
  w10/crc32.c w09/kv_store.c
./repl_ship_test
```

#### Expected

```
leader: shipped 5 records to follower-1
follower-1: received 5 records, CRC OK
follower-1: store has 5 keys
leader: follower WAL replay matches — 5/5 keys identical
```

### Prove — Shipping integrity

Answer in your own words:

1. Why does the length prefix use [network byte order](https://en.wikipedia.org/wiki/Endianness) instead of host byte order?
2. What happens if a [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) connection drops in the middle of sending a record? How does `send_full()` detect this?
3. Why is the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) check on the follower side still valuable even though [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) has its own checksums?

### Ship

```bash
git add w11/repl_ship.h w11/repl_ship.c w11/repl_ship_test.c
git commit -m "w11-l02: WAL log shipping from leader to follower over TCP"
```

---

## Done when

- `repl_ship_record()` sends a length-prefixed [WAL record](https://en.wikipedia.org/wiki/Write-ahead_logging) to every connected follower.
- `repl_receive_record()` reads the length prefix, reads the record, verifies the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check), appends to the follower WAL, and applies to the follower store.
- `send_full()` and `recv_full()` handle [short writes](https://en.wikipedia.org/wiki/Short_(finance)) and short reads.
- The test shows all 5 keys are identical on leader and follower.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not using a length prefix | [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) is a byte stream. Without a length prefix the receiver cannot tell where one record ends and the next begins. Always send the length first. |
| Sending length in host byte order | If leader and follower run on different architectures, the byte order may differ. Use [htonl(3)](https://man7.org/linux/man-pages/man3/byteorder.3.html) and [ntohl(3)](https://man7.org/linux/man-pages/man3/byteorder.3.html). |
| Not handling partial [recv(2)](https://man7.org/linux/man-pages/man2/recv.2.html) | A single [recv(2)](https://man7.org/linux/man-pages/man2/recv.2.html) may return only half the record. `recv_full()` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) loop until all expected bytes are received. |
| Applying a record with a failed CRC | A corrupt record [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) be applied. Log the error and drop it. The leader will detect the missing ack and can retry. |

## Proof

```bash
./repl_ship_test
# → leader: shipped 5 records to follower-1
# → follower-1: received 5 records, CRC OK
# → follower-1: store has 5 keys
# → leader: follower WAL replay matches — 5/5 keys identical
```

## 🖼️ Hero Visual

```
  Log shipping flow:

  leader                           follower
  ┌─────────────────┐              ┌─────────────────┐
  │ WAL append       │              │                 │
  │  ┌─────────────┐ │   4-byte    │ recv length     │
  │  │ encode rec  │─┼──▶ len ────▶│ recv record     │
  │  └─────────────┘ │   N-byte    │ CRC check       │
  │                   │   record    │  ┌────────────┐ │
  │  hashmap          │              │  │ WAL append │ │
  │  ┌───┬───┬───┐   │              │  │ apply to   │ │
  │  │k:v│k:v│k:v│   │              │  │  hashmap   │ │
  │  └───┴───┴───┘   │              │  └────────────┘ │
  └─────────────────┘              │  ┌───┬───┬───┐  │
                                    │  │k:v│k:v│k:v│  │
                                    │  └───┴───┴───┘  │
                                    └─────────────────┘
```

## 🔮 Future Lock

- In [W11 L03](03-ack-quorum-lite.md) you will add acknowledgment messages so the leader knows when a follower has safely received and applied a record.
- In [W11 L05](05-failure-handling.md) you will handle the case where the [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) connection drops mid-record and the follower must rejoin and catch up.
- In [W12](../../../parts/w12/part.md) the [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) log replication mechanism will replace this manual shipping with a consensus-driven protocol.
- In [W20](../../../parts/w20/part.md) [chaos engineering](https://en.wikipedia.org/wiki/Chaos_engineering) will inject network faults into the shipping path and verify correctness.
