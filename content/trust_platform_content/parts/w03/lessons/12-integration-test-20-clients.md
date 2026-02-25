---
id: w03-l12
title: "Integration test — 20 good clients"
order: 12
duration_minutes: 25
xp: 50
kind: lesson
part: w03
proof:
  type: paste
  instructions: "Paste integration test output showing 20 clients × 50 envelope-framed messages with 0 failures."
  regex_patterns:
    - "20 client|clients.*20"
    - "0 failure"
---
# Integration test — 20 good clients

## Concept

Your Week 2 stress test used raw length-prefix framing. Now you upgrade it to use the full envelope protocol. Each client sends proper Envelope messages (version, msg_type, request_id, timestamp, payload) and verifies the server echoes them correctly.

This is an **integration test** — it tests the full stack: client framing + serialization + network + server deserialization + re-serialization + response.

The upgrade from the stress test:
- Each frame is a serialized Envelope (not raw payload)
- The client checks that the response envelope has the same request_id as the request
- The client checks that the response payload matches the sent payload
- The client checks that the response version is correct

## Task

1. Create `integration_test.cpp` that:
   - Accepts `--port`, `--clients` (default 20), `--frames` (default 50)
   - Spawns N client threads
   - Each client sends M envelopes with unique request_ids
   - Each client verifies: response request_id matches, payload matches, version=1
   - Reports pass/fail per client
2. Run with 20 clients × 50 frames
3. Verify all pass

## Hints

- Reuse your `send_frame` / `recv_frame` from Week 2 — the outer framing stays the same
- Inside the frame, the payload is now a serialized Envelope (not a text string)
- So the flow is: `serialize(envelope)` → `send_frame(fd, serialized_data, len)` → `recv_frame(fd, ...)` → `deserialize(received_data)` → check fields
- The request_id is 64-bit — use `std::mt19937_64` for unique IDs per request

## Verify

```bash
# Terminal 1
./server --port 9000

# Terminal 2
./integration_test --port 9000 --clients 20 --frames 50
```

Expected: "20 clients, 1000 frames, 0 failures"

## Done When

20 clients × 50 frames complete with zero failures using the full envelope protocol.
