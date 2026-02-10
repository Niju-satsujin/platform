---
id: w04-l05
title: "epoll Readiness Model"
order: 5
type: lesson
duration_min: 120
---

# epoll Readiness Model

## Goal

Replace [poll()](https://man7.org/linux/man-pages/man2/poll.2.html) with [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) in your server. Understand the difference between [level-triggered and edge-triggered](https://man7.org/linux/man-pages/man7/epoll.7.html) readiness.

## What you build

You take the [poll()-based event loop from W03](../../../parts/w03/part.md) and convert it to use [epoll_create1()](https://man7.org/linux/man-pages/man2/epoll_create.2.html), [epoll_ctl()](https://man7.org/linux/man-pages/man2/epoll_ctl.2.html), and [epoll_wait()](https://man7.org/linux/man-pages/man2/epoll_wait.2.html). The server handles the same workload but scales to thousands of connections.

## Why it matters

[poll()](https://man7.org/linux/man-pages/man2/poll.2.html) scans every fd each call — O(n). [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) returns only the ready fds — O(ready). For 10,000 connections where 5 are ready, [poll()](https://man7.org/linux/man-pages/man2/poll.2.html) does 10,000 checks. [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) does 5. This is why every high-performance Linux server ([nginx](https://nginx.org/), [Redis](https://redis.io/)) uses [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html).

---

## Training Session

### Warmup

Read the first two paragraphs of [epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html). Write down the three syscalls:

1. [epoll_create1()](https://man7.org/linux/man-pages/man2/epoll_create.2.html) — creates the [epoll instance](https://man7.org/linux/man-pages/man7/epoll.7.html).
2. [epoll_ctl()](https://man7.org/linux/man-pages/man2/epoll_ctl.2.html) — adds, modifies, or removes fds.
3. [epoll_wait()](https://man7.org/linux/man-pages/man2/epoll_wait.2.html) — blocks until fds are ready.

### Work

#### Do

1. Create `w04/epoll_server.c`.
2. Copy your [poll()-based server from W03](../../../parts/w03/part.md).
3. Replace the `struct pollfd` array with an [epoll instance](https://man7.org/linux/man-pages/man7/epoll.7.html):
   - Call [epoll_create1(0)](https://man7.org/linux/man-pages/man2/epoll_create.2.html).
   - For the listening socket, call [epoll_ctl()](https://man7.org/linux/man-pages/man2/epoll_ctl.2.html) with `EPOLL_CTL_ADD` and `EPOLLIN`.
4. Replace the `poll()` call with [epoll_wait()](https://man7.org/linux/man-pages/man2/epoll_wait.2.html).
5. When a new client connects ([accept()](https://man7.org/linux/man-pages/man2/accept.2.html)), add it to the [epoll instance](https://man7.org/linux/man-pages/man7/epoll.7.html) with [epoll_ctl()](https://man7.org/linux/man-pages/man2/epoll_ctl.2.html).
6. When a client disconnects, remove it with `EPOLL_CTL_DEL`.
7. Store the fd in `event.data.fd` so you know which socket is ready.
8. Set sockets to non-blocking with [fcntl()](https://man7.org/linux/man-pages/man2/fcntl.2.html) and `O_NONBLOCK`.

#### Test

Start the server in one terminal:

```bash
gcc -Wall -Wextra -o epoll_server w04/epoll_server.c
./epoll_server 9090
```

In another terminal, connect multiple clients:

```bash
for i in $(seq 1 5); do echo "hello from $i" | nc -q1 localhost 9090 & done
wait
```

#### Expected

All 5 clients get a response. The server does not crash. No fd leaks.

#### Prove

```bash
ls /proc/$(pgrep epoll_server)/fd | wc -l
# After all clients disconnect: only listen fd + stdin/stdout/stderr + epoll fd remain
```

#### Ship

```bash
git add w04/epoll_server.c
git commit -m "w04: epoll-based server replaces poll()"
```

---

## Done when

- The server uses [epoll_create1()](https://man7.org/linux/man-pages/man2/epoll_create.2.html), [epoll_ctl()](https://man7.org/linux/man-pages/man2/epoll_ctl.2.html), and [epoll_wait()](https://man7.org/linux/man-pages/man2/epoll_wait.2.html). No [poll()](https://man7.org/linux/man-pages/man2/poll.2.html) calls remain.
- All sockets are [non-blocking](https://man7.org/linux/man-pages/man2/fcntl.2.html).
- Multiple concurrent clients are served correctly.
- Disconnected clients are removed from the [epoll instance](https://man7.org/linux/man-pages/man7/epoll.7.html).

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting `EPOLL_CTL_DEL` on disconnect | Stale fd in the [epoll set](https://man7.org/linux/man-pages/man7/epoll.7.html) causes errors. Remove before [close()](https://man7.org/linux/man-pages/man2/close.2.html). |
| Blocking sockets with [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) | A blocking [recv()](https://man7.org/linux/man-pages/man2/recv.2.html) stalls the whole loop. Use `O_NONBLOCK`. |
| Not handling `EAGAIN` / `EWOULDBLOCK` | Non-blocking sockets return these when no data is available. It is not an error — just move on. |
| Using `EPOLLET` (edge-triggered) without draining | Edge-triggered only fires once per readiness change. You must [recv()](https://man7.org/linux/man-pages/man2/recv.2.html) in a loop until `EAGAIN`. Start with level-triggered. |

## Proof

```bash
# Terminal 1
./epoll_server 9090

# Terminal 2
for i in $(seq 1 10); do echo "ping $i" | nc -q1 localhost 9090 & done
wait
echo "All 10 clients served"
```

## Hero visual

```
                    epoll instance
                   ┌──────────────┐
                   │  ready list:  │
  listen_fd ──────▶│  [listen_fd]  │──── epoll_wait() returns
  client_1  ──────▶│  [client_3]   │     only ready fds
  client_2  ──────▶│               │
  client_3  ──────▶│               │
  ...              │               │     poll() would scan ALL fds
  client_9999 ────▶│               │     epoll returns only READY fds
                   └──────────────┘
```

## Future Lock

- In [W04 L06](06-regression-harness.md) you will build a test harness that hammers both the old [poll()](https://man7.org/linux/man-pages/man2/poll.2.html) server and the new [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) server to prove they behave the same.
- In [W05](../../../parts/w05/part.md) you will add a [thread pool](../../../parts/w05/part.md) behind the epoll loop for CPU-heavy tasks.
- In [W09](../../../parts/w09/part.md) the [KV store server](../../../parts/w09/part.md) will use this exact [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) skeleton.
