---
id: w05-thread-pool-safe-task-execution-d03-quest-scheduling-policy-2h
part: w05-thread-pool-safe-task-execution
title: "Quest: Scheduling Policy  2h"
order: 3
duration_minutes: 120
prereqs: [w05-thread-pool-safe-task-execution-d02-quest-bounded-work-queue-2h]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Scheduling Policy  2h

## Goal

Define the **task scheduling policy** for your thread pool: how tasks are ordered, what fairness guarantees exist, how starvation is prevented, and how long-running tasks are cancelled before they monopolize a worker.

By end of this session you will have:

- ✅ A **scheduling order analysis** comparing FIFO, priority, and fair-share approaches
- ✅ A **starvation prevention rule** guaranteeing every task type gets execution time
- ✅ A **task execution budget** with a hard time limit per task and a cancellation path
- ✅ A **timeout enforcement mechanism** using `std::future` / cooperative cancellation
- ✅ A **fairness verification test** proving no task type is starved under load

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Scheduling order chosen with 3+ tradeoff reasons | Review comparison table |
| 2 | Starvation test: 1000 low-priority tasks complete within 2x expected time | Run test, measure |
| 3 | Task timeout budget ≤ 5s with documented cancellation path | Check timeout constant and cancel code |
| 4 | Cancelled tasks produce error response (not silent drop) | Verify cancel → 504 response path |
| 5 | Cooperative cancellation flag checked at ≥ 2 points in task execution | Audit task code |

## What You're Building Today

A scheduling policy document and implementation that determines how your thread pool selects and limits tasks — preventing both starvation and runaway execution.

By end of this session, you will have:

- ✅ File: `week-5/day3-scheduling-policy.md`
- ✅ Scheduling order: FIFO (default) with justification
- ✅ Max task execution budget: 5 seconds with cooperative cancellation
- ✅ Starvation prevention rule for mixed workloads

What "done" looks like:

```cpp
struct Task {
    int client_fd;
    std::string request_id;
    HttpRequest request;
    std::chrono::steady_clock::time_point enqueue_time;
    std::chrono::steady_clock::time_point deadline;  // enqueue + budget
    std::atomic<bool>* cancel_flag;  // cooperative cancellation
};

constexpr auto TASK_EXECUTION_BUDGET = std::chrono::seconds(5);
```

You **can**: Guarantee every task gets a fair turn, long-running tasks are cancelled, and no task type starves.
You **cannot yet**: Measure scheduling latency (Day 4) or drain the queue during shutdown (Day 5).

## Why This Matters

🔴 **Without this, you will:**
- Have one slow KV scan block a worker for 30 seconds while 100 simple GETs wait in the queue
- Let starvation happen silently: writes always wait behind reads, growing the queue until OOM
- Have no way to stop a runaway task — the worker thread is stuck until the task finishes or the process is killed
- Ship a system where latency depends entirely on what other tasks are in the queue — unpredictable for callers

🟢 **With this, you will:**
- Process tasks in a defined order with documented fairness guarantees
- Kill tasks that exceed their budget, returning a 504 Gateway Timeout to the client
- Prove no task type starves by running mixed workloads and measuring completion rates
- Build a scheduling foundation that can evolve to priority queues in later weeks

🔗 **How this connects:**
- **To Day 2:** The bounded queue holds tasks; this policy defines the order they're dequeued
- **To Day 4:** Contention metrics measure how long tasks wait before scheduling (queue wait) vs how long they run (execution time)
- **To Day 5:** Graceful shutdown must respect in-flight task budgets — don't cancel tasks that are almost done
- **To Week 4 Day 4:** HTTP timeout matrix uses a similar per-phase budget concept
- **To Week 9:** KV store operations (GET, PUT, DELETE) may have different priority levels

🧠 **Mental model: "The Kitchen Line"**

Your thread pool is a restaurant kitchen with N cooks (workers). Orders (tasks) come in from the front of house (event loop). FIFO means "first order in, first order cooked." But if one order is a 20-course meal and 50 orders are simple salads, the salad customers starve. The execution budget is a kitchen timer: if the 20-course meal isn't done in 5 minutes, cancel it and serve an apology (504) so the cooks can move on.

## Visual Model

```
┌──────────────────────────────────────────────────────────────┐
│              TASK SCHEDULING & CANCELLATION                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Event Loop                                                  │
│       │ enqueue with deadline                                │
│       ▼                                                      │
│  ┌──────────────────────────────────────────────┐            │
│  │  FIFO Queue                                  │            │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │            │
│  │  │ T₁   │ │ T₂   │ │ T₃   │ │ T₄   │ ...   │            │
│  │  │ 5s   │ │ 5s   │ │ 5s   │ │ 5s   │        │            │
│  │  │budget│ │budget│ │budget│ │budget│        │            │
│  │  └──┬───┘ └──────┘ └──────┘ └──────┘        │            │
│  └─────┼────────────────────────────────────────┘            │
│        │ dequeue (FIFO order)                                │
│        ▼                                                     │
│  ┌──────────────────────┐                                    │
│  │  Worker Thread        │                                    │
│  │  ┌──────────────────┐│                                    │
│  │  │ start = now()    ││                                    │
│  │  │ while processing:││                                    │
│  │  │  if cancel_flag  ││                                    │
│  │  │    → abort, 504  ││                                    │
│  │  │  if now > deadline│                                    │
│  │  │    → abort, 504  ││                                    │
│  │  │  else            ││                                    │
│  │  │    → continue    ││                                    │
│  │  └──────────────────┘│                                    │
│  └──────────────────────┘                                    │
│                                                              │
│  Monitor Thread (optional):                                  │
│  every 1s: for each active task, check deadline              │
│  if expired: set cancel_flag = true                          │
└──────────────────────────────────────────────────────────────┘
```

## Build

File: `week-5/day3-scheduling-policy.md`

## Do

1. **Analyze scheduling order tradeoffs**
   > 💡 *WHY: FIFO is the simplest and most predictable order. But it has real tradeoffs — one slow task delays everything behind it. You need to choose deliberately and document why, so you can revisit when requirements change.*

   | Policy | Ordering | Starvation risk | Complexity | Best for |
   |--------|----------|----------------|------------|----------|
   | FIFO | Arrival time | Low (all equal) | O(1) dequeue | Uniform task types |
   | Priority | Task priority field | High (low-pri starves) | O(log N) dequeue | Mixed read/write |
   | Fair-share | Round-robin per client | None | O(clients) bookkeeping | Multi-tenant |
   | Shortest-job-first | Estimated duration | High (long tasks starve) | O(log N) | Latency-sensitive |

   Write your decision: "I choose FIFO because all tasks are currently similar duration (HTTP request handling), it's O(1), and it has no starvation risk for equal-priority work. I'll revisit when KV store operations (Week 9) introduce variable-duration tasks."

2. **Implement the task execution budget**
   > 💡 *WHY: Without a time limit, a task that enters an infinite loop or triggers an expensive scan locks a worker thread permanently. The budget says "you have 5 seconds — deliver a result or get cancelled."*

   ```cpp
   constexpr auto TASK_BUDGET = std::chrono::seconds(5);

   struct Task {
       int client_fd;
       std::string request_id;
       HttpRequest request;
       std::chrono::steady_clock::time_point enqueue_time;
       std::chrono::steady_clock::time_point deadline;
       std::atomic<bool> cancelled{false};

       Task(int fd, std::string id, HttpRequest req)
           : client_fd(fd), request_id(std::move(id)),
             request(std::move(req)),
             enqueue_time(std::chrono::steady_clock::now()),
             deadline(enqueue_time + TASK_BUDGET) {}
   };
   ```

3. **Implement cooperative cancellation**
   > 💡 *WHY: C++ has no safe way to kill a thread externally (`pthread_cancel` is dangerous with RAII). Instead, the task checks a cancellation flag at key points and exits cleanly. "Cooperative" means the task must opt in to checking.*

   ```cpp
   HttpResponse execute_task(Task& task) {
       // Check 1: before starting work
       if (task.cancelled.load()) {
           return {504, "Task cancelled before execution"};
       }

       // Do phase 1: parse/validate
       auto result = validate_request(task.request);
       if (!result.ok) return {400, result.error};

       // Check 2: after expensive phase
       if (task.cancelled.load() ||
           std::chrono::steady_clock::now() > task.deadline) {
           return {504, "Task execution budget exceeded"};
       }

       // Do phase 2: process
       auto response = process_request(task.request);

       // Check 3: before sending response
       if (task.cancelled.load()) {
           return {504, "Task cancelled during processing"};
       }
       return response;
   }
   ```

4. **Design the deadline monitor**
   > 💡 *WHY: Workers are busy executing tasks — they can't watch their own clock in a background thread. A separate monitor thread (or the event loop's timer) checks active tasks and sets cancel flags for overdue ones.*

   ```cpp
   class DeadlineMonitor {
       std::vector<Task*> active_tasks_;
       std::mutex mtx_;
   public:
       void register_task(Task* t) {
           std::lock_guard<std::mutex> lock(mtx_);
           active_tasks_.push_back(t);
       }
       void unregister_task(Task* t) {
           std::lock_guard<std::mutex> lock(mtx_);
           active_tasks_.erase(
               std::remove(active_tasks_.begin(), active_tasks_.end(), t),
               active_tasks_.end());
       }
       void check_deadlines() {
           std::lock_guard<std::mutex> lock(mtx_);
           auto now = std::chrono::steady_clock::now();
           for (auto* t : active_tasks_) {
               if (now > t->deadline) {
                   t->cancelled.store(true);
               }
           }
       }
   };
   ```

5. **Write a starvation verification test**
   > 💡 *WHY: The scheduling policy claims no task type starves. Prove it: enqueue 500 fast tasks and 500 slow tasks, measure completion times. If slow tasks finish within 2x expected time, no starvation occurred.*

   ```cpp
   void starvation_test() {
       BoundedQueue<Task> queue(1024);
       ThreadPool pool(4, queue);

       auto start = std::chrono::steady_clock::now();
       std::atomic<int> fast_done{0}, slow_done{0};

       // Enqueue alternating fast and slow tasks
       for (int i = 0; i < 1000; i++) {
           Task t;
           t.type = (i % 2 == 0) ? "fast" : "slow";
           t.work = [&, type = t.type] {
               if (type == "slow")
                   std::this_thread::sleep_for(std::chrono::milliseconds(10));
               (type == "fast" ? fast_done : slow_done)++;
           };
           queue.push(std::move(t));
       }

       pool.drain_and_stop();

       assert(fast_done == 500);
       assert(slow_done == 500);
       auto elapsed = std::chrono::steady_clock::now() - start;
       // Verify slow tasks didn't take > 2x expected time
       // Expected: 500 slow * 10ms / 4 workers = ~1.25s
       // Threshold: 2.5s
       assert(elapsed < std::chrono::milliseconds(2500));
   }
   ```

## Done when

- [ ] Scheduling order chosen (FIFO) with 3+ tradeoff reasons vs alternatives — *documented decision, revisitable for Week 9*
- [ ] Task execution budget: 5s max with `deadline` field on every task — *no runaway task blocks a worker forever*
- [ ] Cooperative cancellation: `cancelled` flag checked at ≥ 2 points in task execution — *clean exit path, not thread kill*
- [ ] Deadline monitor checks active tasks periodically and sets cancel flags — *automatic enforcement, not manual*
- [ ] Starvation test: 500 fast + 500 slow tasks all complete within 2x expected time — *fairness proven, not assumed*

## Proof

Paste your scheduling decision table, Task struct with deadline, cancellation code, and starvation test results, or upload `week-5/day3-scheduling-policy.md`.

**Quick self-test** (answer without looking at your notes):

1. Why is cooperative cancellation safer than `pthread_cancel`? → **`pthread_cancel` can interrupt a thread at any point, including inside a destructor or while holding a lock. Cooperative cancellation lets the task reach a safe checkpoint, release resources, and exit cleanly.**
2. What response does a timed-out task produce? → **504 Gateway Timeout — the server accepted the request but couldn't produce a response within the budget. The client knows to retry or report the failure.**
3. Why choose FIFO over priority scheduling for now? → **All current tasks are HTTP request handlers with similar duration. Priority scheduling adds O(log N) overhead and starvation risk for low-priority tasks — complexity we don't need yet.**
