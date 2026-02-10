---
id: w06-l02
title: "Load Shedding"
order: 2
type: lesson
duration_min: 40
---

# Load Shedding

## Goal

Make the server return a proper [HTTP 503 Service Unavailable](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503) response with a [Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) header when the [bounded queue](https://en.wikipedia.org/wiki/Bounded_buffer_problem) is full, instead of silently dropping or endlessly queueing requests.

## What you build

A [load-shedding](https://en.wikipedia.org/wiki/Load_shedding) layer that sits between the accept path and the [thread pool](https://en.wikipedia.org/wiki/Thread_pool) queue. When the queue depth exceeds the configured limit, the layer writes a minimal 503 response and closes the connection.

## Why it matters

Dropping a connection with no reply leaves the client guessing. It may [retry](https://en.wikipedia.org/wiki/Exponential_backoff) immediately, making the overload worse. A 503 with [Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) tells the client exactly what happened and when to come back. This is the difference between a controlled brown-out and a cascading [failure](https://en.wikipedia.org/wiki/Cascading_failure).

## Training Session

### Warmup — HTTP error codes

1. Read the [HTTP 503](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503) specification. Note what the standard says about [Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After).
2. Compare 503 to [429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429). Write one sentence explaining when you would choose each.
3. Review the [bounded queue](https://en.wikipedia.org/wiki/Bounded_buffer_problem) from [Week 05](../../w05/part.md). Recall what happens when you call `enqueue` on a full queue.

### Work — building the shedding layer

#### Do

1. In your server's request-handling path, right before pushing work onto the [thread pool](https://en.wikipedia.org/wiki/Thread_pool) queue, check the current queue depth.
2. If the depth equals or exceeds `max_queue_depth` from the limits struct you built in [Lesson 01](01-define-limits.md), enter the shed path.
3. Build a minimal [HTTP/1.1](https://datatracker.ietf.org/doc/html/rfc9112) response string: status line `503 Service Unavailable`, a `Retry-After` header set to a configurable number of seconds, a `Content-Length` of the body, and a short plain-text body saying "server is busy".
4. Write this response to the client [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) using [write](https://man7.org/linux/man-pages/man2/write.2.html) or [send](https://man7.org/linux/man-pages/man2/send.2.html).
5. Close the connection.
6. Increment a [shed counter](https://en.cppreference.com/w/c/atomic) (atomic) so [telemetry](https://en.wikipedia.org/wiki/Telemetry) can report it later.
7. Log the event with the client address and the current queue depth.

#### Test

1. Set `max_queue_depth` to 3.
2. Add a deliberate 2-second [sleep](https://man7.org/linux/man-pages/man3/sleep.3.html) inside each worker to simulate slow processing.
3. Send 10 rapid requests with `curl -v`.
4. Observe that the first 3 are queued and processed, while the remaining 7 receive 503 responses.

#### Expected

- Successful responses: HTTP 200 with normal body.
- Shed responses: HTTP 503, header `Retry-After: 5` (or your chosen value), body `server is busy`.
- Log shows 7 shed events with queue depth at 3.

### Prove — deeper understanding

1. What happens if you send the 503 but forget to close the [file descriptor](https://en.wikipedia.org/wiki/File_descriptor)? Describe the [resource leak](https://en.wikipedia.org/wiki/Resource_leak).
2. Should `Retry-After` be a fixed value or [adaptive](https://en.wikipedia.org/wiki/Adaptive_algorithm)? Argue both sides.
3. Explain how [TCP_CORK](https://man7.org/linux/man-pages/man7/tcp.7.html) could help when writing the small 503 response in a single [segment](https://en.wikipedia.org/wiki/Transmission_Control_Protocol#TCP_segment_structure).

### Ship — what to commit

- The shedding layer code.
- Updated server that returns 503 when the queue is full.
- A test script that reproduces the overload scenario.

## Done when

- A full queue triggers a clean 503 with `Retry-After`.
- The shed counter increases by exactly the number of shed requests.
- No [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) leak after shedding (check with `ls /proc/<pid>/fd`).

## Common mistakes

| Mistake | Why it hurts |
|---------|-------------|
| Returning 500 instead of [503](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503) | 500 means a bug; 503 means temporary overload — clients treat them differently |
| Missing [Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) header | Good clients cannot back off intelligently |
| Shedding inside the worker thread instead of before enqueue | The request already consumed a queue slot, defeating the purpose |
| Not closing the socket after the 503 | Leaked [file descriptors](https://en.wikipedia.org/wiki/File_descriptor) pile up and hit `ulimit` |

## Proof

- `curl -v` output showing the 503 status line and `Retry-After` header.
- Log output showing shed count matching the number of rejected requests.

## 🖼️ Hero Visual

A post office with 3 service windows (the queue). A long line stretches outside. A clerk at the door hands each overflow person a ticket that says "Come back in 5 minutes" — that ticket is the 503 with [Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After).

## 🔮 Future Lock

In [Week 09](../../w09/part.md) your [key-value store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) will use this same 503 mechanism to reject writes when the [LSM compaction](https://en.wikipedia.org/wiki/Log-structured_merge-tree) queue is saturated. In [Week 20](../../w20/part.md) you will verify that shedding kicks in within one second of injected slowdown.
