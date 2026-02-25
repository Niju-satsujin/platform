---
id: w12-l09
title: "Week 12 quality gate"
order: 9
duration_minutes: 20
xp: 100
kind: lesson
part: w12
proof:
  type: paste
  instructions: "Paste your completed 8-point quality gate checklist with each item marked PASS, plus the git tag output for v0.12-cluster-demo."
  regex_patterns:
    - "PASS"
    - "v0\\.12|cluster.demo"
---
# Week 12 quality gate

## Concept

Same drill as every week — pass every checkpoint before moving on. This week the checklist covers the full Month 3 demo. Each item corresponds to a lesson from this week. If you did the lessons, the checklist should be straightforward. If any item fails, go back to the relevant lesson and fix it.

This quality gate is the most important one in Month 3. It proves that your entire distributed system works end-to-end. A KV store that cannot survive leader failure is not useful. An election that does not produce a working leader is not useful. Data that differs between nodes is not useful. Every item on this checklist must pass.

The 8-point checklist for Week 12:

1. **Demo plan written** — you have a numbered script with commands and expected output
2. **Writes to leader work** — 50 keys written to the original leader, verified on all nodes
3. **Leader kill triggers detection** — followers detect the leader is gone (timeout or connection error)
4. **New leader elected** — election completes, one node becomes the new leader
5. **Writes to new leader work** — 50 more keys written, replicated to the surviving follower
6. **All data verified on all nodes** — 100 keys on every node, including the restarted old leader
7. **State hashes match at every step** — hash computed on each node is identical after each synchronization point
8. **Month 3 report written** — one-page summary with architecture, benchmark numbers, and next steps

After passing all 8, tag your repo:

```bash
git tag -a v0.12-cluster-demo -m "Week 12: Month 3 demo — full cluster"
```

## Task

1. Run through the 8-point checklist above
2. For each item, write PASS or FAIL
3. If any item is FAIL, go back to the relevant lesson and fix it
4. When all 8 are PASS, create the git tag `v0.12-cluster-demo`
5. Push the tag to your remote repository
6. Verify the tag exists with `git tag -l "v0.*"`

## Hints

- If you have been doing the lessons all week, most items should already be PASS
- For item 6 (all data verified), make sure you restarted the old leader and it caught up — this is the step most people forget
- For item 7 (state hashes), you need hashes from at least 2 checkpoints (after initial writes and after catch-up)
- Keep your demo log files — they are the evidence that each item passes
- `git tag -a v0.12-cluster-demo -m "Week 12: Month 3 demo — full cluster"`
- `git push origin v0.12-cluster-demo`

## Verify

```bash
# Verify the checklist is complete
echo "1. Demo plan written: PASS"
echo "2. Writes to leader work: PASS"
echo "3. Leader kill triggers detection: PASS"
echo "4. New leader elected: PASS"
echo "5. Writes to new leader work: PASS"
echo "6. All data verified on all nodes: PASS"
echo "7. State hashes match at every step: PASS"
echo "8. Month 3 report written: PASS"

# Verify the git tag
git tag -l "v0.*"
# Expected: v0.12-cluster-demo should appear in the list

# Verify all previous tags exist too
git tag -l "v0.*" | wc -l
# Expected: at least 12 (one per week)
```

## Done When

All 8 checklist items are PASS. The git tag `v0.12-cluster-demo` exists. You have completed Month 3 — your replicated KV store survives leader failure, elects a new leader automatically, and all nodes converge to identical state. You are ready for Month 4.
