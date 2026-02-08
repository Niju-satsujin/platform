---
id: w09-kv-store-core-state-model-d03-quest-serialization-format-2h
part: w09-kv-store-core-state-model
title: "Quest: Serialization Format  2h"
order: 3
duration_minutes: 120
prereqs: ["w09-kv-store-core-state-model-d02-quest-versioning-rules-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Serialization Format  2h

## Goal

Design the **binary serialization format** for your KV store records so every persisted entry has stable field ordering, a checksum for integrity verification, and forward-compatible framing that allows schema evolution without breaking existing data.

By end of this session you will have:

- ✅ A **record format spec** with fixed field order, length-prefixed strings, and a CRC32 checksum
- ✅ A **serialize function** that encodes a VersionedEntry to a byte buffer deterministically
- ✅ A **deserialize function** that decodes bytes back to a VersionedEntry with checksum validation
- ✅ A **forward-compatibility strategy** using a schema version byte so future formats can coexist
- ✅ A **round-trip test** proving serialize → deserialize → serialize produces identical bytes

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Record has schema_version byte as first field | Check byte layout |
| 2 | Every string field is length-prefixed (uint32 + bytes) | Verify no null terminators |
| 3 | CRC32 checksum covers all preceding bytes | Verify checksum position and scope |
| 4 | Deserialize rejects records with bad checksums | Corrupt one byte, verify rejection |
| 5 | Round-trip: serialize(deserialize(bytes)) == bytes | Test with 3 sample entries |

## What You're Building Today

A binary serialization layer that converts in-memory VersionedEntry structs (from Day 2) to byte sequences suitable for disk persistence and network transport.

By end of this session, you will have:

- ✅ File: `week-9/day3-serialization-format.md`
- ✅ Wire format: `[schema_ver][key_len][key][val_len][val][version][created][modified][crc32]`
- ✅ Encode/decode functions with checksum verification
- ✅ Schema version strategy for future evolution

What "done" looks like:

```cpp
// Byte layout (all integers little-endian):
// [1B schema_version] [4B key_len] [key bytes] [4B val_len] [val bytes]
// [8B version] [8B created_seq] [8B modified_seq] [4B crc32]

std::vector<uint8_t> serialize(const VersionedEntry& entry);
std::optional<VersionedEntry> deserialize(const uint8_t* data, size_t len);
```

You **can**: Convert any VersionedEntry to bytes and back with integrity verification.
You **cannot yet**: Write these bytes to a snapshot file (Day 4) or WAL (Week 10) — today is the encoding format only.

## Why This Matters

🔴 **Without this, you will:**
- Use text serialization (JSON/CSV) that's slow, ambiguous, and wastes space on disk
- Have no integrity check — a single flipped bit corrupts a record silently
- Lock yourself into one format forever — any schema change breaks all stored data
- Produce different byte sequences on different platforms due to endianness or padding

🟢 **With this, you will:**
- Encode/decode in microseconds with zero allocation for fixed-size fields
- Detect corruption immediately — one bad bit fails the CRC32 check
- Evolve the schema by bumping the version byte and adding new fields at the end
- Produce identical bytes on any platform thanks to explicit endianness

🔗 **How this connects:**
- **To Day 2:** This format encodes the VersionedEntry struct designed yesterday
- **To Day 4:** Snapshot files contain concatenated serialized records
- **To Week 10 Day 1:** WAL records wrap serialized commands with sequence numbers
- **To Week 10 Day 4:** Recovery replays serialized records — checksum validation catches corruption
- **To Week 11 Day 2:** Append RPC sends serialized entries over the network

🧠 **Mental model: "Envelope and Letter"**

Serialization creates an **envelope** (framing: lengths, schema version, checksum) around a **letter** (the actual data). The envelope is the system's metadata — it tells the reader how to open the letter safely. You can change the letter format by changing the schema version on the envelope. You can verify the letter wasn't tampered with by checking the checksum on the envelope. The letter alone is meaningless without the envelope. The envelope alone is useless without the letter. They travel together, always.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│              SERIALIZED RECORD LAYOUT                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Offset  Field              Size   Encoding              │
│  ──────  ─────              ────   ────────              │
│  0x00    schema_version     1B     uint8 (currently 1)   │
│  0x01    key_length         4B     uint32 LE             │
│  0x05    key_data           var    raw bytes             │
│  ...     value_length       4B     uint32 LE             │
│  ...     value_data         var    raw bytes             │
│  ...     version            8B     uint64 LE             │
│  ...     created_seq        8B     uint64 LE             │
│  ...     modified_seq       8B     uint64 LE             │
│  end-4   crc32              4B     uint32 LE             │
│                                                          │
│  ┌─── checksum scope ───────────────────────────┐       │
│  │ schema_ver │ key_len │ key │ val_len │ val │  │       │
│  │ version │ created_seq │ modified_seq         │       │
│  └──────────────────────────────────────────────┘       │
│                    │                                     │
│                    ▼                                     │
│              CRC32(all above) ──▶ [4 bytes at end]      │
│                                                          │
│  Total size = 1 + 4 + key_len + 4 + val_len             │
│             + 8 + 8 + 8 + 4                              │
│           = 37 + key_len + val_len                        │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-9/day3-serialization-format.md`

## Do

1. **Define the byte layout with explicit field ordering**
   > 💡 *WHY: Stable field ordering means any reader — on any platform, in any language — can decode the record by reading fields in the documented order. Changing the order is a breaking change that requires a schema version bump.*

   Document the exact byte layout:

   ```cpp
   // Helper: write little-endian uint32 to buffer
   void write_u32(std::vector<uint8_t>& buf, uint32_t val) {
       buf.push_back(val & 0xFF);
       buf.push_back((val >> 8) & 0xFF);
       buf.push_back((val >> 16) & 0xFF);
       buf.push_back((val >> 24) & 0xFF);
   }

   void write_u64(std::vector<uint8_t>& buf, uint64_t val) {
       for (int i = 0; i < 8; i++)
           buf.push_back((val >> (i * 8)) & 0xFF);
   }

   void write_string(std::vector<uint8_t>& buf, const std::string& s) {
       write_u32(buf, static_cast<uint32_t>(s.size()));
       buf.insert(buf.end(), s.begin(), s.end());
   }
   ```

2. **Implement the serialize function**
   > 💡 *WHY: The serialize function is called on every PUT (for WAL) and every snapshot. It must be fast, allocation-minimal, and deterministic — same input always produces same bytes.*

   Write the complete encoder:

   ```cpp
   std::vector<uint8_t> serialize(const VersionedEntry& entry) {
       std::vector<uint8_t> buf;
       buf.reserve(37 + entry.key.size() + entry.value.size());
       buf.push_back(0x01);  // schema version 1
       write_string(buf, entry.key);
       write_string(buf, entry.value);
       write_u64(buf, entry.meta.version);
       write_u64(buf, entry.meta.created_seq);
       write_u64(buf, entry.meta.modified_seq);
       uint32_t crc = crc32(buf.data(), buf.size());
       write_u32(buf, crc);
       return buf;
   }
   ```

3. **Implement the deserialize function with checksum validation**
   > 💡 *WHY: Deserialization is the first line of defense against corruption. If the CRC doesn't match, the record is rejected immediately — before any corrupted data reaches the state machine. Week 10 recovery depends on this.*

   Write the decoder with validation:

   ```cpp
   std::optional<VersionedEntry> deserialize(const uint8_t* data, size_t len) {
       if (len < 37) return std::nullopt;  // minimum record size
       // Verify checksum first
       uint32_t stored_crc = read_u32(data + len - 4);
       uint32_t computed_crc = crc32(data, len - 4);
       if (stored_crc != computed_crc) return std::nullopt;
       size_t pos = 0;
       uint8_t schema_ver = data[pos++];
       if (schema_ver != 0x01) return std::nullopt;  // unknown version
       auto key = read_string(data, pos, len);
       auto value = read_string(data, pos, len);
       uint64_t version = read_u64(data + pos); pos += 8;
       uint64_t created = read_u64(data + pos); pos += 8;
       uint64_t modified = read_u64(data + pos); pos += 8;
       return VersionedEntry{key, value, {version, created, modified}};
   }
   ```

4. **Design the forward-compatibility strategy**
   > 💡 *WHY: Your format WILL evolve. Adding a field (e.g., TTL) should not break readers that understand only version 1. The schema_version byte lets you branch decode logic without corrupting old data.*

   Document your evolution rules:

   | Rule | Description |
   |------|-------------|
   | Append-only | New fields are added AFTER existing fields, before CRC |
   | Version bump | New field → increment schema_version to 2 |
   | Old reader | Version 1 reader ignores unknown trailing bytes before CRC |
   | Total length | Always store total record length so readers can skip unknown versions |
   | Never reorder | Field order is permanent once a version is released |

5. **Write round-trip tests**
   > 💡 *WHY: If serialize(deserialize(serialize(entry))) ≠ serialize(entry), your format has a bug. Round-trip testing catches endianness errors, padding issues, and off-by-one bugs in length calculation.*

   Create three test cases:

   ```cpp
   void test_round_trip() {
       VersionedEntry e1{"key1", "value1", {1, 100, 100}};
       VersionedEntry e2{"", "empty_key_test", {5, 200, 300}};  // should fail
       VersionedEntry e3{"k", std::string(65536, 'x'), {999, 1, 50}};

       auto bytes = serialize(e1);
       auto decoded = deserialize(bytes.data(), bytes.size());
       assert(decoded.has_value());
       assert(decoded->key == e1.key);
       assert(decoded->meta.version == e1.meta.version);
       // Re-serialize and compare bytes
       auto rebytes = serialize(*decoded);
       assert(bytes == rebytes);  // byte-identical round-trip
   }
   ```

## Done when

- [ ] Byte layout documented with explicit field order and sizes — *WAL (Week 10) wraps this format with sequence headers*
- [ ] Serialize function encodes VersionedEntry deterministically with CRC32 — *called on every write path*
- [ ] Deserialize rejects records with bad checksums before returning data — *recovery (Week 10 Day 4) depends on this check*
- [ ] Forward-compatibility strategy documented with append-only rules — *format evolution without data migration*
- [ ] Round-trip test passes: serialize → deserialize → serialize produces identical bytes — *proves encode/decode are inverses*

## Proof

Paste your byte layout diagram, serialize/deserialize functions, and round-trip test, or upload `week-9/day3-serialization-format.md`.

**Quick self-test** (answer without looking at your notes):

1. Why is the CRC32 placed at the end of the record instead of the beginning? → **The CRC covers all preceding bytes. You must write all fields first, then compute the checksum over them. Putting CRC first would require a two-pass write or backfill.**
2. What does the deserialize function do if schema_version is 2 but the reader only knows version 1? → **It returns nullopt (rejection). A smarter reader could skip to the CRC position using total record length, but today we reject unknown versions as the safe default.**
3. Why use length-prefixed strings instead of null-terminated? → **Null-terminated strings can't contain null bytes, which binary values might. Length-prefixed strings support arbitrary binary content and allow the reader to skip ahead without scanning for a terminator.**
