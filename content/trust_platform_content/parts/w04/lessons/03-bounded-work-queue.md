---
id: w04-l03
title: "Bounded work queue"
order: 3
duration_minutes: 25
xp: 75
kind: lesson
part: w04
proof:
  type: paste
  instructions: "Paste your WorkQueue class showing push (blocks when full), pop (blocks when empty), and shutdown."
  regex_patterns:
    - "WorkQueue|BoundedQueue"
    - "push|pop|shutdown"
---
# Bounded work queue

## Concept

An unbounded queue is dangerous: if the producer is faster than the consumers, the queue grows forever and you run out of memory.

A **bounded queue** has a maximum size. When the queue is full, `push()` blocks until a consumer makes space. This is called **backpressure** — the producer is forced to slow down when the consumers cannot keep up.

The implementation uses the same mutex + condition variable pattern, but now with two conditions:
- `not_empty` — consumers wait on this when the queue is empty
- `not_full` — producers wait on this when the queue is full

```cpp
class WorkQueue {
    std::queue<Work> queue;
    std::mutex mtx;
    std::condition_variable not_empty;
    std::condition_variable not_full;
    size_t max_size;
    bool stopped = false;
};
```

You also need a `shutdown()` method that wakes all waiting threads so they can exit cleanly.

## Task

1. Implement `WorkQueue<T>` as a template class with:
   - Constructor takes `max_size`
   - `bool push(T item)` — blocks if full, returns false if shutdown
   - `std::optional<T> pop()` — blocks if empty, returns nullopt if shutdown
   - `void shutdown()` — sets stopped flag, wakes all waiters
2. Test with max_size=5: producer pushes 100 items, 2 consumers pop. The queue never exceeds 5 items.
3. Test shutdown: call shutdown() while threads are waiting, verify they exit cleanly.

## Hints

- `not_full.wait(lock, [&]{ return queue.size() < max_size || stopped; });`
- `not_empty.wait(lock, [&]{ return !queue.empty() || stopped; });`
- After pushing: `not_empty.notify_one();`
- After popping: `not_full.notify_one();`
- In shutdown: `stopped = true; not_empty.notify_all(); not_full.notify_all();`
- Use `std::optional<T>` for the pop return — nullopt means "queue is shut down, exit"

## Verify

```bash
g++ -std=c++17 -lpthread -o test_queue test_queue.cpp
./test_queue
echo "exit code: $?"
```

Expected: all 100 items consumed, queue size never exceeded 5, shutdown completes cleanly.

## Done When

The bounded queue blocks producers when full, blocks consumers when empty, and shuts down cleanly.
