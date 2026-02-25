---
id: w16-l02
title: "Gossip between monitors"
order: 2
duration_minutes: 25
xp: 75
kind: lesson
part: w16
proof:
  type: paste
  instructions: "Paste the output showing two monitors exchanging checkpoints over TCP and both reporting matching checkpoints."
  regex_patterns:
    - "gossip|received|exchange"
    - "checkpoint|size|root"
    - "match|OK|consistent"
---
# Gossip between monitors

## Concept

A single monitor can verify that the log is consistent over time — each new checkpoint extends the previous one. But what if the log operator is more clever? What if it shows one version of the log to Monitor A and a different version to Monitor B? Monitor A sees a consistent log. Monitor B sees a consistent log. But they are seeing different logs. This is called equivocation, and it is the hardest attack to catch.

The defense is gossip. Monitors talk to each other and compare what they have seen. Monitor A sends its latest signed checkpoint to Monitor B. Monitor B compares it with its own latest checkpoint. If both checkpoints have the same log size but different root hashes, and both signatures are valid, that is proof the operator cheated — it signed two different statements about the same log state. This proof is undeniable because the signatures are cryptographic.

Gossip does not need to be complicated. In your implementation, two monitors connect over a simple TCP socket. One sends its latest signed checkpoint as bytes. The other receives it, verifies the signature, and compares it with what it has. In production systems like Certificate Transparency, gossip happens over HTTPS between organizations, but the idea is the same: share what you have seen, compare notes.

The word "gossip" comes from gossip protocols in distributed systems. Nodes randomly share information with each other, and eventually everyone knows everything. For monitors, even a single exchange between two monitors is enough to catch equivocation.

## Task

1. Create a simple gossip protocol between two monitors:
   - Monitor A serializes its latest `SignedCheckpoint` to bytes (size, root hash, signature)
   - Monitor A connects to Monitor B over TCP and sends the bytes
   - Monitor B receives the bytes, deserializes the checkpoint, and verifies the signature
   - Monitor B compares the received checkpoint with its own latest checkpoint
2. Define a serialization format for `SignedCheckpoint`. A simple approach:
   - 8 bytes: log size (uint64_t, network byte order)
   - 32 bytes: root hash
   - 64 bytes: Ed25519 signature
   - Total: 104 bytes, fixed size
3. Write a test with two monitors running in the same process:
   - Both monitors poll the same log and get the same checkpoint
   - Monitor A sends its checkpoint to Monitor B via TCP (use localhost)
   - Monitor B receives it and confirms it matches its own checkpoint
   - Print: `[Gossip] received checkpoint size=N — matches local checkpoint`
4. Use `std::thread` to run the TCP server (Monitor B) in a background thread

## Hints

- For TCP, use POSIX sockets: `socket()`, `bind()`, `listen()`, `accept()`, `connect()`, `send()`, `recv()`
- Pick a port like 9900. Bind to `127.0.0.1` so it only listens locally
- You need exactly 104 bytes per message — use a fixed-size buffer, no framing needed
- Use `htonll()` or manually convert uint64_t to network byte order (big-endian). On Linux, `htobe64()` from `<endian.h>` works. On other platforms, write a simple byte-swap
- `std::thread server([&]() { /* accept and recv */ });` runs the server in the background
- Call `server.join()` after the client sends, to wait for the server to finish
- Both monitors should verify the signature on any checkpoint they receive over gossip — never trust a checkpoint just because it arrived over the network
- If this is your first time with TCP sockets in C++, focus on the happy path first. Error handling can come later

## Verify

```bash
g++ -std=c++17 -o gossip_test gossip_test.cpp -lssl -lcrypto -lpthread
./gossip_test
# Should show Monitor B receiving the checkpoint and confirming it matches
```

Try sending a corrupted checkpoint (flip a byte in the signature). Monitor B should reject it because the signature does not verify.

## Done When

Two monitors exchange a signed checkpoint over TCP. The receiving monitor verifies the signature and confirms the checkpoint matches its own. A corrupted checkpoint is rejected.
