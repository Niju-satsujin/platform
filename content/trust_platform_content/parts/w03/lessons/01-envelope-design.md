---
id: w03-l01
title: "Design a protocol envelope"
order: 1
duration_minutes: 25
xp: 50
kind: lesson
part: w03
proof:
  type: paste
  instructions: "Paste your Envelope struct definition showing all 5 header fields."
  regex_patterns:
    - "struct Envelope|class Envelope"
    - "version|msg_type|request_id|timestamp"
---
# Design a protocol envelope

## Concept

Last week, your frames carried raw payload — the server had no idea what was inside. A real protocol needs structure. Every message carries a **header** (metadata about the message) and a **payload** (the actual data).

Think of a physical envelope: the outside has the sender's address, the recipient's address, and a stamp. The inside has the letter. Same idea.

Your envelope header has 5 fields:

| Field | Type | Size | Purpose |
|---|---|---|---|
| version | uint8 | 1 byte | Protocol version (start at 1) — lets you change the format later |
| msg_type | uint8 | 1 byte | What kind of message (0=echo, 1=log, 2=error, ...) |
| request_id | uint64 | 8 bytes | Unique ID to correlate request and response |
| timestamp | uint64 | 8 bytes | When the message was created (ms since epoch) |
| payload_len | uint32 | 4 bytes | How many bytes of payload follow |

Total header: 1 + 1 + 8 + 8 + 4 = **22 bytes**, followed by the payload.

This is a **binary protocol** — the header fields are raw bytes in a fixed layout. No JSON, no text parsing. Fast to serialize, fast to parse, unambiguous.

## Task

1. Define a `struct Envelope` with the 5 header fields plus a `std::vector<uint8_t> payload`
2. Define `enum class MsgType : uint8_t { ECHO = 0, LOG = 1, ERROR = 2 }`
3. Define a constant `PROTOCOL_VERSION = 1`
4. Define `HEADER_SIZE = 22`
5. Write a helper `Envelope make_echo(const std::string& data)` that fills in all fields with sensible defaults

## Hints

- Use fixed-width types: `uint8_t`, `uint32_t`, `uint64_t` from `<cstdint>`
- For request_id, reuse your `generate_request_id()` from Week 1 — or use a 64-bit random number
- For timestamp, reuse your `now_ms()` function
- `payload` as `std::vector<uint8_t>` lets you store arbitrary binary data, not just strings

## Verify

```bash
g++ -std=c++17 -o test_envelope test_envelope.cpp
./test_envelope
```

Expected: creates an Envelope, prints its fields, all values make sense (version=1, type=0, timestamp is recent, payload matches input).

## Done When

The Envelope struct compiles and `make_echo()` creates a valid envelope with all fields populated.
