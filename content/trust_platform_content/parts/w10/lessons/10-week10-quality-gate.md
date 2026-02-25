---
id: w10-l10
title: "Week 10 quality gate"
order: 10
duration_minutes: 20
xp: 100
kind: lesson
part: w10
proof:
  type: paste
  instructions: "Paste your completed quality gate checklist with each item marked PASS, plus the git tag output."
  regex_patterns:
    - "PASS"
    - "v0\\.10|v0\\.10-replication"
---
# Week 10 quality gate

## Concept

Same drill as previous weeks — pass every checkpoint before moving on. This week is a big one. You went from a single-node KV store to a replicated 3-node cluster. That is a major step up in complexity. The quality gate makes sure every piece works.

The 8-point checklist for Week 10:

1. **Cluster starts** — 3 instances launch on ports 9001-9003, each with its own data directory
2. **Roles assigned** — leader accepts writes, followers reject writes with a clear error
3. **AppendEntries works** — a write to the leader appears on followers within seconds
4. **Quorum commit works** — writes succeed with 2/3 nodes up, fail with only 1/3
5. **Follower catch-up works** — a late-starting follower gets all missed records
6. **Partition recovery works** — disconnect a follower, write data, reconnect, follower catches up
7. **State hashes match** — after replication, all 3 nodes produce the same state hash
8. **Replication test passes** — 100 keys written to leader, verified on both followers

After passing all 8, tag your repo:
```bash
git tag -a v0.10-replication -m "Week 10: Replication complete"
```

## Task

1. Run each check from the list above
2. For each item, write PASS or FAIL
3. Fix any FAIL items before continuing
4. When all 8 are PASS, create the git tag
5. Push the tag to your remote repository

## Hints

- For check 4 (quorum): stop one follower, write a key, verify it succeeds. Stop the second follower, write another key, verify it fails or times out
- For check 5 (catch-up): delete a follower's data directory, restart it, verify it gets all data from the leader
- For check 6 (partition): Ctrl+C a follower, write keys, restart the follower, read the keys from it
- For check 7 (state hash): use the bash comparison script from lesson 07
- For check 8 (replication test): run `./build/replication_test --leader=9001 --followers=9002,9003`
- `git tag -a v0.10-replication -m "Week 10 complete"`
- `git push origin v0.10-replication`

## Verify

```bash
# Run the full replication test
./build/replication_test --leader=9001 --followers=9002,9003

# Check state hashes
./build/kv_client --port 9001 state_hash
./build/kv_client --port 9002 state_hash
./build/kv_client --port 9003 state_hash

# Verify the tag
git tag -l "v0.10*"

# Check build
cmake --build build 2>&1 | grep -ci warning
```

Expected: replication test passes, all hashes match, tag exists, zero warnings.

## Done When

All 8 checklist items are PASS, the `v0.10-replication` git tag exists, and you are ready for Week 11.
