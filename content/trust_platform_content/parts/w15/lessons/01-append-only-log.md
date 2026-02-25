---
id: w15-l01
title: "Append-only log"
order: 1
duration_minutes: 25
xp: 50
kind: lesson
part: w15
proof:
  type: paste
  instructions: "Paste the output of your program appending 5 entries and printing each entry's index, then reading them back."
  regex_patterns:
    - "index|entry"
    - "[0-4]"
---
# Append-only log

## Concept

An append-only log is a data structure where you can only add entries at the end. You never modify an existing entry. You never delete an entry. Once something is in the log, it stays there forever. This is the foundation of transparency: if a log is append-only, then anyone can check later that a specific entry exists and has not been changed.

In C terms, think of it as a file where you only call `write()` at the end and never `seek()` backward to overwrite old data. Each entry gets an index — the first entry is index 0, the second is index 1, and so on. Given an index, you can always read back the exact bytes that were appended at that position.

Why is this useful? Imagine a certificate authority that promises to log every certificate it issues. If the log is append-only, the CA cannot secretly issue a certificate and then remove it from the log later. The entry is permanent. This is the core idea behind Certificate Transparency, and it is what you are building this week.

For now, you will store entries in a simple on-disk format. Each entry is a blob of bytes (a `std::vector<uint8_t>`). The log assigns it the next available index and writes it to storage. Later lessons will add a Merkle tree on top and signed checkpoints, but the append-only property starts here.

## Task

1. Create a `TransparencyLog` class in `transparency_log.h` / `transparency_log.cpp`
2. The constructor takes a directory path where the log stores its data
3. Implement `uint64_t append(const std::vector<uint8_t>& entry)` — writes the entry to disk and returns its index (starting from 0)
4. Implement `std::vector<uint8_t> get(uint64_t index) const` — reads the entry at the given index
5. Implement `uint64_t size() const` — returns the number of entries in the log
6. Entries must survive process restarts — store them on disk, not just in memory
7. The class must not provide any method to modify or delete entries
8. Write a test program that appends 5 entries (any content), prints each index, then reads them all back and prints them

## Hints

- A simple storage format: one file per entry, named by index (e.g., `log/000000.entry`, `log/000001.entry`). This is not the fastest, but it is easy to reason about
- Alternatively, use a single file and an index file that records the offset and length of each entry
- To survive restarts, read the directory at construction time to find how many entries already exist
- Use `std::filesystem::create_directories()` to make sure the log directory exists
- `std::ofstream` with `std::ios::binary` for writing entries, `std::ifstream` with `std::ios::binary` for reading
- Do not add any `update()`, `remove()`, or `clear()` methods — the whole point is that the log is append-only

## Verify

```bash
cmake --build build
./build/test_append_log

# Run it twice to confirm entries survive restart:
./build/test_append_log
# Second run should show entries from the first run still exist
```

Expected: first run prints indices 0-4 and reads them back. Second run appends 5 more (indices 5-9) and can still read 0-4.

## Done When

Your `TransparencyLog` appends entries, assigns sequential indices, persists them to disk, reads them back correctly, and provides no way to modify or delete entries.
