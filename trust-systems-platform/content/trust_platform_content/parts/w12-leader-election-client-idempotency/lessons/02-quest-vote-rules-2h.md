---
id: w12-leader-election-client-idempotency-d02-quest-vote-rules-2h
part: w12-leader-election-client-idempotency
title: "Quest: Vote Rules  2h"
order: 2
duration_minutes: 120
prereqs: ["w12-leader-election-client-idempotency-d01-quest-election-timeouts-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Vote Rules  2h

## Goal

Design the **vote rules** for leader election so each node grants at most one vote per term, candidates with stale logs are rejected, and any node seeing a newer term immediately updates its own — guaranteeing that at most one leader exists per term.

By end of this session you will have:

- ✅ A **one-vote-per-term rule** preventing a node from voting for two different candidates in the same term
- ✅ A **log up-to-date check** rejecting candidates whose log is less complete than the voter's
- ✅ A **term update rule** requiring nodes to adopt the highest term they see
- ✅ A **RequestVote RPC** specification with request and response structs
- ✅ A **vote grant proof** showing that at most one candidate can win per term

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | voted_for is persisted and allows at most 1 vote per term | Check persistence + guard |
| 2 | Log comparison: reject if candidate's last log term < voter's, or same term but shorter log | Verify comparison logic |
| 3 | Receiving higher term → update term, clear voted_for, step down | Check term update path |
| 4 | RequestVote has term, candidate_id, last_log_index, last_log_term | Review struct |
| 5 | Proof: two candidates can't both get majority in same term | Write quorum argument |

## What You're Building Today

The vote handling logic — the rules that determine whether a node grants its vote to a candidate requesting election. These rules guarantee that at most one leader can exist per term.

By end of this session, you will have:

- ✅ File: `week-12/day2-vote-rules.md`
- ✅ RequestVote RPC with log comparison
- ✅ One-vote-per-term enforcement with persistence
- ✅ Safety proof for single-leader-per-term

What "done" looks like:

```cpp
struct RequestVoteRequest {
    uint64_t term;             // candidate's term
    uint32_t candidate_id;     // who is asking
    uint64_t last_log_index;   // candidate's last log entry index
    uint64_t last_log_term;    // term of candidate's last log entry
};

struct RequestVoteResponse {
    uint64_t term;             // voter's current term
    bool vote_granted;         // did the voter say yes?
};

RequestVoteResponse handle_request_vote(
    const RequestVoteRequest& req, NodeState& state);
```

You **can**: Correctly evaluate vote requests and guarantee single-leader-per-term.
You **cannot yet**: Handle client retries (Day 3) — today is the election mechanism itself.

## Why This Matters

🔴 **Without this, you will:**
- Allow a node to vote for two candidates in the same term — two leaders, split brain
- Elect a candidate with a stale log — committed entries might be lost
- Ignore higher terms and continue voting for an outdated candidate — stale state
- Have no proof that your election is safe — "it seems to work" isn't engineering

🟢 **With this, you will:**
- Guarantee at most one leader per term — the foundation of consensus safety
- Ensure the elected leader has all committed entries — the log up-to-date check
- Automatically converge on the latest term across the cluster
- Provide a formal proof that safety holds even under concurrent elections

🔗 **How this connects:**
- **To Day 1:** Election timeouts trigger the RequestVote that this handler processes
- **To Week 11 Day 3:** The log up-to-date check ensures the winner has all committed entries
- **To Week 11 Day 2:** The winner starts sending AppendEntries after winning
- **To Day 3:** Clients retry during the brief leadership gap between elections
- **To Day 5:** Term comparison in vote rules is the same mechanism used for stale-leader fencing

🧠 **Mental model: "Secret Ballot with Rules"**

Each term is an election cycle with strict rules. Every voter (node) gets exactly one ballot per cycle (one vote per term). Before casting, the voter checks: "Is this candidate at least as informed as I am?" (log comparison). If yes, grant the vote. If no — even if this is the only candidate — reject. Since there are n ballots and a winner needs ⌊n/2⌋+1, and each voter casts at most 1, at most one candidate can collect a majority. The ballots are sealed (persisted) so even if the voter crashes and restarts, they can't vote again.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│               VOTE DECISION FLOWCHART                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  RequestVote received from candidate C, term T           │
│      │                                                   │
│      ▼                                                   │
│  ┌──────────────────────────────┐                       │
│  │ Is T < my current term?      │── YES ──▶ REJECT      │
│  └──────────────┬───────────────┘          (stale term) │
│                 │ NO                                     │
│                 ▼                                        │
│  ┌──────────────────────────────┐                       │
│  │ Is T > my current term?      │── YES ──▶ Update term │
│  │                              │          clear vote    │
│  └──────────────┬───────────────┘          continue ↓   │
│                 │ NO (T == my term)                      │
│                 ▼                                        │
│  ┌──────────────────────────────┐                       │
│  │ Already voted for someone    │── YES ──▶ REJECT      │
│  │ else in term T?              │   (unless voted for C) │
│  └──────────────┬───────────────┘                       │
│                 │ NO (haven't voted or voted for C)      │
│                 ▼                                        │
│  ┌──────────────────────────────┐                       │
│  │ Is C's log at least as       │── NO  ──▶ REJECT      │
│  │ up-to-date as mine?          │          (stale log)  │
│  └──────────────┬───────────────┘                       │
│                 │ YES                                    │
│                 ▼                                        │
│  ┌──────────────────────────────┐                       │
│  │ GRANT VOTE                    │                       │
│  │ Set voted_for = C             │                       │
│  │ Persist to disk               │                       │
│  │ Reset election timer          │                       │
│  └──────────────────────────────┘                       │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-12/day2-vote-rules.md`

## Do

1. **Implement the one-vote-per-term rule**
   > 💡 *WHY: If a node votes for candidate A and then votes for candidate B in the same term, both might claim enough votes to win. Two leaders in one term = split brain = data loss. One vote per term, persisted to disk, prevents this.*

   Write the vote guard:

   ```cpp
   bool can_vote_for(uint32_t candidate_id, const NodeState& state) {
       if (!state.voted_for.has_value())
           return true;  // haven't voted in this term
       return state.voted_for.value() == candidate_id;
       // Already voted for this candidate (idempotent re-grant)
   }
   ```

   **Rule:** `voted_for` is persisted to WAL alongside `current_term`. Both must survive crash-restart. A node that crashes after voting and restarts must remember who it voted for.

2. **Implement the log up-to-date comparison**
   > 💡 *WHY: The log comparison ensures the winner has all committed entries. A candidate with last log term 3 and index 10 is "more up-to-date" than one with last log term 2 and index 100 — terms trump length. This guarantees no committed entries are lost when a new leader takes over.*

   Write the comparison:

   ```cpp
   bool is_candidate_log_up_to_date(
       uint64_t candidate_last_term, uint64_t candidate_last_index,
       uint64_t my_last_term, uint64_t my_last_index)
   {
       // Rule 1: Higher last term wins
       if (candidate_last_term != my_last_term)
           return candidate_last_term > my_last_term;
       // Rule 2: Same term — longer log wins
       return candidate_last_index >= my_last_index;
   }
   ```

   **Key insight:** Term comparison takes priority over index comparison. A log ending at term 5 index 3 is more up-to-date than a log ending at term 4 index 100.

3. **Implement the full RequestVote handler**
   > 💡 *WHY: This handler combines all vote rules into a single decision procedure. The order of checks matters: term update first, then vote eligibility, then log comparison. Getting the order wrong causes subtle bugs.*

   Write the handler:

   ```cpp
   RequestVoteResponse handle_request_vote(
       const RequestVoteRequest& req, NodeState& state)
   {
       RequestVoteResponse resp;
       resp.term = state.current_term;
       resp.vote_granted = false;
       // Rule 1: Reject if candidate's term < ours
       if (req.term < state.current_term)
           return resp;
       // Rule 2: Update term if candidate has higher term
       if (req.term > state.current_term) {
           state.current_term = req.term;
           state.voted_for = std::nullopt;
           state.role = Role::FOLLOWER;
           resp.term = state.current_term;
       }
       // Rule 3: Check if we can vote for this candidate
       if (!can_vote_for(req.candidate_id, state))
           return resp;
       // Rule 4: Check if candidate's log is up-to-date
       uint64_t my_last_term = state.log.empty() ? 0 : state.log.back().term;
       uint64_t my_last_index = state.log.size();
       if (!is_candidate_log_up_to_date(
               req.last_log_term, req.last_log_index,
               my_last_term, my_last_index))
           return resp;
       // All checks pass — grant vote
       state.voted_for = req.candidate_id;
       state.persist_vote(state.current_term, req.candidate_id);
       state.election_timer.reset();  // reset timer on vote grant
       resp.vote_granted = true;
       return resp;
   }
   ```

4. **Implement the candidate's vote collection**
   > 💡 *WHY: The candidate must track votes received and declare victory as soon as it reaches quorum. It must also handle higher terms in responses — if any voter has a higher term, the candidate steps down immediately.*

   Write the collection logic:

   ```cpp
   void Candidate::handle_vote_response(
       uint32_t voter_id, const RequestVoteResponse& resp)
   {
       // Check for higher term — step down
       if (resp.term > current_term_) {
           current_term_ = resp.term;
           role_ = Role::FOLLOWER;
           voted_for_ = std::nullopt;
           return;
       }
       if (role_ != Role::CANDIDATE) return;  // already won or stepped down
       if (resp.vote_granted) {
           votes_received_.insert(voter_id);
           if (votes_received_.size() >= quorum_size(cluster_size_)) {
               // WE WON — transition to leader
               become_leader();
           }
       }
   }

   void Candidate::become_leader() {
       role_ = Role::LEADER;
       log_info("Won election for term {}", current_term_);
       // Initialize follower progress tracking (Week 11 Day 3)
       init_follower_progress();
       // Send immediate heartbeat to assert authority
       send_heartbeats();
   }
   ```

5. **Prove single-leader-per-term safety**
   > 💡 *WHY: This is the fundamental safety property. If two leaders exist in the same term, committed entries can conflict. The proof must show this is impossible given the vote rules.*

   Write the proof:

   ```
   THEOREM: At most one leader can be elected per term.

   PROOF:
   1. To win term T, a candidate needs votes from quorum Q
      (where |Q| = ⌊n/2⌋ + 1)
   2. Each node votes at most once per term (one-vote-per-term rule)
   3. Suppose candidates A and B both win term T:
      A received votes from set Q_A where |Q_A| ≥ ⌊n/2⌋ + 1
      B received votes from set Q_B where |Q_B| ≥ ⌊n/2⌋ + 1
   4. Q_A ∪ Q_B ≤ n, but |Q_A| + |Q_B| ≥ 2(⌊n/2⌋ + 1) > n
      Therefore Q_A ∩ Q_B ≠ ∅ (they overlap)
   5. A node in Q_A ∩ Q_B voted for BOTH A and B in term T
      This contradicts the one-vote-per-term rule (Step 2)
   6. CONTRADICTION: Our assumption that both won is impossible.

   Therefore at most one leader per term. ∎
   ```

## Done when

- [ ] One-vote-per-term: voted_for persisted, allows only one vote per term — *the safety foundation*
- [ ] Log comparison rejects candidates with stale logs (term first, then index) — *elected leader has all committed entries*
- [ ] RequestVote handler checks term, vote eligibility, and log freshness in order — *complete vote decision*
- [ ] Candidate collects votes, wins on quorum, steps down on higher term — *correct election completion*
- [ ] Single-leader-per-term proof via quorum overlap argument — *formal safety guarantee*

## Proof

Paste your RequestVote handler, log comparison function, and safety proof, or upload `week-12/day2-vote-rules.md`.

**Quick self-test** (answer without looking at your notes):

1. A candidate has last_log_term=3, last_log_index=5. Your last_log_term=4, last_log_index=2. Do you grant the vote? → **No. Your last term (4) is higher than the candidate's (3). Despite having a shorter log, your log is more up-to-date because term comparison takes priority.**
2. Why must voted_for be persisted to disk, not just kept in memory? → **If a node votes for A, crashes, and restarts with voted_for=null, it might vote for B in the same term. Both A and B could then claim quorum — two leaders in one term.**
3. What does a candidate do if it receives a VoteResponse with a higher term? → **It immediately updates its term, clears voted_for, and steps down to follower. A higher term means someone started a newer election — this candidate's election is obsolete.**
