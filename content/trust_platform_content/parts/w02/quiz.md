---
id: w02-quiz
title: "TCP Echo Server — Practical Debugging Quiz"
order: 8
duration_min: 30
type: quiz
---

# TCP Echo Server — Practical Debugging Quiz

## Multiple Choice (Scenario-Based Debugging)

**Q1.** Your echo server starts, but the first client gets "connection refused." `ss -tlnp | grep 9900` shows nothing. What is the most likely cause?

- A) [bind](https://man7.org/linux/man-pages/man2/bind.2.html) or [listen](https://man7.org/linux/man-pages/man2/listen.2.html) failed and the error was not checked
- B) The client used the wrong port
- C) The firewall is blocking connections
- D) [SO_REUSEADDR](https://man7.org/linux/man-pages/man7/socket.7.html) was not set

**Q2.** You restart the echo server immediately after killing it and get "address already in use." What fix prevents this?

- A) Set [SO_REUSEADDR](https://man7.org/linux/man-pages/man7/socket.7.html) with setsockopt before calling bind
- B) Wait 60 seconds before restarting
- C) Use a different port every time
- D) Call close() twice

**Q3.** A client sends two framed messages back-to-back: `[00 00 00 04][AAAA][00 00 00 04][BBBB]`. The server echoes `AAAABBBB` as a single response without a frame header. What is the bug?

- A) The server reads all available bytes with one recv call instead of reading the 4-byte header first, then exactly `length` bytes of payload
- B) The client sent the messages too fast
- C) TCP merged the packets and there is no way to separate them
- D) The server's send buffer is too small

**Q4.** After a refactor, the echo server crashes when a client disconnects mid-send. The crash log shows "Broken pipe." What is the fix?

- A) Pass `MSG_NOSIGNAL` to [send](https://man7.org/linux/man-pages/man2/send.2.html) or ignore SIGPIPE with [sigaction](https://man7.org/linux/man-pages/man2/sigaction.2.html), then check for EPIPE in the return value
- B) Never call send after recv returns 0
- C) Increase the send buffer size
- D) Disable [TCP_NODELAY](https://man7.org/linux/man-pages/man7/tcp.7.html)

**Q5.** Your recv_exact function reads a 4-byte header. On a slow network, the first recv call returns 2 bytes. The function returns immediately with those 2 bytes and interprets them as the full header. The decoded length is garbage. What is the fix?

- A) Loop in recv_exact until all 4 bytes are received, advancing the buffer pointer after each partial read
- B) Call recv with MSG_WAITALL to force the kernel to return all bytes at once
- C) Increase the recv buffer size to 64 KB
- D) Add a 1-second sleep between recv calls

**Q6.** A client connects to your echo server and sends nothing. After 10 minutes, the server is still blocked in recv, and no other client can connect. What fix prevents this?

- A) Set [SO_RCVTIMEO](https://man7.org/linux/man-pages/man7/socket.7.html) on the client socket so recv returns EAGAIN after N seconds
- B) Set SO_RCVTIMEO on the listen socket
- C) Use a shorter backlog in listen
- D) Call close on the listen socket

**Q7.** Your load test runs 100 sequential clients. Client #1–50 work fine. Client #51 gets "accept: Too many open files." What is the cause?

- A) The server is not closing client file descriptors after disconnect, leaking fds until it hits the [EMFILE](https://man7.org/linux/man-pages/man2/accept.2.html) limit
- B) The load test is too fast
- C) The server needs more RAM
- D) The port number is too high

**Q8.** You hex-dump a framed message sent by the client and see: `05 00 00 00 48 45 4C 4C 4F`. The server decodes the length as 83886080 instead of 5. What went wrong?

- A) The length was encoded in little-endian but the server decodes big-endian (network byte order). The client should use [htonl](https://man7.org/linux/man-pages/man3/byteorder.3.html) before sending.
- B) The payload is too long
- C) The recv call returned partial data
- D) The server has a buffer overflow

## Short Answer (2–4 lines each)

**Q9.** Explain why you [MUST](https://datatracker.ietf.org/doc/html/rfc2119) use [htonl](https://man7.org/linux/man-pages/man3/byteorder.3.html) and [ntohl](https://man7.org/linux/man-pages/man3/byteorder.3.html) for the 4-byte length header, even when both client and server run on the same x86 machine.

**Q10.** A production echo server logs `recv_timeout` events 200 times per minute. The timeout is set to 5 seconds. Is this a bug? Describe two possible real-world causes.

**Q11.** Explain why checking recv's return value for 0 (zero) is different from checking for -1. What does each mean, and what should your code do in each case?

**Q12.** Your teammate asks: "Why not just use newline delimiters instead of length-prefix framing?" Give two concrete reasons why length-prefix is better for a binary protocol.

## Read Output Questions

**Q13.** Here is the output of `make test-echo`:

```
test_listen              PASS
test_echo_raw            PASS
test_framed_echo         PASS
test_two_messages        FAIL — got 1 echo instead of 2
test_disconnect_recovery PASS
test_oversize_reject     PASS
test_recv_timeout        PASS
test_partial_header_timeout PASS
test_sigpipe_survival    PASS
test_load_50_clients     PASS
9/10 passed, 1 failed
```

What broke in test_two_messages? Describe the most likely bug in the server code and how to fix it.

**Q14.** Here is a log snippet from the echo server:

```json
{"ts":"2026-02-10T16:00:01Z","level":"info","event":"server_start","port":9900,"timeout_sec":5,"request_id":"r-4401"}
{"ts":"2026-02-10T16:00:03Z","level":"info","event":"client_connect","client_fd":4,"request_id":"r-4401"}
{"ts":"2026-02-10T16:00:03Z","level":"info","event":"frame_recv","client_fd":4,"payload_len":12,"request_id":"r-4401"}
{"ts":"2026-02-10T16:00:03Z","level":"info","event":"frame_send","client_fd":4,"payload_len":12,"request_id":"r-4401"}
{"ts":"2026-02-10T16:00:08Z","level":"warn","event":"recv_timeout","client_fd":4,"errno":11,"timeout_sec":5,"request_id":"r-4401"}
{"ts":"2026-02-10T16:00:08Z","level":"info","event":"client_close","client_fd":4,"reason":"timeout","request_id":"r-4401"}
{"ts":"2026-02-10T16:00:10Z","level":"info","event":"client_connect","client_fd":4,"request_id":"r-4401"}
```

Describe the full sequence of events. Why is client_fd the same number (4) for both clients? Was the timeout handled correctly? How do you know?
