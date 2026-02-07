---
id: w05-thread-pool-safe-task-execution-d01-quest-concurrency-model-2h
part: w05-thread-pool-safe-task-execution
title: "Quest: Concurrency Model  2h"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Concurrency Model  2h

## Goal

Define the **concurrency model** for your server: which state is thread-confined, which is shared, what mutex protects each shared invariant, and why every lock scope is as small as possible.

By end of this session you will have:

- ✅ An **ownership map** assigning every mutable object to exactly one thread or one mutex
- ✅ A **data-race audit** proving no shared mutable state is accessed without synchronization
- ✅ A **lock-scope analysis** showing each critical section is minimal — no I/O under lock
- ✅ A **thread responsibility diagram** separating the event-loop thread from worker threads
- ✅ A **UB (undefined behavior) checklist** documenting every data-race risk and its mitigation

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Every shared mutable object has a named mutex owner | Review ownership map |
| 2 | No I/O operations (recv, send, write) inside any lock scope | Audit critical sections |
| 3 | Thread roles documented: event loop, workers, main | Check responsibility diagram |
| 4 | Data-race audit covers ≥ 5 shared objects | Count audited objects |
| 5 | Lock scope ≤ 10 lines for every critical section | Measure each lock block |

## What You're Building Today

A concurrency design document that defines the threading architecture of your server — before writing any threaded code. This prevents the ad-hoc locking patterns that cause deadlocks and data races in production.

By end of this session, you will have:

- ✅ File: `week-5/day1-concurrency-model.md`
- ✅ Thread responsibility matrix: event-loop thread vs N worker threads
- ✅ Ownership map: each mutable object → owning thread or protecting mutex
- ✅ Lock-scope rules with zero I/O inside critical sections

What "done" looks like:

```cpp
// Thread-confined: only event loop touches these
int epfd;                          // owned by: event-loop thread
std::unordered_map<int, Connection> connections;  // owned by: event-loop thread
TimerHeap timers;                  // owned by: event-loop thread

// Shared: protected by mutex
std::mutex queue_mtx;              // protects: task_queue
std::condition_variable queue_cv;  // signals: new task available
std::deque<Task> task_queue;       // shared between event-loop and workers

// Thread-confined: each worker owns its own
thread_local std::vector<uint8_t> worker_scratch_buf;  // owned by: each worker
```

You **can**: Guarantee that every data access is either thread-confined or mutex-protected.
You **cannot yet**: Implement the bounded queue (Day 2) or schedule tasks (Day 3).

## Why This Matters

🔴 **Without this, you will:**
- Write code that "works" on your single-core laptop and crashes under load on a multi-core server
- Introduce data races that are **undefined behavior** in C++ — not just bugs, but compiler-legal corruption
- Put `recv()` calls inside mutex locks, causing one slow client to block all worker threads
- Deadlock when two threads acquire the same mutexes in different order

🟢 **With this, you will:**
- Know exactly which thread owns each piece of mutable state — no ambiguity
- Keep critical sections small: acquire lock, copy data, release lock, then process
- Prevent deadlocks by design: single mutex per shared object, no nested locking
- Build a model that scales: adding more workers doesn't change the ownership rules

🔗 **How this connects:**
- **To Day 2:** The bounded work queue is the first shared data structure protected by this model
- **To Day 3:** Task scheduling policy operates within the constraints defined here
- **To Day 4:** Contention metrics measure how long threads wait on the locks designed today
- **To Week 4 Day 1:** The epoll loop becomes the event-loop thread in this architecture
- **To Week 11:** Replicated KV store adds inter-node communication threads with the same ownership rules

🧠 **Mental model: "Single-Owner Principle"**

Every mutable object has exactly one owner: either a single thread (thread-confined) or a single mutex (shared). If you can't name the owner, you have a data race. Thread-confined data never needs a lock. Shared data always needs a lock. The goal is to make most data thread-confined and minimize what's shared. The queue is the narrow bridge between threads — everything else stays on its own side.

## Visual Model

```
┌──────────────────────────────────────────────────────────────┐
│                  THREAD OWNERSHIP MODEL                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  EVENT-LOOP THREAD (1)           WORKER THREADS (N)          │
│  ┌────────────────────┐          ┌────────────────────┐      │
│  │ epfd               │          │ worker_scratch_buf │      │
│  │ connections{}      │          │ (thread_local)     │      │
│  │ timers             │          └─────────┬──────────┘      │
│  │ listen_fd          │                    │                 │
│  └─────────┬──────────┘                    │                 │
│            │ enqueue task                  │ dequeue task    │
│            │                               │                 │
│            ▼                               ▼                 │
│  ┌──────────────────────────────────────────────────┐        │
│  │              SHARED (mutex-protected)              │        │
│  │  ┌──────────────────────────────────────────┐    │        │
│  │  │  queue_mtx + queue_cv                    │    │        │
│  │  │  ┌──────────────────────────────────┐    │    │        │
│  │  │  │  task_queue: deque<Task>         │    │    │        │
│  │  │  │  [Task₁] [Task₂] [Task₃] ...    │    │    │        │
│  │  │  └──────────────────────────────────┘    │    │        │
│  │  └──────────────────────────────────────────┘    │        │
│  │  Rule: lock → copy → unlock → process            │        │
│  │  Rule: NEVER do I/O while holding lock           │        │
│  └──────────────────────────────────────────────────┘        │
│                                                              │
│  INVARIANT: No mutable state accessed by >1 thread           │
│             without a named mutex owner.                     │
└──────────────────────────────────────────────────────────────┘
```

## Build

File: `week-5/day1-concurrency-model.md`

## Do

1. **Define thread roles and responsibilities**
   > 💡 *WHY: If you don't define who does what, you'll end up with worker threads calling epoll_wait and event-loop threads doing CPU-intensive parsing. Clear roles prevent cross-contamination.*

   | Thread | Count | Responsibility | Owns |
   |--------|-------|---------------|------|
   | Main | 1 | Start server, create threads, handle signals | signal handlers, config |
   | Event loop | 1 | `epoll_wait`, accept, read/write I/O, enqueue tasks | `epfd`, `connections`, `timers` |
   | Worker | N (= CPU cores) | Dequeue tasks, process requests, produce responses | `thread_local` scratch buffers |

   ```cpp
   // Main thread: setup and launch
   int main() {
       auto server = Server::create(config);
       server.start_event_loop();      // spawns event-loop thread
       server.start_workers(num_cpus); // spawns N worker threads
       server.wait_for_shutdown();     // blocks on signal
   }
   ```

2. **Build the ownership map**
   > 💡 *WHY: The ownership map is your data-race prevention tool. If you can't fill in the "owned by" column for an object, that object is a race condition waiting to happen.*

   | Object | Type | Mutable? | Owned by | Synchronization |
   |--------|------|----------|----------|-----------------|
   | `epfd` | int | No (after create) | Event loop | None needed (immutable) |
   | `connections` | map<int, Conn> | Yes | Event loop | Thread-confined |
   | `timers` | TimerHeap | Yes | Event loop | Thread-confined |
   | `task_queue` | deque<Task> | Yes | `queue_mtx` | `lock_guard<mutex>` |
   | `shutdown_flag` | atomic<bool> | Yes | All threads | `std::atomic` (lock-free) |
   | `worker_scratch` | vector<uint8_t> | Yes | Each worker | `thread_local` |

3. **Audit every critical section for minimality**
   > 💡 *WHY: The longer you hold a lock, the longer other threads wait. If you hold a lock during `recv()` (which can block for seconds), every worker thread stalls. The rule: lock, copy, unlock, process.*

   ```cpp
   // ❌ BAD: I/O inside critical section
   void bad_enqueue(int client_fd) {
       std::lock_guard<std::mutex> lock(queue_mtx);
       char buf[4096];
       ssize_t n = recv(client_fd, buf, sizeof(buf), 0);  // BLOCKS!
       task_queue.push_back(Task{client_fd, std::string(buf, n)});
       queue_cv.notify_one();
   }

   // ✅ GOOD: I/O outside, only queue manipulation inside lock
   void good_enqueue(int client_fd, std::string data) {
       // data already read by event loop (non-blocking)
       {
           std::lock_guard<std::mutex> lock(queue_mtx);
           task_queue.push_back(Task{client_fd, std::move(data)});
       }  // lock released here
       queue_cv.notify_one();  // signal outside lock
   }
   ```

4. **Document every data-race risk and its mitigation**
   > 💡 *WHY: In C++, a data race is undefined behavior — the compiler is free to assume it doesn't happen. A race on a simple integer can corrupt your entire program, not just produce a wrong value.*

   | Risk | What could go wrong | Mitigation |
   |------|-------------------|------------|
   | Two workers dequeue same task | Task executed twice, response sent twice | `queue_mtx` protects `task_queue` |
   | Event loop reads `connections` while worker writes response | Torn read on Connection struct | Workers never touch `connections` — they enqueue response to event loop |
   | Shutdown flag read by workers without sync | Worker misses shutdown, leaks thread | Use `std::atomic<bool>` for `shutdown_flag` |
   | Timer heap modified during epoll_wait callback | Heap corruption, wrong expirations | Timer heap is thread-confined to event loop |
   | Worker accesses epfd | Concurrent `epoll_ctl` on same epfd | Workers never call epoll — they return results via queue |

5. **Define the lock ordering rule**
   > 💡 *WHY: Deadlock happens when Thread A holds lock₁ and waits for lock₂, while Thread B holds lock₂ and waits for lock₁. With a single shared mutex, deadlock is impossible. If you ever add a second mutex, you MUST define acquisition order.*

   Write your rule:

   ```cpp
   // LOCK ORDERING RULE:
   // Currently: only queue_mtx exists → deadlock impossible
   // Future: if adding stats_mtx, ALWAYS acquire queue_mtx before stats_mtx
   //
   // Rule: acquire locks in alphabetical order by name
   //       queue_mtx < stats_mtx
   //
   // NEVER hold two locks simultaneously if you can avoid it.
   // Prefer: lock A, copy, unlock A, lock B, update, unlock B
   ```

## Done when

- [ ] Thread roles defined: event loop, workers, main — each with explicit responsibilities and owned state — *prevents cross-thread contamination*
- [ ] Ownership map covers every mutable object with named owner (thread or mutex) — *eliminates data-race ambiguity*
- [ ] Every critical section audited: no I/O under lock, ≤ 10 lines — *minimizes contention from Day 4*
- [ ] Data-race risk table with ≥ 5 entries and mitigations — *documents the race conditions you've deliberately prevented*
- [ ] Lock ordering rule defined for current and future mutexes — *prevents deadlocks as complexity grows*

## Proof

Paste your ownership map, critical section audit, and data-race risk table, or upload `week-5/day1-concurrency-model.md`.

**Quick self-test** (answer without looking at your notes):

1. What is a data race in C++? → **Two threads accessing the same memory location, at least one writing, with no synchronization. It is undefined behavior — not just a wrong value, but license for the compiler to break your program.**
2. Why should workers never touch the `connections` map directly? → **The `connections` map is owned by the event-loop thread. Workers accessing it would create a data race. Instead, workers enqueue responses that the event loop dequeues and writes.**
3. Why call `queue_cv.notify_one()` outside the lock scope? → **The notified thread immediately tries to acquire the lock. If you notify inside the lock, the woken thread blocks immediately, wasting a context switch. Notifying after unlock lets it acquire the lock on first try.**
