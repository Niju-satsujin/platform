---
id: w16-l07
title: "Week 16 quality gate"
order: 7
duration_minutes: 20
xp: 100
kind: lesson
part: w16
proof:
  type: paste
  instructions: "Paste your 8-point quality gate checklist with PASS/FAIL for each item, and the output of `git tag -l 'v0.16*'` showing the tag exists."
  regex_patterns:
    - "PASS"
    - "monitor.*checkpoint|checkpoint.*monitor"
    - "gossip|equivocation"
    - "v0\\.16"
---
# Week 16 quality gate

## Concept

This is the final quality gate for Part 4 (Transparency) and for Month 4 as a whole. Over the past four weeks, you built a complete tamper-evident system from scratch: content-addressed storage, Merkle trees, a transparency log with signed checkpoints, and monitors with gossip-based equivocation detection. Each piece builds on the one before it, and together they form a system where cheating is mathematically detectable.

Take a moment to appreciate what you have accomplished. In Week 13, you stored data by hash — the simplest possible integrity check. In Week 14, you scaled that to thousands of entries with Merkle trees. In Week 15, you added an operator who commits to the log state with signed checkpoints. And now in Week 16, you added watchers who keep the operator honest. This is the same architecture used by Certificate Transparency, Go module transparency, and blockchain systems. You built it yourself, in C++, understanding every layer.

## Task

Run through this 8-point checklist. For each item, verify it works and mark PASS or FAIL.

### Checklist

1. **Monitor verifies checkpoints** — the Monitor class fetches a signed checkpoint and verifies the Ed25519 signature. `./build/monitor_test` includes a test for this. Mark PASS if the test passes.

2. **Monitor checks consistency** — the Monitor verifies that a new checkpoint is consistent with the previous one (the log only grew). `./build/monitor_test` includes a test where the monitor processes two consecutive checkpoints. Mark PASS if the consistency check succeeds.

3. **Gossip exchanges checkpoints** — two monitors exchange signed checkpoints over TCP. `./build/gossip_test` or the relevant test shows two monitors connecting and sharing checkpoints. Mark PASS if the exchange completes and both sides verify signatures.

4. **Equivocation is detected** — `detect_equivocation()` correctly identifies two signed checkpoints with the same size but different roots as equivocation. `./build/equivocation_test` prints EQUIVOCATION DETECTED. Mark PASS if it does.

5. **Trillian reading done** — you have written 3 design decisions and a comparison paragraph from the Trillian code reading. Mark PASS if your notes exist and are substantive.

6. **Demo script written** — `transparency_demo.cpp` exists, compiles, and includes all 5 demo steps with expected output. Mark PASS if it compiles without errors.

7. **Demo executed successfully** — the demo runs end-to-end and produces correct output for all 5 steps (append, sign, verify, consistency, equivocation). Mark PASS if the output matches expectations.

8. **All Part 4 tests pass** — run all test suites from weeks 13-16:
   ```bash
   ./build/cas_test && ./build/merkle_test && ./build/log_test && ./build/monitor_test
   ```
   Mark PASS if all tests are green.

### Tagging

After all 8 items pass:

```bash
git add -A
git commit -m "Week 16: monitors, gossip, equivocation detection, Month 4 demo"
git tag v0.16-transparency
```

## Hints

- If any item fails, go back to the relevant lesson and fix it. Do not mark FAIL and move on
- The most common issue at this stage is an integration problem — all pieces work individually but something breaks when combined. Run the demo to test integration
- If the gossip test fails because of a port conflict, change the port number or add a small `sleep()` before connecting
- For the Trillian reading, you can mark PASS as long as you did the reading and wrote notes. There is no automated test for this one
- Format your checklist clearly:
  ```
  [PASS] 1. Monitor verifies checkpoints
  [PASS] 2. Monitor checks consistency
  ...
  ```
- The tag `v0.16-transparency` marks the end of Part 4. Your next arc will build on this foundation

## Verify

```bash
# Run all Part 4 tests
./build/cas_test && ./build/merkle_test && ./build/log_test && ./build/monitor_test

# Check the tag
git tag -l "v0.16*"

# Verify the tag points to the right commit
git log --oneline -1 v0.16-transparency
```

## Done When

All 8 checklist items are PASS, the `v0.16-transparency` tag exists, and the Month 4 demo output is saved. You have completed the Transparency arc.
