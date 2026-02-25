---
id: w06-l04
title: "Verify a signature"
order: 4
duration_minutes: 25
xp: 50
kind: lesson
part: w06
proof:
  type: paste
  instructions: "Paste output showing: (1) a valid signature verified successfully, and (2) a tampered file detected as invalid."
  regex_patterns:
    - "valid|verified|OK"
    - "invalid|tampered|FAIL|BAD"
---
# Verify a signature

## Concept

Verification is the other half of signing. You take three things — the message, the signature, and the public key — and you check: "did the holder of the corresponding private key actually sign this exact message?"

The function returns a simple yes or no. If the message was changed by even one byte, verification fails. If the signature was created with a different key, verification fails. There is no "partially valid" — it is binary.

This is the core of trust in digital systems. When your server receives a message with a signature, it does not need to trust the network, the transport, or the client software. It only needs to trust the public key. If the signature checks out, the message is authentic.

In C terms, think of it as a `memcmp` that works on cryptographic proofs instead of raw bytes — except the math does all the heavy lifting.

## Task

1. Write a program called `verify` that takes a public key file, an input file, and a signature file
2. Usage: `./verify alice.pub message.txt message.txt.sig`
3. Read the public key (32 bytes), the message, and the signature (64 bytes)
4. Call the verification function
5. Print `SIGNATURE VALID` and exit 0 on success
6. Print `SIGNATURE INVALID` and exit 1 on failure
7. Test with the real signature from lesson 3
8. Test again after modifying one byte of the message file — verification must fail

## Hints

- `crypto_sign_verify_detached(sig, message, message_len, pk)` — returns 0 if valid, -1 if invalid
- Exit codes: `return 0;` for success, `return 1;` for failure
- To tamper: `echo "hello world!" > message.txt` (added an exclamation mark) then re-run verify with the old signature
- The public key is the `.pub` file, not the `.key` file — this is intentional: you should never need the secret key to verify

## Verify

```bash
# Test 1: valid signature
echo "hello world" > message.txt
./sign alice.key message.txt
./verify alice.pub message.txt message.txt.sig
echo "Exit code: $?"

# Test 2: tampered message
echo "hello world!" > message.txt
./verify alice.pub message.txt message.txt.sig
echo "Exit code: $?"
```

Expected:
- Test 1: `SIGNATURE VALID`, exit code 0
- Test 2: `SIGNATURE INVALID`, exit code 1

## Done When

The verify program correctly distinguishes between valid and invalid signatures, and returns appropriate exit codes.
