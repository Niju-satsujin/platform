---
id: w03-l13
title: "Integration test — add 3 bad clients"
order: 13
duration_minutes: 25
xp: 75
kind: lesson
part: w03
proof:
  type: paste
  instructions: "Paste integration test output showing 20 good clients pass AND 3 bad clients handled without affecting the good ones."
  regex_patterns:
    - "20.*pass|good.*pass"
    - "3.*bad|bad.*handled"
---
# Integration test — add 3 bad clients

## Concept

The real test of robustness is not "does it work with good input?" — it is "does it keep working when some clients are actively misbehaving?"

You add 3 bad clients to the integration test, running alongside the 20 good clients:

1. **Slow client** — connects, sends one frame, then stops reading. The server should timeout and disconnect it. The key question: does this affect the other 20 clients?

2. **Garbage client** — connects, sends 1000 random bytes (not valid envelopes). The server should detect the malformed data and disconnect. Again: does this affect the other clients?

3. **Disconnect client** — connects, sends the first 11 bytes of a header (half of the 22-byte header), then disconnects. The server should detect the short read and clean up.

All 3 bad clients run simultaneously with the 20 good clients. The test passes only if ALL 20 good clients complete with zero failures.

## Task

1. Add 3 bad client threads to your integration test:
   - `bad_slow()`: connect, send 1 frame, sleep forever (do not read)
   - `bad_garbage()`: connect, write 1000 random bytes, close
   - `bad_disconnect()`: connect, write 11 bytes, close
2. Start the 3 bad clients at the same time as the 20 good clients
3. After all threads finish, report:
   - Good clients: N/20 passed
   - Bad clients: 3/3 handled (server did not crash)
4. The test passes only if good = 20/20 and bad = 3/3

## Hints

- The slow client will be disconnected by the server's write timeout (5 seconds)
- The garbage client will be disconnected when deserialization fails
- The disconnect client will cause `read_exact()` to return 0 (short read)
- Make sure bad clients do not use the same port concurrently — they all connect to the same server, which is fine
- Start bad clients with a slight delay (100ms) after good clients start, so the server is already busy

## Verify

```bash
# Terminal 1
./server --port 9000

# Terminal 2
./integration_test --port 9000 --clients 20 --frames 50 --with-bad-clients
```

Expected: "good: 20/20 pass, bad: 3/3 handled, server healthy"

## Done When

All 20 good clients pass with zero failures, all 3 bad clients are handled, and the server remains running.
