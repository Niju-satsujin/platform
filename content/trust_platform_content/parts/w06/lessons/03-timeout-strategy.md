---
id: w06-l03
title: "Timeout Strategy"
order: 3
type: lesson
duration_min: 45
---

# Timeout Strategy

## Goal

Enforce a per-request [deadline](https://en.wikipedia.org/wiki/Deadline_(computing)) so that no single slow request can hold a [thread](https://en.wikipedia.org/wiki/Thread_(computing)) hostage forever. Use [timerfd_create](https://man7.org/linux/man-pages/man2/timerfd_create.2.html) to get a file descriptor that fires when the deadline expires.

## What you build

A timeout wrapper that arms a [timer file descriptor](https://man7.org/linux/man-pages/man2/timerfd_create.2.html) at the start of each request and disarms it on completion. If the timer fires before the request finishes, the wrapper cancels the request, logs the timeout, and returns [HTTP 504 Gateway Timeout](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504) to the client.

## Why it matters

A server without [timeouts](https://en.wikipedia.org/wiki/Timeout_(computing)) is a server that can be killed by one slow downstream call. One stuck [database](https://en.wikipedia.org/wiki/Database) query or one client that reads slowly can pin a thread, reducing your available concurrency by one. Multiply by a few bad requests and the whole pool is frozen — a [thread starvation](https://en.wikipedia.org/wiki/Starvation_(computer_science)) death spiral.

## Training Session

### Warmup — timers in Linux

1. Read the [timerfd_create](https://man7.org/linux/man-pages/man2/timerfd_create.2.html) man page. Note that it returns a [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) you can [poll](https://man7.org/linux/man-pages/man2/poll.2.html) or add to [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html).
2. Compare [timerfd_create](https://man7.org/linux/man-pages/man2/timerfd_create.2.html) to [alarm](https://man7.org/linux/man-pages/man2/alarm.2.html). Write one reason why timerfd is safer in a [multithreaded](https://en.wikipedia.org/wiki/Multithreading_(computer_architecture)) program.
3. Read about [clock_gettime](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) with `CLOCK_MONOTONIC`. Explain why [monotonic time](https://en.wikipedia.org/wiki/Monotonic_function) is better than wall-clock time for measuring [elapsed duration](https://en.wikipedia.org/wiki/Elapsed_real_time).

### Work — building the timeout wrapper

#### Do

1. At the start of each request handler, call [timerfd_create](https://man7.org/linux/man-pages/man2/timerfd_create.2.html) with `CLOCK_MONOTONIC`.
2. Arm the timer with [timerfd_settime](https://man7.org/linux/man-pages/man2/timerfd_create.2.html) using the configured `request_timeout_ms` value from your limits struct.
3. Register the timer fd with [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) alongside the client socket fd.
4. In your event loop, if the timer fd becomes readable before the request completes, enter the timeout path.
5. In the timeout path: close the client socket, close the timer fd, decrement the [inflight counter](https://en.cppreference.com/w/c/atomic), increment a `timeout_count` [atomic](https://en.cppreference.com/w/c/atomic), and log the event.
6. If the request completes before the timer, disarm the timer with [timerfd_settime](https://man7.org/linux/man-pages/man2/timerfd_create.2.html) (set to zero) and close the timer fd.
7. Add a `--request-timeout-ms` command-line flag.

#### Test

1. Start the server with `--request-timeout-ms 500`.
2. Create a test handler that deliberately [sleeps](https://man7.org/linux/man-pages/man3/sleep.3.html) for 2 seconds.
3. Send a request to the slow handler.
4. Observe that the server kills the request after 500 ms and logs "timeout".
5. Send a request to a fast handler and confirm it completes normally.

#### Expected

- Slow request: connection closed by server at ~500 ms. Log line: "request timed out after 500 ms".
- Fast request: normal 200 response, no timeout log.
- `timeout_count` incremented by 1.

### Prove — deeper understanding

1. What happens if you forget to close the [timer fd](https://man7.org/linux/man-pages/man2/timerfd_create.2.html) after the request completes? Count how many fds you leak per request.
2. Explain the race condition: the timer fires at the exact moment the response is being written. How do you make sure you do not double-close the client socket?
3. Why is [CLOCK_MONOTONIC](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) essential here? Describe a scenario where `CLOCK_REALTIME` gives a wrong timeout.

### Ship — what to commit

- Timeout wrapper code integrated into the request path.
- Updated [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) loop that monitors timer fds.
- Test script that confirms timeouts trigger at the configured deadline.

## Done when

- A request that exceeds the deadline is killed within 50 ms of the timeout value.
- The timer fd is always closed — verify with `ls /proc/<pid>/fd` before and after a burst of slow requests.
- The `timeout_count` metric matches the number of timed-out requests.

## Common mistakes

| Mistake | Why it hurts |
|---------|-------------|
| Using [alarm](https://man7.org/linux/man-pages/man2/alarm.2.html) instead of [timerfd](https://man7.org/linux/man-pages/man2/timerfd_create.2.html) | [SIGALRM](https://en.wikipedia.org/wiki/Signal_(IPC)) is process-wide, not per-request |
| Forgetting to disarm the timer on success | Timer fires later and corrupts state |
| Using [CLOCK_REALTIME](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) | [NTP](https://en.wikipedia.org/wiki/Network_Time_Protocol) adjustments can make your timeout too short or too long |
| Not handling the double-close [race](https://en.wikipedia.org/wiki/Race_condition) | Closing an fd that another thread reused causes silent corruption |

## Proof

- Log output showing a timed-out request with the exact elapsed time.
- `fd` count before and after proving no leak.

## 🖼️ Hero Visual

A chess clock with two faces. The left face counts down the request deadline. The right face shows the work progress. When the left face hits zero, a red flag drops and the game (request) is over — that flag is the [timerfd](https://man7.org/linux/man-pages/man2/timerfd_create.2.html) becoming readable.

## 🔮 Future Lock

In [Week 09](../../w09/part.md) you will chain timeouts: an outer request timeout and an inner [storage](https://en.wikipedia.org/wiki/Computer_data_storage) operation timeout, learning to propagate [deadlines](https://en.wikipedia.org/wiki/Deadline_(computing)) through layers. In [Week 20](../../w20/part.md) you will inject random delays and verify that timeouts prevent [thread starvation](https://en.wikipedia.org/wiki/Starvation_(computer_science)).
