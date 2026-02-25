---
id: w08-l04
title: "Attack drill — revoked key"
order: 4
duration_minutes: 25
xp: 50
kind: lesson
part: w08
proof:
  type: paste
  instructions: "Paste the output showing the server REJECTED a message signed with a revoked key."
  regex_patterns:
    - "REJECTED|rejected|revoked"
    - "key.revoked|revoked.key"
---
# Attack drill — revoked key

## Concept

Key revocation means a key is no longer trusted. Maybe the private key was compromised. Maybe the user left the organization. Maybe the key expired and was replaced. Whatever the reason, the server has marked that key as revoked.

But the private key still works. It can still produce valid Ed25519 signatures. The math does not know the key is revoked — only your server knows. If your server checks the signature but forgets to check the revocation list, a revoked key can still send commands.

This is a real-world problem. Certificate revocation is one of the hardest problems in security. Your system is simpler — you have a local revocation list — but the same logic applies. The check must happen, and it must happen before the server acts on the message.

The attack: sign a message with a key that was valid but has since been revoked. The signature will be cryptographically correct. The server must still reject it.

## Task

1. Write an attack program called `attack_revoked`
2. Register a test key with the server (or use one from your key store)
3. Send a properly signed message with that key — confirm it is ACCEPTED
4. Revoke the key using your key management interface (revocation list, API call, or config update)
5. Send another properly signed message with the same key
6. Print the server's response — it must be REJECTED with a revocation reason
7. Print results: `"BEFORE_REVOKE: <response>"` and `"AFTER_REVOKE: <response>"`
8. Exit with code 0 if the post-revocation message is rejected

## Hints

- Your key lifecycle code from Week 7 should have a revocation list or a `revoked` status flag
- The server must check revocation status AFTER looking up the key but BEFORE trusting the signature (or after verifying but before processing — either order works, as long as it rejects)
- If your revocation is file-based, update the file and make sure the server re-reads it (or watches for changes)
- If your revocation is in-memory, you need a way to trigger it — a command, a signal, or an API endpoint
- The error reason should be distinct from "unknown_key" — the key IS known, it is just revoked

## Verify

```bash
# Terminal 1 — server running
./server --port 9000

# Terminal 2 — run the attack
./attack_revoked --host 127.0.0.1 --port 9000
echo $?
```

Expected output:
```
BEFORE_REVOKE: ACCEPTED
AFTER_REVOKE: REJECTED reason=key_revoked
```

Exit code: `0`

## Done When

The server accepts a message before key revocation and rejects the same key's messages after revocation.
