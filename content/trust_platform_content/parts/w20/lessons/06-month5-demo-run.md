---
id: w20-l06
title: "Month 5 Demo Run"
order: 6
duration_minutes: 25
xp: 50
kind: lesson
part: w20
proof:
  type: paste
  instructions: "Paste the full output of your Month 5 demo run."
  regex_patterns:
    - "demo"
    - "pass|success|verified"
---

## Concept

Execute the demo script you wrote in the previous lesson. Run every command, capture every output. This is a dry run — practice the demo as if you were presenting to an audience. If anything fails, fix it before the real presentation.

The goal of running the demo is not just to check that it works — it is to make sure the output is clear and tells a good story. If a step produces confusing output, improve the logging so the demo audience can follow along.

## Task

1. Follow your demo script step by step
2. Capture all output (use `script` command or redirect to a file)
3. Note any steps that fail or produce unclear output
4. Fix any issues — improve error messages, add progress logging, adjust timing
5. Run the full demo again after fixes — it should be clean from start to finish
6. Save the final output as `docs/month5-demo-output.txt`

## Hints

- Use `script docs/month5-demo-output.txt` to automatically capture all terminal output
- If a step takes too long, reduce the number of documents (e.g., 5 instead of 20)
- Add clear separators between acts: `echo "=== Act 2: Crash Recovery ==="`
- If the crash simulation is flaky (sometimes works, sometimes does not), add a small sleep to make it reliable
- Review the output file after — does it tell a clear story?

## Verify

```bash
cat docs/month5-demo-output.txt | head -50
```

Full demo output captured with all 5 acts executed successfully.

## Done When

Your Month 5 demo runs cleanly from start to finish with all 5 acts, and the output is saved.
