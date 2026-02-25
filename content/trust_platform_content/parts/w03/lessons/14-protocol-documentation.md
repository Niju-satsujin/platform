---
id: w03-l14
title: "Write your protocol documentation"
order: 14
duration_minutes: 20
xp: 25
kind: lesson
part: w03
proof:
  type: paste
  instructions: "Paste the header layout table and at least 2 example messages from your protocol doc."
  regex_patterns:
    - "version|msg_type|payload"
    - "offset|byte"
---
# Write your protocol documentation

## Concept

You have built a binary protocol. Now document it so someone else (or future-you) can implement a client without reading your source code.

A protocol document has these sections:

1. **Overview** — one paragraph explaining what the protocol does
2. **Framing** — how messages are delimited (4-byte length prefix)
3. **Header layout** — byte-by-byte table of the 22-byte header
4. **Message types** — what each msg_type value means
5. **Byte order** — "all multi-byte integers are big-endian (network byte order)"
6. **Error handling** — what happens on version mismatch, malformed input, etc.
7. **Examples** — hex dumps of real messages with annotations

This document lives in your project as `docs/protocol.md`. It is a living document — update it when the protocol changes.

Writing documentation forces you to think clearly about your design. If something is hard to explain, it is probably too complex and should be simplified.

## Task

1. Create `docs/protocol.md` in your project
2. Write all 7 sections listed above
3. Include a header layout table with: offset, size, field name, type, description
4. Include at least 2 example messages as annotated hex dumps
5. Include the error response format

## Hints

- Header table format:

```
| Offset | Size | Field       | Type   | Description                |
|--------|------|-------------|--------|----------------------------|
| 0      | 1    | version     | uint8  | Protocol version (1)       |
| 1      | 1    | msg_type    | uint8  | Message type (see table)   |
| 2      | 8    | request_id  | uint64 | Big-endian request ID      |
| 10     | 8    | timestamp   | uint64 | Big-endian ms since epoch  |
| 18     | 4    | payload_len | uint32 | Big-endian payload length  |
| 22     | N    | payload     | bytes  | Raw payload data           |
```

- For hex dump examples, use your serialize function and a hex printer

## Verify

Read `docs/protocol.md` yourself. Can someone implement a client from just this document, without reading your code?

## Done When

A developer who has never seen your code could implement a compatible client using only your protocol document.
