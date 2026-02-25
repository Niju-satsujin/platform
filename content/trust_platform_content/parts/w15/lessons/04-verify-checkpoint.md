---
id: w15-l04
title: "Verify a checkpoint"
order: 4
duration_minutes: 25
xp: 50
kind: lesson
part: w15
proof:
  type: paste
  instructions: "Paste output showing a valid checkpoint verified as VALID, and a tampered checkpoint detected as INVALID."
  regex_patterns:
    - "VALID|valid|verified"
    - "INVALID|invalid|tampered|rejected"
---
# Verify a checkpoint

## Concept

Signing a checkpoint is only useful if someone else can verify it. In a transparency log system, the operator publishes checkpoints and anyone — clients, auditors, monitors — can download them and check the signature. This is the "trust but verify" part: you do not have to blindly trust the operator, because you can check their math.

Verification is straightforward. You take the signed checkpoint, re-serialize the body (log_size + root_hash + timestamp) using the exact same format the operator used, then verify the Ed25519 signature against the operator's public key. If the signature is valid, you know the operator really did commit to that log state. If someone changed even a single bit of the checkpoint — the log size, the root hash, or the timestamp — the signature check will fail.

This is a key property of digital signatures: they protect integrity. You cannot change the signed message without invalidating the signature. And you cannot forge a new signature without the private key. So if the signature verifies, you know two things: (1) the operator signed it, and (2) nobody changed it since.

## Task

1. Implement `bool verify_checkpoint(const SignedCheckpoint& cp, const Ed25519PublicKey& pk)`
2. Re-serialize the checkpoint body the same way you did when signing: 8 bytes little-endian log_size + 32 bytes root_hash + 8 bytes little-endian timestamp
3. Verify the Ed25519 signature over the serialized body using the public key
4. Return `true` if the signature is valid, `false` otherwise
5. Test with a valid checkpoint — should return true
6. Test with a tampered checkpoint — change one byte of the root hash, verify returns false
7. Test with a tampered checkpoint — change the log_size, verify returns false
8. Test with a wrong public key — verify returns false

## Hints

- The serialization must be byte-for-byte identical to what `sign_checkpoint()` produces. If you use a helper function for serialization, share it between sign and verify
- If using libsodium: `crypto_sign_verify_detached(sig, message, message_len, public_key)` returns 0 on success, -1 on failure
- For the tampered test: copy a valid checkpoint, change `root_hash[0] ^= 0x01`, then verify — should fail
- For the wrong-key test: generate a second Ed25519 key pair and try to verify with that public key
- This function is pure — it does not need access to the log itself, just the checkpoint struct and the public key

## Verify

```bash
cmake --build build
./build/test_verify_checkpoint
```

Expected output:
```
Valid checkpoint:   VALID
Tampered root_hash: INVALID
Tampered log_size:  INVALID
Wrong public key:   INVALID
```

## Done When

Your `verify_checkpoint` function accepts valid checkpoints and rejects any checkpoint where the signature, root hash, log size, timestamp, or public key has been tampered with.
