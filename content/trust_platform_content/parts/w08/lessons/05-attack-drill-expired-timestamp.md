---
id: w08-l05
title: "Attack drill — expired timestamp"
order: 5
duration_minutes: 25
xp: 50
kind: lesson
part: w08
proof:
  type: paste
  instructions: "Paste the output showing the server REJECTED a message with a timestamp 10 minutes in the past."
  regex_patterns:
    - "REJECTED|rejected|expired|stale"
    - "timestamp|time"
---
# Attack drill — expired timestamp

## Concept

Timestamps prevent a delayed version of the replay attack. Even if an attacker cannot replay the exact same nonce, they might capture a message and hold it for later. If the message says "delete all files" and the attacker sends it an hour later, the nonce is unique (never seen before) so the nonce check passes. But the message is old. The sender might have changed their mind or revoked the command.

Your timestamp validation from Week 7 defends against this. Every message includes a timestamp, and the server rejects messages older than a threshold — typically 5 minutes. The exact window depends on your design, but the concept is the same: if the message is too old, do not trust it.

The attack: build a properly signed message but set the timestamp to 10 minutes in the past. The signature is valid, the nonce is fresh, the key is good — but the timestamp is stale. The server must reject it.

## Task

1. Write an attack program called `attack_expired`
2. Build a message with a valid signature, fresh nonce, and authorized key
3. Set the timestamp to `now - 10 minutes` (or whatever exceeds your server's threshold)
4. Sign the message (the signature covers the timestamp, so the stale time is baked into the signature)
5. Send it to the server
6. Print the server's response — it must be REJECTED with a timestamp/expiry reason
7. Also send a message with a valid current timestamp to confirm the server is not rejecting everything
8. Print results: `"CURRENT_TIME: <response>"` and `"EXPIRED_TIME: <response>"`
9. Exit with code 0 if the expired message is rejected and the current one is accepted

## Hints

- `std::chrono::system_clock::now()` for current time
- Subtract 10 minutes: `auto old = now - std::chrono::minutes(10);`
- Convert to Unix timestamp: `std::chrono::duration_cast<std::chrono::seconds>(old.time_since_epoch()).count()`
- Your timestamp field is signed as part of the payload — you set the old time BEFORE signing, not after
- This means the signature is valid — the attack is not a tamper attack, it is a freshness attack
- Your server's threshold should be well under 10 minutes (e.g., 5 minutes or 2 minutes)

## Verify

```bash
# Terminal 1 — server running
./server --port 9000

# Terminal 2 — run the attack
./attack_expired --host 127.0.0.1 --port 9000
echo $?
```

Expected output:
```
CURRENT_TIME: ACCEPTED
EXPIRED_TIME: REJECTED reason=timestamp_expired
```

Exit code: `0`

## Done When

The server accepts a message with a current timestamp and rejects an otherwise-valid message with a timestamp 10 minutes in the past.
