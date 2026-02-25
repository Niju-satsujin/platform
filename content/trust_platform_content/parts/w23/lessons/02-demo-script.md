---
id: w23-l02
title: "Polished Demo Script"
order: 2
duration_minutes: 25
xp: 50
kind: lesson
part: w23
proof:
  type: paste
  instructions: "Paste the first page of your polished demo script showing the introduction and first act."
  regex_patterns:
    - "demo|presentation"
    - "step|act"
---

## Concept

The Month 5 demo was a technical dry run. Now create a polished 5-minute demo designed for a job interview audience. The audience is a hiring manager or technical interviewer — they are technical but do not know your system. You need to explain what CivicTrust does, why it matters, and show it working, all in 5 minutes.

The structure: 30 seconds on "what is CivicTrust" (the elevator pitch), 1 minute showing normal operation (issue + verify), 1 minute showing resilience (kill leader, show recovery), 1 minute showing transparency (show Merkle proof, verify offline), 1 minute showing the architecture (point to the diagram) and answering "what did you learn?"

The demo should be rehearsed until it is smooth. Every command should be pre-tested. Every expected output should be known. No surprises.

## Task

1. Write the polished demo script with exact timing for each section
2. Write the opening pitch: "CivicTrust is a distributed document issuance system that provides cryptographic proof of authenticity using Ed25519 signatures, Merkle trees, and a tamper-evident transparency log."
3. For each section: write exactly what you say, what command you run, and what the audience sees
4. Include recovery steps in case something goes wrong during the demo
5. Practice running the full demo and time it — should be under 5 minutes
6. Save as `docs/interview-demo.txt`

## Hints

- Start with the impact: "This system can verify a government document offline on an air-gapped computer"
- Show, don't tell: run actual commands rather than showing slides
- Pre-load the system with some test data so the demo starts fast
- Have a backup plan: if the live demo fails, have the Month 5 demo output saved as a fallback
- End with a memorable statement: "The entire verification fits in a 520-byte receipt — smaller than a tweet"

## Verify

```bash
cat docs/interview-demo.txt | head -30
```

Demo script exists with timing, commands, and talking points.

## Done When

Your 5-minute demo script is polished, timed, and rehearsed.
