---
id: w12-leader-election-client-idempotency-d01-quest-election-timeouts-2h
part: w12-leader-election-client-idempotency
title: "Quest: Election Timeouts  2h"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Election Timeouts  2h

## Goal

Design the **election timeout system** for your replicated cluster so leader failures are detected within a bounded time, randomized timeouts prevent split votes, and heartbeat cadence keeps elections from triggering during normal operation.

By end of this session you will have:

- ✅ An **election timeout range** with randomized per-node values to prevent simultaneous elections
- ✅ A **heartbeat interval** that is significantly shorter than the election timeout
- ✅ A **term monotonicity rule** ensuring terms only increase, never decrease
- ✅ A **timeout reset policy** defining exactly which events reset the election timer
- ✅ A **candidate transition** specifying what a follower does when its election timeout fires

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Election timeout is randomized in range [T, 2T] per node | Check random generation |
| 2 | Heartbeat interval < T/2 (at most half the minimum election timeout) | Verify ratio |
| 3 | Terms are uint64, only increment, never decrement or wrap | Check term update logic |
| 4 | Timer resets on: AppendEntries from leader, granting vote | List reset events |
| 5 | On timeout: increment term, vote for self, send RequestVote | Check transition steps |

## What You're Building Today

The election timeout mechanism — the trigger that starts a new leader election when the current leader fails or becomes unreachable. This is the liveness mechanism of your consensus protocol.

By end of this session, you will have:

- ✅ File: `week-12/day1-election-timeouts.md`
- ✅ Randomized election timeout: 150-300ms (configurable)
- ✅ Heartbeat interval: 50ms (well below minimum timeout)
- ✅ Candidate transition procedure on timeout

What "done" looks like:

```cpp
class ElectionTimer {
    std::mt19937 rng_;
    std::uniform_int_distribution<int> timeout_dist_;
    std::chrono::steady_clock::time_point deadline_;

public:
    ElectionTimer(int min_ms, int max_ms)
        : rng_(std::random_device{}())
        , timeout_dist_(min_ms, max_ms)
    {
        reset();
    }

    void reset() {
        int ms = timeout_dist_(rng_);
        deadline_ = std::chrono::steady_clock::now() +
                    std::chrono::milliseconds(ms);
    }

    bool expired() const {
        return std::chrono::steady_clock::now() >= deadline_;
    }
};
```

You **can**: Detect leader failure and trigger an election with randomized timing.
You **cannot yet**: Implement vote rules (Day 2) or handle client retries (Day 3).

## Why This Matters

🔴 **Without this, you will:**
- Never detect a failed leader — the cluster stalls forever waiting for heartbeats that never come
- Have all followers timeout simultaneously and split the vote — no one wins, election repeats forever
- Allow terms to go backward, breaking the term monotonicity that all safety proofs depend on
- Trigger unnecessary elections during normal operation because heartbeats arrive too late

🟢 **With this, you will:**
- Detect leader failure within 300ms (maximum timeout) — bounded detection time
- Break split-vote ties naturally: different timeouts mean one candidate starts first and wins
- Maintain strict term monotonicity: terms only increase, making every term transition a clean cut
- Keep elections suppressed during normal operation via frequent heartbeats well within timeout

🔗 **How this connects:**
- **To Week 11 Day 2:** Heartbeats are empty AppendEntries that reset this timer
- **To Week 11 Day 5:** Partition causes leader heartbeats to stop, triggering election on majority side
- **To Day 2:** Vote rules determine which candidate wins the election triggered here
- **To Day 3:** Client retries happen during election transitions when there's briefly no leader
- **To Day 5:** Stale-leader fencing uses term comparison enabled by term monotonicity

🧠 **Mental model: "Random Alarm Clocks"**

Each follower has an alarm clock set to a random time between 150ms and 300ms. Every heartbeat from the leader resets all alarm clocks. If the leader dies, no resets happen, and the alarm clocks start ticking. The first alarm to ring triggers an election. Because each alarm is set to a different random time, they almost never ring at the same time — one candidate starts first, wins quickly, and starts sending heartbeats that reset everyone else's alarms. The randomness is the key insight: it turns a coordination problem into a probabilistic one with high success rate.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│              ELECTION TIMEOUT TIMELINE                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Time ──────────────────────────────────────────▶        │
│                                                          │
│  Leader:  ♥────♥────♥────♥────╳ (crashes)                │
│           50ms  50ms  50ms                               │
│                                                          │
│  Node B:  [────reset────][────reset────][─── 210ms ──▶  │
│           timeout=210ms   timeout=180ms   TIMEOUT!       │
│                                                          │
│  Node C:  [────reset────][────reset────][───── 270ms    │
│           timeout=270ms   timeout=250ms   (still waiting)│
│                                                          │
│  B times out FIRST (210ms < 270ms):                      │
│  ┌───────────────────────────────────────────┐           │
│  │ B: increment term                         │           │
│  │ B: vote for self                          │           │
│  │ B: send RequestVote to A(dead), C         │           │
│  │ C: receives RequestVote → grants vote     │           │
│  │ B: 2 votes (self + C) → wins! (quorum=2)│           │
│  │ B: send heartbeats → C resets timer      │           │
│  └───────────────────────────────────────────┘           │
│                                                          │
│  SPLIT VOTE (rare):                                      │
│  If B and C timeout at nearly the same time:             │
│  B votes for B, C votes for C → no winner               │
│  → new random timeouts → one wins next round             │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-12/day1-election-timeouts.md`

## Do

1. **Implement the randomized election timeout**
   > 💡 *WHY: If all nodes used the same timeout, they'd all start elections simultaneously — every time. Randomization in range [T, 2T] means the probability of two nodes choosing the same timeout is negligible. The first to timeout wins before others even start.*

   Write the timer:

   ```cpp
   constexpr int ELECTION_TIMEOUT_MIN_MS = 150;
   constexpr int ELECTION_TIMEOUT_MAX_MS = 300;
   constexpr int HEARTBEAT_INTERVAL_MS = 50;  // must be < min/3

   class ElectionTimer {
       std::mt19937 rng_;
       std::uniform_int_distribution<int> dist_;
       std::chrono::steady_clock::time_point deadline_;
   public:
       ElectionTimer()
           : rng_(std::random_device{}())
           , dist_(ELECTION_TIMEOUT_MIN_MS, ELECTION_TIMEOUT_MAX_MS)
       { reset(); }

       void reset() {
           deadline_ = std::chrono::steady_clock::now() +
                       std::chrono::milliseconds(dist_(rng_));
       }
       bool expired() const {
           return std::chrono::steady_clock::now() >= deadline_;
       }
       int remaining_ms() const {
           auto diff = deadline_ - std::chrono::steady_clock::now();
           return std::chrono::duration_cast<
               std::chrono::milliseconds>(diff).count();
       }
   };
   ```

2. **Define the heartbeat cadence and ratio**
   > 💡 *WHY: The heartbeat interval must be significantly less than the minimum election timeout. If heartbeats arrive every 50ms and the minimum timeout is 150ms, there's a 100ms margin for network delay. If the ratio is too tight, normal jitter triggers false elections.*

   Document the timing relationships:

   | Parameter | Value | Rationale |
   |-----------|-------|-----------|
   | Heartbeat interval | 50ms | ~3x faster than minimum timeout |
   | Election timeout min | 150ms | 3× heartbeat — room for 2 missed heartbeats |
   | Election timeout max | 300ms | 2× min — wide range reduces split-vote probability |
   | Max detection time | 300ms | Worst case: timeout fires at max value |
   | Expected detection | ~225ms | Average of [150, 300] |

   **Rule:** heartbeat_interval ≤ election_timeout_min / 3. This allows up to 2 lost heartbeats before timeout.

3. **Implement term monotonicity**
   > 💡 *WHY: The term is the logical clock of your consensus protocol. Every election increments it. Every message carries it. When a node sees a higher term, it updates. Terms NEVER decrease — this is what makes term comparison a valid authority check.*

   Write the term management:

   ```cpp
   class TermManager {
       uint64_t current_term_ = 0;
       std::optional<uint32_t> voted_for_;  // who we voted for in this term
   public:
       uint64_t term() const { return current_term_; }

       // Called when starting an election
       void increment_term() {
           current_term_++;
           voted_for_ = std::nullopt;  // new term, new vote
       }

       // Called when we see a higher term in any message
       bool update_term(uint64_t seen_term) {
           if (seen_term > current_term_) {
               current_term_ = seen_term;
               voted_for_ = std::nullopt;
               return true;  // term changed — caller should step down
           }
           return false;
       }

       // CRITICAL: Terms persisted to WAL for crash recovery
       void persist(WALWriter& wal) {
           // Term and voted_for must survive restart
           wal.write_metadata(current_term_, voted_for_);
       }
   };
   ```

4. **Define the timer reset policy**
   > 💡 *WHY: Resetting the timer at the wrong time causes either false elections (not resetting when you should) or missed elections (resetting when you shouldn't). The reset events must be precisely defined.*

   Document every reset event:

   ```
   TIMER RESET EVENTS (reset = restart countdown):
   ├── ✓ Receive valid AppendEntries from current leader
   │     (proves leader is alive)
   ├── ✓ Grant vote to a candidate
   │     (an election is in progress, don't compete)
   ├── ✓ Win an election (become leader)
   │     (leaders don't need election timers)
   
   TIMER NOT RESET BY:
   ├── ✗ Receive AppendEntries with lower term
   │     (stale leader, ignore)
   ├── ✗ Receive RequestVote (without granting)
   │     (candidate exists but we didn't vote for them)
   ├── ✗ Client requests
   │     (client activity ≠ leader liveness)
   └── ✗ Receiving messages from other followers
         (follower-to-follower is not leader proof)
   ```

5. **Implement the candidate transition**
   > 💡 *WHY: When the election timer fires, the follower transitions to candidate. This is a specific sequence of actions that must happen atomically: increment term, vote for self, send RequestVote to all others. Getting the order wrong causes split-brain or lost elections.*

   Write the transition:

   ```cpp
   void Node::on_election_timeout() {
       log_info("Election timeout fired — starting election");
       // Step 1: Transition to candidate
       role_ = Role::CANDIDATE;
       // Step 2: Increment term
       term_mgr_.increment_term();
       // Step 3: Vote for self
       term_mgr_.set_voted_for(my_id_);
       votes_received_ = {my_id_};  // self-vote
       // Step 4: Persist term + vote (must survive crash)
       term_mgr_.persist(wal_);
       // Step 5: Reset election timer (for re-election if this fails)
       election_timer_.reset();
       // Step 6: Send RequestVote to all other nodes
       for (uint32_t peer : peer_ids_) {
           RequestVoteRequest req;
           req.term = term_mgr_.term();
           req.candidate_id = my_id_;
           req.last_log_index = log_.size();
           req.last_log_term = log_.empty() ? 0 : log_.back().term;
           send_rpc(peer, req);
       }
   }
   ```

## Done when

- [ ] Election timeout randomized in [150ms, 300ms] per node — *split-vote probability minimized*
- [ ] Heartbeat at 50ms, ratio ≤ 1:3 with minimum timeout — *2 missed heartbeats before false alarm*
- [ ] Term only increments, never decrements, persisted to WAL — *authority comparison always valid*
- [ ] Timer resets on valid AppendEntries and granted votes only — *precise reset policy*
- [ ] Candidate transition: increment term → self-vote → persist → RequestVote to all — *correct election start*

## Proof

Paste your election timer, term management, and candidate transition code, or upload `week-12/day1-election-timeouts.md`.

**Quick self-test** (answer without looking at your notes):

1. Why randomize in [T, 2T] instead of using a fixed timeout for all nodes? → **Fixed timeouts cause all nodes to start elections simultaneously, splitting the vote every time. Randomization ensures one node starts first, wins, and sends heartbeats before others time out.**
2. Why must term and voted_for be persisted to disk before sending RequestVote? → **If the node crashes after sending RequestVote but before persisting, it might vote differently after restart — potentially voting for two different candidates in the same term, breaking the one-vote-per-term rule.**
3. What happens if the heartbeat interval is only slightly less than the election timeout? → **Normal network jitter (5-20ms) would cause heartbeats to arrive after the timeout occasionally, triggering false elections during normal operation. The 3x ratio provides sufficient margin.**
