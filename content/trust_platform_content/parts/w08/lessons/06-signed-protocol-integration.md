---
id: w08-l06
title: "Full signed protocol integration"
order: 6
duration_minutes: 30
xp: 75
kind: lesson
part: w08
proof:
  type: paste
  instructions: "Paste output showing: (1) a stress test of 20 legitimate signed messages all ACCEPTED, (2) a mixed test with legitimate and attack messages where attacks are REJECTED and legitimate ones are ACCEPTED."
  regex_patterns:
    - "ACCEPTED|accepted"
    - "REJECTED|rejected"
    - "20.*(pass|ok|success)|all.*accepted"
---
# Full signed protocol integration

## Concept

You have been building crypto features one at a time across Weeks 5-7: hashing, signatures, replay defense, timestamps, key management. You tested each one individually. The attack drills in lessons 1-5 tested each defense individually.

Now you integrate everything into a single code path. When a message arrives at the server, it goes through every check in order:

1. Parse the envelope (is it well-formed?)
2. Look up the key (is the key ID known?)
3. Check revocation (is the key still valid?)
4. Verify the signature (does the signature match the payload and key?)
5. Check the timestamp (is the message fresh?)
6. Check the nonce (has this message been seen before?)
7. Process the request (only if all six checks pass)

If any check fails, the server rejects the message with a specific error and does not run subsequent checks. This order matters. You do not want to store a nonce for a message that has an invalid signature — that would let an attacker fill your nonce store with garbage.

The integration challenge is making sure all these checks work together without interfering. A bug in one check should not bypass another.

## Task

1. Wire all six checks into your server's message processing pipeline in the order listed above
2. Each check returns a specific error code on failure — do not use a generic "error" for everything
3. Write a stress test that sends 20 legitimate signed messages with unique nonces and current timestamps — all 20 must be ACCEPTED
4. Write a mixed test that sends 5 legitimate messages interleaved with 5 attack messages (one of each type from lessons 1-5) — legitimate messages are ACCEPTED, attacks are REJECTED
5. Verify the server stays stable after processing a mix of good and bad messages
6. Verify the server's nonce store only contains nonces from accepted messages, not from rejected ones

## Hints

- Create a `MessageValidator` class or function that chains all six checks
- Return early on the first failure — do not continue checking after a rejection
- For the nonce store: only insert the nonce AFTER all other checks pass
- The stress test can use a loop with `std::this_thread::sleep_for` between sends to avoid overwhelming the server
- For the mixed test, alternate: good, replay, good, forge, good, tamper, good, revoked, good, expired
- Check that the server's response includes which check failed — this helps debugging

## Verify

```bash
# Terminal 1 — server running
./server --port 9000

# Terminal 2 — run the integration test
./test_signed_protocol --host 127.0.0.1 --port 9000 --mode stress
./test_signed_protocol --host 127.0.0.1 --port 9000 --mode mixed
```

Expected output (stress):
```
Sent 20 signed messages: 20 ACCEPTED, 0 REJECTED
```

Expected output (mixed):
```
Message 1 (legit):   ACCEPTED
Message 2 (replay):  REJECTED reason=duplicate_nonce
Message 3 (legit):   ACCEPTED
Message 4 (forge):   REJECTED reason=invalid_signature
Message 5 (legit):   ACCEPTED
Message 6 (tamper):  REJECTED reason=invalid_signature
Message 7 (legit):   ACCEPTED
Message 8 (revoked): REJECTED reason=key_revoked
Message 9 (legit):   ACCEPTED
Message 10 (expired): REJECTED reason=timestamp_expired
Result: 5 ACCEPTED, 5 REJECTED — PASS
```

## Done When

Twenty legitimate messages are accepted and five different attack types are each rejected with distinct error reasons in a single test run.
