---
id: w11-l09
title: "Week 11 quality gate"
order: 9
duration_minutes: 20
xp: 100
kind: lesson
part: w11
proof:
  type: paste
  instructions: "Paste your completed 8-point checklist with each item marked PASS, plus the git tag output for v0.11-election."
  regex_patterns:
    - "PASS"
    - "v0\\.11|election"
---
# Week 11 quality gate

## Concept

Same process as previous weeks. Go through every checkpoint, fix anything that is broken, and tag your repo when everything passes.

The 8-point checklist for Week 11:

1. **Election timeout triggers** — when the leader stops sending heartbeats, a follower detects it within the randomized timeout (150-300ms) and logs the event
2. **Vote rules are correct** — nodes vote at most once per term, only for candidates with up-to-date logs, and reject votes for lower terms
3. **Automatic election works** — killing the leader causes a new leader to be elected within 1 second, with no manual intervention
4. **Idempotent writes work** — sending the same (client_id, seq_num) twice returns the cached result without applying the write again
5. **Stale leader steps down** — a node with an outdated term becomes follower when it sees a higher term in any message
6. **Raft paper read** — you have written a list of 3+ features Raft has that your implementation lacks
7. **Election test passes** — the automated election test (lesson 7) runs and prints PASS
8. **Benchmark recorded** — election time and write latency numbers are recorded

After all 8 items pass, tag your repo:
```bash
git tag -a v0.11-election -m "Week 11: leader election + client safety"
```

## Task

1. Run each check from the list above
2. For each item, write PASS or FAIL
3. Fix any FAIL items before proceeding
4. When all 8 are PASS, create the git tag
5. Double-check: start a 3-node cluster, kill the leader, verify the new leader accepts writes, read from a follower — the full cycle should work smoothly

## Hints

- For check 1: start a follower without a leader and verify the timeout fires. Check the log for the timeout message
- For check 2: send a RequestVote with a lower term — it should be rejected. Send two RequestVotes in the same term — the second should be rejected
- For check 3: the election test from lesson 7 covers this, but also test manually to be sure
- For check 4: use the `--client-id` and `--seq` flags to send duplicate requests
- For check 5: restart a killed leader and verify it steps down when it hears from the new leader
- For check 6: check your `election_notes.txt` or wherever you wrote the Raft comparison
- `git tag -a v0.11-election -m "Week 11: leader election complete"`
- `git push origin v0.11-election`

## Verify

```bash
# Build with zero warnings
cmake --build build 2>&1 | grep -ci warning

# Run the election test
./build/election_test

# Check the git tag
git tag -l "v0.*"

# Full manual check
./build/kvstore --id 1 --port 9001 --peers 9002,9003 &
./build/kvstore --id 2 --port 9002 --peers 9001,9003 &
./build/kvstore --id 3 --port 9003 --peers 9001,9002 &
sleep 2
./build/kv_client --port 9001 put testkey testvalue
kill $(pgrep -f "kvstore --id 1")
sleep 1
# find new leader and write to it
```

Expected: zero warnings, election test PASS, tag exists, manual failover works.

## Done When

All 8 checklist items are PASS, the git tag `v0.11-election` exists, and you are ready for Week 12.
