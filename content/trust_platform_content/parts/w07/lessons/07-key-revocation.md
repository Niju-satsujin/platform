---
id: w07-l07
title: "Key revocation"
order: 7
duration_minutes: 25
xp: 50
kind: lesson
part: w07
proof:
  type: paste
  instructions: "Paste the output of your program that: (1) signs and verifies an envelope with an active key, (2) revokes the key, (3) attempts to verify the same envelope and gets a revocation rejection."
  regex_patterns:
    - "REVOKED|revoked"
    - "reject|denied|refused"
    - "active.*valid|valid.*active|verified OK"
---
# Key revocation

## Concept

Deprecation is gentle: the key still works, just with a warning. Revocation is the emergency brake. When you revoke a key, it is immediately and permanently rejected. No grace period. No transition.

Why would you revoke instead of deprecate? The key was stolen. The key was used to sign malicious messages. The key owner left the company under bad terms. In these cases you want the key dead right now, not "still working for a few days."

When the verifier encounters an envelope signed by a revoked key, it must reject the envelope even though the signature is mathematically valid. The signature check would pass — the bytes are correct, the math works. But the key is revoked, so the answer is no.

The revocation check must happen before the signature check. The order of verification is now:

1. Extract the key ID from the envelope
2. Look up the key in the registry
3. If the key status is `REVOKED`: reject immediately (do not verify signature)
4. If the key status is `ACTIVE` or `DEPRECATED`: proceed with signature verification
5. Check nonce and timestamp as before

Checking revocation before signature verification is important for two reasons: it is faster (a map lookup vs. elliptic curve math), and it prevents a subtle attack where a compromised key is used to sign new messages that would pass signature verification.

## Task

1. Add a `revoke_key(key_id)` method to your key registry that sets the key's status to `REVOKED`
2. Update the verification flow: check key status before verifying the signature
3. If the key is revoked, return an error like `"KEY_REVOKED: key <id> has been revoked"`
4. A revoked key cannot be un-revoked — there is no method to change `REVOKED` back to `ACTIVE`
5. Write a test that: signs with an active key (succeeds), revokes the key, verifies the same envelope (fails with revocation error)

## Hints

- The revoke method just changes the status in the registry: `registry[key_id].status = KeyStatus::REVOKED;`
- Do not delete the key from the registry — you want to remember that it existed and was revoked, in case someone tries to re-register it
- Consider adding a `revoked_at` timestamp so you have an audit trail
- Print: `"KEY_REVOKED: rejecting envelope signed by revoked key abc123"`
- Test that revoking an already-revoked key is a no-op (no crash, no error)

## Verify

```bash
cmake --build build
./build/test_key_revocation
```

Expected output:
```
key ABC123 status: ACTIVE
signed envelope: verified OK
--- revoking key ABC123 ---
key ABC123 status: REVOKED
same envelope: KEY_REVOKED — rejecting envelope signed by revoked key ABC123
revocation test passed
```

## Done When

An envelope signed by a revoked key is rejected with a clear error message, even though its signature is mathematically valid.
