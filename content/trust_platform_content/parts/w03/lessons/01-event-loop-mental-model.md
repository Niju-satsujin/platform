---
id: w03-l01
title: "Event Loop Mental Model"
order: 1
duration_min: 120
type: lesson
---

# Lesson 1 (1/7): Event Loop Mental Model

**Goal:** Understand how a single thread can serve many clients by waiting on multiple file descriptors at once.

**What you build:** A diagram and a minimal `poll()` loop that watches stdin and a single listening socket simultaneously.

**Why it matters:**
Most network servers need concurrency.
Threads are one way — but they bring shared-state bugs and memory overhead.
The [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html) and [select(2)](https://man7.org/linux/man-pages/man2/select.2.html) system calls let **one thread** wait for activity on **many** file descriptors at once.
This is the foundation of [event-driven programming](https://en.wikipedia.org/wiki/Event-driven_programming) used by Redis, Nginx, and Node.js.

---

## TRAINING SESSION

### Warmup (15 min)

1. Draw a timeline of your Week 02 echo server handling two clients A and B. Client B connects while A is still sending. What happens to B?
2. Read the DESCRIPTION section of [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html). Write down what `struct pollfd` contains and what `POLLIN` means.
3. Read the DESCRIPTION section of [select(2)](https://man7.org/linux/man-pages/man2/select.2.html). Note the three fd_set arguments. Why three?

### Work

#### Task 1 — Set the listening socket to non-blocking

**Do:** Open your Week 02 server code. After `bind()` and `listen()`, call [fcntl(2)](https://man7.org/linux/man-pages/man2/fcntl.2.html) with `F_SETFL` and `O_NONBLOCK` on the listening socket.

**Test:**
```bash
./server &
sleep 0.1
nc localhost 7000 &
nc localhost 7000 &
kill %1
```

**Expected:** Neither `nc` connection blocks the other from connecting. The server process does not hang on `accept()`.

#### Task 2 — Build the poll() skeleton

**Do:** Replace your blocking `accept()` + `read()` loop with a `poll()` loop. Create a `struct pollfd` array. Entry 0 is the listening socket with `events = POLLIN`. Call `poll()` with a timeout of -1 (block forever). When `revents & POLLIN` is true on the listener, call `accept()`.

**Test:**
```bash
./server &
nc localhost 7000
# type "hello" + Enter in nc
```

**Expected:** Server prints a log line like `new connection fd=4`. The `poll()` call returns when the client connects.

#### Task 3 — Watch stdin alongside the listener

**Do:** Add fd 0 (stdin) to the `pollfd` array with `events = POLLIN`. When stdin becomes readable, read a line and print it prefixed with `[stdin]`.

**Test:**
```bash
./server
# In the same terminal, type "admin shutdown" + Enter
```

**Expected:** Server prints `[stdin] admin shutdown`. The listener still accepts connections in the same loop iteration.

### Prove

- [ ] `poll()` loop runs without busy-waiting (CPU stays near 0% when idle — check with `top`).
- [ ] Server accepts a connection while stdin input is also processed.
- [ ] Non-blocking flag is set on the listener fd (verify with `fcntl(fd, F_GETFL)` and log the result).

### Ship

```bash
git add -A && git commit -m "w03-l01: poll() skeleton with non-blocking listener"
```

---

## Done When

- You can explain why `poll()` does **not** need threads to watch multiple fds.
- Your server loop alternates between checking the listener and stdin without blocking on either.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting `O_NONBLOCK` on listener | `accept()` blocks, freezing the loop. Always set non-blocking before entering the loop. |
| Using `select()` with fd ≥ 1024 | `select()` has an `FD_SETSIZE` limit. Prefer `poll()` — it has no hard fd limit. |
| Busy-wait loop (poll timeout = 0) | Use timeout = -1 to block until an event. Zero timeout burns CPU. |

## Proof

```
Screenshot: terminal showing server accepting 2 connections while also echoing stdin input.
Git log showing commit w03-l01.
```

## Hero Visual

```
┌─────────────────────────────────────┐
│            poll() loop              │
│  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │stdin │  │listen│  │client│     │
│  │ fd=0 │  │ fd=3 │  │ fd=4 │     │
│  └──┬───┘  └──┬───┘  └──┬───┘     │
│     │         │         │          │
│     ▼         ▼         ▼          │
│  ┌─────────────────────────────┐   │
│  │  ONE thread checks ALL fds  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Future Lock

In **W04** you will replace `poll()` with [epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html).
`epoll` uses a kernel-side set instead of passing the full array each call — it scales to tens of thousands of connections.
The loop structure you build today stays the same; only the syscall changes.
In **W05** you will add a thread pool so CPU-heavy tasks do not block this event loop.
