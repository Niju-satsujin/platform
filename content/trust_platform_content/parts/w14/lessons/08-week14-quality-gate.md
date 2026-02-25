---
id: w14-l08
title: "Week 14 quality gate"
order: 8
duration_minutes: 20
xp: 100
kind: lesson
part: w14
proof:
  type: paste
  instructions: "Paste your completed 7-point quality gate checklist with each item marked PASS, plus the git tag v0.14-merkle."
  regex_patterns:
    - "PASS"
    - "v0\\.14|merkle"
---
# Week 14 quality gate

## Concept

This is the Week 14 quality gate. It covers everything you built this week: Merkle tree construction, inclusion proofs, consistency proofs, verification of both proof types, fuzz testing, and benchmarks.

The 7-point checklist:

1. **Tree construction correct** — root hash is deterministic, changes when any leaf changes (Lesson 1)
2. **Inclusion proofs work** — proof is generated for any valid leaf index, size is O(log N) (Lesson 2)
3. **Consistency proofs work** — proof proves old tree is prefix of new tree, works for various sizes (Lesson 3)
4. **verify_inclusion works** — accepts valid proofs, rejects tampered proofs and wrong roots (Lesson 4)
5. **verify_consistency works** — accepts valid consistency proofs, rejects tampered ones, append sequence passes (Lesson 5)
6. **Fuzz test passes** — 1000 random test cases, all valid proofs pass, all invalid proofs fail (Lesson 6)
7. **Benchmark recorded** — construction, proof, and verification times for 100 to 100000 leaves (Lesson 7)

After all 7 pass:
```bash
git tag -a v0.14-merkle -m "Week 14: Merkle Trees complete"
```

This is a key building block for transparency. You now have a data structure that can prove membership and prove append-only consistency. Next week you will use these proofs in a real transparency log.

## Task

1. Run every check from the 7-point list above
2. Mark each item PASS or FAIL
3. Fix any failures — do not skip items
4. Run the fuzz test one more time to make sure nothing regressed
5. Confirm your benchmark numbers are reasonable (proof and verify times should be microseconds, not milliseconds)
6. Tag the repo with `v0.14-merkle`
7. Push the tag

## Hints

- Run each test program individually to verify it still passes
- `git tag -l "v0*"` should show all your tags so far
- Push all tags: `git push origin --tags`
- If a lesson 1-6 item fails, go back and fix it before tagging
- Common last-minute issues: tree construction test was hardcoded to 8 leaves and fails for other sizes; consistency proof fails for size 1 to size 2; verification uses wrong byte order for sibling hashes
- If your fuzz test was seeded with a fixed seed, run it once more with a different seed to increase confidence

## Verify

```bash
cd build && cmake .. && make && ./merkle_tree_test && ./merkle_proof_test && ./verify_inclusion_test && ./verify_consistency_test && ./merkle_fuzz_test
```

Expected: all tests pass.

```bash
git tag -l "v0*"
```

Expected: `v0.14-merkle` appears in the list.

```bash
git log --oneline -5
```

Expected: recent commits show Merkle tree implementation work.

## Done When

All 7 checklist items are PASS, `v0.14-merkle` tag exists, and Week 14 is complete.
