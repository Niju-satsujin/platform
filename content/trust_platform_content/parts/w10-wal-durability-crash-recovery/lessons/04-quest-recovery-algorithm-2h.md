---
id: w10-wal-durability-crash-recovery-d04-quest-recovery-algorithm-2h
part: w10-wal-durability-crash-recovery
title: "Quest: Recovery Algorithm  2h"
order: 4
duration_minutes: 120
prereqs: ["w10-wal-durability-crash-recovery-d03-quest-crash-drill-procedure-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Recovery Algorithm  2h

## Goal

Implement the **recovery algorithm** that replays WAL records to rebuild in-memory state after a crash — with idempotent replay, checksum validation on every record, and a strict cutoff rule that stops at the first invalid record and quarantines the remainder.

By end of this session you will have:

- ✅ A **WAL scanner** that reads records sequentially, validating CRC on each
- ✅ An **idempotent replay function** that applies records without duplicating effects
- ✅ A **replay cutoff rule** that stops at the first invalid record
- ✅ A **quarantine policy** for records after the cutoff point
- ✅ A **recovery report** summarizing records replayed, skipped, and quarantined

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Scanner reads records sequentially with CRC validation | Trace the scan loop |
| 2 | Replay is idempotent: applying the same record twice has no additional effect | Test with duplicate records |
| 3 | First invalid record triggers stop — no further records applied | Corrupt middle record, verify |
| 4 | Records after cutoff are quarantined, not deleted | Check quarantine file |
| 5 | Recovery report shows replayed/skipped/quarantined counts | Verify report output |

## What You're Building Today

The recovery algorithm — the code that runs on every startup to bring the KV store back to its last consistent state. It reads the WAL from beginning to end (or from the last snapshot), validates each record, applies it to state, and stops at the first sign of corruption.

By end of this session, you will have:

- ✅ File: `week-10/day4-recovery-algorithm.md`
- ✅ Sequential WAL scanner with per-record CRC validation
- ✅ Idempotent replay using request_id deduplication
- ✅ Cutoff at first bad record with quarantine of remainder

What "done" looks like:

```cpp
struct RecoveryReport {
    uint64_t records_replayed;
    uint64_t records_skipped;    // already applied (dedup)
    uint64_t records_quarantined;
    uint64_t last_valid_sequence;
    bool     had_corruption;
};

RecoveryReport recover_from_wal(const std::string& wal_path,
                                 KVStore& store);
```

You **can**: Rebuild complete KV state from WAL records with corruption detection.
You **cannot yet**: Combine snapshot + WAL recovery (Day 5) — today is WAL-only replay.

## Why This Matters

🔴 **Without this, you will:**
- Start with empty state after every crash — losing all data
- Apply corrupted records to state, producing garbage entries
- Replay records that were already applied before the crash, causing double-increments of version counters
- Have no way to tell operations what happened during recovery — how many records, any corruption

🟢 **With this, you will:**
- Recover to the exact last-committed state within seconds of restart
- Reject corrupted records before they touch state — corruption is contained
- Handle the "crash after apply, before next write" case correctly via idempotent replay
- Produce a recovery report for operational monitoring and alerting

🔗 **How this connects:**
- **To Day 1:** Recovery replays the WAL records defined in the WAL schema
- **To Day 3:** Torn tail detection (yesterday) runs BEFORE recovery replay
- **To Day 5:** Checkpoint + compaction reduces the number of records to replay
- **To Week 9 Day 1:** Request IDs in commands enable deduplication during replay
- **To Week 11 Day 4:** Follower catch-up uses the same replay logic for received entries

🧠 **Mental model: "Videotape Rewind"**

Recovery is like rewinding and replaying a videotape of every write your store ever processed. Each frame (WAL record) shows one mutation. You play frames sequentially, and each frame transforms the picture (state) by exactly one step. If a frame is damaged (bad CRC), you stop the tape — everything after the damage is unreliable. The frames before the damage are your last known-good picture. Idempotency means playing the same frame twice doesn't change the picture the second time — it's already there.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│               RECOVERY REPLAY FLOW                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  WAL File                                                │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐     │
│  │ R #1 │ R #2 │ R #3 │ R #4 │ XXXX │ R #6 │ R #7 │     │
│  │ OK ✓ │ OK ✓ │ OK ✓ │ OK ✓ │ BAD  │ ???  │ ???  │     │
│  └──┬───┴──┬───┴──┬───┴──┬───┴──┬───┴──────┴──────┘     │
│     │      │      │      │      │                        │
│     ▼      ▼      ▼      ▼      ▼                        │
│  ┌──────────────────────────────────────────────┐        │
│  │ Scanner validates CRC on each record         │        │
│  │                                              │        │
│  │ R#1: CRC ✓ → apply (or skip if dedup)        │        │
│  │ R#2: CRC ✓ → apply (or skip if dedup)        │        │
│  │ R#3: CRC ✓ → apply (or skip if dedup)        │        │
│  │ R#4: CRC ✓ → apply (or skip if dedup)        │        │
│  │ R#5: CRC ✗ → STOP. Cutoff here.             │        │
│  │                                              │        │
│  │ R#6, R#7: QUARANTINED (not applied)          │        │
│  └──────────────────────────────────────────────┘        │
│                                                          │
│  Recovery Report:                                        │
│  ├── Replayed: 4   Skipped: 0   Quarantined: 2          │
│  ├── Last valid sequence: 4                              │
│  └── Corruption detected: YES at record 5               │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-10/day4-recovery-algorithm.md`

## Do

1. **Implement the sequential WAL scanner**
   > 💡 *WHY: Records must be replayed in order — sequence 1, then 2, then 3. Out-of-order replay violates the total ordering guarantee and produces incorrect state. The scanner reads linearly, never skips ahead.*

   Write the scanner:

   ```cpp
   struct ScanResult {
       std::vector<WALRecord> valid_records;
       off_t cutoff_position;        // byte offset of first bad record
       uint64_t last_valid_sequence;
       bool corruption_found;
   };

   ScanResult scan_wal(int fd) {
       ScanResult result{};
       off_t pos = sizeof(WALHeader);
       off_t file_size = lseek(fd, 0, SEEK_END);
       while (pos < file_size) {
           uint32_t rec_len;
           if (pread(fd, &rec_len, 4, pos) != 4) break;
           if (pos + 4 + rec_len > file_size) {
               result.corruption_found = true;
               break;  // torn record
           }
           std::vector<uint8_t> data(rec_len);
           pread(fd, data.data(), rec_len, pos + 4);
           // Validate CRC
           uint32_t stored_crc = read_u32(data.data() + rec_len - 4);
           uint32_t computed = crc32(data.data(), rec_len - 4);
           if (stored_crc != computed) {
               result.corruption_found = true;
               break;  // CRC mismatch — stop here
           }
           auto record = deserialize_wal_record(data);
           result.valid_records.push_back(record);
           result.last_valid_sequence = record.sequence;
           pos += 4 + rec_len;
       }
       result.cutoff_position = pos;
       return result;
   }
   ```

2. **Implement idempotent replay**
   > 💡 *WHY: A crash can happen after applying a record to state but before the next write. On recovery, that record is in the WAL and already in state. Applying it again would double-increment the version. Request-ID dedup prevents this.*

   Write the replay function:

   ```cpp
   void replay_record(KVStore& store,
                       std::unordered_set<std::string>& seen_ids,
                       const WALRecord& rec,
                       RecoveryReport& report) {
       // Check if this request_id was already applied
       if (!rec.request_id.empty() && seen_ids.count(rec.request_id)) {
           report.records_skipped++;
           return;  // idempotent: already applied
       }
       // Apply the command
       KVRequest req{rec.command, rec.key, rec.value, rec.request_id};
       store.apply_without_wal(req, rec.sequence);  // bypass WAL during replay
       seen_ids.insert(rec.request_id);
       report.records_replayed++;
   }
   ```

3. **Implement the cutoff rule**
   > 💡 *WHY: After the first invalid record, you cannot trust any subsequent records. Even if record #6 has a valid CRC, it might depend on data from the corrupt record #5. The cutoff rule is conservative: stop and quarantine.*

   Enforce the rule in the recovery function:

   ```cpp
   RecoveryReport recover_from_wal(const std::string& wal_path,
                                    KVStore& store) {
       int fd = open(wal_path.c_str(), O_RDONLY);
       auto scan = scan_wal(fd);
       RecoveryReport report{};
       std::unordered_set<std::string> seen_ids;
       // Replay only valid records (before cutoff)
       for (const auto& rec : scan.valid_records) {
           replay_record(store, seen_ids, rec, report);
       }
       report.last_valid_sequence = scan.last_valid_sequence;
       report.had_corruption = scan.corruption_found;
       // Quarantine: count records after cutoff
       if (scan.corruption_found) {
           off_t remaining = lseek(fd, 0, SEEK_END) - scan.cutoff_position;
           report.records_quarantined = remaining;  // bytes, not records
           quarantine_tail(wal_path, scan.cutoff_position);
       }
       close(fd);
       return report;
   }
   ```

4. **Implement the quarantine function**
   > 💡 *WHY: Deleting corrupt data permanently destroys evidence. Quarantining copies the suspect bytes to a separate file for later forensic analysis, then truncates the WAL. You can investigate the corruption cause without risking live data.*

   Write the quarantine function:

   ```cpp
   void quarantine_tail(const std::string& wal_path, off_t cutoff) {
       std::string quarantine_path = wal_path + ".quarantine." +
           std::to_string(time(nullptr));
       int src = open(wal_path.c_str(), O_RDONLY);
       int dst = open(quarantine_path.c_str(),
                      O_WRONLY | O_CREAT | O_TRUNC, 0644);
       off_t file_size = lseek(src, 0, SEEK_END);
       size_t qlen = file_size - cutoff;
       std::vector<uint8_t> buf(qlen);
       pread(src, buf.data(), qlen, cutoff);
       write(dst, buf.data(), qlen);
       fsync(dst);
       close(dst);
       close(src);
       // Truncate WAL at cutoff
       truncate(wal_path.c_str(), cutoff);
       log_info("Quarantined {} bytes to {}", qlen, quarantine_path);
   }
   ```

5. **Generate the recovery report**
   > 💡 *WHY: Operations teams need to know what happened during recovery. How many records were replayed? Were any duplicates skipped? Was corruption detected? The report is the audit trail.*

   Define the report output:

   ```cpp
   void print_recovery_report(const RecoveryReport& report) {
       log_info("=== RECOVERY REPORT ===");
       log_info("Records replayed:    {}", report.records_replayed);
       log_info("Records skipped:     {}", report.records_skipped);
       log_info("Bytes quarantined:   {}", report.records_quarantined);
       log_info("Last valid sequence: {}", report.last_valid_sequence);
       log_info("Corruption found:    {}",
                report.had_corruption ? "YES" : "NO");
       if (report.had_corruption)
           log_warn("ACTION: Investigate quarantine file for corruption cause");
       log_info("=== RECOVERY COMPLETE ===");
   }
   ```

## Done when

- [ ] WAL scanner reads sequentially, validates CRC on each record — *no record enters state without integrity check*
- [ ] Replay is idempotent via request_id deduplication — *safe to replay records that were already applied before crash*
- [ ] First invalid record triggers complete stop — no records after cutoff are applied — *conservative correctness guarantee*
- [ ] Quarantine copies suspect bytes to separate file before truncation — *preserves evidence for forensic analysis*
- [ ] Recovery report summarizes replayed, skipped, and quarantined counts — *operational visibility into every recovery*

## Proof

Paste your WAL scanner, idempotent replay function, and recovery report format, or upload `week-10/day4-recovery-algorithm.md`.

**Quick self-test** (answer without looking at your notes):

1. Why stop at the first invalid record instead of skipping it and continuing? → **Record #6 might depend on the state change from record #5. If #5 is corrupt and not applied, applying #6 could produce incorrect state. The safe choice is to stop — you know everything before the cutoff is consistent.**
2. How does idempotent replay handle a record that was applied to state but not yet visible to the dedup set? → **During initial recovery, the dedup set is built as records are replayed. If a crash happened after state-apply but before the next write, the state already has the effect. The replay re-applies it, which is a no-op for version-incrementing because the request_id was stored in the state machine's dedup table (Week 12).**
3. Why quarantine instead of delete the corrupt tail? → **The corrupt bytes might contain useful forensic information — partial writes that indicate a specific failure mode, or data that could be manually reconstructed. Deleting destroys evidence.**
