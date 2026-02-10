---
id: w04-l03
title: "Keep-Alive Semantics"
order: 3
type: lesson
duration_min: 120
---

# Keep-Alive Semantics

## Goal

Send multiple [HTTP/1.1 requests](https://datatracker.ietf.org/doc/html/rfc9112#section-3) over a single [TCP connection](https://man7.org/linux/man-pages/man7/tcp.7.html) by using [persistent connections (keep-alive)](https://datatracker.ietf.org/doc/html/rfc9112#section-9.3).

## What you build

A program that connects once, sends two [GET requests](https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.1) on the same socket, parses both responses using [Content-Length](https://datatracker.ietf.org/doc/html/rfc9110#section-8.6), and prints both bodies.

## Why it matters

Opening a new [TCP connection](https://man7.org/linux/man-pages/man2/connect.2.html) costs a three-way [handshake](https://man7.org/linux/man-pages/man7/tcp.7.html). That is wasted time. [HTTP/1.1 defaults to keep-alive](https://datatracker.ietf.org/doc/html/rfc9112#section-9.3). You reuse the socket. But you must know exactly where one response ends so the next response can begin. That is why [Content-Length from L02](02-headers-content-length.md) matters.

---

## Training Session

### Warmup

Run this — note the two separate requests on one connection:

```bash
{
  printf 'GET / HTTP/1.1\r\nHost: example.com\r\n\r\n'
  sleep 1
  printf 'GET / HTTP/1.1\r\nHost: example.com\r\nConnection: close\r\n\r\n'
} | nc example.com 80 | grep -c 'HTTP/1.1 200 OK'
```

Expected output: `2`. Two responses came back on one connection.

### Work

#### Do

1. Create `w04/http_keepalive.c`.
2. [connect()](https://man7.org/linux/man-pages/man2/connect.2.html) once to `example.com:80`.
3. Send the first [GET request](https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.1). Do **not** include `Connection: close`.
4. Parse the response [headers](https://datatracker.ietf.org/doc/html/rfc9110#section-6.3). Extract [Content-Length](https://datatracker.ietf.org/doc/html/rfc9110#section-8.6).
5. Read exactly [Content-Length](https://datatracker.ietf.org/doc/html/rfc9110#section-8.6) bytes of body. Stop. Do not read more.
6. Now the socket is positioned at the start of the next exchange. Send the second [GET request](https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.1). This time add `Connection: close\r\n`.
7. Parse the second response. Print both bodies.
8. [close()](https://man7.org/linux/man-pages/man2/close.2.html) the socket.

#### Test

```bash
gcc -Wall -Wextra -o http_keepalive w04/http_keepalive.c
./http_keepalive 2>/dev/null | grep -c '<title>Example Domain</title>'
```

#### Expected

```
2
```

Two bodies. One connection. Two complete responses.

#### Prove

```bash
./http_keepalive 2>/dev/null | grep -c '<title>Example Domain</title>'
# → 2
```

#### Ship

```bash
git add w04/http_keepalive.c
git commit -m "w04: keep-alive – two requests, one socket"
```

---

## Done when

- Two full [HTTP responses](https://datatracker.ietf.org/doc/html/rfc9112#section-4) are received on one [TCP connection](https://man7.org/linux/man-pages/man7/tcp.7.html).
- The [Content-Length](https://datatracker.ietf.org/doc/html/rfc9110#section-8.6) of each response is respected exactly.
- The socket is only opened and closed once.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Reading past [Content-Length](https://datatracker.ietf.org/doc/html/rfc9110#section-8.6) | You consume bytes from the next response. Track remaining bytes carefully. |
| Not checking `Connection: close` from server | If the server sends `Connection: close`, you must not reuse the socket. Check the [header](https://datatracker.ietf.org/doc/html/rfc9110#section-6.3). |
| Buffer contains start of second response | Your [recv()](https://man7.org/linux/man-pages/man2/recv.2.html) may return bytes beyond the first body. Save the leftover bytes — they belong to response two. |
| Assuming the server supports keep-alive | [HTTP/1.1 defaults to persistent](https://datatracker.ietf.org/doc/html/rfc9112#section-9.3). But always check the `Connection` header in the response. |

## Proof

```bash
./http_keepalive 2>/dev/null | grep -c 'HTTP/1.1 200'
# → 2
```

## Hero visual

```
  Client                              Server
    │                                    │
    │─── GET / HTTP/1.1 ───────────────▶│  request 1
    │◀── HTTP/1.1 200 OK + body ────────│  response 1
    │                                    │
    │  (same socket, no new handshake)   │
    │                                    │
    │─── GET / HTTP/1.1 ───────────────▶│  request 2
    │    Connection: close               │
    │◀── HTTP/1.1 200 OK + body ────────│  response 2
    │                                    │
    │◀── FIN ───────────────────────────│  server closes
    │─── FIN ───────────────────────────▶│  client closes
```

## Future Lock

- In [W04 L04](04-dns-multiple-targets.md) you will resolve hostnames to [IP addresses](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html) so you can connect to servers other than hard-coded IPs.
- In [W05](../../../parts/w05/part.md) you will offload slow connections to a [thread pool](../../../parts/w05/part.md) so one stalled keep-alive socket does not block others.
- In [W09](../../../parts/w09/part.md) your [KV store protocol](../../../parts/w09/part.md) will use persistent connections for the same reason: avoid handshake overhead.
