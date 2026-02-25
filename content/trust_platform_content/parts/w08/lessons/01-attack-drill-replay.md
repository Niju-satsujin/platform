---
id: w08-l01
title: "Attack drill — replay attack"
order: 1
duration_minutes: 25
xp: 50
kind: lesson
part: w08
proof:
  type: paste
  instructions: "Paste the output showing: (1) the original signed message accepted, (2) the replayed message REJECTED with a replay/nonce error."
  regex_patterns:
    - "REJECTED|rejected|replay|duplicate"
    - "nonce|already.seen"
---
# Attack drill — replay attack

## Concept

A replay attack is the simplest attack against a signed protocol. You do not need to break any cryptography. You just record a valid message that worked before and send it again.

Imagine someone sends a signed command: "transfer $100 to Alice." The signature is valid. The timestamp is valid. Everything checks out and the server processes it. Now you copy that exact message — every byte — and send it again. If the server does not track which messages it has already seen, it processes the transfer a second time.

Your nonce-based replay defense from Week 7 should stop this. Every message has a unique nonce. The server stores nonces it has seen. When it sees the same nonce twice, it rejects the message. This drill proves that defense actually works.

You are now the attacker. Your job is to capture a legitimate signed message off the wire (or from your own client) and replay it. If the server accepts it, your replay defense has a bug.

## Task

1. Write an attack program called `attack_replay` (or add it as a mode to an existing test harness)
2. The program connects to the server and sends a properly signed message with a valid nonce and timestamp
3. Read the server's response — it should be ACCEPTED
4. Send the exact same bytes again without changing anything
5. Read the server's response — it must be REJECTED with an error indicating duplicate nonce or replay detected
6. Print both responses clearly labeled: `"ORIGINAL: <response>"` and `"REPLAY: <response>"`
7. Exit with code 0 if the replay was rejected, exit with code 1 if it was accepted

## Hints

- You already have a function that builds a signed envelope — reuse it
- Save the serialized bytes in a `std::vector<uint8_t>` after the first send
- For the replay, send those exact saved bytes — do not rebuild the message
- The server's nonce store from Week 7 should catch duplicates
- If you stored nonces in a `std::unordered_set`, the `.count()` or `.contains()` check triggers on the second send
- Check your server's error response format — it probably includes a reason string

## Verify

```bash
# Terminal 1 — start the server
./server --port 9000

# Terminal 2 — run the attack
./attack_replay --host 127.0.0.1 --port 9000
echo $?
```

Expected output:
```
ORIGINAL: ACCEPTED
REPLAY: REJECTED reason=duplicate_nonce
```

Exit code: `0`

## Done When

The replay attack program sends the same signed message twice and the server rejects the second copy.
