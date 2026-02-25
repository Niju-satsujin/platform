---
id: w04-l05
title: "Graceful shutdown — drain then stop"
order: 5
duration_minutes: 25
xp: 50
kind: lesson
part: w04
proof:
  type: paste
  instructions: "Paste test output showing: (1) 50 tasks submitted, (2) shutdown called, (3) all 50 tasks completed before threads exit."
  regex_patterns:
    - "shutdown|drain"
    - "50.*complete|all.*done"
---
# Graceful shutdown — drain then stop

## Concept

When you call shutdown, there might be tasks still in the queue. You have two choices:

1. **Drop remaining tasks** — fast but you lose work
2. **Drain the queue first** — slower but all submitted work completes

For a reliable system, you always drain. If someone submitted work, they expect it to finish.

The shutdown sequence:
1. Stop accepting new submissions (new calls to `submit()` return false)
2. Let workers finish their current tasks and pull remaining tasks from the queue
3. When the queue is empty and all workers are idle, join the threads
4. Destructor completes

The trick: after setting the stopped flag, do NOT immediately wake all threads with nullopt. Instead, let them keep pulling from the queue until it is empty. Only when `queue.empty() && stopped` should workers exit.

One approach: in `shutdown()`, set a `no_more_submissions` flag first. The queue keeps working. Then call `queue.shutdown()` only after the queue is drained. Or simpler: have `pop()` return nullopt only when both `stopped` and `queue.empty()`.

## Task

1. Modify your WorkQueue: `pop()` returns nullopt only when `stopped && queue.empty()`
2. Add a `drain` parameter to `ThreadPool::shutdown(bool drain = true)`
3. If `drain=true`: stop accepting new tasks, but let workers finish queued tasks
4. If `drain=false`: stop immediately, drop remaining tasks
5. Test: submit 50 tasks (each sleeps 10ms), call shutdown(true), verify all 50 complete

## Hints

- Modified pop condition: `cv.wait(lock, [&]{ return !queue.empty() || (stopped && queue.empty()); });`
- Simpler: `cv.wait(lock, [&]{ return !queue.empty() || stopped; }); if (stopped && queue.empty()) return nullopt;`
- For the non-drain case: clear the queue before waking workers
- 50 tasks × 10ms each with 4 threads = ~125ms total (50/4 × 10ms). Verify total time is roughly this.

## Verify

```bash
g++ -std=c++17 -lpthread -o test_shutdown test_shutdown.cpp
time ./test_shutdown
```

Expected: all 50 tasks complete, total time ~125ms (not 0ms which would mean tasks were dropped).

## Done When

Graceful shutdown drains the queue completely — no submitted task is lost.
