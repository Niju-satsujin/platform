---
id: w05-l03
title: "SHA-256 hash of a file"
order: 3
duration_minutes: 25
xp: 50
kind: lesson
part: w05
proof:
  type: paste
  instructions: "Paste the output of your program hashing a test file, plus the output of sha256sum on the same file showing the hashes match."
  regex_patterns:
    - "[a-f0-9]{64}"
    - "sha256|SHA256|match"
---
# SHA-256 hash of a file

## Concept

Now you use libsodium for real. The function `crypto_hash_sha256()` takes a buffer of bytes and produces a 32-byte digest.

In C, when you hash data, you pass a pointer and a length:

```c
unsigned char hash[32];
crypto_hash_sha256(hash, data, data_len);
```

That is the entire API. Three arguments: output buffer, input data, input length. The output buffer must be exactly `crypto_hash_sha256_BYTES` (which is 32).

To hash a file, you read the entire file into memory, then pass the buffer to `crypto_hash_sha256()`. This is the simple approach — it works for small files. Later this week you will learn the streaming approach for large files.

To convert the 32-byte digest to a hex string for display, loop over each byte and print it as two hex characters. libsodium also provides `sodium_bin2hex()` to do this conversion for you.

You can verify your output by comparing it with the `sha256sum` command-line tool (Linux/macOS). If both produce the same 64-character hex string, your implementation is correct.

## Task

1. Write a program that takes a filename as a command-line argument
2. Read the entire file into a `std::vector<unsigned char>`
3. Call `crypto_hash_sha256()` to compute the hash
4. Print the hash as a 64-character lowercase hex string
5. Test with a known file and verify against `sha256sum`

## Hints

- Output buffer: `unsigned char hash[crypto_hash_sha256_BYTES]`
- Read file: open with `std::ifstream` in binary mode (`std::ios::binary`), use `seekg`/`tellg` for size, read into vector
- Hex conversion: `sodium_bin2hex()` takes output char buffer, output max length, input bytes, input length
- Or manually: `printf("%02x", hash[i])` in a loop
- Compare with: `sha256sum yourfile` on Linux or `shasum -a 256 yourfile` on macOS
- Link with `-lsodium`

## Verify

```bash
cmake --build build
echo -n "hello world" > testfile.txt
./build/file_hash testfile.txt
sha256sum testfile.txt
```

Expected: both commands print the same 64-character hex string. For "hello world" (no newline), the SHA-256 is `b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9`.

## Done When

Your program and `sha256sum` produce identical hashes for the same file.
