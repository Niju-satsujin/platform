---
id: w05-part
title: "Week 05 – Thread Pool & Safe Task Execution"
order: 5
type: part
---

# Week 05 – Thread Pool & Safe Task Execution

Event loop handles IO; [thread pool](https://en.wikipedia.org/wiki/Thread_pool) handles bounded CPU work safely.

## What you build

A [thread pool](https://en.wikipedia.org/wiki/Thread_pool) with a bounded [task queue](https://en.wikipedia.org/wiki/Queue_(abstract_data_type)), clean [shutdown](https://man7.org/linux/man-pages/man3/pthread_join.3.html), [IO-to-CPU handoff](https://en.wikipedia.org/wiki/Thread_pool#I/O_bound_vs_CPU_bound), and [error propagation](https://en.wikipedia.org/wiki/Exception_handling) back to the [event loop](../w03/part.md). Workers pull tasks from a shared queue protected by a [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) and signalled by a [condition variable](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html). The [event loop](../w03/part.md) stays free for IO while CPU-heavy work runs on pool threads.

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W03 | [Event loop](../w03/part.md) – you built the single-threaded reactor that must not block |
| ← builds on | W04 | [epoll](../w04/part.md) – the IO multiplexer that feeds tasks into the pool |
| → leads to | W06 | [Backpressure](../w06/part.md) – when the pool is full, you push back on the caller |
| → leads to | W09 | [KV concurrent ops](../w09/part.md) – pool threads execute GET/SET/DEL concurrently |
| → leads to | W10 | [WAL writes](../w10/part.md) – durable writes happen on a pool thread, not the event loop |

## Lessons

1. [Task Queue Contract](lessons/01-task-queue-contract.md)
2. [Worker Lifecycle](lessons/02-worker-lifecycle.md)
3. [Cancellation & Shutdown](lessons/03-cancellation-shutdown.md)
4. [IO-to-CPU Handoff](lessons/04-io-cpu-handoff.md)
5. [Error Propagation](lessons/05-error-propagation.md)
6. [Regression Harness](lessons/06-regression-harness.md)

## Quest

[W05 Quest – Full Thread Pool with Handoff](quest.md)

## Quiz

[W05 Quiz](quiz.md)
