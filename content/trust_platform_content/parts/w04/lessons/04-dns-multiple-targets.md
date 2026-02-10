---
id: w04-l04
title: "DNS & Multiple Targets"
order: 4
type: lesson
duration_min: 120
---

# DNS & Multiple Targets

## Goal

Use [getaddrinfo()](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html) to resolve a hostname. Try each returned address until one [connect()](https://man7.org/linux/man-pages/man2/connect.2.html) succeeds.

## What you build

A function that takes a hostname and port string, calls [getaddrinfo()](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html), walks the linked list of results, and returns the first socket that connects. Your HTTP client from previous lessons now works with any hostname, not just hard-coded IPs.

## Why it matters

A hostname can resolve to multiple [IPv4](https://man7.org/linux/man-pages/man7/ip.7.html) and [IPv6](https://man7.org/linux/man-pages/man7/ipv6.7.html) addresses. Some may be unreachable. A robust client tries each one. This is how every real HTTP client works — and it is how your [KV store (W09)](../../../parts/w09/part.md) will discover peers.

---

## Training Session

### Warmup

Run:

```bash
getent hosts example.com
```

You see one or more IP addresses. Some may be [IPv6](https://man7.org/linux/man-pages/man7/ipv6.7.html). Your code must handle both [address families](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html).

### Work

#### Do

1. Create `w04/http_dns.c`.
2. Write a function `int connect_to(const char *host, const char *port)`.
3. Inside, call [getaddrinfo()](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html) with `hints.ai_socktype = SOCK_STREAM`.
4. Loop over the linked list (`struct addrinfo *p = res; p != NULL; p = p->ai_next`).
5. For each entry: call [socket()](https://man7.org/linux/man-pages/man2/socket.2.html) with `p->ai_family`, `p->ai_socktype`, `p->ai_protocol`.
6. Call [connect()](https://man7.org/linux/man-pages/man2/connect.2.html) with `p->ai_addr` and `p->ai_addrlen`.
7. If [connect()](https://man7.org/linux/man-pages/man2/connect.2.html) succeeds, call [freeaddrinfo()](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html) and return the socket fd.
8. If it fails, [close()](https://man7.org/linux/man-pages/man2/close.2.html) the socket and try the next address.
9. Use `connect_to("example.com", "80")` in your HTTP client. Send the same [GET request](https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.1) from [L01](01-http-request-shape.md).

#### Test

```bash
gcc -Wall -Wextra -o http_dns w04/http_dns.c
./http_dns example.com
./http_dns httpbin.org
```

#### Expected

Both print a valid [HTTP response](https://datatracker.ietf.org/doc/html/rfc9112#section-4) starting with `HTTP/1.1`.

#### Prove

```bash
./http_dns example.com 2>/dev/null | head -1
# → HTTP/1.1 200 OK
```

#### Ship

```bash
git add w04/http_dns.c
git commit -m "w04: DNS resolution with getaddrinfo fallback"
```

---

## Done when

- Your client accepts a hostname on the command line (no hard-coded IP).
- [getaddrinfo()](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html) is called correctly.
- If the first address fails, the next one is tried.
- [freeaddrinfo()](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html) is called before return.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Leaking the `addrinfo` list | Always call [freeaddrinfo()](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html) — even on error paths. |
| Hard-coding `AF_INET` | Use `p->ai_family` from the result. This handles [IPv6](https://man7.org/linux/man-pages/man7/ipv6.7.html) automatically. |
| Not closing failed sockets | Each failed [connect()](https://man7.org/linux/man-pages/man2/connect.2.html) leaves an open fd. [close()](https://man7.org/linux/man-pages/man2/close.2.html) it before trying the next. |
| Ignoring [getaddrinfo()](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html) error codes | Use [gai_strerror()](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html) to print meaningful error messages. |

## Proof

```bash
./http_dns example.com 2>/dev/null | head -1
# → HTTP/1.1 200 OK

./http_dns httpbin.org 2>/dev/null | head -1
# → HTTP/1.1 200 OK (or 301)
```

## Hero visual

```
  getaddrinfo("example.com", "80")
         │
         ▼
  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
  │ 93.184.216.34│───▶│ 2606:2800:: │───▶│    NULL     │
  │  AF_INET     │    │  AF_INET6   │    │  (end)      │
  └─────────────┘    └─────────────┘    └─────────────┘
         │                  │
    connect() ✓         (skip if first worked)
```

## Future Lock

- In [W04 L05](05-epoll-readiness-model.md) you will connect to multiple hosts concurrently using [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) and non-blocking sockets.
- In [W09](../../../parts/w09/part.md) your [KV store](../../../parts/w09/part.md) will use [getaddrinfo()](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html) to discover peer nodes.
- In [W17](../../../parts/w17/part.md) you will resolve credential endpoint hostnames the same way.
