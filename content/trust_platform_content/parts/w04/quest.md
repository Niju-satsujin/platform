---
id: w04-quest
title: "Quest – Full HTTP/1.1 Client"
order: 7
type: quest
duration_min: 240
---

# Quest – Full HTTP/1.1 Client

## Mission

Build a complete [HTTP/1.1](https://datatracker.ietf.org/doc/html/rfc9112) client from raw [sockets](https://man7.org/linux/man-pages/man2/socket.2.html). It resolves [DNS](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html), sends [GET requests](https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.1), parses [response headers](https://datatracker.ietf.org/doc/html/rfc9110#section-6.3), reads the body using [Content-Length](https://datatracker.ietf.org/doc/html/rfc9110#section-8.6), and supports [keep-alive](https://datatracker.ietf.org/doc/html/rfc9112#section-9.3).

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | Accept hostname and path from command line | `./http_client example.com /` |
| R2 | Resolve hostname with [getaddrinfo()](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html), try each address | `./http_client httpbin.org /get` |
| R3 | Send a valid [HTTP/1.1 GET request](https://datatracker.ietf.org/doc/html/rfc9112#section-3) with [Host header](https://datatracker.ietf.org/doc/html/rfc9110#section-7.2) | Response starts with `HTTP/1.1` |
| R4 | Parse all [response headers](https://datatracker.ietf.org/doc/html/rfc9112#section-5) into name-value pairs | `Content-Length` extracted correctly |
| R5 | Read exactly [Content-Length](https://datatracker.ietf.org/doc/html/rfc9110#section-8.6) bytes of body | `./http_client example.com / \| wc -c` matches header value |
| R6 | Support [keep-alive](https://datatracker.ietf.org/doc/html/rfc9112#section-9.3): send two requests on one connection | Two responses, one [connect()](https://man7.org/linux/man-pages/man2/connect.2.html) call |
| R7 | Print response body to [stdout](https://man7.org/linux/man-pages/man3/stdout.3.html), status and headers to [stderr](https://man7.org/linux/man-pages/man3/stderr.3.html) | `./http_client example.com / 2>/dev/null` shows body only |
| R8 | Exit `0` on [2xx](https://datatracker.ietf.org/doc/html/rfc9110#section-15.3), exit `1` on [4xx/5xx](https://datatracker.ietf.org/doc/html/rfc9110#section-15.5) | `./http_client example.com /notfound; echo $?` → `1` |

## Constraints

- C only. No `libcurl`. No `http_parser` library.
- Must compile with `gcc -Wall -Wextra -Werror`.
- Must call [freeaddrinfo()](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html). No memory leaks from DNS.
- All sockets must be [close()](https://man7.org/linux/man-pages/man2/close.2.html)d on every code path.

## Bonus challenges

| Bonus | Description |
|-------|-------------|
| B1 | Also convert your W03 server to [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) and pass the [regression harness (L06)](lessons/06-regression-harness.md) |
| B2 | Support [chunked transfer encoding](https://datatracker.ietf.org/doc/html/rfc9112#section-7.1) (no Content-Length) |
| B3 | Add a `-v` flag that prints request and response headers like `curl -v` |
| B4 | Implement a simple [connection timeout](https://man7.org/linux/man-pages/man2/connect.2.html) using non-blocking connect + [epoll_wait()](https://man7.org/linux/man-pages/man2/epoll_wait.2.html) with a timeout |

## Verification

```bash
# Build
gcc -Wall -Wextra -Werror -o http_client w04/http_client.c

# R1 + R3: basic GET
./http_client example.com / 2>/dev/null | grep -q 'Example Domain' && echo "R1+R3: PASS"

# R2: DNS resolution
./http_client httpbin.org /get 2>/dev/null | grep -q '"url"' && echo "R2: PASS"

# R5: Content-Length body size
BODY=$(./http_client example.com / 2>/dev/null | wc -c)
echo "Body bytes: $BODY"

# R6: keep-alive (run two requests — implement a --keepalive flag or test mode)
./http_client --keepalive example.com / / 2>/dev/null | grep -c '<title>' | grep -q '2' && echo "R6: PASS"

# R8: exit code
./http_client example.com /notfound 2>/dev/null; echo "Exit: $?"
# → Exit: 1
```

## Ship

```bash
git add w04/http_client.c
git commit -m "w04 quest: full HTTP/1.1 client"
```
