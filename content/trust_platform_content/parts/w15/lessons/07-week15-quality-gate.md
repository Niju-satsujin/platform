---
id: w15-l07
title: "Week 15 Quality Gate"
order: 7
duration_minutes: 20
xp: 100
kind: lesson
part: w15
proof:
  type: paste
  instructions: "Paste the output of your full test suite and the git tag command."
  regex_patterns:
    - "pass"
    - "v0\\.15"
---

## Concept

Quality gate time. This week you built a transparency log — an append-only log backed by a Merkle tree with signed checkpoints and an audit client. Before moving to Week 16, make sure everything works together and all the pieces from Weeks 13-15 integrate cleanly.

This is the halfway point of Part 4. You have content-addressed storage, Merkle trees, and a transparency log. Next week you will add monitors and run the Month 4 demo.

## Task

Verify this 7-point checklist:
1. Append-only log stores entries and returns indices
2. Merkle-backed root hash changes when entries are appended
3. Signed checkpoints contain correct root hash and valid signature
4. Checkpoint verification rejects tampered checkpoints
5. Audit client verifies signature and consistency across checkpoints
6. Audit client would detect a tampered log (test with intentional tampering)
7. Benchmark numbers recorded

Run your full test suite. Fix any failures. Tag your repo.

## Hints

- Run all tests: `cd build && ctest --output-on-failure`
- If any test fails, read the error message carefully — it usually tells you exactly which check failed
- For the tampering test: manually modify a log entry on disk, then run the audit client — it should detect the inconsistency
- Tag with: `git tag v0.15-transparency-log`

## Verify

```bash
cd build && ctest --output-on-failure && git tag v0.15-transparency-log
```

All tests pass, tag created.

## Done When

All 7 checklist items pass, full test suite green, repo tagged `v0.15-transparency-log`.
