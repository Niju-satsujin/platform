---
id: w06-quest
title: "Week 6 Boss: Signed Protocol"
part: w06
kind: boss
proof:
  type: paste
  instructions: "Paste: (1) output of a client sending a signed envelope that the server accepts, (2) output of a client sending with an unknown key that the server rejects, (3) quality gate checklist with all items PASS."
  regex_patterns:
    - "signature|verified|accepted"
    - "rejected|unknown|denied"
    - "PASS"
---
# Week 6 Boss: Signed Protocol

## Goal

Demonstrate a fully signed protocol where the server verifies every message and rejects unknown signers.

## Requirements

1. **Client generates an Ed25519 key pair** and registers its public key with the server
2. **Every envelope** includes a signature field and a key_id field
3. **Server verifies** the signature on every incoming envelope before processing
4. **Valid messages** from registered keys are accepted and processed normally
5. **Messages from unknown keys** are rejected with an error response
6. **Messages with invalid signatures** (tampered payload) are rejected
7. **Benchmark** — signing and verification throughput numbers recorded

## Verify

```bash
# Terminal 1: start the server with a key registry
./server --key-registry keys.db

# Terminal 2: registered client sends a signed message
./client --keyfile alice.key --message "hello from alice"

# Terminal 3: unknown client tries to send
./client --keyfile unknown.key --message "hello from stranger"
```

Expected: Terminal 2 shows the message accepted. Terminal 3 shows the message rejected with "unknown key" error.

## Done When

The server accepts signed messages from registered clients, rejects messages from unknown clients, and the Week 6 quality gate is fully green.
