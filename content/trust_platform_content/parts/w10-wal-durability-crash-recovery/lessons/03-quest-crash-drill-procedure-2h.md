---
id: w10-wal-durability-crash-recovery-d03-quest-crash-drill-procedure-2h
part: w10-wal-durability-crash-recovery
title: "Quest: Crash Drill Procedure  2h"
order: 3
duration_minutes: 120
prereqs: ["w10-wal-durability-crash-recovery-d02-quest-fsync-policy-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Crash Drill Procedure  2h

## Goal

Design a **crash drill procedure** that systematically tests your WAL's durability by simulating abrupt termination at every critical point in the write path — verifying that torn writes are detected, partial records are ignored, and restart recovery reaches a consistent state.

By end of this session you will have:

- ✅ A **crash point map** identifying every location in the write path where a crash could occur
- ✅ A **torn write detector** that identifies incomplete records at the WAL tail
- ✅ A **crash simulation script** using SIGKILL to terminate the process mid-operation
- ✅ A **restart verification checklist** confirming state consistency after recovery
- ✅ A **corrupt tail policy** defining how to handle the partial record at the end of a crashed WAL

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Crash point map covers 5+ locations in the write path | Review map |
| 2 | Torn write detected by length vs available bytes mismatch | Test with truncated record |
| 3 | Crash simulation uses SIGKILL (not SIGTERM) | Verify signal in script |
| 4 | Restart verification checks entry count and last sequence | Review checklist |
| 5 | Corrupt tail policy: truncate and log, never apply partial | Check policy |

## What You're Building Today

A crash-testing methodology — not just "does it work?" but "does it survive violent death at every possible moment?" You will map every crash point, build a kill script, and define the recovery verification procedure.

By end of this session, you will have:

- ✅ File: `week-10/day3-crash-drill-procedure.md`
- ✅ Crash point map: 5+ failure points with expected behavior at each
- ✅ Kill script: write N records, SIGKILL at random, verify on restart
- ✅ Torn write detection: identify and safely discard incomplete WAL tail

What "done" looks like:

```cpp
// Torn write detection at WAL tail
enum class TailStatus { CLEAN, TORN_RECORD, CORRUPT_CRC };

TailStatus check_wal_tail(int fd, off_t file_size) {
    // Read last record's length prefix
    // If length_prefix + sizeof(length) > remaining bytes → TORN
    // If CRC mismatch on last record → CORRUPT_CRC
    // Otherwise → CLEAN
}
```

You **can**: Simulate crashes, detect torn writes, and define the recovery starting point.
You **cannot yet**: Replay the WAL to rebuild state (Day 4) — today is crash detection and classification.

## Why This Matters

🔴 **Without this, you will:**
- Assume your WAL is always clean — then encounter a partial record in production and panic
- Attempt to parse a torn record as valid data, corrupting the deserialized state
- Have no reproducible procedure for testing crash safety — "it probably works" is not engineering
- Discover crash bugs only in production, where the cost is customer data loss

🟢 **With this, you will:**
- Know exactly what happens at every crash point — documented and tested
- Detect and safely discard torn records without touching valid data
- Run crash drills regularly as part of your testing suite
- Have confidence that your recovery procedure (Day 4) starts from a known-good point

🔗 **How this connects:**
- **To Day 1:** Crash points exist in the WAL append path designed yesterday
- **To Day 2:** Fsync policy determines which writes survive a crash
- **To Day 4:** Recovery algorithm starts after torn-write detection trims the WAL tail
- **To Week 11 Day 1:** Failure model includes crash-stop — this drill proves crash-stop behavior
- **To Week 12 Day 5:** Stale-leader fencing must survive leader crash during term transition

🧠 **Mental model: "Fire Drill"**

A fire drill doesn't prevent fires — it ensures everyone knows what to do when one happens. A crash drill doesn't prevent crashes — it ensures your system knows how to recover from one. You practice the drill so the response is automatic: detect the torn tail, truncate it, log it, and resume from the last clean record. If you've never practiced, your first real crash becomes a data loss incident instead of a routine recovery.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│              CRASH POINT MAP — WAL WRITE PATH             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  write_mutex_ acquired                                   │
│      │                                                   │
│      ▼                                                   │
│  ┌──────────────┐                                       │
│  │ validate req  │ ◀── CRASH A: no effect, nothing       │
│  └──────┬───────┘      written yet                      │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ ++sequence    │ ◀── CRASH B: seq incremented but      │
│  └──────┬───────┘      WAL not written — seq gap         │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ write length  │ ◀── CRASH C: length prefix written,   │
│  │ prefix        │      no payload — TORN RECORD         │
│  └──────┬───────┘                                       │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ write payload │ ◀── CRASH D: partial payload —        │
│  │ (partial)     │      length says 200B, only 80B       │
│  └──────┬───────┘      written — TORN RECORD             │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ fsync         │ ◀── CRASH E: payload in kernel        │
│  │               │      buffer, not on disk              │
│  └──────┬───────┘                                       │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ apply state   │ ◀── CRASH F: WAL durable, state       │
│  │               │      not updated — replay fixes this  │
│  └──────┬───────┘                                       │
│         ▼                                                │
│  respond to client       CRASH G: client may not get OK  │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-10/day3-crash-drill-procedure.md`

## Do

1. **Map every crash point in the write path**
   > 💡 *WHY: You cannot test what you haven't enumerated. Each crash point has different consequences — some are harmless, some leave torn records, some lose in-flight data. The map is your testing checklist.*

   Document each crash point:

   | Point | Location | WAL state after crash | State machine effect |
   |-------|----------|-----------------------|---------------------|
   | A | Before WAL write | Unchanged | None — request lost |
   | B | After seq increment, before write | Seq gap in memory | None on disk |
   | C | After length prefix, before payload | Torn: length but no data | Tail must be truncated |
   | D | Mid-payload write | Torn: partial record | Tail must be truncated |
   | E | After write, before fsync | Data in kernel buffer | May or may not survive |
   | F | After fsync, before state apply | WAL durable, state stale | Replay restores it |
   | G | After apply, before client response | Fully durable | Client may retry (dedup handles it) |

2. **Implement torn write detection**
   > 💡 *WHY: After a crash, the WAL may have a partial record at the end. You must detect it by comparing the length prefix to the actual remaining bytes. If they don't match, the last record is torn and must be discarded.*

   Write the tail checker:

   ```cpp
   TailStatus check_wal_tail(int fd) {
       off_t file_size = lseek(fd, 0, SEEK_END);
       off_t pos = sizeof(WALHeader);  // skip header
       while (pos < file_size) {
           // Read record length
           uint32_t rec_len;
           if (file_size - pos < sizeof(rec_len))
               return TailStatus::TORN_RECORD;  // can't even read length
           pread(fd, &rec_len, sizeof(rec_len), pos);
           pos += sizeof(rec_len);
           if (pos + rec_len > file_size)
               return TailStatus::TORN_RECORD;  // payload incomplete
           // Read and verify CRC
           std::vector<uint8_t> data(rec_len);
           pread(fd, data.data(), rec_len, pos);
           uint32_t stored_crc = read_u32(data.data() + rec_len - 4);
           uint32_t computed_crc = crc32(data.data(), rec_len - 4);
           if (stored_crc != computed_crc)
               return TailStatus::CORRUPT_CRC;
           pos += rec_len;
       }
       return TailStatus::CLEAN;
   }
   ```

3. **Write the crash simulation script**
   > 💡 *WHY: SIGKILL is unblockable — the process dies instantly with no cleanup. This simulates power failure or kernel panic. SIGTERM allows graceful shutdown and is NOT a valid crash test.*

   Create the drill script:

   ```bash
   #!/bin/bash
   # crash-drill.sh — kill the KV store mid-write
   set -e
   ./kv_store --wal-dir=/tmp/crash-test &
   PID=$!
   sleep 0.5
   # Write 1000 records as fast as possible
   for i in $(seq 1 1000); do
       echo "PUT key$i value$i req$i" | nc localhost 9000 &
   done
   # Kill mid-flight after random delay
   sleep 0.$((RANDOM % 500))
   kill -9 $PID   # SIGKILL — no cleanup
   wait $PID 2>/dev/null || true
   # Restart and verify
   ./kv_store --wal-dir=/tmp/crash-test --verify-only
   echo "Crash drill complete. Check recovery log."
   ```

4. **Define the restart verification checklist**
   > 💡 *WHY: After a crash, you need to verify the recovered state is consistent. "It started up" is not sufficient. You must check entry count, sequence continuity, and checksum integrity.*

   Create the checklist:

   ```
   RESTART VERIFICATION CHECKLIST:
   ├── [ ] WAL header magic and version valid
   ├── [ ] Torn tail detected and truncated (if any)
   ├── [ ] Truncated bytes logged for audit
   ├── [ ] All remaining records pass CRC validation
   ├── [ ] Sequence numbers are monotonically increasing
   ├── [ ] No sequence gaps (or gaps are logged)
   ├── [ ] State rebuilt matches entry count from valid records
   ├── [ ] Global sequence set to last valid record's sequence
   └── [ ] System ready to accept new writes
   ```

5. **Define the corrupt tail policy**
   > 💡 *WHY: A torn record at the end of the WAL is expected after a crash. Your policy must define exactly what to do: truncate the file at the last valid record, log the discarded bytes, and continue. NEVER attempt to parse or "fix" a torn record.*

   Document the policy:

   ```cpp
   void handle_wal_tail(int fd, off_t last_valid_end) {
       off_t file_size = lseek(fd, 0, SEEK_END);
       if (file_size > last_valid_end) {
           size_t torn_bytes = file_size - last_valid_end;
           log_warn("Truncating {} torn bytes from WAL tail", torn_bytes);
           ftruncate(fd, last_valid_end);
           fsync(fd);  // make truncation durable
       }
       // WAL is now clean — ready for new appends
   }
   ```

   **Rules:**
   - NEVER try to recover data from a torn record
   - ALWAYS log what was truncated (byte count and position)
   - ALWAYS fsync after truncation to make it durable
   - Truncation is the ONLY valid action for torn tails

## Done when

- [ ] Crash point map covers 7 locations from validation to client response — *your crash-testing checklist*
- [ ] Torn write detector compares length prefix to available bytes — *identifies partial records safely*
- [ ] Crash simulation uses SIGKILL with random timing — *reproduces real crash conditions*
- [ ] Restart verification checklist has 9 items covering integrity and continuity — *proves recovery correctness*
- [ ] Corrupt tail policy: truncate, log, fsync — never parse partial data — *the only safe response to torn writes*

## Proof

Paste your crash point map, torn write detection function, and corrupt tail policy, or upload `week-10/day3-crash-drill-procedure.md`.

**Quick self-test** (answer without looking at your notes):

1. Why use SIGKILL instead of SIGTERM for crash testing? → **SIGTERM can be caught — the process might flush buffers and shut down cleanly. SIGKILL is unblockable — the process dies instantly, simulating real power failure or OOM-kill. Only SIGKILL tests true crash safety.**
2. What does a torn record look like on disk? → **A length prefix says the record is 200 bytes, but only 80 bytes follow. The remaining 120 bytes were never written because the process was killed mid-write.**
3. Why must you fsync after truncating the torn tail? → **Without fsync, the truncation is in the kernel buffer. If the system crashes again before the OS flushes, the torn tail reappears on next restart — and you re-detect it. Fsync makes the truncation permanent.**
