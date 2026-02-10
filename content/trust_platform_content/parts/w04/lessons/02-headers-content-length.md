---
id: w04-l02
title: "Headers & Content-Length"
order: 2
type: lesson
duration_min: 120
---

# Headers & Content-Length

## Goal

Parse [HTTP response headers](https://datatracker.ietf.org/doc/html/rfc9110#section-6.3) from raw bytes. Use [Content-Length](https://datatracker.ietf.org/doc/html/rfc9110#section-8.6) to know exactly how many body bytes to read.

## What you build

A function that scans the [recv()](https://man7.org/linux/man-pages/man2/recv.2.html) buffer for the `\r\n\r\n` boundary, extracts each [header field](https://datatracker.ietf.org/doc/html/rfc9112#section-5), and returns the [Content-Length](https://datatracker.ietf.org/doc/html/rfc9110#section-8.6) value. Your program then reads exactly that many bytes for the [body](https://datatracker.ietf.org/doc/html/rfc9110#section-6.4).

## Why it matters

Without [Content-Length](https://datatracker.ietf.org/doc/html/rfc9110#section-8.6), you do not know where the body ends. You cannot pipeline requests. You cannot reuse the connection. [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) is a byte stream — it gives you no message boundaries. The [header](https://datatracker.ietf.org/doc/html/rfc9110#section-6.3) tells you the boundary. This is the same problem you solved with [length-prefix framing in W02](../../../parts/w02/part.md), but now the protocol is [HTTP/1.1](https://datatracker.ietf.org/doc/html/rfc9112).

---

## Training Session

### Warmup

Run:

```bash
printf 'GET / HTTP/1.1\r\nHost: example.com\r\nConnection: close\r\n\r\n' | nc example.com 80 | head -20
```

Find the `Content-Length:` line. Write down the number. Count the blank line. Everything after that blank line is [body](https://datatracker.ietf.org/doc/html/rfc9110#section-6.4).

### Work

#### Do

1. Create `w04/http_parse.c` (or extend `http_get.c`).
2. After [connect()](https://man7.org/linux/man-pages/man2/connect.2.html) and [send()](https://man7.org/linux/man-pages/man2/send.2.html), receive into a buffer.
3. Search the buffer for `\r\n\r\n`. This is the [header/body boundary](https://datatracker.ietf.org/doc/html/rfc9112#section-2.1).
4. Walk each line before that boundary. Each line has the form `Name: value\r\n` — see [RFC 9112 §5](https://datatracker.ietf.org/doc/html/rfc9112#section-5).
5. When the name is `Content-Length`, convert the value to an integer.
6. Compute how many body bytes you already have in the buffer (bytes after `\r\n\r\n`).
7. Loop [recv()](https://man7.org/linux/man-pages/man2/recv.2.html) until you have collected exactly [Content-Length](https://datatracker.ietf.org/doc/html/rfc9110#section-8.6) body bytes.
8. Print the body only (no headers).

#### Test

```bash
gcc -Wall -Wextra -o http_parse w04/http_parse.c
./http_parse | wc -c
```

#### Expected

The byte count matches the `Content-Length` value you wrote down in the warmup.

#### Prove

```bash
./http_parse | wc -c
# Must equal the Content-Length header value
```

#### Ship

```bash
git add w04/http_parse.c
git commit -m "w04: parse headers and read Content-Length body"
```

---

## Done when

- Your program reads exactly [Content-Length](https://datatracker.ietf.org/doc/html/rfc9110#section-8.6) bytes of body. No more, no less.
- `./http_parse | wc -c` equals the `Content-Length` value from the response.
- Your [header parser](https://datatracker.ietf.org/doc/html/rfc9112#section-5) handles at least `Content-Length` and `Connection`.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Searching for `\n\n` instead of `\r\n\r\n` | [HTTP uses CRLF](https://datatracker.ietf.org/doc/html/rfc9112#section-2.1). The boundary is four bytes: `0x0d 0x0a 0x0d 0x0a`. |
| First `recv()` does not contain full headers | Headers can span multiple [recv()](https://man7.org/linux/man-pages/man2/recv.2.html) calls. Accumulate until you find `\r\n\r\n`. |
| Off-by-one on body start | Body starts at offset of `\r\n\r\n` **plus four**. |
| Case-sensitive header comparison | [RFC 9110 §5.1](https://datatracker.ietf.org/doc/html/rfc9110#section-5.1) says header names are case-insensitive. Compare with [strcasecmp()](https://man7.org/linux/man-pages/man3/strcasecmp.3.html). |

## Proof

```bash
CL=$(./http_parse 2>/dev/null | wc -c)
echo "Body bytes: $CL"
# → Body bytes: <matches Content-Length>
```

## Hero visual

```
  recv buffer:
  ┌──────────────────────────────────────────────────┐
  │ HTTP/1.1 200 OK\r\n                              │  ← status line
  │ Content-Length: 1256\r\n                          │  ← header
  │ Connection: keep-alive\r\n                        │  ← header
  │ \r\n                                              │  ← blank line (boundary)
  │ <!doctype html>...                                │  ← body (1256 bytes)
  └──────────────────────────────────────────────────┘
       ▲                    ▲
       headers end here     body starts here (+4)
```

## Future Lock

- In [W04 L03](03-keep-alive-semantics.md) you will use the exact byte count from [Content-Length](https://datatracker.ietf.org/doc/html/rfc9110#section-8.6) to know when one response ends and the next can begin on the same socket.
- In [W09](../../../parts/w09/part.md) you will build your own [length-prefix framing](../../../parts/w02/part.md) inspired by what you learned here.
- In [W17](../../../parts/w17/part.md) you will parse JSON bodies from credential endpoints using the same header logic.
