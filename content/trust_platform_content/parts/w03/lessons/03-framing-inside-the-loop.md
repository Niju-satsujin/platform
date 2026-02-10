---
id: w03-l03
title: "Framing Inside the Loop"
order: 3
duration_min: 120
type: lesson
---

# Lesson 3 (3/7): Framing Inside the Loop

**Goal:** Integrate your Week 02 length-prefix framing protocol into the non-blocking event loop so partial reads are handled correctly.

**What you build:** A per-connection read buffer that accumulates bytes until a complete frame arrives, then dispatches the message.

**Why it matters:**
In a blocking server, `read()` waits until all bytes arrive.
In a non-blocking loop, `read()` returns whatever is available — which may be half a frame, two frames, or anything in between.
You [MUST](https://datatracker.ietf.org/doc/html/rfc2119) buffer and parse incrementally.
This is the exact problem every protocol parser faces — HTTP, TLS, Postgres wire protocol, all of them.

---

## TRAINING SESSION

### Warmup (15 min)

1. Review your Week 02 length-prefix framing: 4-byte big-endian length header + payload.
2. Draw what happens when the kernel delivers the first 2 bytes of a 4-byte header in one `read()`, and the remaining 2 bytes + payload in the next `read()`.
3. List the states a frame parser needs: READING_HEADER, READING_PAYLOAD, FRAME_COMPLETE.

### Work

#### Task 1 — Add a read buffer to each connection

**Do:** Add a `char recv_buf[4096]` and `size_t recv_len` to your `struct connection`. On each `POLLIN` event, `read()` into `recv_buf + recv_len`. Update `recv_len`.

**Test:**
```bash
./server &
echo -n "hello" | nc localhost 7000
```

**Expected:** Server logs `[READ] fd=4 got=5 total=5`. Buffer holds "hello".

#### Task 2 — Parse frames from the buffer

**Do:** After each `read()`, call a `try_parse_frame()` function. It checks if `recv_len >= 4` (header). If yes, read the 4-byte big-endian length. If `recv_len >= 4 + payload_len`, extract the message. Shift remaining bytes to the front of the buffer. Decrement `recv_len`.

**Test:**
Send two frames back-to-back in one TCP write (concatenated bytes).

**Expected:** Server logs two separate `[FRAME]` lines with correct payloads. No data lost, no crash.

#### Task 3 — Handle partial frames across poll() iterations

**Do:** If `try_parse_frame()` finds an incomplete frame, return without consuming. The next `poll()` → `read()` appends more bytes, then `try_parse_frame()` succeeds.

**Test:**
Use a script that sends a 100-byte frame in 10-byte chunks with 50ms delays between each chunk.

**Expected:** Server does not produce a `[FRAME]` line until all 100 bytes + 4-byte header have arrived. One `[FRAME]` line with the correct 100-byte payload.

#### Task 4 — Reject oversized frames

**Do:** If the parsed length exceeds `MAX_FRAME_SIZE` (e.g., 4096), log an error, close the connection, and free the slot.

**Test:**
Send a frame header claiming 1,000,000 bytes.

**Expected:** Server logs `[ERROR] fd=4 frame too large (1000000 > 4096)` and closes the connection.

### Prove

- [ ] Two concatenated frames in one `read()` are parsed as two separate messages.
- [ ] A frame split across two `read()` calls is reassembled correctly.
- [ ] Oversized frame is rejected and connection closed.
- [ ] Other clients are not affected when one client sends a bad frame.

### Ship

```bash
git add -A && git commit -m "w03-l03: length-prefix framing in non-blocking event loop"
```

---

## Done When

- Your event loop handles partial reads, concatenated frames, and oversized frames without data corruption.
- The frame parser is a pure function that works on a buffer — it does not call `read()` itself.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Calling `read()` inside the parser | Parser should only inspect the buffer. `read()` belongs in the event loop. |
| Not shifting remaining bytes after consuming a frame | Next frame parse reads stale data. Use `memmove()`. |
| Assuming `read()` returns exactly one frame | Never assume. Always parse from the buffer. |
| Buffer overflow when `recv_len + new_bytes > sizeof(recv_buf)` | Check available space before `read()`. Use `sizeof(recv_buf) - recv_len` as max read. |

## Proof

```
Screenshot: server log showing two frames parsed from one read(), and one frame assembled from two reads().
Git log showing commit w03-l03.
```

## Hero Visual

```
  recv_buf (4096 bytes)
  ┌──────────────────────────────────────────┐
  │ [4B hdr][payload...][4B hdr][payl│       │
  │ ◄── frame 1 ──────►◄── frame 2 (partial)│
  └──────────────────────────────────────────┘
                                     ▲
                              recv_len = here

  After consuming frame 1:
  ┌──────────────────────────────────────────┐
  │ [4B hdr][payl                    │       │
  │ ◄── frame 2 (still partial) ────►       │
  └──────────────────────────────────────────┘
  memmove() shifted remaining bytes to front
```

## Future Lock

In **W04** with [epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html) and edge-triggered mode, you must drain the read buffer completely on each event — the partial-frame logic you build here becomes even more critical.
In **W09** the frame payload becomes a KV command (GET/SET/DEL). The parser dispatches to a command handler instead of echoing. Same buffer, same framing, different action.
