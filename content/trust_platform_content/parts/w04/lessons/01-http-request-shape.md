---
id: w04-l01
title: "HTTP Request Shape"
order: 1
type: lesson
duration_min: 120
---

# HTTP Request Shape

## Goal

Send a valid [HTTP/1.1](https://datatracker.ietf.org/doc/html/rfc9112) [GET request](https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.1) through a raw [TCP socket](https://man7.org/linux/man-pages/man2/socket.2.html) and read the first bytes of the response.

## What you build

A small C program that opens a [TCP connection](https://man7.org/linux/man-pages/man2/connect.2.html) to a known HTTP server, sends a hand-crafted [request line](https://datatracker.ietf.org/doc/html/rfc9112#section-3) plus [Host header](https://datatracker.ietf.org/doc/html/rfc9110#section-7.2), and prints the raw bytes that come back.

## Why it matters

Every [HTTP client](https://datatracker.ietf.org/doc/html/rfc9110#section-3.3) — `curl`, browsers, your future [KV store protocol (W09)](../../../parts/w09/part.md) — starts with the same pattern: connect, write a request, read a response. You already know [TCP framing from W02](../../../parts/w02/part.md). Now you put real protocol text on the wire.

---

## Training Session

### Warmup

Open a terminal. Run:

```
printf 'GET / HTTP/1.1\r\nHost: example.com\r\nConnection: close\r\n\r\n' | nc example.com 80
```

Read the output. Find the [status line](https://datatracker.ietf.org/doc/html/rfc9112#section-4). Find the blank line that separates [headers](https://datatracker.ietf.org/doc/html/rfc9110#section-6.3) from the [body](https://datatracker.ietf.org/doc/html/rfc9110#section-6.4). Count the `\r\n` pairs.

### Work

#### Do

1. Create `w04/http_get.c`.
2. Use [socket()](https://man7.org/linux/man-pages/man2/socket.2.html), [connect()](https://man7.org/linux/man-pages/man2/connect.2.html) to reach `example.com` port `80`.
3. Build the [request line](https://datatracker.ietf.org/doc/html/rfc9112#section-3): `GET / HTTP/1.1\r\n`.
4. Add the [Host header](https://datatracker.ietf.org/doc/html/rfc9110#section-7.2): `Host: example.com\r\n`.
5. Add `Connection: close\r\n` so the server shuts down after one response.
6. End with `\r\n` — the empty line that signals end of [headers](https://datatracker.ietf.org/doc/html/rfc9110#section-6.3).
7. [send()](https://man7.org/linux/man-pages/man2/send.2.html) the whole buffer.
8. Loop [recv()](https://man7.org/linux/man-pages/man2/recv.2.html) until it returns `0`. Print every chunk to [stdout](https://man7.org/linux/man-pages/man3/stdout.3.html).
9. [close()](https://man7.org/linux/man-pages/man2/close.2.html) the socket.

#### Test

```bash
gcc -Wall -Wextra -o http_get w04/http_get.c
./http_get
```

#### Expected

The first line of output matches:

```
HTTP/1.1 200 OK
```

The body contains `<title>Example Domain</title>`.

#### Prove

Pipe through `head -1` and confirm the [status code](https://datatracker.ietf.org/doc/html/rfc9110#section-15) is `200`:

```bash
./http_get | head -1
```

Expected:

```
HTTP/1.1 200 OK
```

#### Ship

```bash
git add w04/http_get.c
git commit -m "w04: raw HTTP/1.1 GET request"
```

---

## Done when

- Your program compiles with zero warnings under `-Wall -Wextra`.
- It prints a complete [HTTP response](https://datatracker.ietf.org/doc/html/rfc9112#section-4) with [status line](https://datatracker.ietf.org/doc/html/rfc9112#section-4), [headers](https://datatracker.ietf.org/doc/html/rfc9110#section-6.3), and [body](https://datatracker.ietf.org/doc/html/rfc9110#section-6.4).
- The [status code](https://datatracker.ietf.org/doc/html/rfc9110#section-15) is `200`.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Missing `\r\n\r\n` at the end of headers | The server waits forever. Always terminate headers with a blank [CRLF](https://datatracker.ietf.org/doc/html/rfc9112#section-2.1) line. |
| Using `\n` instead of `\r\n` | [HTTP/1.1](https://datatracker.ietf.org/doc/html/rfc9112#section-2.1) requires carriage-return + line-feed. |
| Forgetting [Host header](https://datatracker.ietf.org/doc/html/rfc9110#section-7.2) | Required in HTTP/1.1. Server may return `400 Bad Request`. |
| Single `recv()` call | TCP is a [byte stream](https://man7.org/linux/man-pages/man7/tcp.7.html). One `recv()` may not return everything. Loop until `0`. |

## Proof

```bash
./http_get 2>/dev/null | head -1
# → HTTP/1.1 200 OK
```

## Hero visual

```
 ┌────────────┐        request line + headers        ┌──────────────┐
 │  your code │ ────────────────────────────────────▶ │ example.com  │
 │  (socket)  │ ◀──────────────────────────────────── │   port 80    │
 └────────────┘        status line + headers + body   └──────────────┘
```

## Future Lock

- In [W04 L02](02-headers-content-length.md) you will parse the [headers](https://datatracker.ietf.org/doc/html/rfc9110#section-6.3) you just received, especially [Content-Length](https://datatracker.ietf.org/doc/html/rfc9110#section-8.6).
- In [W04 L03](03-keep-alive-semantics.md) you will remove `Connection: close` and keep the socket open for multiple requests.
- In [W09](../../../parts/w09/part.md) you will design your own request/response protocol on top of the same socket mechanics.
- In [W17](../../../parts/w17/part.md) you will use HTTP client skills to talk to credential endpoints.
