---
id: w24-l03
title: "Timed Demo Practice"
order: 3
duration_minutes: 25
xp: 50
kind: lesson
part: w24
proof:
  type: paste
  instructions: "Paste your demo timing results showing the demo completed in under 5 minutes."
  regex_patterns:
    - "time|minute|demo"
    - "complete|finish"
---

## Concept

A demo that runs over time loses its audience. A demo that finishes too early feels thin. The sweet spot is 4-5 minutes — long enough to show substance, short enough to leave time for questions.

This lesson is pure practice. Run the demo from your interview-demo.txt script at least 3 times. Time each run. Identify where you lose time and tighten those sections. The goal: under 5 minutes, every time, with smooth transitions between sections.

## Task

1. Set a 5-minute timer
2. Run the full demo from your script
3. Record the actual time for each section (opening pitch, normal operation, resilience, transparency, architecture)
4. If any section runs long, trim it: fewer documents, shorter pauses, tighter talking points
5. Run the demo again. Repeat until you consistently finish under 5 minutes
6. Record your best times in `docs/demo-timing.txt`

## Hints

- Use `time` command to measure each section: `time ./civictrust issue --count 5`
- If the live system takes too long to start, pre-start it before the demo begins
- Pre-load test data so you do not waste demo time on setup
- Smooth transitions: "Now let me show you what happens when the leader dies..." (kill immediately, do not explain first)
- If you stumble on words, simplify the talking point — shorter is always better
- Aim for: pitch (30s), normal ops (60s), resilience (60s), transparency (60s), architecture (30s), closing (30s)

## Verify

```bash
cat docs/demo-timing.txt
```

3 timed runs recorded, all under 5 minutes.

## Done When

You can consistently run the demo in under 5 minutes with smooth transitions and clear talking points.
