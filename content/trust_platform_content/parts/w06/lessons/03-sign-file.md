---
id: w06-l03
title: "Sign a file"
order: 3
duration_minutes: 25
xp: 50
kind: lesson
part: w06
proof:
  type: paste
  instructions: "Paste output showing a file being signed: the file name, file size, and the hex-encoded 64-byte detached signature."
  regex_patterns:
    - "signature|sig"
    - "[0-9a-f]{128}"
    - "bytes|size"
---
# Sign a file

## Concept

Signing means: take some data, combine it with your private key, and produce a short fixed-size blob (the signature) that proves you approved that data. If even one bit of the data changes, the signature becomes invalid.

libsodium offers two modes for signing:

1. **Combined mode** (`crypto_sign`) — prepends the signature to the message, producing a single blob. Simple but you get a copy of the entire message embedded in the output.
2. **Detached mode** (`crypto_sign_detached`) — produces only the 64-byte signature, separate from the message. This is what you want when the message is large (a file) or when you are adding the signature as a field in a protocol.

You will use **detached mode** because your messages already exist (as files or envelopes). You just need the 64-byte signature alongside.

In C terms, this is like computing a checksum — but a checksum that only someone with the right key can produce.

## Task

1. Write a program called `sign` that takes a secret key file and an input file
2. Usage: `./sign alice.key message.txt`
3. Read the secret key from the `.key` file (64 bytes)
4. Read the entire input file into memory
5. Compute a detached Ed25519 signature
6. Write the signature to `<input>.sig` (raw 64 bytes)
7. Print the signature as hex to stdout
8. Print the input file size for confirmation

## Hints

- `crypto_sign_detached(sig, &sig_len, message, message_len, sk)` — `sig` is `unsigned char[crypto_sign_BYTES]`, `sig_len` will be set to `crypto_sign_BYTES` (64)
- Read files with `std::ifstream` in binary mode: `std::ifstream f(path, std::ios::binary)`
- Use `std::vector<unsigned char>` to hold the file contents
- Get file size: read all bytes into a vector, then check `.size()`
- `sodium_bin2hex()` to print the signature as hex

## Verify

```bash
echo "hello world" > message.txt
./sign alice.key message.txt
ls -la message.txt.sig
xxd message.txt.sig | head -2
```

Expected:
- `message.txt.sig` is exactly 64 bytes
- stdout shows a 128-character hex string (64 bytes as hex)
- stdout also shows the input file size

## Done When

The sign program reads a secret key and a file, produces a 64-byte detached Ed25519 signature, and writes it to a `.sig` file.
