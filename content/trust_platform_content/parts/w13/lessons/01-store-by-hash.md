---
id: w13-l01
title: "Store by hash"
order: 1
duration_minutes: 25
xp: 50
kind: lesson
part: w13
proof:
  type: paste
  instructions: "Paste the output of your program showing a SHA-256 hex hash returned from store(), and the file existing on disk with that hash as its name."
  regex_patterns:
    - "[a-f0-9]{64}"
    - "stored|written|store"
---
# Store by hash

## Concept

Content-addressed storage is a simple but powerful idea: the "key" for any piece of data is its SHA-256 hash. You do not choose a filename or a key — the data names itself.

Here is how it works. You have some bytes — a string, a file, anything. You compute the SHA-256 hash of those bytes, which gives you a 64-character hex string like `e3b0c44298fc1c149afbf4c8996fb924...`. You then write the bytes to a file named with that hex string, inside a storage directory. That is it. The data is now "stored by hash."

Think of it like a hash table in C, except the key is always `hash(value)`. You never pick the key yourself. This has a huge benefit: if you ask for data by hash and the data you get back hashes to the same value, you know with near-certainty the data is exactly what was originally stored. Nobody changed it, no bit flipped on disk, no bug corrupted it. The hash acts as a built-in checksum.

This is exactly how Git stores objects internally. When you `git add` a file, Git computes the SHA-1 hash of the contents and stores the file in `.git/objects/` using the hash as the path. Git uses SHA-1; we use SHA-256 because it is stronger, but the idea is identical.

## Task

1. Create a class `ContentStore` that takes a directory path in its constructor (the storage root)
2. Implement `std::string store(const std::vector<uint8_t>& data)` that:
   - Computes the SHA-256 hash of `data`
   - Converts the hash to a lowercase hex string (64 characters)
   - Writes `data` to a file named `<hash>` inside the storage directory
   - Returns the hex hash string
3. Use OpenSSL's `EVP_Digest` or a similar SHA-256 implementation (you can use a header-only library like PicoSHA2 if you prefer)
4. Write a small `main()` that stores a test string and prints the returned hash
5. Verify the file exists on disk with `ls` and the correct size

## Hints

- For SHA-256 with OpenSSL: `#include <openssl/evp.h>`, link with `-lssl -lcrypto`
- `EVP_Digest(data.data(), data.size(), hash_buf, &hash_len, EVP_sha256(), nullptr)` computes the hash into a 32-byte buffer
- Convert 32 raw bytes to 64 hex characters with a loop: `sprintf(hex + i*2, "%02x", hash_buf[i])`
- Or use `std::ostringstream` with `std::hex` and `std::setfill('0')` and `std::setw(2)`
- The storage directory structure is flat for now — just `store_dir/<hash>`. No subdirectories yet
- `std::ofstream out(path, std::ios::binary)` to write binary data

## Verify

```bash
g++ -std=c++17 -o cas_store cas_store.cpp -lssl -lcrypto
./cas_store
# Should print something like: stored hash: 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
ls store_dir/
# Should show a file named with the 64-char hex hash
```

You can double-check with the command line: `echo -n "hello" | sha256sum` should give the same hash as storing the bytes of "hello".

## Done When

`store()` returns a 64-character hex hash, the file exists on disk with that name, and the hash matches what `sha256sum` produces for the same input.
