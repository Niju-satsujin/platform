---
id: w20-l07
title: "Week 20 Quality Gate"
order: 7
duration_minutes: 20
xp: 100
kind: lesson
part: w20
proof:
  type: paste
  instructions: "Paste the output of your full test suite and the git tag command."
  regex_patterns:
    - "pass"
    - "v0\\.20"
---

## Concept

Quality gate for Week 20 — and the end of Part 5. You have completed the CivicTrust Capstone: document issuance, transparency anchoring, receipt generation, offline verification, and chaos testing. This is the most complete system you have built in the entire program.

Take stock of what you have accomplished in 20 weeks. You started with a simple logger in C++ and now you have a distributed, cryptographically-secured document issuance system with tamper-evident logging, offline verification, and proven resilience under failures. This is the kind of system that runs in production at companies working on digital identity, supply chain transparency, and government document verification.

## Task

Verify this 7-point checklist:
1. Crash-during-issuance test passes — no partial issuances survive
2. Partition test passes — all nodes converge after partition heals
3. Key compromise drill passes — revocation, rotation, and warning flags all work
4. Recovery runbook is written with procedures for all three failure modes
5. Month 5 demo script is written with 5 acts
6. Month 5 demo runs cleanly with captured output
7. All tests pass

Run the full test suite. Fix any failures. Tag your repo.

## Hints

- Run all tests: `cd build && ctest --output-on-failure`
- Tag with: `git tag v0.20-chaos`

## Verify

```bash
cd build && ctest --output-on-failure && git tag v0.20-chaos
```

All tests pass, tag created.

## Done When

All 7 checklist items pass, full test suite green, repo tagged `v0.20-chaos`. Part 5 complete.
