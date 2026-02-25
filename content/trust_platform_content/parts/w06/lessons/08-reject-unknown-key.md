---
id: w06-l08
title: "Reject messages from unknown keys"
order: 8
duration_minutes: 30
xp: 75
kind: lesson
part: w06
proof:
  type: paste
  instructions: "Paste server logs showing: (1) accepting a message from a registered key, (2) rejecting a message from an unknown key with an error response sent to the client, (3) rejecting a message with a valid key_id but tampered signature."
  regex_patterns:
    - "accepted|processed"
    - "rejected|unknown|denied"
    - "invalid|tampered|bad.sig"
---
# Reject messages from unknown keys

## Concept

This is where everything comes together. Your server now has:

- A signed envelope format (lesson 5)
- A key_id field for fast lookup (lesson 6)
- A key registry with known public keys (lesson 7)

Now you wire them together in the server's message-handling path. When an envelope arrives:

1. Extract the `key_id` from the envelope
2. Look up the `key_id` in the registry
3. If the key_id is **not found** — reject immediately with an "unknown key" error
4. If the key_id is found, get the public key and **verify the signature**
5. If the signature is **invalid** — reject with a "bad signature" error
6. If everything checks out — process the message normally

This is called **authentication** — verifying the identity of the sender before doing anything with their message. It is the first line of defense. Without it, anyone can send anything.

Three failure modes to handle:
- **Unknown key_id** — the sender is not registered. Maybe they are a new client, maybe an attacker. Either way, reject.
- **Bad signature** — the key_id is known but the signature does not match. Either the message was tampered with in transit or someone is trying to forge a signature. Reject.
- **Expired/revoked key** — out of scope for this week, but keep it in mind for later.

## Task

1. Add signature verification to your server's message-handling path
2. Before processing any envelope, verify the signature using the key registry
3. For unknown key_id: send an error response `"ERROR: unknown key"`, log a warning, increment an `unknown_key_count` metric
4. For bad signature: send an error response `"ERROR: invalid signature"`, log a warning, increment a `bad_sig_count` metric
5. For valid signature: process normally, log the signer's name
6. Test with three scenarios:
   - Registered client sends a properly signed message (accepted)
   - Unregistered client sends a signed message (rejected: unknown key)
   - Registered client's message is tampered with after signing (rejected: bad signature)
7. Log format: `"[AUTH] key_id=<hex> result=<accepted|unknown_key|bad_sig> name=<name|?>""`

## Hints

- Check key_id lookup before signature verification — no point verifying against a key you do not have
- Use early returns: `if (!registry.has(key_id)) { send_error(...); return; }`
- For the tamper test: flip one byte in the serialized payload after signing but before sending
- The error response should be a valid envelope so the client can parse it — use a special message type like `MSG_ERROR`
- Consider rate-limiting: if a key_id sends too many bad signatures, something is wrong

## Verify

```bash
# Terminal 1: server with registered keys
./server --key-registry keys.db

# Terminal 2: registered client (alice is in keys.db)
./client --keyfile alice.key --message "hello from alice"
# Expected: server logs "[AUTH] key_id=... result=accepted name=alice"

# Terminal 3: unknown client
./keygen stranger
./client --keyfile stranger.key --message "hello from stranger"
# Expected: server logs "[AUTH] key_id=... result=unknown_key name=?"
# Expected: client receives "ERROR: unknown key"
```

Expected server output:
```
[AUTH] key_id=a1b2c3d4e5f60718 result=accepted name=alice
[AUTH] key_id=9f8e7d6c5b4a3928 result=unknown_key name=?
```

## Done When

The server rejects messages from unknown keys and messages with invalid signatures, sends appropriate error responses to the client, and logs every authentication decision.
