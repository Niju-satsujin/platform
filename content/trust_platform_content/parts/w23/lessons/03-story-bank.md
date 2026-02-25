---
id: w23-l03
title: "Interview Story Bank"
order: 3
duration_minutes: 30
xp: 75
kind: lesson
part: w23
proof:
  type: paste
  instructions: "Paste 3 of your STAR-format interview stories."
  regex_patterns:
    - "Situation|Task|Action|Result"
---

## Concept

Behavioral interviews ask questions like "Tell me about a time you solved a hard problem" or "Describe a project where you had to make a difficult design decision." The STAR method is the standard format: Situation (what was the context?), Task (what did you need to do?), Action (what did you do?), Result (what was the outcome?).

CivicTrust gives you at least 10 strong STAR stories. Each week had a challenge, a design decision, or a debugging experience. Write these down now while they are fresh in your memory. In 6 months, you will not remember the details.

## Task

Write at least 6 STAR-format stories from your CivicTrust experience:

1. **Hard debugging**: "I had a bug where replication was losing data under partition..." (Week 10-11)
2. **Design decision**: "I had to choose between leader-based and leaderless replication..." (Week 10)
3. **Performance optimization**: "My Merkle tree was slow for large logs, so I..." (Week 14)
4. **Security thinking**: "I discovered that my receipt system was vulnerable to..." (Week 22)
5. **Learning new technology**: "I had never used Ed25519 before, so I..." (Week 6)
6. **System integration**: "Combining 16 weeks of components into the issuance pipeline..." (Week 17)

Each story should be 4-6 sentences. Keep them concise — interviewers have short attention spans.

Save as `docs/story-bank.txt`.

## Hints

- Write each story in STAR format: **S**: one sentence of context. **T**: what needed to be done. **A**: what you specifically did (use "I", not "we"). **R**: the measurable outcome
- Focus on YOUR actions, not the system's features
- Include numbers: "Reduced election time from 2 seconds to 200ms" or "Processed 10,000 entries per second"
- Prepare for follow-up questions: "How would you do it differently?" and "What would you add with more time?"
- Practice saying each story out loud — if it takes more than 90 seconds to tell, it is too long

## Verify

```bash
cat docs/story-bank.txt | head -30
```

Story bank exists with at least 6 STAR-format stories.

## Done When

You have at least 6 polished STAR stories ready for behavioral interviews.
