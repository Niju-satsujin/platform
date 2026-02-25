---
id: w07-l06
title: "Key rotation"
order: 6
duration_minutes: 30
xp: 75
kind: lesson
part: w07
proof:
  type: paste
  instructions: "Paste the output of your program that: (1) signs with the old key and verifies successfully, (2) rotates to a new key, (3) signs with the new key and verifies successfully, (4) signs with the old key during the transition period and verifies successfully."
  regex_patterns:
    - "old.key|previous.key|key_0|KEY_OLD"
    - "new.key|rotated|key_1|KEY_NEW"
    - "transition|both.*accepted|grace"
---
# Key rotation

## Concept

Keys should not last forever. There are many reasons to replace a key with a new one: the key might have been accidentally exposed, a policy might require rotation every 90 days, or an employee who knew the key might have left the organization. Whatever the reason, you need a way to swap in a new key without breaking everything.

The naive approach is: generate a new keypair, delete the old one, start signing with the new one. The problem is that messages signed with the old key are still in flight. Maybe a message was signed one second before the rotation and arrives one second after. If you only accept the new key, that valid message gets rejected.

The solution is a transition period. During rotation, both the old key and the new key are accepted. New messages are signed with the new key. Old messages signed with the previous key are still valid. After the transition period ends, the old key is fully retired.

Your key registry from Week 6 already maps key IDs to public keys. Now you extend it with a concept of key status: `active`, `deprecated`, or `revoked`. During rotation, the old key moves to `deprecated` status, and the new key becomes `active`. The verifier accepts signatures from both `active` and `deprecated` keys.

## Task

1. Add a `KeyStatus` enum to your key registry: `ACTIVE`, `DEPRECATED`, `REVOKED`
2. Each entry in the registry now has: public key, status, and a `created_at` timestamp
3. Write a `rotate_key(old_key_id)` function that:
   - Generates a new Ed25519 keypair
   - Adds the new key to the registry with status `ACTIVE`
   - Changes the old key's status from `ACTIVE` to `DEPRECATED`
   - Returns the new key ID
4. Update your verification logic: accept signatures from keys with status `ACTIVE` or `DEPRECATED`
5. Write a test that signs with old key, rotates, signs with new key, and verifies both succeed

## Hints

- `crypto_sign_keypair()` from libsodium generates a new Ed25519 keypair
- The key ID can be the first 8 bytes of the public key in hex, or any unique identifier you choose
- Store `KeyStatus` as an enum class: `enum class KeyStatus { ACTIVE, DEPRECATED, REVOKED };`
- The transition period logic comes in lesson 8 — for now, deprecated keys are accepted indefinitely
- Print which key was used for each operation: `"signed with key_id=abc123 (ACTIVE)"`, `"verified with key_id=def456 (DEPRECATED)"`

## Verify

```bash
cmake --build build
./build/test_key_rotation
```

Expected output:
```
signed with key OLD_KEY (ACTIVE): verified OK
--- key rotation ---
old key OLD_KEY status: DEPRECATED
new key NEW_KEY status: ACTIVE
signed with key NEW_KEY (ACTIVE): verified OK
signed with key OLD_KEY (DEPRECATED): verified OK
both keys accepted during transition
```

## Done When

After rotating, envelopes signed with the new key and envelopes signed with the old (now deprecated) key are both accepted by the verifier.
