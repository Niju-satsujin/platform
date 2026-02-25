---
id: w04-l14
title: "Month 1 demo run"
order: 14
duration_minutes: 20
xp: 50
kind: lesson
part: w04
proof:
  type: paste
  instructions: "Paste the full output of your demo.sh run."
  regex_patterns:
    - "==="
    - "pass|success|complete"
---
# Month 1 demo run

## Concept

Run the demo script, capture the output, and review it. This is your Month 1 deliverable — the proof that everything works together.

Review the output critically:
- Does each section produce the expected output?
- Are there any warnings or errors you missed?
- Is the output clear enough that someone who has never seen your code understands what is happening?
- Does it run cleanly 3 times in a row?

If anything is unclear or broken, fix the demo script and re-run. The demo is your portfolio piece for Month 1.

## Task

1. Run `demo.sh` and capture the full output: `./demo.sh 2>&1 | tee demo_output.txt`
2. Review the output — fix any issues
3. Run it 3 times to verify consistency
4. Save `demo_output.txt` as your Month 1 deliverable

## Hints

- `2>&1` redirects stderr to stdout so both are captured
- `tee` prints to screen AND saves to file simultaneously
- If the demo takes more than 2 minutes, find the slow part and optimize
- If it fails intermittently, you have a race condition — fix it

## Verify

```bash
./demo.sh 2>&1 | tee demo_output.txt
./demo.sh 2>&1 | tee /dev/null
./demo.sh 2>&1 | tee /dev/null
```

Expected: all 3 runs succeed. The output file captures the full demo.

## Done When

The demo runs cleanly 3 times and the output is saved as your Month 1 deliverable.
