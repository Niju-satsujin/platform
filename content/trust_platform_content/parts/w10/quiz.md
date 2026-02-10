---
id: w10-quiz
title: "Week 10 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 10 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – WAL purpose

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) every SET and DEL be written to the [write-ahead log](https://en.wikipedia.org/wiki/Write-ahead_logging) before being applied to the in-memory [hash table](https://en.wikipedia.org/wiki/Hash_table)?

- A) Because the hash table is too slow
- B) Because if the process crashes after applying the change but before writing the log, the change is lost on recovery — writing the log first guarantees the operation can be replayed
- C) Because the [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) is faster than the hash table
- D) Because the operating system requires it

---

### Q2 – CRC32 coverage

The [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) in a WAL record covers everything except:

- A) The key bytes
- B) The value bytes
- C) The [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) field itself — bytes 0 through 3 are excluded from the checksum computation
- D) The operation type byte

---

### Q3 – fsync necessity

What data can be lost if you call [write(2)](https://man7.org/linux/man-pages/man2/write.2.html) but skip [fsync(2)](https://man7.org/linux/man-pages/man2/fsync.2.html)?

- A) No data is lost — [write(2)](https://man7.org/linux/man-pages/man2/write.2.html) always reaches the disk
- B) The written bytes may still be in the kernel [page cache](https://en.wikipedia.org/wiki/Page_cache) and a power failure would lose them
- C) Only the first byte is lost
- D) The file descriptor becomes invalid

---

### Q4 – O_APPEND flag

Why does the WAL writer [open(2)](https://man7.org/linux/man-pages/man2/open.2.html) the file with [O_APPEND](https://man7.org/linux/man-pages/man2/open.2.html)?

- A) Because it makes [write(2)](https://man7.org/linux/man-pages/man2/write.2.html) faster
- B) Because [O_APPEND](https://man7.org/linux/man-pages/man2/open.2.html) atomically moves the file offset to the end before each write, preventing any write from overwriting existing records
- C) Because without it the file cannot be created
- D) Because [fsync(2)](https://man7.org/linux/man-pages/man2/fsync.2.html) requires it

---

### Q5 – Recovery stop rule

During [recovery (L03)](lessons/03-recovery-replay.md), when a record fails the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) check, the code [MUST](https://datatracker.ietf.org/doc/html/rfc2119):

- A) Skip the bad record and continue replaying the next one
- B) Stop immediately — a bad [CRC](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) means the length field may also be corrupt, so you cannot find the start of the next record
- C) Replace the bad record with a DEL
- D) Retry reading the same record

---

### Q6 – Torn write detection

A power failure cuts a [write(2)](https://man7.org/linux/man-pages/man2/write.2.html) in the middle of a record. Only the first 8 bytes of a 24-byte record are on disk. How does recovery detect this?

- A) The file size is odd
- B) The [read(2)](https://man7.org/linux/man-pages/man2/read.2.html) call returns fewer bytes than the length field says, so recovery treats the record as incomplete and stops
- C) The operating system flags the file as corrupt
- D) The key is empty

---

### Q7 – Checkpoint benefit

What is the main benefit of [checkpointing (L05)](lessons/05-checkpointing.md)?

- A) It makes the WAL file smaller
- B) It bounds recovery time — instead of replaying the entire log from the beginning, recovery loads the snapshot and replays only the records written after the checkpoint
- C) It deletes old data
- D) It prevents crashes

---

### Q8 – Regression harness trap

Why does the [regression harness (L06)](lessons/06-regression-harness.md) use `trap cleanup EXIT`?

- A) To restart the test on failure
- B) To ensure temp files and background processes are cleaned up even if a test fails or the script exits early
- C) To catch [SIGTERM](https://man7.org/linux/man-pages/man7/signal.7.html) from the kernel
- D) To speed up the tests

---

### Q9 – Short answer: Write-ahead rule

Explain in one or two sentences what "write-ahead" means. Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the log record reach stable storage before the in-memory state is updated?

---

### Q10 – Short answer: Short write handling

What is a [short write](https://en.wikipedia.org/wiki/Short_(finance))? Explain why `write_full()` loops on [write(2)](https://man7.org/linux/man-pages/man2/write.2.html) and what would happen if it did not.

---

### Q11 – Short answer: Checkpoint WAL offset

The [checkpoint file](lessons/05-checkpointing.md) stores a `wal_offset`. Explain what this value represents and why recovery needs it.

---

### Q12 – Short answer: CRC polynomial

The [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) implementation uses polynomial `0xEDB88320`. What happens if you accidentally change this constant? How would the [regression harness](lessons/06-regression-harness.md) catch it?

---

### Q13 – Read the output: Recovery after crash

A WAL file contains 8 records. Record 6 was written during a power failure and only half its bytes are on disk. Recovery runs and prints:

```
recovery: replayed 5 records
recovery: record 6 — incomplete read, stopping
```

How many keys are in the store after recovery? What happened to the data from records 6, 7, and 8?

---

### Q14 – Read the output: Checkpoint + replay

A system writes 20 records, checkpoints after record 12 (offset 240), then writes 8 more records. After a restart, recovery prints:

```
loaded checkpoint: 7 keys at WAL offset 240
replayed 8 WAL records from offset 240
store has 9 keys
```

Why does the store have 9 keys instead of 7? Where did the extra 2 keys come from?

---

## Answer Key

| Q | Answer |
|---|--------|
| 1 | B |
| 2 | C |
| 3 | B |
| 4 | B |
| 5 | B |
| 6 | B |
| 7 | B |
| 8 | B |
| 9 | "Write-ahead" means the log record is written and [fsynced](https://man7.org/linux/man-pages/man2/fsync.2.html) to disk before the corresponding change is applied to the in-memory [hash table](https://en.wikipedia.org/wiki/Hash_table). If the process crashes after updating memory but before writing the log, the change would be lost because it was never persisted. By writing the log first, every committed change can be replayed from disk during recovery. |
| 10 | A [short write](https://en.wikipedia.org/wiki/Short_(finance)) occurs when [write(2)](https://man7.org/linux/man-pages/man2/write.2.html) writes fewer bytes than requested. `write_full()` loops, advancing the buffer pointer and decreasing the remaining count, until all bytes are written. Without the loop, the end of a record could be silently dropped, producing a corrupt record on disk that would fail the [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) check during recovery. |
| 11 | The `wal_offset` is the byte position in the WAL file where the checkpoint snapshot was taken — the first byte after the last record included in the snapshot. During recovery, after loading the checkpoint, the code seeks to this offset and replays only the records written after it, avoiding duplicate replay of records already captured in the snapshot. |
| 12 | Changing the polynomial produces different [CRC32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) values for the same data. Every existing WAL record would fail the checksum check during recovery because the decode function computes a different CRC than the one stored. The [regression harness (L06)](lessons/06-regression-harness.md) test 2 (CRC corruption detection) and test 4 (full recovery replay) would both fail — test 4 because valid records would be rejected, and test 2 because the bit-flip test might accidentally produce a "matching" CRC with the wrong polynomial. |
| 13 | The store has the keys and values from records 1 through 5 only. Recovery replayed those 5 records successfully, then hit the incomplete record 6 and stopped. Records 6, 7, and 8 are all lost — record 6 because it was torn by the power failure, and records 7 and 8 because recovery cannot find their start positions after encountering the corrupt record 6. |
| 14 | The checkpoint captured 7 keys as of record 12. The 8 post-checkpoint records (records 13–20) included SET operations for 2 new keys that did not exist in the checkpoint. After replaying those 8 records on top of the 7 checkpoint keys, the store ends up with 9 total keys. The extra 2 keys came from SET commands in the post-checkpoint WAL records. |
