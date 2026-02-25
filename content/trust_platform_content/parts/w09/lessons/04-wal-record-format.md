---
id: w09-l04
title: "WAL record format"
order: 4
duration_minutes: 25
xp: 50
kind: lesson
part: w09
proof:
  type: paste
  instructions: "Paste your WAL record struct and a hex dump of one serialized WAL record showing LSN, operation type, key, value, and checksum."
  regex_patterns:
    - "WAL|wal|Record"
    - "checksum|crc|hash"
---
# WAL record format

## Concept

A write-ahead log (WAL) is a file where you record every operation before applying it to memory. If the process crashes, you replay the log to rebuild the state.

Each WAL record contains:
- **LSN** (Log Sequence Number) — the version number from your KV store (uint64_t, 8 bytes)
- **Operation type** — PUT or DELETE (uint8_t, 1 byte)
- **Key length** — how long the key is (uint32_t, 4 bytes)
- **Key** — the key bytes
- **Value length** — how long the value is (uint32_t, 4 bytes, 0 for DELETE)
- **Value** — the value bytes (empty for DELETE)
- **Checksum** — CRC32 or SHA-256 of the entire record (4 or 32 bytes)

The checksum is critical. If the machine crashes mid-write, the record on disk might be truncated or corrupted. The checksum lets you detect this: read the record, compute the checksum, compare. If they do not match, the record is corrupt — skip it.

The record is written in a binary format, similar to your protocol envelope. All multi-byte integers are big-endian.

## Task

1. Define `struct WALRecord { uint64_t lsn; uint8_t op; std::string key; std::string value; uint32_t checksum; }`
2. Define `enum class WALOp : uint8_t { PUT = 1, DELETE = 2 }`
3. Write `std::vector<uint8_t> serialize_wal_record(const WALRecord& rec)` — creates the binary representation
4. Write `std::optional<WALRecord> deserialize_wal_record(const uint8_t* data, size_t len)` — parses and validates
5. Compute checksum using CRC32 (or use libsodium's crypto_hash_sha256 and take the first 4 bytes)

## Hints

- CRC32 is available in `<zlib.h>`: `crc32(0, data, len)` — link with `-lz`
- Or use a simple checksum: XOR all bytes (very weak but functional for learning)
- Or use SHA-256 and truncate to 4 bytes: `crypto_hash_sha256(hash, data, len); memcpy(&checksum, hash, 4);`
- The checksum covers everything EXCEPT the checksum field itself
- Serialize the record first without the checksum, compute checksum, append it

## Verify

```bash
g++ -std=c++17 -o test_wal_format test_wal_format.cpp -lz
./test_wal_format
```

Expected: serialize a record, print hex dump, deserialize it back, assert all fields match.

## Done When

A WAL record survives a serialize → deserialize round-trip with checksum validation.
