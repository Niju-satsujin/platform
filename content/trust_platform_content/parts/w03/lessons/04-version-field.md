---
id: w03-l04
title: "Version field — future-proof your protocol"
order: 4
duration_minutes: 20
xp: 50
kind: lesson
part: w03
proof:
  type: paste
  instructions: "Paste server output showing it rejects a message with version=99 and accepts version=1."
  regex_patterns:
    - "version|unsupported|reject"
---
# Version field — future-proof your protocol

## Concept

The version byte is the first thing in your header. It exists for one reason: someday you will change the protocol, and old clients will still be running.

When the server receives a message, the first thing it checks is the version byte. If it is a version the server supports, proceed. If not, send an error response and close the connection.

This is called **protocol negotiation**. Every real protocol does this:
- HTTP has `HTTP/1.1`, `HTTP/2`
- TLS has version bytes in the ClientHello
- Redis has `RESP2`, `RESP3`

The rule: **always check the version before reading anything else**. If you change the header layout in version 2, reading version-2 headers with version-1 code will parse garbage.

For now, you only support version 1. But the check exists so that when you add version 2 later, the server does not crash on old messages — it rejects them cleanly.

## Task

1. In your server's envelope processing: check `env.version == PROTOCOL_VERSION` first
2. If the version is wrong, send an error envelope back with msg_type=ERROR and payload="unsupported protocol version"
3. Log the rejection: `"rejected message: unsupported version <N>"`
4. In your client, add a `--version` flag for testing: `./client --protocol-version 99 send "test"` — sends a message with a bad version
5. Test that the server rejects version 99 and accepts version 1

## Hints

- The error response should use the same framing (length-prefix + envelope) so the client can parse it
- Set the error envelope's request_id to match the original request_id — so the client knows which request failed
- The error envelope's version should be YOUR version (1), not the bad version
- This is 10 lines of code — but it saves you from mysterious bugs months later

## Verify

```bash
# Terminal 1
./server --port 9000

# Terminal 2
./client --port 9000 send "hello"                      # should work
./client --port 9000 --protocol-version 99 send "hello" # should be rejected
```

Expected: first command succeeds, second gets an error response mentioning "unsupported version."

## Done When

The server rejects unknown protocol versions with a clear error message and continues serving other clients normally.
