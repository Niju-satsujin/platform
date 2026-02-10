---
id: w12-l03
title: "Client Idempotency"
order: 3
type: lesson
duration_min: 45
---

# Client Idempotency

## Goal

Add [idempotency](https://en.wikipedia.org/wiki/Idempotence) to client requests so that retries caused by [network failures](https://en.wikipedia.org/wiki/Network_partition) or [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) failover do not apply the same command twice.

## What you build

A `struct client_request` that carries a `client_id` and a `sequence_number`. A server-side [deduplication](https://en.wikipedia.org/wiki/Data_deduplication) table that maps each `client_id` to the highest `sequence_number` already applied. A check that skips any request whose `sequence_number` is less than or equal to the stored value. A test that sends the same request three times and verifies it is applied exactly once.

## Why it matters

In a distributed system, the client cannot always tell if its request succeeded. The [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) may crash after committing the [log](https://en.wikipedia.org/wiki/Write-ahead_logging) entry but before sending the reply. The client retries, and the new [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) receives the same command again. Without [idempotency](https://en.wikipedia.org/wiki/Idempotence), the command is applied twice — if it was `INCR balance`, the balance is incremented twice. Every real [consensus](https://en.wikipedia.org/wiki/Consensus_(computer_science)) system — [etcd](https://etcd.io/), [ZooKeeper](https://zookeeper.apache.org/) — uses client IDs and sequence numbers or equivalent [idempotency keys](https://en.wikipedia.org/wiki/Idempotence) to solve this problem.

---

## Training Session

### Warmup — Idempotency concepts

1. Read the first three paragraphs of [Idempotence](https://en.wikipedia.org/wiki/Idempotence). Write down the difference between an [idempotent](https://en.wikipedia.org/wiki/Idempotence) operation (like SET) and a non-idempotent operation (like INCR).
2. Read Section 8 of the [Raft paper](https://raft.github.io/raft.pdf) on client interaction. Note that [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) itself does not guarantee [exactly-once semantics](https://en.wikipedia.org/wiki/Exactly-once_delivery) — the application layer [MUST](https://datatracker.ietf.org/doc/html/rfc2119) handle deduplication.
3. Think about a bank transfer: what happens if the client retries `TRANSFER $100 from A to B` and the server applies it twice? Write down why [at-least-once delivery](https://en.wikipedia.org/wiki/Message_delivery) without [idempotency](https://en.wikipedia.org/wiki/Idempotence) is dangerous.
4. Read the [Raft spec](https://raft.github.io/) overview. Note that the spec recommends a session-based approach where each client registers and gets a unique ID.

### Work — Build the deduplication layer

#### Do

1. Create `w12/client_request.h`. Define `struct client_request` with fields: `uint64_t client_id`, `uint64_t sequence_number`, `char command[256]`. Define `struct client_response` with fields: `int status` (0 = OK, 1 = DUPLICATE, -1 = ERROR), `char result[256]`.
2. Create `w12/dedup_table.h`. Define `struct dedup_entry` with fields: `uint64_t client_id`, `uint64_t last_sequence`, `char last_result[256]`. Define `struct dedup_table` with an array of entries and a count.
3. Create `w12/dedup_table.c`. Write `dedup_init(table)` that zeroes the table. Write `dedup_check(table, client_id, sequence_number)` that looks up the `client_id`. If `sequence_number` is less than or equal to `last_sequence`, return `DUPLICATE` and copy `last_result` into the response. If `sequence_number` is exactly `last_sequence + 1`, return `OK` (the request is new). If it is higher than `last_sequence + 1`, return `ERROR` (gap detected — the client skipped a sequence).
4. Write `dedup_record(table, client_id, sequence_number, result)` that updates the entry for `client_id` with the new `last_sequence` and `last_result`.
5. Write `dedup_lookup(table, client_id)` that returns a pointer to the entry for the given client, or NULL if the client has no entry yet. New clients get an entry with `last_sequence = 0`.
6. Create `w12/idempotency_test.c`. Register a client with `client_id = 42`. Send three requests with `sequence_number = 1` and the command `SET x=hello`. The first request [MUST](https://datatracker.ietf.org/doc/html/rfc2119) return OK. The second and third [MUST](https://datatracker.ietf.org/doc/html/rfc2119) return DUPLICATE.
7. Send a fourth request with `sequence_number = 2` and command `SET x=world`. It [MUST](https://datatracker.ietf.org/doc/html/rfc2119) return OK.
8. Send a fifth request with `sequence_number = 5` (skipping 3 and 4). It [MUST](https://datatracker.ietf.org/doc/html/rfc2119) return ERROR.

#### Test

```bash
gcc -Wall -Wextra -o idempotency_test w12/idempotency_test.c w12/dedup_table.c
./idempotency_test
```

#### Expected

```
req client=42 seq=1 cmd=SET x=hello → OK (applied)
req client=42 seq=1 cmd=SET x=hello → DUPLICATE (skipped)
req client=42 seq=1 cmd=SET x=hello → DUPLICATE (skipped)
req client=42 seq=2 cmd=SET x=world → OK (applied)
req client=42 seq=5 cmd=SET x=jump → ERROR (gap: expected seq=3)
idempotency_test: PASS
```

### Prove — Deeper understanding

Answer in your own words:

1. Why is `SET x=hello` naturally [idempotent](https://en.wikipedia.org/wiki/Idempotence) but `INCR counter` is not?
2. Why does the [deduplication table](https://en.wikipedia.org/wiki/Data_deduplication) store the `last_result` alongside the `last_sequence`?
3. What would happen if the [deduplication table](https://en.wikipedia.org/wiki/Data_deduplication) were lost during a [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) failover? How can the table be made durable?

### Ship

```bash
git add w12/client_request.h w12/dedup_table.h w12/dedup_table.c w12/idempotency_test.c
git commit -m "w12-l03: client idempotency with dedup table"
```

---

## Done when

- `struct client_request` carries `client_id` and `sequence_number`.
- `dedup_check()` detects duplicates and gaps.
- `dedup_record()` stores the latest applied sequence and result.
- The test sends the same request three times and sees OK once, DUPLICATE twice.
- A gap request returns ERROR.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Checking only the `sequence_number` without the `client_id` | Two different clients can have the same sequence number. The lookup [MUST](https://datatracker.ietf.org/doc/html/rfc2119) match on `client_id` first. |
| Not returning the cached result on duplicate | The client expects the original response. Returning an empty or generic DUPLICATE is incorrect — the cached `last_result` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be sent back. |
| Allowing gaps in the sequence | If `sequence_number` jumps from 1 to 5, requests 2–4 are missing. Applying 5 out of order may corrupt the state. Reject gaps. |
| Unbounded deduplication table growth | In production, old entries [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) be evicted after a timeout or session expiry. For this lesson, a fixed-size table is fine. |

## Proof

```bash
./idempotency_test
# → req client=42 seq=1 cmd=SET x=hello → OK (applied)
# → req client=42 seq=1 cmd=SET x=hello → DUPLICATE (skipped)
# → req client=42 seq=1 cmd=SET x=hello → DUPLICATE (skipped)
# → req client=42 seq=2 cmd=SET x=world → OK (applied)
# → req client=42 seq=5 cmd=SET x=jump → ERROR (gap: expected seq=3)
# → idempotency_test: PASS
```

## 🖼️ Hero Visual

```
  Client retry with deduplication:

  client                          leader (dedup table)
    │                                │
    │── req(cid=42, seq=1, SET x) ──▶│  table: {42: seq=0}
    │                                │  seq=1 > 0 → apply, record
    │◀────── OK (x=hello) ──────────│  table: {42: seq=1, res="hello"}
    │                                │
    │── req(cid=42, seq=1, SET x) ──▶│  RETRY (timeout)
    │                                │  seq=1 <= 1 → DUPLICATE
    │◀────── DUPLICATE (x=hello) ───│  return cached result
    │                                │
    │── req(cid=42, seq=2, SET y) ──▶│
    │                                │  seq=2 > 1 → apply, record
    │◀────── OK (y=world) ──────────│  table: {42: seq=2, res="world"}
```

## 🔮 Future Lock

- In [W12 L04](04-redirect-rules.md) the [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) will forward client requests to the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)), and the [deduplication table](https://en.wikipedia.org/wiki/Data_deduplication) ensures the redirect does not cause double application.
- In [W12 L06](06-regression-harness.md) the [regression harness](https://en.wikipedia.org/wiki/Regression_testing) will test idempotency by replaying the same request after a simulated [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) crash.
- In [W20](../w20/part.md) [chaos drills](https://en.wikipedia.org/wiki/Chaos_engineering) will kill the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) mid-request and verify the client retry is deduplicated by the new [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)).
