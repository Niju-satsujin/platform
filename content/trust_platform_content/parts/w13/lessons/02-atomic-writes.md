---
id: w13-l02
title: "Atomic writes"
order: 2
duration_minutes: 25
xp: 50
kind: lesson
part: w13
proof:
  type: paste
  instructions: "Paste the output showing your store uses the write-tmp-fsync-rename pattern, and that the final file exists with the correct hash name."
  regex_patterns:
    - "rename|atomic"
    - "[a-f0-9]{64}"
---
# Atomic writes

## Concept

Your `store()` function writes data to a file named by its hash. But what if the program crashes mid-write? You end up with a partially written file sitting in your store with a valid-looking hash name. When you try to retrieve it later, the data is incomplete. The hash will not match, so retrieval will catch it — but you have a corrupt file taking up space and the original data is lost.

The fix is atomic writes, the same pattern you used in Week 9 for Raft snapshots. The idea is: never write directly to the final filename. Instead, write to a temporary file first, call `fsync()` to make sure all bytes are flushed to disk, then `rename()` the temp file to the final hash name. The key property of `rename()` on most filesystems is that it is atomic — the file either has the old name or the new name, never something in between. If you crash before the rename, the temp file is just garbage that you can clean up. If you crash after the rename, the file is complete.

In C terms, you already know `fsync(fd)` — it forces the OS to flush buffered writes to the physical disk. And `rename(old, new)` is an atomic operation on POSIX filesystems. In C++ you can use `std::filesystem::rename()` which does the same thing.

The beauty of content-addressed storage is that even without atomic writes, corruption is detectable. But with atomic writes, you also avoid leaving corrupt files behind in the first place. Belt and suspenders.

## Task

1. Modify your `store()` function to use the write-tmp-fsync-rename pattern:
   - Generate a temp filename like `store_dir/.tmp-<random>` or `store_dir/.tmp-<hash>`
   - Open and write all data to the temp file
   - Call `fsync()` on the file descriptor (or `file.flush()` then `fsync(fileno)`)
   - Close the file
   - Rename the temp file to the final `store_dir/<hash>` path
2. If the final file already exists (same hash = same content), you can skip the write entirely — this is called deduplication and it is free with content-addressed storage
3. Clean up any leftover `.tmp-*` files on startup (they are evidence of a previous crash)

## Hints

- In C++: `std::ofstream` does not expose the raw fd easily. You can use POSIX `open()` / `write()` / `fsync()` / `close()` for this function, or use `fileno()` on a FILE* from `fopen()`
- For the temp filename, `store_dir/.tmp-` + the hash string works well — it is unique per content
- `std::filesystem::rename(tmp_path, final_path)` does an atomic rename
- To check if the file already exists: `std::filesystem::exists(final_path)` — if true, skip the write and just return the hash
- For cleanup on startup, use `std::filesystem::directory_iterator` and delete anything starting with `.tmp-`
- Remember to create the storage directory if it does not exist: `std::filesystem::create_directories(store_dir)`

## Verify

```bash
g++ -std=c++17 -o cas_store cas_store.cpp -lssl -lcrypto
./cas_store
ls -la store_dir/
# Should show the final hash-named file, no .tmp- files
ls -la store_dir/.tmp-* 2>/dev/null
# Should show nothing (no leftover temp files)
```

To test deduplication, store the same data twice and confirm only one file exists and the second call is fast (no disk write).

## Done When

`store()` uses write-tmp-fsync-rename, no `.tmp-` files remain after a successful store, and storing duplicate data skips the write.
