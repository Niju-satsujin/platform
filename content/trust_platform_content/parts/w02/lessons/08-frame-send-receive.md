---
id: w02-l08
title: "Integrate framing into echo server"
order: 8
duration_minutes: 25
xp: 50
kind: lesson
part: w02
proof:
  type: paste
  instructions: "Paste client output showing 5 framed messages sent and echoed back correctly."
  regex_patterns:
    - "frame|sent|received"
    - "5.*match|all.*correct"
---
# Integrate framing into echo server

## Concept

Your echo server currently reads raw bytes. Your client sends raw bytes. There is no framing — if you send two messages quickly, they might arrive merged into one read.

Now you replace the raw read/write calls with `send_frame()` and `recv_frame()`. The server loop becomes:

```
while true:
    len = recv_frame(client_fd, buf, max_size)
    if len <= 0: break
    send_frame(client_fd, buf, len)
```

The client becomes:
```
send_frame(fd, message, strlen(message))
len = recv_frame(fd, buf, max_size)
// buf now contains exactly the echoed message
```

With framing in place, you can send multiple messages on the same connection and each one arrives as a distinct unit. This is the foundation for every protocol you will build.

## Task

1. Update your echo server to use `recv_frame()` and `send_frame()` instead of raw `read()` and `write()`
2. Update your client to use `send_frame()` and `recv_frame()`
3. Modify the client to send multiple messages in sequence: `./client send "msg1" "msg2" "msg3"`
4. For each message: send a frame, receive the echo frame, verify they match
5. Print a summary: `"5/5 frames echoed correctly"`

## Hints

- The client sends N frames in a loop, receiving the echo after each send
- Compare sent bytes with received bytes using `memcmp()` or convert to `std::string` and use `==`
- If any frame does not match, print which one failed and exit 1
- The server code change is minimal — just swap `read()`/`write()` for `recv_frame()`/`send_frame()`

## Verify

```bash
# Terminal 1
./echo_server

# Terminal 2
./client send "alpha" "bravo" "charlie" "delta" "echo"
```

Expected: client prints "5/5 frames echoed correctly"

## Done When

Multiple framed messages sent on one connection all echo back correctly, with no merging or splitting.
