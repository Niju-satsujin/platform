---
id: w10-wal-durability-crash-recovery-d01-quest-wal-schema-2h
part: w10-wal-durability-crash-recovery
title: "Quest: WAL Schema  2h"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: WAL Schema  2h

## Goal

Design the **Write-Ahead Log schema** for your KV store so every mutation is appended to a durable, ordered log BEFORE it is applied to in-memory state — guaranteeing that no acknowledged write is ever lost, even after a crash.

By end of this session you will have:

- ✅ A **WAL record format** containing sequence number, command type, payload, and CRC32 checksum
- ✅ An **append-before-apply rule** enforced in the write path — WAL write must succeed before state changes
- ✅ A **WAL file structure** with a header, sequential records, and EOF marker
- ✅ A **durable ordering guarantee** proving WAL record order matches apply order
- ✅ A **fsync policy tradeoff document** outlining when sync is required vs batched (detailed in Day 2)

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | WAL record has sequence, type, key, value, CRC32 | Review record struct |
| 2 | Append-before-apply: WAL write precedes state mutation | Trace the write path |
| 3 | WAL header has magic bytes and version | Check file format |
| 4 | Records are ordered by monotonic sequence | Verify no out-of-order appends |
| 5 | Fsync tradeoff documented with at least 3 options | Review policy document |

## What You're Building Today

A WAL (Write-Ahead Log) — the single most important durability mechanism in any storage system. Every database, every filesystem, every distributed log uses this pattern: write the intent to a durable log first, then apply the change. If you crash after the log write but before the apply, you replay the log on restart.

By end of this session, you will have:

- ✅ File: `week-10/day1-wal-schema.md`
- ✅ WAL record format: `[seq][type][key_len][key][val_len][val][crc32]`
- ✅ Write path: validate → WAL append → fsync → apply to state → respond
- ✅ File structure: header + sequential records

What "done" looks like:

```cpp
struct WALRecord {
    uint64_t sequence;         // monotonic, matches global_sequence
    CmdType  command;          // PUT or DELETE
    std::string key;
    std::string value;         // empty for DELETE
    std::string request_id;    // for dedup on replay
    uint32_t crc;              // CRC32 of all fields above
};

bool wal_append(int wal_fd, const WALRecord& record);
```

You **can**: Append every mutation to a durable log before applying it to memory.
You **cannot yet**: Control fsync timing (Day 2), simulate crashes (Day 3), or replay the log (Day 4).

## Why This Matters

🔴 **Without this, you will:**
- Lose every in-memory write on crash — hours of work vanished
- Acknowledge writes to clients that never actually persisted — violating durability promises
- Have no way to recover state after restart except from stale snapshots
- Build replication (Week 11) on an ephemeral state machine — followers can't catch up from a log that doesn't exist

🟢 **With this, you will:**
- Survive any crash: restart, replay the WAL, recover to the last committed write
- Guarantee that every acknowledged write exists in the log — the durability contract
- Provide replication with a persistent command log that followers can subscribe to
- Enable checkpoint + truncation (Day 5) for bounded recovery time

🔗 **How this connects:**
- **To Week 9 Day 3:** WAL records use the serialization format from last week
- **To Week 9 Day 5:** WAL append happens inside the single-writer lock
- **To Day 2:** Fsync policy controls when WAL bytes actually hit disk
- **To Day 4:** Recovery algorithm replays these records to rebuild state
- **To Week 11 Day 2:** Append RPC ships WAL records from leader to followers

🧠 **Mental model: "Accountant's Ledger"**

An accountant never changes the balance sheet directly. They write every transaction in a ledger first, then update the balance. If someone interrupts them mid-update, the ledger is the source of truth — they can re-derive the balance from it. The WAL is your ledger. The in-memory KV state is the balance sheet. The balance sheet is a convenience cache; the ledger is the truth. If you lose the balance sheet (crash), you recompute it from the ledger (replay). If you lose the ledger, you've lost everything.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│                 WAL WRITE PATH                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Client Request                                          │
│      │                                                   │
│      ▼                                                   │
│  ┌──────────────┐                                       │
│  │  1. Validate  │── reject invalid ──▶ ERROR response  │
│  └──────┬───────┘                                       │
│         │ valid                                          │
│         ▼                                                │
│  ┌──────────────┐    ┌────────────────────────────┐     │
│  │ 2. WAL Append │──▶│ WAL File (append-only)     │     │
│  │    + CRC      │    │ ┌──────┐┌──────┐┌──────┐  │     │
│  └──────┬───────┘    │ │ R #1 ││ R #2 ││ R #3 │  │     │
│         │ success     │ └──────┘└──────┘└──────┘  │     │
│         ▼             └────────────────────────────┘     │
│  ┌──────────────┐                                       │
│  │ 3. Fsync     │── force bytes to disk                 │
│  └──────┬───────┘                                       │
│         │ durable                                        │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ 4. Apply to  │── update in-memory KV state           │
│  │    State     │                                        │
│  └──────┬───────┘                                       │
│         │                                                │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ 5. Respond   │── OK to client (write is durable)     │
│  └──────────────┘                                       │
│                                                          │
│  CRASH SAFETY: If crash at step 3/4, replay from WAL    │
│  ORDERING: sequence numbers are strictly monotonic       │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-10/day1-wal-schema.md`

## Do

1. **Define the WAL record format**
   > 💡 *WHY: Every field in the WAL record must be recoverable independently. The sequence number orders records. The CRC detects corruption. The request_id enables deduplication during replay. Missing any field makes recovery unreliable.*

   Specify the binary layout:

   ```cpp
   // WAL Record binary layout (little-endian):
   // [8B sequence] [1B command_type] [4B key_len] [key bytes]
   // [4B val_len] [val bytes] [4B req_id_len] [req_id bytes]
   // [4B crc32]

   std::vector<uint8_t> serialize_wal_record(const WALRecord& rec) {
       std::vector<uint8_t> buf;
       write_u64(buf, rec.sequence);
       buf.push_back(static_cast<uint8_t>(rec.command));
       write_string(buf, rec.key);
       write_string(buf, rec.value);
       write_string(buf, rec.request_id);
       uint32_t crc = crc32(buf.data(), buf.size());
       write_u32(buf, crc);
       return buf;
   }
   ```

2. **Implement the append-before-apply write path**
   > 💡 *WHY: The order is critical: WAL THEN state. If you apply first and crash before WAL write, the client got an OK but the write is lost. If you WAL first and crash before apply, replay restores the write. This is the WAL guarantee.*

   Integrate into the KV store write path:

   ```cpp
   KVResponse KVStore::apply(const KVRequest& req) {
       std::unique_lock<std::mutex> lock(write_mutex_);
       if (!validate_request(req))
           return {KVResponse::ERROR, "", req.request_id, "invalid"};
       uint64_t seq = ++global_sequence_;
       // STEP 1: Append to WAL FIRST
       WALRecord rec{seq, req.type, req.key, req.value, req.request_id, 0};
       if (!wal_append(wal_fd_, rec)) {
           --global_sequence_;  // rollback sequence
           return {KVResponse::ERROR, "", req.request_id, "WAL write failed"};
       }
       // STEP 2: Apply to state ONLY after WAL success
       auto resp = apply_to_state(req, seq);
       return resp;
   }
   ```

3. **Define the WAL file header**
   > 💡 *WHY: The header identifies the file as a WAL and specifies its format version. Without it, opening a random file as WAL produces garbage. The header also records the starting sequence for this WAL segment.*

   Design the header:

   ```cpp
   struct WALHeader {
       uint8_t  magic[4] = {'W','A','L','1'};   // file identification
       uint8_t  version = 0x01;                  // format version
       uint64_t start_sequence;                   // first record's expected seq
       uint32_t header_crc;                       // CRC of above fields
   };
   // Total: 4 + 1 + 8 + 4 = 17 bytes

   bool write_wal_header(int fd, uint64_t start_seq) {
       WALHeader hdr;
       hdr.start_sequence = start_seq;
       hdr.header_crc = crc32(&hdr, offsetof(WALHeader, header_crc));
       return write(fd, &hdr, sizeof(hdr)) == sizeof(hdr);
   }
   ```

4. **Implement the append function with record length framing**
   > 💡 *WHY: Records are variable-length (key and value sizes differ). Length-prefixing each record lets the reader skip forward without parsing the payload. On corruption, the reader can detect a torn record by checking length vs available bytes.*

   Write the append function:

   ```cpp
   bool wal_append(int wal_fd, const WALRecord& record) {
       auto payload = serialize_wal_record(record);
       uint32_t rec_len = payload.size();
       // Write length prefix + payload atomically
       struct iovec iov[2];
       iov[0].iov_base = &rec_len;
       iov[0].iov_len = sizeof(rec_len);
       iov[1].iov_base = payload.data();
       iov[1].iov_len = payload.size();
       ssize_t written = writev(wal_fd, iov, 2);
       return written == (ssize_t)(sizeof(rec_len) + payload.size());
   }
   ```

5. **Document the fsync policy tradeoff (overview for Day 2)**
   > 💡 *WHY: Writing to WAL is not durable until fsync. But fsync is slow (~1ms on SSD, ~10ms on HDD). You need to decide: sync every record (safest, slowest), batch sync (faster, risk window), or no sync (fastest, data loss on crash).*

   Create the tradeoff table:

   | Policy | Durability | Latency | Data loss window |
   |--------|-----------|---------|------------------|
   | Sync every write | Full | ~1ms per write | Zero |
   | Batch sync (every N writes or T ms) | High | Amortized | Up to N writes or T ms |
   | No sync (OS decides) | Low | Minimal | Up to 30s of writes |
   | Group commit (Day 2) | High | Amortized | Single batch |

   **Rule for today:** Use sync-every-write as the default. Day 2 explores optimizations.

## Done when

- [ ] WAL record has sequence, command, key, value, request_id, CRC32 — *the replication unit for Week 11*
- [ ] Append-before-apply enforced: WAL write succeeds before state mutation — *the durability guarantee*
- [ ] WAL header has magic bytes, version, start_sequence — *file identification and format versioning*
- [ ] Append uses length-prefixed records for skip-forward capability — *recovery (Day 4) scans these records*
- [ ] Fsync tradeoff documented with 4 policy options — *detailed implementation in Day 2*

## Proof

Paste your WAL record struct, append-before-apply write path, and fsync tradeoff table, or upload `week-10/day1-wal-schema.md`.

**Quick self-test** (answer without looking at your notes):

1. What happens if you apply to state BEFORE the WAL append and then crash? → **The client received OK, but the WAL doesn't have the record. On restart, replay skips this write — the acknowledged data is permanently lost. This violates the durability contract.**
2. Why does the WAL record include request_id? → **During replay after a crash, some records may have already been applied before the crash. The request_id enables deduplication — the replay engine skips records whose request_id is already in the state.**
3. Why use writev() instead of two separate write() calls? → **writev() is a single syscall that writes the length prefix and payload atomically. Two separate write() calls could be interrupted by a crash between them, leaving a length prefix with no payload — a torn record.**
