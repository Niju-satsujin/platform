---
id: w24-l02
title: "Debugging Drills"
order: 2
duration_minutes: 30
xp: 75
kind: lesson
part: w24
proof:
  type: paste
  instructions: "Paste the output showing you completed at least 3 debugging drills with the root cause identified for each."
  regex_patterns:
    - "root cause|bug|fixed"
---

## Concept

Many technical interviews include a debugging exercise: "Here is a system that is broken. Find and fix the bug." The key skill is systematic debugging — not guessing randomly, but narrowing down the problem step by step.

These drills simulate realistic bugs in CivicTrust. Each drill gives you a broken scenario and a time limit. Your job is to identify the root cause, not just the symptom. "The test fails" is a symptom. "The follower catch-up sends records in the wrong order because the LSN comparison uses signed comparison on an unsigned type" is a root cause.

## Task

Complete these 5 debugging drills (15 minutes each):

1. **Replication data loss**: Start 3 nodes, write 100 keys, kill the leader, elect a new leader, write 50 more keys. One follower is missing 3 keys. Find why. (Hint: check the quorum logic — is it counting ACKs correctly?)

2. **Slow verification**: Verification takes 500ms for a single document. It should take 1ms. Find the bottleneck. (Hint: is the inclusion proof being generated fresh every time instead of cached?)

3. **Receipt fails on valid document**: A receipt that was generated correctly now fails verification. Nothing was tampered with. Find why. (Hint: did the log append more entries after the receipt was generated, changing the root hash?)

4. **Election storm**: Nodes keep electing new leaders every few seconds, never stabilizing. Find why. (Hint: is the election timeout being reset correctly on heartbeat?)

5. **Memory growth**: The server's memory usage grows continuously, even with a steady workload. Find the leak. (Hint: is the nonce tracking set growing without bound? Old nonces should expire.)

For each drill: describe the symptom, the debugging steps you took, and the root cause.

## Hints

- For each drill, start by reproducing the problem, then add logging to narrow down where it fails
- Use binary search: is the problem in the sender or the receiver? Is it in the data or the metadata?
- Check edge cases: off-by-one errors, integer overflow, signed vs unsigned comparison
- Time yourself — in an interview, you will have 15-20 minutes per problem
- Write down your debugging process — interviewers care about HOW you debug, not just the answer

## Verify

```bash
cat docs/debugging-drills.txt | head -30
```

At least 3 drills completed with root causes identified.

## Done When

You have completed at least 3 debugging drills with documented symptoms, debugging steps, and root causes.
