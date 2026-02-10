---
id: w02-l02
title: "Lesson 2 — Stream Framing Rule: Length-Prefix Protocol"
order: 2
duration_min: 120
type: lesson
---

# Lesson 2 (2/7): Stream Framing Rule — Length-Prefix Protocol

**Goal:** Add 4-byte big-endian length-prefix framing so the echo server can distinguish message boundaries over a [byte stream](https://datatracker.ietf.org/doc/html/rfc793#section-1.5).

**What you build:** A framing layer that prepends a 4-byte length header to every message. The server reads the header first, then reads exactly that many payload bytes. Echoes use the same frame format.

## Why it matters

- [TCP is a byte stream](https://datatracker.ietf.org/doc/html/rfc793#section-1.5), not a message stream. The kernel can merge, split, or delay your sends. Lesson 1 showed this: two sends arrived as one recv. Without framing, you cannot tell where one message ends and the next begins.
- Length-prefix framing is the simplest correct solution. Protocols like [Protocol Buffers](https://protobuf.dev/programming-guides/encoding/#length-delimited), [Redis RESP](https://redis.io/docs/reference/protocol-spec/), and [Kafka](https://kafka.apache.org/protocol.html#protocol_common) all use length-prefix or length-delimited framing.
- Delimiter-based framing (like newlines in HTTP/1.1 headers) requires scanning every byte. Length-prefix tells you exactly how many bytes to read. It is faster and simpler for binary protocols.
- The 4-byte big-endian format you build here becomes the wire format for the KV protocol in Week 9.

## TRAINING SESSION

### Warmup (10 min)
- Q: Why can't you just use `\n` as a message delimiter for binary data?
- Q: If the length header says 500 bytes, but recv only returns 200, what do you do?
- Recall: From Lesson 1, what happened when you sent two messages without framing?

### Work

**Task 1: Define the frame format**

1. Do this: Define the wire format in a comment or doc:
   - Frame = `[4-byte big-endian uint32: payload length][payload bytes]`
   - Maximum payload: 65536 bytes (64 KB). Reject anything larger.
   - Length 0 is valid (empty payload). Length > 65536 → close connection, log error.
2. How to test it: Review the definition. Confirm it uses [network byte order](https://man7.org/linux/man-pages/man3/byteorder.3.html) (big-endian).
3. Expected result: A documented frame format with clear limits.

**Task 2: Write frame encoding and decoding helpers**

1. Do this: Write two functions:
   - `frame_encode(payload, length)` → writes 4-byte big-endian length + payload into a buffer
   - `frame_decode_header(buf)` → reads 4 bytes, returns the payload length as a host-order uint32
   Use [htonl](https://man7.org/linux/man-pages/man3/byteorder.3.html) and [ntohl](https://man7.org/linux/man-pages/man3/byteorder.3.html) for byte order conversion.
2. How to test it: Encode a 5-byte payload. Check that the first 4 bytes are `0x00 0x00 0x00 0x05`. Decode them back and confirm you get 5.
3. Expected result: Round-trip encoding/decoding produces the original length.

**Task 3: Update the server to read framed messages**

1. Do this: Replace the raw recv loop from Lesson 1. The new loop:
   - Read exactly 4 bytes (the length header). Use a loop — recv may return fewer than 4.
   - Convert to host byte order with [ntohl](https://man7.org/linux/man-pages/man3/byteorder.3.html).
   - Validate: if length > 65536, log error, close connection.
   - Read exactly `length` bytes of payload. Use a loop.
   - Echo: send 4-byte length header + payload back to the client.
   - Repeat until client disconnects.
2. How to test it: Use a custom test client (Task 4) since netcat does not speak your frame protocol.
3. Expected result: Server reads framed messages and echoes them with frames.

**Task 4: Write a framing test client**

1. Do this: Write a simple client program that:
   - Connects to `localhost:<PORT>`
   - Sends a framed message: 4-byte length + payload
   - Reads the framed echo: 4-byte length + payload
   - Prints the echoed payload
   - Disconnects
2. How to test it:
   ```
   trustctl echo-server --port 9900 &
   PID=$!
   sleep 1
   ./echo-client localhost 9900 "hello framed"
   kill $PID
   ```
3. Expected result: Client prints `hello framed`. No extra bytes. No merged messages.

**Task 5: Prove framing solves the merge problem**

1. Do this: Send two framed messages back-to-back from the client without any sleep between them. The server [MUST](https://datatracker.ietf.org/doc/html/rfc2119) echo them as two separate responses.
2. How to test it:
   ```
   trustctl echo-server --port 9900 &
   PID=$!
   sleep 1
   ./echo-client localhost 9900 "AAAA" "BBBB"
   kill $PID
   ```
3. Expected result: Client receives two separate echoed messages: `AAAA` then `BBBB`. Not `AAAABBBB`.

### Prove (15 min)
- Run the two-message test. Confirm two separate echoes.
- Hex-dump the wire bytes to verify the 4-byte header is correct:
  ```
  # In the client, log the raw bytes you send
  # First message "AAAA": 00 00 00 04 41 41 41 41
  ```
- Explain in 4 lines: Why is big-endian (network byte order) required? (Hint: the sender and receiver may have different [endianness](https://man7.org/linux/man-pages/man3/byteorder.3.html).)

### Ship (5 min)
- Submit: updated echo-server + echo-client source code
- Paste: output of two-message echo test showing separate responses
- Paste: hex dump of one framed message showing 4-byte header

## Done when
- Server reads 4-byte length header before reading payload.
- Messages are echoed with 4-byte length header + payload.
- Two back-to-back messages produce two separate echoes.
- Payloads > 65536 bytes are rejected and connection is closed.
- Frame helpers use htonl/ntohl for byte order.

## Common mistakes
- Using `strlen` for binary payloads → Fix: Pass explicit length. Binary data may contain null bytes.
- Assuming recv reads all 4 header bytes in one call → Fix: Loop until you have exactly 4 bytes. Lesson 3 drills this.
- Forgetting to convert byte order → Fix: Always use [htonl](https://man7.org/linux/man-pages/man3/byteorder.3.html) before send and [ntohl](https://man7.org/linux/man-pages/man3/byteorder.3.html) after recv.
- No maximum payload limit → Fix: Reject lengths > 65536. A malicious client could claim 4 GB and exhaust memory.
- Echoing without the frame header → Fix: The echo [MUST](https://datatracker.ietf.org/doc/html/rfc2119) include the 4-byte length + payload.

## Proof
- Submit: echo-server + echo-client source
- Paste: two-message echo test output
- Paste: hex dump of a framed message

## Hero Visual

```
┌─────────────────────────────────────────────────────┐
│              Length-Prefix Frame Format              │
│                                                     │
│  Byte:  0   1   2   3   4   5   6   7   8  ...     │
│       ├───┬───┬───┬───┼───┬───┬───┬───┬───┤        │
│       │ 0 │ 0 │ 0 │ 5 │ H │ E │ L │ L │ O │       │
│       ├───┴───┴───┴───┼───┴───┴───┴───┴───┤        │
│       │  length = 5   │   payload "HELLO"  │        │
│       │  (big-endian) │   (5 bytes)        │        │
│       └───────────────┴────────────────────┘        │
│                                                     │
│  Two messages on the wire:                          │
│  [00 00 00 04][AAAA][00 00 00 04][BBBB]             │
│       ▲                    ▲                        │
│       │                    │                        │
│    msg boundary        msg boundary                 │
│  (length tells you     (length tells you            │
│   where payload ends)   where payload ends)         │
└─────────────────────────────────────────────────────┘
```

### What you should notice
- The length field removes all ambiguity. You always know exactly how many bytes to read.
- Two messages stay separate even if TCP merges them in one recv call.
- This is the same pattern used by real protocols (Kafka, gRPC, Redis).

## Future Lock
In **Week 3** (Event Loop), you will buffer partial frames across multiple recv calls per client. In **Week 9** (KV Protocol), the length-prefix format is reused for get/put/delete commands — only the payload content changes. In **Week 13** (Raft), log entries are framed the same way. Build this correctly now and it carries you through the entire course.
