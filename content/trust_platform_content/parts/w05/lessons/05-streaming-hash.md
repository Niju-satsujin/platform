---
id: w05-l05
title: "Streaming hash for large files"
order: 5
duration_minutes: 25
xp: 75
kind: lesson
part: w05
proof:
  type: paste
  instructions: "Paste the output of your streaming hash program on a 10 MB test file, showing the hash matches the single-shot hash and sha256sum."
  regex_patterns:
    - "[a-f0-9]{64}"
    - "match|equal|same|identical"
---
# Streaming hash for large files

## Concept

In lesson 3, you read an entire file into memory and hashed it in one call. That works for small files, but a 4 GB file would require 4 GB of RAM just to compute a hash. That is wasteful — you only need the final 32-byte digest.

The solution is **streaming** (also called multi-part or incremental hashing). Instead of one function call, you use three:

1. **Init** — set up the hash state
2. **Update** — feed data in chunks (call this as many times as you want)
3. **Final** — produce the digest

In C you are familiar with this pattern — it is how `fread()` works: open, read in a loop, close. Streaming hashing is the same idea: init, update in a loop, finalize.

libsodium provides:
- `crypto_hash_sha256_init()` — initialize a `crypto_hash_sha256_state`
- `crypto_hash_sha256_update()` — feed a chunk of data
- `crypto_hash_sha256_final()` — compute the final digest

The key guarantee: the final digest is **identical** whether you feed the data all at once or in 4 KB chunks. The hash function processes bytes in order — it does not matter how you split them up.

Use a fixed-size buffer (4 KB or 8 KB is common), read the file in a loop, feed each chunk to `update()`, then call `final()`. Peak memory usage: your buffer size + the state struct (a few hundred bytes).

## Task

1. Write a program that hashes a file using the streaming API
2. Read the file in chunks of 4096 bytes (do not load the whole file)
3. Call `crypto_hash_sha256_update()` for each chunk
4. Call `crypto_hash_sha256_final()` to get the digest
5. Print the hash as a 64-character hex string
6. Create a 10 MB test file and verify the streaming hash matches `sha256sum` and your single-shot hasher from lesson 3

## Hints

- Declare the state: `crypto_hash_sha256_state state;`
- Init: `crypto_hash_sha256_init(&state)`
- Update: `crypto_hash_sha256_update(&state, chunk, bytes_read)`
- Final: `crypto_hash_sha256_final(&state, hash)`
- Create a 10 MB test file: `dd if=/dev/urandom of=bigfile.bin bs=1M count=10`
- Read loop: `while (file.read(...))` with `file.gcount()` for the last partial chunk
- Buffer: `unsigned char buf[4096];`

## Verify

```bash
cmake --build build
dd if=/dev/urandom of=bigfile.bin bs=1M count=10
./build/stream_hash bigfile.bin
./build/file_hash bigfile.bin
sha256sum bigfile.bin
```

Expected: all three commands print the same 64-character hex hash.

## Done When

Your streaming hasher produces the same digest as the single-shot hasher and `sha256sum` for a 10 MB file.
