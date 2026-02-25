---
id: w24-l04
title: "Mock Interview"
order: 4
duration_minutes: 30
xp: 75
kind: lesson
part: w24
proof:
  type: paste
  instructions: "Paste your mock interview self-assessment with scores for each category."
  regex_patterns:
    - "mock|interview"
    - "score|rating|assessment"
---

## Concept

The mock interview simulates a real technical interview focused on your CivicTrust project. You play both roles: interviewer and candidate. Write the questions, then answer them as if you were in a real interview. Rate yourself honestly.

The interview has three parts: (1) project walkthrough (5 minutes — use your demo), (2) deep dive (10 minutes — the interviewer asks hard questions about your design decisions), (3) system design extension (5 minutes — "How would you add feature X?").

## Task

Run a self-guided mock interview:

**Part 1 — Project Walkthrough (5 min):**
Run your 5-minute demo. Rate yourself: was the demo smooth? Did you stay under time?

**Part 2 — Deep Dive (10 min):**
Answer these questions (write your answers):
1. "Why did you choose Ed25519 over RSA for signatures?"
2. "What happens if two nodes both think they are the leader?"
3. "How many documents can your system handle per second? What is the bottleneck?"
4. "If the transparency log grows to 1 billion entries, what breaks first?"
5. "Walk me through what happens when I call verify() on a document."

**Part 3 — System Design Extension (5 min):**
"Your company wants to add multi-tenant support — different organizations share the same CivicTrust cluster but cannot see each other's documents. How would you design this?"

Write a self-assessment with scores (1-5) for: technical depth, communication clarity, time management, handling unknowns.

## Hints

- For "Why Ed25519?": smaller keys (32 bytes vs 256+), faster than RSA, deterministic signatures, well-supported by libsodium
- For "Two leaders": term numbers prevent this — the higher-term leader wins, the stale one steps down
- For "1 billion entries": the Merkle tree is O(log N) so proofs are still small, but disk I/O and tree construction become bottlenecks
- For multi-tenant: namespace each organization's data (separate logs, separate CAS directories), add authentication to the TCP protocol
- Be honest in your self-assessment — knowing your weaknesses helps you improve

## Verify

```bash
cat docs/mock-interview.txt
```

Mock interview completed with answers and self-assessment.

## Done When

You have completed the mock interview, written answers to all questions, and rated yourself honestly.
