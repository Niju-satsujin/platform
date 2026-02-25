---
id: w24-l05
title: "Final Demo Run"
order: 5
duration_minutes: 25
xp: 75
kind: lesson
part: w24
proof:
  type: paste
  instructions: "Paste the full output of your final CivicTrust demo."
  regex_patterns:
    - "CivicTrust|demo|final"
    - "verified|pass|complete"
---

## Concept

This is the final demo. Everything you have built over 24 weeks, running together one last time. Make it count.

The final demo is not just a test — it is a celebration of what you have accomplished. You started with `printf("hello")` in C and built a distributed, cryptographically-secured document issuance system with tamper-evident transparency logging, Merkle proofs, replicated storage, offline verification, chaos-tested resilience, observability, and professional documentation.

## Task

1. Start the full CivicTrust cluster (3 nodes)
2. Issue 10 documents with different types and subjects
3. Verify all 10 documents — all should pass
4. Generate receipts for all 10 documents
5. Kill the leader, observe election, write to new leader
6. Verify all documents still accessible after failover
7. Create a verification bundle for document #1
8. Verify the bundle offline (simulated air gap)
9. Print the SLO dashboard — all metrics should be green
10. Print the final state hashes — all nodes should match
11. Tag the repo: `git tag v1.0-civictrust`

Capture the full output and save as `docs/final-demo-output.txt`.

## Hints

- Use your demo script from Week 23 as the guide
- If any step fails, fix it before continuing — the final demo should be clean
- Add clear section headers between steps for readability
- The state hash check at the end is the ultimate proof that everything is consistent
- This is your last commit — make it a good one

## Verify

```bash
cat docs/final-demo-output.txt | tail -20
```

Final demo output shows all steps completed successfully.

## Done When

The final demo runs cleanly from start to finish, all checks pass, and the output is saved.
