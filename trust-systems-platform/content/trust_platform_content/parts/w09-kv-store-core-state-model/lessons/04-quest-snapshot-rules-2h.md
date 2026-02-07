---
id: w09-kv-store-core-state-model-d04-quest-snapshot-rules-2h
part: w09-kv-store-core-state-model
title: "Quest: Snapshot Rules  2h"
order: 4
duration_minutes: 120
prereqs: ["w09-kv-store-core-state-model-d03-quest-serialization-format-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Snapshot Rules  2h

## Goal

Design the **snapshot system** for your KV store so you can capture a point-in-time copy of the entire state, write it atomically to disk, and restore from it safely — with validation that rejects corrupt or schema-mismatched snapshot files.

By end of this session you will have:

- ✅ A **snapshot file format** with a header containing metadata (schema version, entry count, global sequence, checksum)
- ✅ An **atomic write procedure** using write-to-temp + rename to prevent partial snapshots
- ✅ A **snapshot restore function** that validates checksum and schema version before applying
- ✅ A **consistency point** tying the snapshot to a specific global sequence number
- ✅ A **snapshot rejection policy** for corrupt, incomplete, or schema-mismatched files

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Snapshot header has schema version, entry count, global sequence | Review header struct |
| 2 | Write uses temp file + atomic rename | Verify no partial snapshot possible |
| 3 | Restore validates header checksum before reading entries | Check validation order |
| 4 | Restore rejects unknown schema versions | Test with schema_version=99 |
| 5 | Consistency point ties snapshot to a global sequence number | Verify sequence in header |

## What You're Building Today

A snapshot mechanism that persists the full KV state to a single file — enabling fast recovery without replaying the entire WAL (Week 10) and providing a baseline for follower catch-up (Week 11).

By end of this session, you will have:

- ✅ File: `week-9/day4-snapshot-rules.md`
- ✅ Snapshot format: header + concatenated serialized entries + footer checksum
- ✅ Atomic write: write-to-temp → fsync → rename — no partial files
- ✅ Restore with validation: reject if checksum fails or schema unknown

What "done" looks like:

```cpp
struct SnapshotHeader {
    uint8_t  schema_version;   // must match reader's known version
    uint32_t entry_count;      // number of KV entries in snapshot
    uint64_t global_sequence;  // sequence at time of capture
    uint32_t header_crc;       // CRC of header fields above
};

bool write_snapshot(const std::string& path,
                    const std::map<std::string, VersionedEntry>& store,
                    uint64_t global_seq);

std::optional<std::map<std::string, VersionedEntry>>
    load_snapshot(const std::string& path);
```

You **can**: Capture, persist, and restore the full KV state atomically.
You **cannot yet**: Coordinate snapshots with WAL truncation (Week 10 Day 5) or ship snapshots to followers (Week 11 Day 4).

## Why This Matters

🔴 **Without this, you will:**
- Rely on WAL replay from the very beginning for every restart — minutes or hours of replay
- Risk loading a half-written snapshot file after a crash during snapshot write
- Accept a snapshot with a different schema version, silently corrupting state
- Have no fallback when a follower is too far behind for log-based catch-up

🟢 **With this, you will:**
- Restart in seconds by loading the latest snapshot, then replaying only recent WAL entries
- Never load a partial snapshot — atomic rename guarantees all-or-nothing visibility
- Reject incompatible snapshots at load time with a clear error
- Provide a snapshot-install path for followers that are hopelessly behind

🔗 **How this connects:**
- **To Day 3:** Each entry in the snapshot is serialized using the format from yesterday
- **To Day 5:** Concurrency policy determines whether snapshot capture blocks writes
- **To Week 10 Day 5:** Checkpoint triggers snapshot write and then truncates the WAL
- **To Week 11 Day 4:** Follower catch-up falls back to snapshot install when log is insufficient
- **To Week 12 Day 5:** Stale-leader fencing checks snapshot sequence against current term

🧠 **Mental model: "Photograph of State"**

A snapshot is a photograph of your KV store at one instant. Like a photograph, it freezes everything — every key, every value, every version — at a single point in time (the global sequence number). After taking the photograph, new writes continue but don't change the photo. On restore, you "develop" the photo back into live state. The header is the timestamp on the back of the photo: it tells you when it was taken, how many subjects are in it, and whether the film (schema) is compatible with your viewer.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│                SNAPSHOT FILE LAYOUT                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────┐          │
│  │ HEADER                                     │          │
│  │  schema_version : 0x01                     │          │
│  │  entry_count    : 3                        │          │
│  │  global_sequence: 42                       │          │
│  │  header_crc     : 0xA3B2C1D0              │          │
│  └────────────────────────────────────────────┘          │
│  ┌────────────────────────────────────────────┐          │
│  │ ENTRY 1  (serialized VersionedEntry)       │          │
│  │  [schema][key_len][key][val_len][val]      │          │
│  │  [version][created][modified][entry_crc]   │          │
│  ├────────────────────────────────────────────┤          │
│  │ ENTRY 2  (serialized VersionedEntry)       │          │
│  ├────────────────────────────────────────────┤          │
│  │ ENTRY 3  (serialized VersionedEntry)       │          │
│  └────────────────────────────────────────────┘          │
│  ┌────────────────────────────────────────────┐          │
│  │ FOOTER                                     │          │
│  │  total_bytes: 1847                         │          │
│  │  footer_crc : CRC32(entire file above)     │          │
│  └────────────────────────────────────────────┘          │
│                                                          │
│  WRITE PATH:  state ──▶ temp.snap ──▶ fsync             │
│                         ──▶ rename(temp, snapshot.dat)   │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-9/day4-snapshot-rules.md`

## Do

1. **Define the snapshot file header**
   > 💡 *WHY: The header is the first thing the reader checks. If schema_version is wrong or header_crc fails, the reader stops immediately — no time wasted parsing entries from an incompatible file.*

   Define your header structure:

   ```cpp
   struct SnapshotHeader {
       uint8_t  magic[4] = {'S','N','A','P'};  // file identification
       uint8_t  schema_version = 0x01;
       uint32_t entry_count;
       uint64_t global_sequence;  // consistency point
       uint32_t header_crc;       // CRC of bytes 0 to here (exclusive)
   };
   // Total header size: 4 + 1 + 4 + 8 + 4 = 21 bytes
   ```

   **Rule:** Always read and validate the header BEFORE reading any entries.

2. **Implement atomic snapshot write**
   > 💡 *WHY: If the process crashes mid-write, a partial snapshot file is worse than no snapshot — it might be loaded on the next restart and corrupt state. Write-to-temp + rename is the standard atomic file pattern on POSIX systems.*

   Write the snapshot function:

   ```cpp
   bool write_snapshot(const std::string& path,
                       const std::map<std::string, VersionedEntry>& store,
                       uint64_t global_seq) {
       std::string tmp = path + ".tmp";
       int fd = open(tmp.c_str(), O_WRONLY | O_CREAT | O_TRUNC, 0644);
       if (fd < 0) return false;
       // Write header
       SnapshotHeader hdr;
       hdr.entry_count = store.size();
       hdr.global_sequence = global_seq;
       // ... serialize header, compute header_crc ...
       write(fd, &hdr, sizeof(hdr));
       // Write each entry using Day 3 serialize()
       for (const auto& [key, entry] : store) {
           auto bytes = serialize(entry);
           uint32_t rec_len = bytes.size();
           write(fd, &rec_len, 4);       // record length prefix
           write(fd, bytes.data(), rec_len);
       }
       fsync(fd);     // force to disk before rename
       close(fd);
       return rename(tmp.c_str(), path.c_str()) == 0;
   }
   ```

3. **Implement snapshot restore with validation**
   > 💡 *WHY: The restore function must reject corrupt files before populating state. Applying a half-valid snapshot leaves the store in an inconsistent state that's worse than starting from empty + WAL replay.*

   Write the restore function:

   ```cpp
   std::optional<std::map<std::string, VersionedEntry>>
   load_snapshot(const std::string& path) {
       // Read header and validate
       SnapshotHeader hdr;
       // ... read header bytes ...
       if (memcmp(hdr.magic, "SNAP", 4) != 0) return std::nullopt;
       if (hdr.schema_version != 0x01) return std::nullopt;
       if (!validate_header_crc(hdr)) return std::nullopt;
       // Read entries one by one
       std::map<std::string, VersionedEntry> store;
       for (uint32_t i = 0; i < hdr.entry_count; i++) {
           uint32_t rec_len;
           // ... read rec_len, read rec_len bytes ...
           auto entry = deserialize(rec_data, rec_len);
           if (!entry) return std::nullopt;  // corrupt entry → reject all
           store[entry->key] = *entry;
       }
       return store;
   }
   ```

4. **Define the consistency point contract**
   > 💡 *WHY: The global_sequence in the header tells the WAL "I have everything up to this point." After loading a snapshot, WAL replay starts at global_sequence + 1. If this number is wrong, you either re-apply writes (duplicates) or skip writes (data loss).*

   Document the consistency rule:

   | Property | Value |
   |----------|-------|
   | Snapshot captures state at | global_sequence = N |
   | WAL replay starts at | N + 1 |
   | If snapshot seq > WAL start | Gap — data loss possible |
   | If snapshot seq < WAL start | Overlap — replay must be idempotent |

5. **Define the snapshot rejection policy**
   > 💡 *WHY: A snapshot that passes header validation but has corrupt entries is dangerous. Your policy must define exactly when to reject: immediately at first bad entry, or attempt partial recovery. The safe default is total rejection.*

   Document rejection conditions:

   ```
   REJECT snapshot if ANY of:
   ├── magic bytes != "SNAP"
   ├── schema_version unknown
   ├── header_crc mismatch
   ├── any entry fails deserialization (checksum or parse)
   ├── entry_count != actual number of entries read
   └── file truncated before all entries read

   On rejection: log reason, fall back to WAL-only recovery
   ```

## Done when

- [ ] Snapshot header has magic, schema_version, entry_count, global_sequence, CRC — *the first thing any reader validates*
- [ ] Write uses temp file + fsync + atomic rename — *no partial snapshots survive a crash*
- [ ] Restore validates header then each entry, rejects on first failure — *corrupt data never reaches the state machine*
- [ ] Global sequence in header defines WAL replay start point — *Week 10 checkpoint depends on this*
- [ ] Rejection policy documented for all failure modes — *safety net for every edge case*

## Proof

Paste your snapshot header struct, write/restore functions, and rejection policy, or upload `week-9/day4-snapshot-rules.md`.

**Quick self-test** (answer without looking at your notes):

1. Why use write-to-temp + rename instead of writing directly to the final path? → **If the process crashes mid-write, the final path still has the old (valid) snapshot. rename() is atomic on POSIX — the file is either the old version or the new version, never a mix.**
2. What happens if the snapshot has 100 entries but entry_count says 99? → **After reading 99 entries, there are still bytes remaining. The loader should detect this mismatch and reject the snapshot — the entry count is wrong, so the file may be corrupt.**
3. Why does the snapshot store global_sequence instead of a wall-clock timestamp? → **Global sequence is a logical clock that's identical across all replicas. Wall-clock timestamps differ between machines, making cross-node snapshot comparison unreliable.**
