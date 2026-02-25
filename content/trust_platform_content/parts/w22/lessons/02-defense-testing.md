---
id: w22-l02
title: "Defense Testing"
order: 2
duration_minutes: 30
xp: 75
kind: lesson
part: w22
proof:
  type: paste
  instructions: "Paste the output of your defense tests showing all attacks blocked."
  regex_patterns:
    - "blocked|rejected|denied"
    - "pass|defense"
---

## Concept

You have built multiple defenses throughout the program: input validation (Week 3), replay defense (Week 7), signature verification (Week 6), key revocation (Week 7), and policy gates (Week 17). But do they actually work? Defense testing means trying to attack your own system and verifying the defenses catch every attack.

This is different from normal testing. Normal tests check that valid inputs produce correct outputs. Defense tests check that invalid, malicious, or crafted inputs are rejected. A defense test is a mini-penetration test — you play the role of the attacker.

Write one test for each defense: send a malformed envelope (should be rejected by the parser), replay a signed message (should be rejected by the nonce tracker), forge a signature (should be rejected by verify), use a revoked key (should be rejected by the policy gate), and send an oversized payload (should be rejected by the size limit).

## Task

Write 5 defense tests:
1. **Malformed envelope**: send garbage bytes to the TCP server → should disconnect with an error, not crash
2. **Replay attack**: capture a valid signed message, send it again → should be rejected ("duplicate nonce")
3. **Signature forgery**: modify one byte of a signed document, verify → should fail ("signature invalid")
4. **Revoked key**: issue a document with a revoked key → should fail ("key revoked")
5. **Oversized payload**: send a message larger than the maximum allowed size → should be rejected ("payload too large")

## Hints

- For malformed envelope: send 100 random bytes to the TCP port and verify the server stays alive
- For replay: save the raw bytes of a valid message, send them twice. The first should succeed, the second should fail
- For forgery: use a valid SignedDocument, flip one byte in the body, then call verify()
- For revoked key: revoke a key, then try to issue a document with it
- For oversized payload: create a message larger than your MAX_PAYLOAD_SIZE and send it

## Verify

```bash
cd build && ctest --output-on-failure -R defense
```

All 5 defense tests pass — every attack is blocked.

## Done When

Your defense tests prove that all 5 attack vectors are blocked by your existing security measures.
