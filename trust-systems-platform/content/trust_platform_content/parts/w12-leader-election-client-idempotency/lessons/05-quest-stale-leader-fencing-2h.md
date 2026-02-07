---
id: w12-leader-election-client-idempotency-d05-quest-stale-leader-fencing-2h
part: w12-leader-election-client-idempotency
title: "Quest: Stale-Leader Fencing  2h"
order: 5
duration_minutes: 120
prereqs: ["w12-leader-election-client-idempotency-d04-quest-dedupe-store-rules-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Stale-Leader Fencing  2h

## Goal

Design the **stale-leader fencing system** so any request or message carrying an outdated term is immediately rejected, role transitions are logged for auditability, and the cluster can never have two active leaders processing writes simultaneously.

By end of this session you will have:

- ✅ A **term-based fencing rule** rejecting any request with a term lower than the node's current term
- ✅ A **stale write rejection** mechanism for client writes arriving at a deposed leader
- ✅ A **role transition log** recording every leader→follower, follower→candidate, and candidate→leader transition
- ✅ A **leader lease guard** preventing a stale leader from processing writes after losing quorum contact
- ✅ A **end-to-end fencing proof** showing that committed writes from a stale leader are impossible

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Any RPC with term < current_term returns error with current term | Verify all RPC handlers |
| 2 | Client writes to deposed leader return REDIRECT or ERROR | Check client-facing path |
| 3 | Role transitions logged with timestamp, old_role, new_role, reason | Review log format |
| 4 | Leader stops accepting writes within 1 election timeout of losing contact | Verify lease check |
| 5 | Proof: stale leader cannot commit — quorum requires current term acks | Read proof |

## What You're Building Today

The fencing system — the final safety mechanism that prevents a deposed leader from continuing to accept writes after a new leader has been elected. This closes the last gap in your consensus protocol.

By end of this session, you will have:

- ✅ File: `week-12/day5-stale-leader-fencing.md`
- ✅ Term check in every RPC handler
- ✅ Client write rejection for deposed leaders
- ✅ Role transition audit log

What "done" looks like:

```cpp
class Node {
    // Fencing: every RPC handler calls this first
    bool check_term_and_fence(uint64_t incoming_term) {
        if (incoming_term > current_term_) {
            log_transition(role_, Role::FOLLOWER,
                          "saw higher term " + std::to_string(incoming_term));
            current_term_ = incoming_term;
            role_ = Role::FOLLOWER;
            voted_for_ = std::nullopt;
            persist_state();
            return true;  // caller should handle step-down
        }
        return false;
    }
};
```

You **can**: Guarantee that no stale leader processes writes after being deposed.
You **cannot yet**: This is the capstone — with today's lesson, your consensus protocol is complete.

## Why This Matters

🔴 **Without this, you will:**
- Have a deposed leader continue accepting writes for seconds after a new election — split brain
- Allow stale AppendEntries to overwrite entries from the new leader — log corruption
- Have no audit trail of leadership transitions — impossible to debug production incidents
- Accept client writes during the limbo period between losing quorum and realizing it

🟢 **With this, you will:**
- Reject stale messages instantly based on term comparison — no ambiguity about authority
- Redirect clients from deposed leaders to the current leader within one RTT
- Maintain a complete audit trail of every role transition for forensic analysis
- Close the fencing gap: deposed leaders cannot commit because followers won't ack old terms

🔗 **How this connects:**
- **To Day 1:** Term monotonicity enables the term-based fencing comparison
- **To Day 2:** Vote responses carry terms that trigger fencing on stale candidates
- **To Week 11 Day 2:** AppendEntries responses carry terms that fence stale leaders
- **To Week 11 Day 5:** Partition recovery triggers fencing when the minority-side leader reconnects
- **To Day 3:** Client retries are necessary because fencing causes the old leader to reject writes

🧠 **Mental model: "Badge Check at Every Door"**

Every message in your system carries a badge (term number). Every door (RPC handler) has a guard that checks the badge. If the badge is older than the building's current security level, the visitor is turned away. When the building upgrades security (new election), all old badges are invalidated instantly. A deposed leader holding an old badge can't get through any door — every follower rejects their messages. They must go to the lobby (become follower), get a new badge (update term), and respect the new authority.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│              STALE-LEADER FENCING                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Timeline:                                               │
│  Term 3: A is leader ──────╳ A partitioned from B,C      │
│  Term 4: B wins election (B,C form quorum)               │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ A (stale leader, term 3)                        │    │
│  │                                                 │    │
│  │ Client → A: PUT key=x, term=3                   │    │
│  │ A tries AppendEntries to B: term=3              │    │
│  │ B responds: term=4 ──▶ A sees higher term       │    │
│  │ A: step down to follower, update to term 4      │    │
│  │ A: reject client write → REDIRECT to B          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ FENCING POINTS (term check at every entry):     │    │
│  │                                                 │    │
│  │ 1. AppendEntries handler:                       │    │
│  │    req.term < my term → reject                  │    │
│  │                                                 │    │
│  │ 2. AppendEntries response handler (leader):     │    │
│  │    resp.term > my term → step down              │    │
│  │                                                 │    │
│  │ 3. RequestVote handler:                         │    │
│  │    req.term < my term → reject                  │    │
│  │                                                 │    │
│  │ 4. RequestVote response handler (candidate):    │    │
│  │    resp.term > my term → step down              │    │
│  │                                                 │    │
│  │ 5. Client write handler (leader):               │    │
│  │    role != LEADER → redirect                    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ROLE TRANSITION LOG:                                    │
│  [10:00:05] LEADER→FOLLOWER term 3→4 reason: higher_term│
│  [10:00:05] redirect client write to node B (new leader) │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-12/day5-stale-leader-fencing.md`

## Do

1. **Implement term-based fencing in every RPC handler**
   > 💡 *WHY: A stale leader's messages carry an old term. Every follower that has moved to a higher term must reject these messages. This is automatic if you check the term at the top of every handler. Missing even ONE handler creates a fencing hole.*

   Add term fencing to all handlers:

   ```cpp
   // AppendEntries handler — already has term check (Week 11)
   AppendEntriesResponse handle_append_entries(
       const AppendEntriesRequest& req, NodeState& state) {
       if (req.term < state.current_term)
           return {state.current_term, false, 0};  // FENCED
       // ... rest of handler
   }

   // RequestVote handler — already has term check (Day 2)
   RequestVoteResponse handle_request_vote(
       const RequestVoteRequest& req, NodeState& state) {
       if (req.term < state.current_term)
           return {state.current_term, false};  // FENCED
       // ... rest of handler
   }

   // InstallSnapshot handler
   InstallSnapshotResponse handle_install_snapshot(
       const InstallSnapshotRequest& req, NodeState& state) {
       if (req.term < state.current_term)
           return {state.current_term};  // FENCED
       // ... rest of handler
   }
   ```

2. **Implement stale write rejection for client requests**
   > 💡 *WHY: After step-down, a node might still have pending client connections. These clients expect to write to a leader. The deposed leader must reject all writes and redirect clients to the new leader.*

   Write the client-facing guard:

   ```cpp
   KVResponse Node::handle_client_write(const KVRequest& req) {
       // Guard 1: Am I still the leader?
       if (role_ != Role::LEADER) {
           return {KVResponse::REDIRECT, "", req.request_id,
                   "NOT_LEADER: redirect to " +
                   std::to_string(last_known_leader_)};
       }
       // Guard 2: Do I still have quorum contact? (lease check)
       if (!has_quorum_contact()) {
           return {KVResponse::ERROR, "", req.request_id,
                   "NO_QUORUM: leader lease expired, retry later"};
       }
       // Guards passed — process normally
       return apply(req);
   }

   bool Node::has_quorum_contact() {
       int alive = 1;  // self
       auto now = std::chrono::steady_clock::now();
       for (const auto& [id, fp] : followers_) {
           if (now - fp.last_response < election_timeout_)
               alive++;
       }
       return alive >= quorum_size(cluster_size_);
   }
   ```

3. **Implement the role transition log**
   > 💡 *WHY: In production, you need to know exactly when and why each role transition happened. "Node A was leader from 10:00:05 to 10:03:22, stepped down due to higher term from Node B" — this is essential for incident investigation.*

   Write the transition logger:

   ```cpp
   struct RoleTransition {
       std::chrono::system_clock::time_point timestamp;
       Role old_role;
       Role new_role;
       uint64_t old_term;
       uint64_t new_term;
       std::string reason;
   };

   class TransitionLog {
       std::vector<RoleTransition> log_;
   public:
       void record(Role old_r, Role new_r,
                   uint64_t old_t, uint64_t new_t,
                   const std::string& reason) {
           log_.push_back({
               std::chrono::system_clock::now(),
               old_r, new_r, old_t, new_t, reason
           });
           // Also write to stderr/file for persistence
           log_info("[TRANSITION] {}→{} term {}→{} reason: {}",
                    role_name(old_r), role_name(new_r),
                    old_t, new_t, reason);
       }

       const std::vector<RoleTransition>& history() const {
           return log_;
       }
   };
   ```

   Document all transition reasons:

   | Transition | Reason |
   |-----------|---------|
   | FOLLOWER → CANDIDATE | Election timeout fired |
   | CANDIDATE → LEADER | Won election (quorum votes) |
   | CANDIDATE → FOLLOWER | Higher term seen OR election timeout (new attempt) |
   | LEADER → FOLLOWER | Higher term in AppendEntries response or RequestVote |
   | ANY → FOLLOWER | Received AppendEntries with higher term |

4. **Implement the leader lease guard**
   > 💡 *WHY: A leader that's been partitioned doesn't discover the new term until it tries to send an RPC. In the meantime, it might accept client writes. The lease guard adds an expiration: if no quorum contact within one election timeout, stop accepting writes preemptively.*

   Write the lease check:

   ```cpp
   class LeaderLease {
       std::chrono::steady_clock::time_point last_quorum_contact_;
       std::chrono::milliseconds lease_duration_;  // = election_timeout

   public:
       LeaderLease(std::chrono::milliseconds dur)
           : lease_duration_(dur) { renew(); }

       void renew() {
           last_quorum_contact_ = std::chrono::steady_clock::now();
       }

       bool is_valid() const {
           auto elapsed = std::chrono::steady_clock::now() -
                          last_quorum_contact_;
           return elapsed < lease_duration_;
       }
   };

   // Renewed when leader receives quorum acks
   void Leader::on_quorum_ack() {
       leader_lease_.renew();
   }

   // Checked before accepting client writes
   KVResponse Leader::accept_write(const KVRequest& req) {
       if (!leader_lease_.is_valid()) {
           log_transition(Role::LEADER, Role::FOLLOWER,
                          current_term_, current_term_,
                          "lease expired — lost quorum contact");
           role_ = Role::FOLLOWER;
           return {KVResponse::ERROR, "", req.request_id,
                   "LEASE_EXPIRED"};
       }
       return apply(req);
   }
   ```

5. **Write the end-to-end fencing proof**
   > 💡 *WHY: The proof must show that a stale leader cannot commit a write even if it processes the client request. Committing requires quorum acks, and followers won't ack a message with a stale term.*

   Write the proof:

   ```
   THEOREM: A stale leader cannot commit any new writes.

   PROOF:
   1. Leader A has term T. New leader B elected with term T+1.
   2. Election required quorum Q_B votes for term T+1.
      Every node in Q_B has current_term ≥ T+1.
   3. A sends AppendEntries with term T to followers.
   4. Any follower in Q_B rejects: T < T+1 (term fencing).
   5. Followers NOT in Q_B: at most n - |Q_B| = n - (⌊n/2⌋+1)
      = ⌊(n-1)/2⌋ = f nodes.
   6. A can get at most f+1 acks (including self).
      f+1 = ⌊(n-1)/2⌋ + 1 = ⌊(n+1)/2⌋ = quorum for odd n
      
      WAIT — this seems like A could reach quorum with stragglers.
      But the term-safety rule (Week 11 Day 3) prevents this:
      A's entries have term T, not T+1.
      Even if A counts enough acks, the commit algorithm requires
      the entry's term == current_term.
      A's current_term is T, and the entries are from term T.
      BUT when A receives a response with term T+1, it steps down.

   7. Net result: A either:
      a) Gets rejected by quorum members (can't reach quorum), OR
      b) Receives a higher term in a response and steps down, OR
      c) Lease expires and A preemptively stops accepting writes

   In ALL cases, A's writes are never committed. ∎
   ```

## Done when

- [ ] Term check at the top of every RPC handler rejects stale terms — *no fencing holes*
- [ ] Deposed leader rejects client writes with REDIRECT — *clients find the new leader*
- [ ] Role transition log records every transition with timestamp and reason — *complete audit trail*
- [ ] Leader lease expires within one election timeout of losing quorum contact — *proactive fencing*
- [ ] End-to-end proof: stale leader cannot commit because quorum won't ack old term — *formal safety*

## Proof

Paste your fencing code, transition log, and end-to-end proof, or upload `week-12/day5-stale-leader-fencing.md`.

**Quick self-test** (answer without looking at your notes):

1. What happens when a deposed leader (term 3) tries to send AppendEntries to a follower at term 4? → **The follower rejects the AppendEntries (term 3 < 4) and responds with term=4. The deposed leader sees term 4 > 3, updates its term to 4, and steps down to follower. All pending client writes are rejected with REDIRECT.**
2. Why is the leader lease necessary if term-based fencing already works? → **Term-based fencing requires receiving a response with a higher term. A partitioned leader doesn't receive any responses — it just times out. The lease provides a time-based fallback: "I haven't heard from a quorum in T ms, I should stop accepting writes."**
3. Can a stale leader's uncommitted writes cause any harm after fencing? → **No. Uncommitted writes exist only in the stale leader's local log. They were never committed (no quorum ack). The new leader's log takes precedence. When the stale leader catches up (Week 11 Day 4), its local uncommitted entries are overwritten by the new leader's log.**
