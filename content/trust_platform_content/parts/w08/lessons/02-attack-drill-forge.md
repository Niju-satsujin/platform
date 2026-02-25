---
id: w08-l02
title: "Attack drill — signature forgery"
order: 2
duration_minutes: 25
xp: 50
kind: lesson
part: w08
proof:
  type: paste
  instructions: "Paste the output showing the server REJECTED the forged message with a signature verification failure."
  regex_patterns:
    - "REJECTED|rejected|invalid.signature|verification.failed"
    - "forg|fake|bad.sig"
---
# Attack drill — signature forgery

## Concept

A forgery attack means you send a message that was not signed by any authorized key. You make up a signature — random bytes — and hope the server does not notice.

This sounds silly, but it catches real bugs. Maybe your server skips signature verification under certain conditions. Maybe an error path accepts unsigned messages. Maybe the verification function returns the wrong value on failure. The only way to know is to try it.

In this drill you generate a completely fake signature. Not a modified real one — a fully random 64-byte blob. You attach it to a properly formatted message and send it. Ed25519 verification should fail immediately because the signature does not match the public key and payload.

There is also a subtler variant: sign the message with a different key — one the server does not know. The signature is cryptographically valid but for the wrong key. The server should reject this too.

## Task

1. Write an attack program called `attack_forge`
2. Build a properly formatted message with a valid payload, nonce, and timestamp
3. Instead of signing it with your real private key, fill the signature field with 64 random bytes
4. Send the message to the server
5. Print the server's response — it must be REJECTED
6. Second test: generate a new Ed25519 key pair that the server has never seen, sign the message with that key, and send it
7. Print the server's response — it must also be REJECTED
8. Print results: `"RANDOM_SIG: <response>"` and `"UNKNOWN_KEY: <response>"`
9. Exit with code 0 if both are rejected, exit with code 1 if either is accepted

## Hints

- For random bytes: `RAND_bytes(sig_buf, 64)` from OpenSSL, or read from `/dev/urandom`
- For the unknown key variant: `EVP_PKEY_keygen()` to create a throwaway Ed25519 key pair
- Your message format should include a key identifier (public key or key ID) — the server uses this to look up the verification key
- If your server requires a registered key ID, the unknown-key test should fail at key lookup before verification even runs
- Both failure modes matter: "bad signature" and "unknown key" are different rejection reasons

## Verify

```bash
# Terminal 1 — server running
./server --port 9000

# Terminal 2 — run the attack
./attack_forge --host 127.0.0.1 --port 9000
echo $?
```

Expected output:
```
RANDOM_SIG: REJECTED reason=invalid_signature
UNKNOWN_KEY: REJECTED reason=unknown_key
```

Exit code: `0`

## Done When

The server rejects both a message with random signature bytes and a message signed by an unknown key.
