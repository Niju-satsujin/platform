---
id: w07-l01
title: "What is a replay attack?"
order: 1
duration_minutes: 20
xp: 50
kind: lesson
part: w07
proof:
  type: paste
  instructions: "Paste the output of your program that sends the same signed envelope twice and shows the second one being accepted (proving the vulnerability exists)."
  regex_patterns:
    - "accepted|valid|verified"
    - "replay|duplicate|same"
---
# What is a replay attack?

## Concept

Imagine you send a signed message that says "transfer $100 to Alice." The signature is valid. The receiver checks it, confirms it, and processes the transfer. Now an attacker copies that exact message — envelope, signature, everything — and sends it again. The receiver checks the signature. It is still valid. The payload has not changed. So the receiver processes the transfer a second time. Alice gets $200 instead of $100.

This is a replay attack. The attacker did not break the signature. They did not forge anything. They just recorded a valid message and played it back, like pressing replay on a tape recorder.

Your current signed envelope system from Week 6 is vulnerable to this. The signature only proves two things: who signed it and that the bytes were not modified. It says nothing about whether this is the first time or the hundredth time this message has been sent.

To stop replay attacks you need two things: a way to make every message unique (nonces) and a way to make messages expire (timestamps). You will add both this week.

But first, prove the problem exists. Write a test that shows your current system happily accepts the same envelope twice.

## Task

1. Write a program that creates a signed envelope using your Week 6 code (Ed25519 sign, build envelope with payload + signature + sender public key)
2. Verify the envelope once — it should pass
3. Verify the exact same envelope a second time — it should also pass (this is the bug)
4. Print a message for each verification: "Attempt 1: accepted" and "Attempt 2: accepted"
5. Add a comment in your code: "// BUG: replay accepted — will fix this week"

## Hints

- Reuse your `sign_envelope()` and `verify_envelope()` functions from Week 6
- You are not building the fix yet — just proving the vulnerability
- The point is that `verify_envelope()` returns true both times because it only checks the signature, not whether it has seen this message before
- Link with `-lsodium`

## Verify

```bash
cmake --build build
./build/test_replay_vulnerability
```

Expected output:
```
Attempt 1: accepted
Attempt 2: accepted
BUG: replay attack succeeded — same envelope accepted twice
```

## Done When

Your program proves that the same signed envelope is accepted on both attempts, demonstrating the replay vulnerability.
