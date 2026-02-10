---
id: w04-quiz
title: "Week 04 Quiz"
order: 8
type: quiz
duration_min: 30
---

# Week 04 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – Request termination

What byte sequence ends the [HTTP/1.1 header section](https://datatracker.ietf.org/doc/html/rfc9112#section-2.1)?

- A) `\n\n`
- B) `\r\n\r\n`
- C) `\0\0`
- D) `EOF`

---

### Q2 – Host header

Why is the [Host header](https://datatracker.ietf.org/doc/html/rfc9110#section-7.2) required in [HTTP/1.1](https://datatracker.ietf.org/doc/html/rfc9112)?

- A) It sets the TCP port number
- B) It allows [virtual hosting](https://datatracker.ietf.org/doc/html/rfc9110#section-7.2) — multiple domains on one IP
- C) It encrypts the connection
- D) It replaces DNS resolution

---

### Q3 – Content-Length purpose

What happens if your client ignores [Content-Length](https://datatracker.ietf.org/doc/html/rfc9110#section-8.6) and reads until the socket closes?

- A) Nothing — it always works
- B) It works only with `Connection: close` but breaks [keep-alive](https://datatracker.ietf.org/doc/html/rfc9112#section-9.3)
- C) The server crashes
- D) The response is encrypted

---

### Q4 – Keep-alive default

In [HTTP/1.1](https://datatracker.ietf.org/doc/html/rfc9112#section-9.3), what is the default connection behavior?

- A) The server closes the connection after every response
- B) The connection is [persistent (keep-alive)](https://datatracker.ietf.org/doc/html/rfc9112#section-9.3) by default
- C) The client must send `Connection: keep-alive` explicitly
- D) Keep-alive only works over TLS

---

### Q5 – getaddrinfo

[getaddrinfo()](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html) returns a linked list of addresses. Why try more than one?

- A) To balance load across servers
- B) Because the first address may be unreachable or may be [IPv6](https://man7.org/linux/man-pages/man7/ipv6.7.html) on a v4-only host
- C) Because DNS always returns duplicates
- D) To avoid calling [freeaddrinfo()](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html)

---

### Q6 – epoll vs poll

What is the main performance advantage of [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) over [poll()](https://man7.org/linux/man-pages/man2/poll.2.html)?

- A) epoll uses less memory
- B) epoll returns only the ready file descriptors instead of scanning all of them
- C) epoll works on macOS
- D) epoll does not need file descriptors

---

### Q7 – epoll_ctl

Which [epoll_ctl()](https://man7.org/linux/man-pages/man2/epoll_ctl.2.html) operation adds a new file descriptor to the [epoll instance](https://man7.org/linux/man-pages/man7/epoll.7.html)?

- A) `EPOLL_CTL_MOD`
- B) `EPOLL_CTL_DEL`
- C) `EPOLL_CTL_ADD`
- D) `EPOLL_CTL_SET`

---

### Q8 – Non-blocking + EAGAIN

When a [non-blocking](https://man7.org/linux/man-pages/man2/fcntl.2.html) socket returns [EAGAIN](https://man7.org/linux/man-pages/man3/errno.3.html) from [recv()](https://man7.org/linux/man-pages/man2/recv.2.html), what does it mean?

- A) The connection is broken
- B) No data is available right now — try again when [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) says ready
- C) The buffer is full
- D) The server sent an error

---

### Q9 – Regression testing

Why run the same test harness against both the [poll()](https://man7.org/linux/man-pages/man2/poll.2.html) server and the [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) server?

- A) To prove [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) is faster
- B) To verify the behavior is identical — the replacement did not introduce bugs
- C) Because [poll()](https://man7.org/linux/man-pages/man2/poll.2.html) is deprecated
- D) To measure memory usage

---

### Q10 – Header case sensitivity

According to [RFC 9110 §5.1](https://datatracker.ietf.org/doc/html/rfc9110#section-5.1), are HTTP header field names case-sensitive?

- A) Yes — `Content-Length` and `content-length` are different headers
- B) No — header field names are case-insensitive
- C) Only request headers are case-insensitive
- D) Case sensitivity depends on the server

---

## Answer Key

| Q | Answer |
|---|--------|
| 1 | B |
| 2 | B |
| 3 | B |
| 4 | B |
| 5 | B |
| 6 | B |
| 7 | C |
| 8 | B |
| 9 | B |
| 10 | B |
