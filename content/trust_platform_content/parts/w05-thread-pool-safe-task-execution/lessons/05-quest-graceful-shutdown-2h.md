---
id: w05-thread-pool-safe-task-execution-d05-quest-graceful-shutdown-2h
part: w05-thread-pool-safe-task-execution
title: "Quest: Graceful Shutdown  2h"
order: 5
duration_minutes: 120
prereqs: [w05-thread-pool-safe-task-execution-d04-quest-contention-metrics-2h]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Graceful Shutdown  2h

## Goal

Implement **graceful shutdown** for your server: stop accepting new connections, drain all queued tasks to completion, join all worker threads safely, and guarantee zero task loss for work that was already accepted.

By end of this session you will have:

- ✅ A **shutdown sequence document** defining the exact order of operations
- ✅ A **stop-intake mechanism** that closes the listen socket and stops enqueuing new tasks
- ✅ A **queue drain** that lets workers finish all remaining tasks before exiting
- ✅ A **thread join** that waits for every worker to complete and exit cleanly
- ✅ A **zero-loss verification test** proving no accepted task is dropped during shutdown

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Shutdown sequence has ≥ 4 ordered phases | Review sequence document |
| 2 | Listen socket closed before queue drain starts | Verify `close(listen_fd)` before drain |
| 3 | All queued tasks complete during drain (zero loss) | Count enqueued vs completed |
| 4 | All worker threads joined with no hanging | Verify `join()` returns for all |
| 5 | Shutdown completes within `drain_timeout` (bounded) | Check timeout enforcement |

## What You're Building Today

A shutdown orchestration system that safely transitions your server from "running" to "stopped" without losing any work that's already been accepted. This is the difference between a `kill -9` that drops requests and a graceful `SIGTERM` that finishes them.

By end of this session, you will have:

- ✅ File: `week-5/day5-graceful-shutdown.md`
- ✅ Signal handler that sets shutdown flag on `SIGTERM`/`SIGINT`
- ✅ Phased shutdown: stop intake → drain queue → join workers → close resources
- ✅ Drain timeout: if queue doesn't empty in N seconds, force-stop

What "done" looks like:

```cpp
void Server::graceful_shutdown() {
    // Phase 1: Stop accepting new connections
    epoll_ctl(epfd_, EPOLL_CTL_DEL, listen_fd_, nullptr);
    close(listen_fd_);

    // Phase 2: Drain the task queue
    task_queue_.stop_accepting();  // push() now returns SHUTDOWN
    // Workers continue popping and processing remaining tasks

    // Phase 3: Wait for queue to empty (with timeout)
    auto deadline = std::chrono::steady_clock::now() + DRAIN_TIMEOUT;
    while (task_queue_.size() > 0 &&
           std::chrono::steady_clock::now() < deadline) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }

    // Phase 4: Signal workers to stop and join
    task_queue_.shutdown();  // unblock all pop() waiters
    for (auto& worker : workers_) {
        if (worker.joinable()) worker.join();
    }

    // Phase 5: Close remaining client connections
    close_all_connections();
    close(epfd_);
}
```

You **can**: Shut down the server without losing any accepted request and without hanging threads.
You **cannot yet**: Perform live restarts (rolling deployment), which requires external orchestration.

## Why This Matters

🔴 **Without this, you will:**
- Drop in-flight requests on every deploy, causing client errors and retry storms
- Have worker threads that block forever on `pop()` because nobody called `shutdown()`
- Leak file descriptors and sockets because cleanup code never runs
- Get `kill -9`'d by your deployment system after the graceful timeout expires, causing data corruption

🟢 **With this, you will:**
- Complete every accepted request during shutdown — zero client-visible errors on deploy
- Join every thread cleanly, proving no resource leaks with Valgrind/AddressSanitizer
- Bound shutdown time: if drain takes too long, force-stop after the timeout
- Build the foundation for zero-downtime deploys by draining before stopping

🔗 **How this connects:**
- **To Day 2:** Queue's `shutdown()` method unblocks all consumers — designed for this moment
- **To Day 3:** Task execution budget bounds how long each in-flight task can take during drain
- **To Day 4:** Metrics from drain (final queue depth, drain duration) become shutdown diagnostics
- **To Week 4 Day 2:** Timer cleanup runs during shutdown to expire all remaining deadlines
- **To Week 20:** Failure survival hardening tests that shutdown completes under adversarial conditions

🧠 **Mental model: "Last Call at the Bar"**

Graceful shutdown is like closing a bar. Phase 1: Lock the front door (stop intake). Phase 2: Serve everyone who's already inside (drain queue). Phase 3: Wait for them to finish their drinks (join workers), but with a closing time (drain timeout). Phase 4: Turn off the lights and lock up (close resources). If someone's still inside after closing time, you escort them out (force-stop). The key: nobody new gets in after Phase 1, and nobody already inside gets abandoned.

## Visual Model

```
┌──────────────────────────────────────────────────────────────┐
│              GRACEFUL SHUTDOWN SEQUENCE                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  SIGTERM received                                            │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────┐                     │
│  │ PHASE 1: STOP INTAKE               │                     │
│  │  close(listen_fd)                   │  New connections    │
│  │  push() → returns SHUTDOWN          │  rejected (RST)    │
│  └──────────────┬──────────────────────┘                     │
│                 │                                            │
│                 ▼                                            │
│  ┌─────────────────────────────────────┐                     │
│  │ PHASE 2: DRAIN QUEUE               │  Workers continue   │
│  │  queue: [T₅] [T₆] [T₇]            │  processing ──────▶ │
│  │  workers pop and execute            │  [T₅ ✓] [T₆ ✓]    │
│  │  wait until queue.size() == 0       │  [T₇ ✓]            │
│  │  (or drain_timeout expires)         │                     │
│  └──────────────┬──────────────────────┘                     │
│                 │                                            │
│                 ▼                                            │
│  ┌─────────────────────────────────────┐                     │
│  │ PHASE 3: JOIN WORKERS              │                     │
│  │  queue.shutdown()  → notify_all     │                     │
│  │  for each worker: worker.join()     │  All threads exit   │
│  └──────────────┬──────────────────────┘                     │
│                 │                                            │
│                 ▼                                            │
│  ┌─────────────────────────────────────┐                     │
│  │ PHASE 4: CLOSE RESOURCES           │                     │
│  │  close all client fds               │                     │
│  │  close(epfd)                        │                     │
│  │  log final metrics                  │  Process exits 0    │
│  └─────────────────────────────────────┘                     │
│                                                              │
│  INVARIANT: Every task that was enqueued before Phase 1      │
│  completes execution or times out. Zero silent drops.        │
└──────────────────────────────────────────────────────────────┘
```

## Build

File: `week-5/day5-graceful-shutdown.md`

## Do

1. **Set up the signal handler for SIGTERM/SIGINT**
   > 💡 *WHY: `SIGTERM` is the standard signal for "please shut down gracefully." Docker, systemd, and Kubernetes all send SIGTERM first, wait a grace period, then SIGKILL. Your handler must set a flag — not call complex logic (signal handler context is restricted).*

   ```cpp
   #include <signal.h>
   #include <atomic>

   std::atomic<bool> shutdown_requested{false};

   void signal_handler(int signum) {
       // ONLY safe operations in a signal handler:
       // set atomic flag, write to pipe, call _exit()
       shutdown_requested.store(true);
   }

   void install_signal_handlers() {
       struct sigaction sa = {};
       sa.sa_handler = signal_handler;
       sigemptyset(&sa.sa_mask);
       sa.sa_flags = 0;
       sigaction(SIGTERM, &sa, nullptr);
       sigaction(SIGINT, &sa, nullptr);
   }

   // In event loop:
   while (!shutdown_requested.load()) {
       int n = epoll_wait(epfd, events, MAX_EVENTS, 1000);
       if (n == -1 && errno == EINTR) continue;  // signal interrupted
       // ... handle events ...
   }
   // Loop exits → start graceful shutdown
   ```

2. **Implement Phase 1: Stop intake**
   > 💡 *WHY: If you keep accepting connections during shutdown, you'll never drain — new work keeps arriving. The very first action is closing the listen socket and rejecting new pushes. Existing connections continue being served.*

   ```cpp
   void Server::stop_intake() {
       // Close listen socket — kernel resets new SYN packets
       epoll_ctl(epfd_, EPOLL_CTL_DEL, listen_fd_, nullptr);
       close(listen_fd_);
       listen_fd_ = -1;

       // Queue rejects new tasks
       task_queue_.stop_accepting();

       fprintf(stderr, "[SHUTDOWN] Phase 1: intake stopped, "
               "queue depth=%zu\n", task_queue_.size());
   }
   ```

3. **Implement Phase 2: Drain queue with timeout**
   > 💡 *WHY: Workers are still running — they'll keep dequeuing and processing. You just wait for the queue to empty. But if a task is stuck (infinite loop, deadlock), you can't wait forever. The drain timeout bounds the wait.*

   ```cpp
   constexpr auto DRAIN_TIMEOUT = std::chrono::seconds(30);

   bool Server::drain_queue() {
       auto deadline = std::chrono::steady_clock::now() + DRAIN_TIMEOUT;

       while (task_queue_.size() > 0) {
           if (std::chrono::steady_clock::now() >= deadline) {
               fprintf(stderr, "[SHUTDOWN] Drain timeout! "
                       "%zu tasks remaining\n", task_queue_.size());
               return false;  // timed out, some tasks lost
           }
           std::this_thread::sleep_for(std::chrono::milliseconds(100));
       }

       fprintf(stderr, "[SHUTDOWN] Phase 2: queue drained successfully\n");
       return true;  // all tasks completed
   }
   ```

4. **Implement Phase 3: Join all workers**
   > 💡 *WHY: After the queue is empty (or timed out), workers are either idle or finishing their last task. `shutdown()` unblocks any workers stuck in `pop()`, and `join()` waits for each thread to complete. If join hangs, you have a bug — a worker didn't exit.*

   ```cpp
   void Server::join_workers() {
       // Signal consumers: "no more work, exit your loop"
       task_queue_.shutdown();

       // Join every thread with a per-thread timeout
       for (size_t i = 0; i < workers_.size(); i++) {
           if (workers_[i].joinable()) {
               workers_[i].join();
               fprintf(stderr, "[SHUTDOWN] Worker %zu joined\n", i);
           }
       }
       fprintf(stderr, "[SHUTDOWN] Phase 3: all %zu workers joined\n",
               workers_.size());
   }

   // Worker thread main loop:
   void worker_main(BoundedQueue<Task>& queue) {
       while (auto task = queue.pop()) {
           // pop() returns nullopt after shutdown()
           execute_task(*task);
       }
       // Exits cleanly when pop() returns nullopt
   }
   ```

5. **Write the zero-loss verification test**
   > 💡 *WHY: The claim is "zero task loss for accepted work." Prove it: enqueue 1000 tasks, trigger shutdown mid-processing, verify all 1000 complete. This test catches drain bugs, race conditions, and premature thread termination.*

   ```cpp
   void zero_loss_test() {
       BoundedQueue<Task> queue(2048);
       std::atomic<int> completed{0};
       const int TOTAL_TASKS = 1000;

       // Start 4 workers
       std::vector<std::thread> workers;
       for (int i = 0; i < 4; i++) {
           workers.emplace_back([&] {
               while (auto task = queue.pop()) {
                   std::this_thread::sleep_for(
                       std::chrono::milliseconds(1));  // simulate work
                   completed++;
               }
           });
       }

       // Enqueue all tasks
       for (int i = 0; i < TOTAL_TASKS; i++) {
           while (queue.push(Task{i}) == PushResult::FULL)
               std::this_thread::yield();
       }

       // Trigger shutdown while tasks are still processing
       fprintf(stderr, "Triggering shutdown with ~%d tasks remaining\n",
               TOTAL_TASKS - completed.load());

       // Phase 2: wait for drain
       while (queue.size() > 0)
           std::this_thread::sleep_for(std::chrono::milliseconds(10));

       // Phase 3: shutdown and join
       queue.shutdown();
       for (auto& w : workers) w.join();

       fprintf(stderr, "Completed: %d / %d\n", completed.load(), TOTAL_TASKS);
       assert(completed.load() == TOTAL_TASKS);  // ZERO LOSS
   }
   ```

## Done when

- [ ] Signal handler sets atomic flag on SIGTERM/SIGINT — safe, minimal, no complex logic — *works with Docker/systemd/k8s*
- [ ] Phase 1 closes listen socket and rejects new pushes — *no new work enters the system*
- [ ] Phase 2 drains queue with bounded timeout (30s default) — *all accepted tasks complete or timeout fires*
- [ ] Phase 3 calls `queue.shutdown()` and `join()` on every worker — *no hanging threads, no leaked resources*
- [ ] Zero-loss test: 1000 enqueued tasks, shutdown mid-flight, all 1000 complete — *the guarantee proven, not assumed*

## Proof

Paste your shutdown sequence code, zero-loss test output, and drain log messages, or upload `week-5/day5-graceful-shutdown.md`.

**Quick self-test** (answer without looking at your notes):

1. Why must you close the listen socket before draining the queue? → **If you drain first, new connections keep arriving and enqueuing tasks — the queue never empties. Closing the listen socket ensures no new work enters the system, making the drain convergent.**
2. What happens if a worker thread never returns from `join()`? → **The shutdown hangs and eventually gets SIGKILL'd by the deployment system (Docker sends SIGKILL after 10s grace period). This means you have a bug: a worker is stuck in an infinite loop or deadlock. Fix the root cause.**
3. Why use an atomic flag in the signal handler instead of calling `graceful_shutdown()` directly? → **Signal handlers run in a restricted context — you can't call most functions (no malloc, no mutex lock, no I/O). Setting an atomic flag is signal-safe. The main event loop checks the flag and calls the full shutdown sequence from normal code.**
