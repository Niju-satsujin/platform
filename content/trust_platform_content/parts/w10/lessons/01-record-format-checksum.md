---
id: w10-l01
title: "Record Format & Checksum"
order: 1
type: lesson
duration_min: 40
---

# Record Format & Checksum

## Goal

Design a binary record format for [write-ahead log](https://en.wikipedia.org/wiki/Write-ahead_logging) entries. Each record carries a [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) checksum so the recovery code can detect corruption.

## What you build

A `struct wal_record` and two functions: `wal_record_encode()` which serializes a SET or DEL operation into a byte buffer with a [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) header, and `wal_record_decode()` which reads a byte buffer, verifies the [checksum](https://en.wikipedia.org/wiki/Checksum), and fills a record struct. You also write a standalone [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) function.

## Why it matters

Every serious [database](https://en.wikipedia.org/wiki/Database) protects its log records with a [checksum](https://en.wikipedia.org/wiki/Checksum). [PostgreSQL](https://www.postgresql.org/) and [SQLite](https://sqlite.org/) both use [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) or similar to catch torn writes, bit flips, and partial records. If the [checksum](https://en.wikipedia.org/wiki/Checksum) does not match during recovery, the record is known to be corrupt and [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be discarded. In [W07](../../../parts/w07/part.md) you learned how [hash functions](https://en.wikipedia.org/wiki/Hash_function) map data to fixed-size values — [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) is a specialized version designed for error detection.

---

## Training Session

### Warmup — CRC and record layout

1. Read the first four paragraphs of [Cyclic redundancy check](https://en.wikipedia.org/wiki/Cyclic_redundancy_check). Write down what a [CRC](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) computes and why it catches single-bit errors.
2. Read the DESCRIPTION section of [write(2)](https://man7.org/linux/man-pages/man2/write.2.html). Note that [write(2)](https://man7.org/linux/man-pages/man2/write.2.html) takes a flat byte buffer and a length.
3. Sketch on paper a record layout: `[crc32 : 4 bytes][length : 4 bytes][op : 1 byte][key_len : 2 bytes][key][value_len : 2 bytes][value]`. The [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) covers everything after the first 4 bytes.

### Work — Build the record codec

#### Do

1. Create `w10/wal_record.h`. Define `enum wal_op` with values `WAL_OP_SET` and `WAL_OP_DEL`.
2. Define `struct wal_record` with fields: `uint8_t op`, `char *key`, `uint16_t key_len`, `char *value`, `uint16_t value_len`, and `uint32_t crc`.
3. Create `w10/crc32.h` and `w10/crc32.c`. Implement a table-driven [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) function. The function [MUST](https://datatracker.ietf.org/doc/html/rfc2119) take a byte pointer and a length, and return a `uint32_t`.
4. Build the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) lookup table in an init function. The polynomial is `0xEDB88320` — the same one used by [zlib](https://en.wikipedia.org/wiki/Zlib).
5. Create `w10/wal_record.c`. Write `wal_record_encode(record, buffer, buf_size)`. Pack the fields into the buffer in the order from step 3 of the warmup. Compute the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) over everything after the first 4 bytes, then write the [CRC](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) into the first 4 bytes. Return the total number of bytes written.
6. Write `wal_record_decode(buffer, len, record)`. Read the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) from the first 4 bytes. Compute a fresh [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) over the remaining bytes. If they do not match, return an error code. If they match, fill the `record` struct and return success.
7. Write a `main()` test. Create a SET record for key `foo` and value `bar`. Encode it. Decode it. Print the decoded fields. Verify the [CRC](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) matches.
8. Add a corruption test: flip one bit in the encoded buffer and decode again. Verify that `wal_record_decode()` returns an error.

#### Test

```bash
gcc -Wall -Wextra -o wal_record_test w10/wal_record.c w10/crc32.c
./wal_record_test
```

#### Expected

```
encode: 21 bytes written
decode: op=SET key=foo value=bar crc=OK
corrupt: decode returned CRC_MISMATCH — correct
```

### Prove — Checksum coverage

Answer these questions in your own words:

1. Why does the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) cover the length and op fields, not just the key and value?
2. What happens if a power failure cuts a [write(2)](https://man7.org/linux/man-pages/man2/write.2.html) in the middle of a record? How does the [checksum](https://en.wikipedia.org/wiki/Checksum) help?
3. Could you use a simple sum instead of [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check)? What class of errors would a simple sum miss?

### Ship

```bash
git add w10/wal_record.h w10/wal_record.c w10/crc32.h w10/crc32.c
git commit -m "w10-l01: WAL record format with CRC32 checksum"
```

---

## Done when

- `wal_record_encode()` packs a record into a byte buffer with a leading [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check).
- `wal_record_decode()` unpacks the buffer and verifies the [checksum](https://en.wikipedia.org/wiki/Checksum).
- Flipping any single bit in the buffer causes decode to return `CRC_MISMATCH`.
- DEL records encode with `value_len = 0` and no value bytes.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Computing CRC over the entire buffer including the CRC field itself | The [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) covers bytes 4 through end. Bytes 0–3 hold the CRC and are excluded from the computation. |
| Using host byte order for multi-byte fields | Use a fixed [endianness](https://en.wikipedia.org/wiki/Endianness). Write `key_len` and `value_len` in little-endian so the log is portable. |
| Not initializing the CRC table before first use | Call the init function once at program start. Without the table, every [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) call returns garbage. |
| Buffer overflow in encode | Check that `buf_size` is large enough before writing. Return -1 if the buffer is too small. |

## Proof

```bash
./wal_record_test
# → encode: 21 bytes written
# → decode: op=SET key=foo value=bar crc=OK
# → corrupt: decode returned CRC_MISMATCH — correct
```

## 🖼️ Hero Visual

```
  Record layout (SET foo=bar):

  byte offset:  0    3  4    7  8   9   10  11  12  13  14  15  16  17  18  19  20
               ┌────────┬────────┬───┬───────┬───┬───┬───┬───────┬───┬───┬───┐
               │ CRC32  │ length │ S │key_len│ f │ o │ o │val_len│ b │ a │ r │
               │ 4 bytes│ 4 bytes│ 1 │ 2 b   │   │   │   │ 2 b   │   │   │   │
               └────────┴────────┴───┴───────┴───┴───┴───┴───────┴───┴───┴───┘
                         ◀───────── CRC32 covers this region ─────────────────▶
```

## 🔮 Future Lock

- In [W10 L02](02-append-discipline.md) you will write these encoded records to a file using [append-only](https://en.wikipedia.org/wiki/Append-only) discipline and [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html).
- In [W10 L03](03-recovery-replay.md) you will read these records back during recovery and replay them into the [KV store (W09)](../../../parts/w09/part.md).
- In [W11](../../../parts/w11/part.md) you will ship these encoded records over the network to [replica](https://en.wikipedia.org/wiki/Replication_(computing)) nodes.
- In [W15](../../../parts/w15/part.md) the same append-only record model powers a [transparency log](https://en.wikipedia.org/wiki/Certificate_Transparency).
