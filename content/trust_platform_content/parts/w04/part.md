---
id: w04-part
title: "Week 04 – epoll & HTTP Client"
order: 4
type: part
---

# Week 04 – epoll & HTTP Client

Connect socket mechanics to real protocol interactions ([HTTP/1.1](https://datatracker.ietf.org/doc/html/rfc9110) parsing, [keep-alive](https://datatracker.ietf.org/doc/html/rfc9112#section-9.3), [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html)).

## What you build

An [HTTP/1.1](https://datatracker.ietf.org/doc/html/rfc9112) client using raw [sockets](https://man7.org/linux/man-pages/man2/socket.2.html) and [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html). You parse response [headers](https://datatracker.ietf.org/doc/html/rfc9110#section-6.3), handle [Content-Length](https://datatracker.ietf.org/doc/html/rfc9110#section-8.6), implement [keep-alive](https://datatracker.ietf.org/doc/html/rfc9112#section-9.3), resolve [DNS](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html), and replace [poll()](https://man7.org/linux/man-pages/man2/poll.2.html) with [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) on the server side.

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W02 | [TCP framing](../w02/part.md) – you already know how bytes move over a stream socket |
| ← builds on | W03 | [Event loop](../w03/part.md) – you built a poll()-based reactor; now you upgrade it |
| → leads to | W05 | [Thread pool](../w05/part.md) – CPU work that blocks the event loop gets offloaded |
| → leads to | W09 | [KV store protocol](../w09/part.md) – you design your own request/response protocol |
| → leads to | W17 | [HTTP-based credential endpoints](../w17/part.md) – HTTP client skills applied to auth |

## Lessons

1. [HTTP Request Shape](lessons/01-http-request-shape.md)
2. [Headers & Content-Length](lessons/02-headers-content-length.md)
3. [Keep-Alive Semantics](lessons/03-keep-alive-semantics.md)
4. [DNS & Multiple Targets](lessons/04-dns-multiple-targets.md)
5. [epoll Readiness Model](lessons/05-epoll-readiness-model.md)
6. [Regression Harness](lessons/06-regression-harness.md)

## Quest

[W04 Quest – Full HTTP/1.1 Client](quest.md)

## Quiz

[W04 Quiz](quiz.md)
