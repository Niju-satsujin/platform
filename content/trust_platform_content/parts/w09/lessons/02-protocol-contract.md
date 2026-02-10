---
id: w09-l02
title: "Protocol Contract"
order: 2
type: lesson
duration_min: 45
---

# Protocol Contract

## Goal

Define a strict text [protocol](https://datatracker.ietf.org/doc/html/rfc2119) for the [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database). Every command and every response [MUST](https://datatracker.ietf.org/doc/html/rfc2119) follow the contract exactly.

## What you build

A request parser and a response serializer. Clients send newline-terminated commands over [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html): `SET key value\n`, `GET key\n`, `DEL key\n`. The server parses each command, validates it against the [protocol contract](https://datatracker.ietf.org/doc/html/rfc2119), dispatches to the [state machine (L01)](01-state-machine-model.md), and sends a well-defined response. You write the parser, the validator, and the response formatter.

## Why it matters

A [protocol](https://en.wikipedia.org/wiki/Communication_protocol) is a contract between client and server. If the contract is ambiguous, clients and servers disagree on what bytes mean — and bugs hide for months. [Redis](https://redis.io/docs/reference/protocol-spec/) defines [RESP](https://redis.io/docs/reference/protocol-spec/) down to the byte. [HTTP](https://datatracker.ietf.org/doc/html/rfc9110) specifies every header. Your protocol is simpler, but the discipline is the same. In [W02](../../../parts/w02/part.md) you learned [framing](../../../parts/w02/part.md) — now you use it. In [W11](../../../parts/w11/part.md) you will extend this protocol for [replication](../../../parts/w11/part.md) commands.

---

## Training Session

### Warmup — Protocol basics

Read the first page of [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119). Write down:

1. What [MUST](https://datatracker.ietf.org/doc/html/rfc2119) means — an absolute requirement.
2. What [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) means — an absolute prohibition.
3. Review your [framing code from W02](../../../parts/w02/part.md). Recall how you split a byte stream into messages using a newline delimiter.

### Work — Build the protocol layer

#### Do

1. Create `w09/kv_protocol.h`. Define an enum `kv_cmd_type` with values `CMD_SET`, `CMD_GET`, `CMD_DEL`, `CMD_UNKNOWN`.
2. Define `struct kv_request` with a `kv_cmd_type type`, a `char *key`, and a `char *value` (NULL for GET and DEL).
3. Define `struct kv_response` with a `int ok` flag, a `char *data` (the value for GET, or "OK"/"NOT_FOUND"/"ERROR" strings).
4. Write `kv_parse_request(const char *line, struct kv_request *req)` in `w09/kv_protocol.c`:
   - Split the line on spaces using [strtok()](https://man7.org/linux/man-pages/man3/strtok.3.html) or manual pointer walking.
   - The first token is the command. It [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be one of SET, GET, or DEL.
   - SET [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have exactly two arguments: key and value.
   - GET [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have exactly one argument: key.
   - DEL [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have exactly one argument: key.
   - If any rule is violated, set `type` to `CMD_UNKNOWN` and return an error code.
5. Write `kv_format_response(const struct kv_response *resp, char *buf, int buf_size)`:
   - If `resp->ok` is true and the command was GET, write `VALUE <data>\n`.
   - If `resp->ok` is true and the command was SET, write `OK\n`.
   - If `resp->ok` is true and the command was DEL, write `DELETED\n` or `NOT_FOUND\n`.
   - If `resp->ok` is false, write `ERROR <data>\n`.
   - The response [MUST](https://datatracker.ietf.org/doc/html/rfc2119) always end with a newline.
6. Write `kv_handle_request(struct kv_store *store, const struct kv_request *req, struct kv_response *resp)`:
   - Switch on `req->type`.
   - For `CMD_SET`, call `kv_store_set()` from [L01](01-state-machine-model.md). Set `resp->ok = 1`.
   - For `CMD_GET`, call `kv_store_get()`. If the result is NULL, set data to "NOT_FOUND". Otherwise, copy the value.
   - For `CMD_DEL`, call `kv_store_del()`. Set data to "DELETED" or "NOT_FOUND" based on the return value.
   - For `CMD_UNKNOWN`, set `resp->ok = 0` and data to "unknown command".
7. Write a `main()` test: create a [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database), parse a list of raw command strings, handle each one, format the response, and print it.

#### Test

```bash
gcc -Wall -Wextra -o kv_proto_test w09/kv_protocol.c w09/kv_store.c
./kv_proto_test
```

#### Expected

```
> SET foo bar
OK
> GET foo
VALUE bar
> DEL foo
DELETED
> GET foo
NOT_FOUND
> BADCMD
ERROR unknown command
> SET
ERROR missing arguments
```

### Prove — Contract violations

Try sending these invalid inputs and confirm the server rejects each one:

- An empty line — [MUST](https://datatracker.ietf.org/doc/html/rfc2119) return ERROR.
- `SET key` with no value — [MUST](https://datatracker.ietf.org/doc/html/rfc2119) return ERROR.
- `GET` with no key — [MUST](https://datatracker.ietf.org/doc/html/rfc2119) return ERROR.
- `GET key extraarg` — [MUST](https://datatracker.ietf.org/doc/html/rfc2119) return ERROR.

### Ship

```bash
git add w09/kv_protocol.h w09/kv_protocol.c
git commit -m "w09-l02: protocol contract with parser, validator, and response formatter"
```

---

## Done when

- `kv_parse_request()` correctly parses all three commands and rejects malformed input.
- `kv_format_response()` produces the exact output strings specified in the contract.
- `kv_handle_request()` connects the protocol layer to the [state machine (L01)](01-state-machine-model.md).
- Every invalid input returns an ERROR response — never a crash, never silence.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Using [strtok()](https://man7.org/linux/man-pages/man3/strtok.3.html) on the original buffer | [strtok()](https://man7.org/linux/man-pages/man3/strtok.3.html) modifies the string. Work on a copy if you need the original later. |
| Not stripping the trailing newline before parsing | Use [strcspn()](https://man7.org/linux/man-pages/man3/strcspn.3.html) to find and replace `\n` with `\0` before parsing. |
| Responding with no newline | Every response [MUST](https://datatracker.ietf.org/doc/html/rfc2119) end with `\n`. Without it, the client cannot [frame](../../../parts/w02/part.md) the response. |
| Crashing on NULL key or value | Always check for NULL after each [strtok()](https://man7.org/linux/man-pages/man3/strtok.3.html) call before using the pointer. |

## Proof

```bash
./kv_proto_test
# → OK
# → VALUE bar
# → DELETED
# → NOT_FOUND
# → ERROR unknown command
# → ERROR missing arguments
```

## 🖼️ Hero Visual

```
  client                 wire                         server
  ┌──────────┐     "SET foo bar\n"     ┌──────────────────────────────┐
  │ SET foo  │ ──────────────────────▶ │ parse ──▶ validate ──▶ apply │
  │   bar    │                         │                              │
  │          │     "OK\n"              │ format ◀── response ◀── ok  │
  │          │ ◀────────────────────── │                              │
  └──────────┘                         └──────────────────────────────┘
                contract: command MUST be SET|GET|DEL
                          response MUST end with \n
```

## 🔮 Future Lock

- In [W09 L03](03-core-ops-correctness.md) you will prove that every command produces the correct result by testing edge cases and invariants.
- In [W09 L04](04-concurrency-strategy.md) you will run multiple protocol handlers at the same time — the parser is [thread-safe](https://en.wikipedia.org/wiki/Thread_safety) because each request gets its own `struct kv_request`.
- In [W11](../../../parts/w11/part.md) you will add replication commands like `REPLICATE key value seqno` to this protocol.
- In [W12](../../../parts/w12/part.md) you will add [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) protocol messages that travel on the same [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) connections.
