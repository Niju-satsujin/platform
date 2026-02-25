---
id: w24-l01
title: "Distributed Systems Q&A"
order: 1
duration_minutes: 30
xp: 50
kind: lesson
part: w24
proof:
  type: paste
  instructions: "Paste your written answers to at least 5 of the distributed systems questions."
  regex_patterns:
    - "CAP|consensus|replication|partition"
---

## Concept

Technical interviews for backend and infrastructure roles often include distributed systems questions. Having built CivicTrust, you can answer these from personal experience — not textbook knowledge. That is a massive advantage.

Interviewers want to see that you understand the trade-offs, not just the definitions. Anyone can say "CAP theorem says you can only have two of three." But you can say "In my CivicTrust project, I chose consistency over availability — when a quorum is not available, writes are rejected rather than risked being lost. I made this choice because the transparency log requires strict ordering."

## Task

Write answers to these 10 common distributed systems interview questions. Use examples from CivicTrust in every answer:

1. What is the CAP theorem? Which trade-off did you make in CivicTrust?
2. What is consensus and why is it hard?
3. Explain how leader election works. What happens during a split vote?
4. What is a write-ahead log and why is it important?
5. What is the difference between at-most-once, at-least-once, and exactly-once delivery?
6. How do you detect data corruption in a distributed system?
7. What is a Merkle tree and why is it useful?
8. How would you handle a compromised signing key in production?
9. What is the difference between strong consistency and eventual consistency?
10. How do you test a distributed system?

Write each answer in 3-5 sentences. Save as `docs/interview-qa.txt`.

## Hints

- Always start with a brief definition, then pivot to your experience: "A WAL is... In CivicTrust, I used a WAL to..."
- Use specific numbers: "My election timeout was 150-300ms randomized to avoid split votes"
- For trade-off questions, explain both sides: "I chose X because Y, but the downside is Z"
- Practice saying the answers out loud — interview answers need to be spoken, not read
- Prepare for follow-ups: "How would you change your design if you needed higher availability?"

## Verify

```bash
cat docs/interview-qa.txt | head -40
```

At least 5 questions answered with CivicTrust examples.

## Done When

You have written answers to at least 10 distributed systems questions using your CivicTrust experience.
