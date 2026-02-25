---
id: w11-l02
title: "Vote rules"
order: 2
duration_minutes: 25
xp: 50
kind: lesson
part: w11
proof:
  type: paste
  instructions: "Paste log output showing a node receiving a RequestVote, checking the log, and granting or denying the vote."
  regex_patterns:
    - "RequestVote|vote"
    - "granted|denied|reject"
---
# Vote rules

## Concept

When a follower's election timeout fires, it becomes a candidate and asks the other nodes to vote for it. But nodes cannot just vote for anyone — there are rules. These rules prevent two bad outcomes: electing a leader that is missing committed data, and having two leaders in the same term.

**Rule 1: one vote per term.** Each node can vote for at most one candidate in a given term. If node 2 already voted for node 3 in term 5, and then node 4 also asks for a vote in term 5, node 2 must refuse. This is stored in a `voted_for` field that resets whenever the term changes. In C terms, think of it like a flag: once you set `voted_for = 3` in term 5, it stays locked until the term increments.

**Rule 2: candidate's log must be up-to-date.** A node only votes for a candidate whose log is at least as long and as recent as its own. Compare the last entry in the candidate's log (its term and LSN) with the last entry in the voter's log. If the candidate's last entry has a higher term, it is more up-to-date. If the terms are equal, the one with the higher LSN (longer log) wins. This rule prevents electing a leader that is behind — it guarantees the winner has all committed entries.

These two rules together mean that in any given term, at most one candidate can get a majority of votes. And that candidate will have the most up-to-date log. This is the foundation of safe leader election.

## Task

1. Define a `RequestVote` message with fields: `candidate_id`, `term`, `last_log_term`, `last_log_lsn`
2. Define a `VoteResponse` message with fields: `voter_id`, `term`, `vote_granted` (bool)
3. Add a `voted_for` field to your node state — initialize to -1 (meaning "nobody")
4. When your node receives a `RequestVote`:
   - If the candidate's term is less than your current term, deny the vote
   - If you already voted for someone else in this term, deny the vote
   - If the candidate's log is less up-to-date than yours, deny the vote
   - Otherwise, grant the vote and set `voted_for = candidate_id`
5. Log every vote decision: `"[node X] granted vote to Y in term Z"` or `"[node X] denied vote to Y in term Z (already voted for W)"`

## Hints

- For the log comparison: get your last log entry's term and LSN. Compare candidate's `last_log_term` vs yours first. If the candidate's term is higher, their log is more up-to-date. If equal, compare `last_log_lsn` — higher LSN means more entries
- If your log is empty (no entries), any candidate is at least as up-to-date as you
- When you receive a `RequestVote` with a term higher than yours, update your term first, then process the vote. Higher term always causes a term update
- Reset `voted_for` to -1 whenever your term changes
- Use the same message serialization you built for AppendEntries — add a message type byte at the start

## Verify

```bash
# Start node 2 and node 3 as followers
# Manually send a RequestVote from a test client to node 2
# Check node 2's log for "granted vote" or "denied vote"

# Example test sequence:
# 1. Send RequestVote{candidate=3, term=2, last_log_term=1, last_log_lsn=5} to node 2
# 2. Node 2 should grant (assuming it has not voted in term 2 and its log is not ahead)
# 3. Send another RequestVote{candidate=4, term=2, ...} to node 2
# 4. Node 2 should deny (already voted for 3 in term 2)
```

Expected: the vote grant/deny logic works correctly for both rules.

## Done When

Your node correctly handles RequestVote messages: grants votes when the candidate is qualified and the node has not voted yet in that term, denies votes otherwise. All decisions are logged.
