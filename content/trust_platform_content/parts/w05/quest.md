---
id: w05-quest
title: "Quest – Full Thread Pool with Handoff"
order: 7
type: quest
duration_min: 240
---

# Quest – Full Thread Pool with Handoff

## Mission

Build a complete [thread pool](https://en.wikipedia.org/wiki/Thread_pool) server. The [event loop](../w03/part.md) reads client requests over [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html), hands CPU-bound work to pool workers through a bounded [task queue](lessons/01-task-queue-contract.md), collects results via [eventfd](https://man7.org/linux/man-pages/man2/eventfd.2.html), sends responses back to clients, handles errors, and shuts down cleanly.

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | Bounded [task queue](lessons/01-task-queue-contract.md) with configurable capacity | Push to a full queue blocks until space opens |
| R2 | Fixed-size [thread pool](lessons/02-worker-lifecycle.md) with N [worker threads](https://man7.org/linux/man-pages/man3/pthread_create.3.html) | `ps -T -p <pid>` shows N+1 threads (main + workers) |
| R3 | Clean [shutdown](lessons/03-cancellation-shutdown.md): all workers exit after current task finishes | `./pool_server 9090 &` then `kill -TERM $!` — process exits within 2 seconds |
| R4 | [IO-to-CPU handoff](lessons/04-io-cpu-handoff.md): event loop pushes tasks, workers compute, results return via [eventfd](https://man7.org/linux/man-pages/man2/eventfd.2.html) | Log shows CPU work on worker threads, IO on main thread |
| R5 | [Error propagation](lessons/05-error-propagation.md): task failure sends error response to the correct client | `echo "bad" \| nc -q1 localhost 9090` → `ERROR: ...` |
| R6 | 30 concurrent clients all get correct responses (mix of good and bad input) | [Regression harness (L06)](lessons/06-regression-harness.md) passes |
| R7 | Server uses [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) for IO, not [poll()](https://man7.org/linux/man-pages/man2/poll.2.html) | `strace -e epoll_wait ./pool_server 9090` shows [epoll_wait](https://man7.org/linux/man-pages/man2/epoll_wait.2.html) calls |
| R8 | Zero [Helgrind](https://valgrind.org/docs/manual/hg-manual.html) errors | `valgrind --tool=helgrind ./pool_server 9090` reports 0 errors |

## Constraints

- C only. No external thread pool libraries.
- Must compile with `gcc -Wall -Wextra -Werror -pthread`.
- All [mutexes](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) and [condition variables](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be destroyed in `thread_pool_shutdown()`.
- All [sockets](https://man7.org/linux/man-pages/man2/socket.2.html) and [eventfds](https://man7.org/linux/man-pages/man2/eventfd.2.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be [close()](https://man7.org/linux/man-pages/man2/close.2.html)d on every code path.
- Workers [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) call [send()](https://man7.org/linux/man-pages/man2/send.2.html) or [recv()](https://man7.org/linux/man-pages/man2/recv.2.html) on client sockets.

## Bonus challenges

| Bonus | Description |
|-------|-------------|
| B1 | Handle [SIGTERM](https://man7.org/linux/man-pages/man7/signal.7.html) — install a [signal handler](https://man7.org/linux/man-pages/man2/sigaction.2.html) that sets a shutdown flag and writes to [eventfd](https://man7.org/linux/man-pages/man2/eventfd.2.html) to break out of [epoll_wait()](https://man7.org/linux/man-pages/man2/epoll_wait.2.html) |
| B2 | Dynamic pool sizing — start with 2 workers, grow to 8 under load, shrink when idle |
| B3 | Per-task timeout — if a worker takes longer than T seconds, mark the task as failed and send a timeout error to the client |
| B4 | Metrics endpoint — a special command `STATS` returns queue depth, active workers, completed tasks, and error count |

## Verification

```bash
# Build
gcc -Wall -Wextra -Werror -pthread -o pool_server \
  w05/handoff_server.c w05/task_queue.c w05/thread_pool.c

# R1: queue capacity
./pool_server 9090 &
PID=$!

# R2: thread count
ps -T -p $PID | wc -l
# → 6 (header + main + 4 workers)

# R4 + R5: handoff and error propagation
echo "good data" | nc -q1 localhost 9090
# → result: <value>
echo "bad" | nc -q1 localhost 9090
# → ERROR: invalid input

# R6: regression harness
./w05/test_harness.sh ./pool_server
# → PASS (30/30 clients)

# R3: clean shutdown
kill -TERM $PID
wait $PID 2>/dev/null
echo "Exit: $?"
# → Exit: 0

# R8: helgrind
valgrind --tool=helgrind ./pool_server 9090 &
sleep 1
echo "test" | nc -q1 localhost 9090
kill -TERM %1
wait
# → 0 errors from 0 contexts
```

## Ship

```bash
git add w05/
git commit -m "w05 quest: full thread pool server with handoff and error propagation"
```
