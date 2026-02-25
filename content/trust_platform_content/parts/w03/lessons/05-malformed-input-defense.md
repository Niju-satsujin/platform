---
id: w03-l05
title: "Malformed input defense"
order: 5
duration_minutes: 25
xp: 75
kind: lesson
part: w03
proof:
  type: paste
  instructions: "Paste server log showing it handles all 4 malformed input types without crashing: truncated header, payload_len too large, zero-length payload, random garbage bytes."
  regex_patterns:
    - "malformed|invalid|reject"
---
# Malformed input defense

## Concept

A real server receives garbage. Not just from attackers — from buggy clients, network corruption, or load balancers that mangle data. Your server must handle every kind of broken input without crashing.

Four categories of malformed input:

1. **Truncated header** — the client sends 10 bytes then disconnects. Your `read_exact()` for the 22-byte header returns 0 or a short read. Handle it.

2. **Absurd payload_len** — the header says payload is 2GB. You must reject before trying to allocate 2GB of memory. Check payload_len against a MAX_PAYLOAD constant (e.g., 1MB).

3. **Zero-length payload** — technically valid but depends on your protocol. Decide: is a zero-payload message allowed for ECHO type? Maybe not. Document the rule and enforce it.

4. **Random garbage** — the "header" is random bytes. Version might be 255, msg_type might be 200, payload_len might be a random number. Your deserialization must reject all of these.

The principle: **parse, validate, reject** — in that order. Parse the bytes into fields, validate every field, reject if any validation fails. Never pass unvalidated data to your application logic.

## Task

1. Write a test client that sends each of the 4 malformed input types
2. For each, verify the server:
   - Does not crash
   - Logs the error (what was wrong, which client)
   - Disconnects the offending client
   - Continues serving other clients normally
3. The test should have 1 good client and 4 bad clients running simultaneously

## Hints

- For truncated header: `write_exact(fd, garbage, 10); close(fd);`
- For absurd payload_len: craft a valid-looking header with `payload_len = 0xFFFFFFFF`, send it
- For zero-length: send a header with `payload_len = 0` and no payload bytes
- For random garbage: `for (auto& b : buf) b = rand(); write_exact(fd, buf, sizeof(buf));`
- In the server: after `deserialize()` returns nullopt, log the error and close the client fd
- The good client should still work after all 4 bad clients are disconnected

## Verify

```bash
./server --port 9000 &
./test_malformed --port 9000
```

Expected: test prints which malformed types were sent, server logs show 4 rejections, good client completes successfully.

## Done When

All 4 malformed input types are handled without crashing, and a good client running alongside is unaffected.
