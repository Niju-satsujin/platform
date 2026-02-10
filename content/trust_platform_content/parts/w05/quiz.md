---
id: w05-quiz
title: "Week 05 Quiz"
order: 8
type: quiz
duration_min: 30
---

# Week 05 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – Bounded queue purpose

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the [task queue](lessons/01-task-queue-contract.md) have a capacity limit?

- A) To make the code simpler
- B) To prevent a fast producer from exhausting memory and to create [backpressure](../w06/part.md)
- C) Because [pthread_mutex_t](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) only supports fixed-size arrays
- D) Because the OS limits queue sizes

---

### Q2 – Spurious wakeup

Why must [pthread_cond_wait()](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html) be called inside a `while` loop, not an `if` statement?

- A) Because `while` is faster than `if`
- B) Because [spurious wakeups](https://en.wikipedia.org/wiki/Spurious_wakeup) can happen — the thread may wake even when the condition is still false
- C) Because the compiler requires it
- D) Because [pthread_cond_signal()](https://man7.org/linux/man-pages/man3/pthread_cond_signal.3p.html) always wakes all threads

---

### Q3 – pthread_create stack cost

What is the default [stack](https://man7.org/linux/man-pages/man3/pthread_attr_setstacksize.3.html) size for a new thread created by [pthread_create()](https://man7.org/linux/man-pages/man3/pthread_create.3.html) on Linux?

- A) 4 KB
- B) 64 KB
- C) 8 MB
- D) Unlimited

---

### Q4 – Broadcast vs Signal

Why does [shutdown (L03)](lessons/03-cancellation-shutdown.md) use [pthread_cond_broadcast()](https://man7.org/linux/man-pages/man3/pthread_cond_broadcast.3p.html) instead of [pthread_cond_signal()](https://man7.org/linux/man-pages/man3/pthread_cond_signal.3p.html)?

- A) Broadcast is faster
- B) Signal wakes only one thread — other workers stay asleep and never see the shutdown flag
- C) Signal does not work with [mutexes](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html)
- D) Broadcast uses less memory

---

### Q5 – Worker IO rule

Why [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) worker threads call [send()](https://man7.org/linux/man-pages/man2/send.2.html) on client [sockets](https://man7.org/linux/man-pages/man2/socket.2.html)?

- A) Workers cannot access file descriptors
- B) Two threads writing to the same fd is a [data race](https://en.wikipedia.org/wiki/Race_condition) — only the [event loop](../w03/part.md) does IO
- C) [send()](https://man7.org/linux/man-pages/man2/send.2.html) only works on the main thread
- D) Workers are too slow to send data

---

### Q6 – eventfd purpose

What is the role of [eventfd](https://man7.org/linux/man-pages/man2/eventfd.2.html) in the [IO-to-CPU handoff (L04)](lessons/04-io-cpu-handoff.md)?

- A) It transfers the result data to the event loop
- B) It wakes the [event loop](../w03/part.md) from [epoll_wait()](https://man7.org/linux/man-pages/man2/epoll_wait.2.html) when a worker has finished a task
- C) It replaces the [task queue](lessons/01-task-queue-contract.md)
- D) It creates new threads

---

### Q7 – Error propagation path

When a task fails on a worker thread, the correct error propagation path is:

- A) Worker calls [send()](https://man7.org/linux/man-pages/man2/send.2.html) with the error directly to the client
- B) Worker sets the error in the result struct, pushes it to the results queue, and writes to [eventfd](https://man7.org/linux/man-pages/man2/eventfd.2.html) — the [event loop](../w03/part.md) sends the error to the client
- C) Worker logs the error and drops the task silently
- D) Worker calls [exit()](https://man7.org/linux/man-pages/man3/exit.3.html) to crash the server

---

### Q8 – Join after shutdown

What happens if you call `task_queue_shutdown()` but do not call [pthread_join()](https://man7.org/linux/man-pages/man3/pthread_join.3.html) on the workers?

- A) Nothing — the workers clean up automatically
- B) The main thread may exit while workers are still running, causing undefined behavior
- C) The workers are killed immediately
- D) The [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) is automatically destroyed

---

### Q9 – Regression harness value

Why run the same [regression harness](lessons/06-regression-harness.md) against both the [epoll-only server (W04)](../w04/part.md) and the [thread pool server (W05)](lessons/04-io-cpu-handoff.md)?

- A) To prove the thread pool is faster
- B) To verify that adding threads did not change client-visible behavior — the output [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be identical
- C) Because [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) is deprecated
- D) To count how many threads the server uses

---

### Q10 – Circular buffer wrap

In the [task queue's circular buffer](lessons/01-task-queue-contract.md), what does `tail = (tail + 1) % capacity` do?

- A) It doubles the buffer size
- B) It wraps the index back to zero when it reaches the end — reusing slots without shifting elements
- C) It removes the oldest task
- D) It locks the [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html)

---

## Answer Key

| Q | Answer |
|---|--------|
| 1 | B |
| 2 | B |
| 3 | C |
| 4 | B |
| 5 | B |
| 6 | B |
| 7 | B |
| 8 | B |
| 9 | B |
| 10 | B |
