---
id: w06-l02
title: "Ed25519 key generation"
order: 2
duration_minutes: 25
xp: 50
kind: lesson
part: w06
proof:
  type: paste
  instructions: "Paste output showing a generated key pair with hex-encoded public key (64 hex chars) and confirmation that the key files were written to disk."
  regex_patterns:
    - "[0-9a-f]{64}"
    - "public|pk"
    - "written|saved|file"
---
# Ed25519 key generation

## Concept

Before you can sign anything, you need a key pair. In C, generating random keys meant calling platform-specific APIs or reading from `/dev/urandom`. libsodium handles all of this for you with one function call.

`crypto_sign_keypair()` generates a random Ed25519 key pair. It fills two buffers: one for the public key (32 bytes), one for the secret key (64 bytes). The secret key actually contains a copy of the public key inside it — this is an Ed25519 implementation detail.

The critical rule: the **secret key must never be shared**. If someone gets your secret key, they can forge your signature on any message. Treat it like a password — write it to a file with restricted permissions, do not print it to stdout in production, do not commit it to git.

The public key is safe to share with anyone. It is your identity — "this is how you verify that a message came from me."

## Task

1. Write a program called `keygen` that generates an Ed25519 key pair
2. Save the public key to `<name>.pub` (raw 32 bytes)
3. Save the secret key to `<name>.key` (raw 64 bytes)
4. The name comes from a command-line argument: `./keygen alice`
5. Print the public key as a hex string to stdout
6. Set file permissions on the `.key` file to owner-read-only (0400)
7. Call `sodium_init()` before any crypto operations

## Hints

- `#include <sodium.h>` — the single libsodium header
- `crypto_sign_keypair(pk, sk)` — fills `unsigned char pk[crypto_sign_PUBLICKEYBYTES]` and `unsigned char sk[crypto_sign_SECRETKEYBYTES]`
- To hex-encode: `sodium_bin2hex()` converts binary to hex string
- `chmod()` from `<sys/stat.h>` sets file permissions
- Link with `-lsodium`: `g++ -std=c++17 -o keygen keygen.cpp -lsodium`
- `sodium_init()` returns 0 on success, 1 if already initialized, -1 on failure

## Verify

```bash
g++ -std=c++17 -o keygen keygen.cpp -lsodium
./keygen alice
ls -la alice.pub alice.key
xxd alice.pub | head -1
xxd alice.key | head -1
```

Expected:
- `alice.pub` is exactly 32 bytes
- `alice.key` is exactly 64 bytes
- `alice.key` has permissions `-r--------` (0400)
- stdout shows 64 hex characters (the public key)

## Done When

The keygen program creates a valid Ed25519 key pair, saves both files, and the secret key file has restricted permissions.
