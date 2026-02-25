---
id: w13-l03
title: "Verified retrieval"
order: 3
duration_minutes: 20
xp: 50
kind: lesson
part: w13
proof:
  type: paste
  instructions: "Paste output showing (1) successful retrieval with hash verification, and (2) retrieval failure when a file is deliberately corrupted."
  regex_patterns:
    - "verified|integrity|match"
    - "corrupt|mismatch|fail|error"
---
# Verified retrieval

## Concept

Storing data by hash is only half the story. The real power comes at retrieval time. When someone asks for data by hash, you read the file, compute the SHA-256 of what you read, and compare it to the hash they asked for. If they match, the data is good. If they do not match, something went wrong — a disk error, a bug, or tampering. You return an error instead of bad data.

This is what makes content-addressed storage self-verifying. In a normal key-value store, if someone corrupts the file for key "user-profile", you have no way to detect it — you just read back garbage. But in a content-addressed store, corruption is always caught because the address (the hash) is derived from the content. Change the content, the hash changes, and the mismatch is obvious.

In C terms, think of it as a built-in CRC check, except much stronger. CRC can detect accidental errors. SHA-256 can detect both accidental errors and deliberate tampering — it is computationally infeasible to find two different inputs that produce the same SHA-256 hash.

## Task

1. Implement `std::vector<uint8_t> retrieve(const std::string& hash)` in your `ContentStore` class:
   - Build the file path: `store_dir/<hash>`
   - Read the entire file into a `std::vector<uint8_t>`
   - Compute the SHA-256 of the data you just read
   - Compare the computed hash to the requested hash
   - If they match, return the data
   - If they do not match, throw an exception or return an error (your choice)
   - If the file does not exist, return a "not found" error
2. Test the happy path: store some data, retrieve it, confirm you get the same bytes back
3. Test the corruption path: store some data, then manually edit the file on disk (add a byte, change a byte), try to retrieve it, confirm you get an error

## Hints

- Read a file into a vector: open with `std::ifstream(path, std::ios::binary)`, use `std::istreambuf_iterator<char>` to read all bytes
- Or use POSIX: `open()`, `fstat()` to get size, `read()` into a buffer, `close()`
- For the corruption test, you can use `echo "garbage" >> store_dir/<hash>` from the shell to append bytes to the file
- Consider using `std::optional<std::vector<uint8_t>>` as the return type — `std::nullopt` for errors
- Or throw a custom exception like `IntegrityError` with a message saying which hash failed
- A helper function `std::string compute_hash(const std::vector<uint8_t>& data)` is useful — both `store()` and `retrieve()` need it

## Verify

```bash
g++ -std=c++17 -o cas_test cas_store.cpp -lssl -lcrypto
./cas_test
# Should print: stored and retrieved successfully, data matches

# Now corrupt a file
echo "tampered" >> store_dir/<paste-your-hash-here>
./cas_test
# Should print: integrity error — hash mismatch
```

## Done When

Retrieval succeeds for clean data, and retrieval fails with a clear error message for corrupted data.
