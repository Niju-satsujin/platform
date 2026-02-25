---
id: w16-l06
title: "Month 4 demo run"
order: 6
duration_minutes: 25
xp: 50
kind: lesson
part: w16
proof:
  type: paste
  instructions: "Paste the full output of your transparency demo run, showing all 5 steps completing successfully."
  regex_patterns:
    - "append|entry|added"
    - "checkpoint|signed"
    - "OK|verified"
    - "consistency"
    - "EQUIVOCATION DETECTED"
---
# Month 4 demo run

## Concept

Planning and building are important, but the demo is where it all comes together. This is the moment you run the system end-to-end and see every piece working in sequence. You will compare the actual output to the expected output you wrote in the previous lesson. If something does not match, you debug it, fix it, and run again.

Demos often reveal small bugs that unit tests miss — timing issues, output formatting problems, or integration gaps where two components do not quite fit together. That is normal. The value of the demo is not just showing it works, but finding and fixing these last issues.

## Task

1. Build and run your demo script from the previous lesson:
   ```bash
   g++ -std=c++17 -o transparency_demo transparency_demo.cpp -lssl -lcrypto -lpthread
   ./transparency_demo
   ```
2. Capture the full output (copy-paste from terminal or redirect to a file with `./transparency_demo 2>&1 | tee demo_output.txt`)
3. Compare the actual output to your expected output from the previous lesson. Note any differences
4. If anything fails or looks wrong:
   - Identify the problem (wrong output, crash, assertion failure, etc.)
   - Fix the issue in your code
   - Rebuild and run again
   - Repeat until all 5 steps complete successfully
5. After a clean run, review the output one more time:
   - Step 1: Do you see 4 entries appended with hashes?
   - Step 2: Do you see a signed checkpoint with size=4?
   - Step 3: Does the monitor report OK?
   - Step 4: Does the monitor report consistency OK for the size change?
   - Step 5: Do you see EQUIVOCATION DETECTED with two different root hashes?

## Hints

- If the demo crashes, run it under a debugger: `gdb ./transparency_demo` then `run`. Look at the backtrace with `bt`
- Common issues:
  - Signature verification fails: make sure you are using the same key pair for signing and verification. Print the public key bytes to confirm
  - Consistency proof fails: check that your Merkle tree is building correctly. Print the tree at each step
  - Equivocation not detected: make sure the two checkpoints have the same size but genuinely different roots. Print both roots to confirm they differ
- If the output is messy, add blank lines between steps: `std::cout << "\n--- Step 2: Sign checkpoint ---\n";`
- Save the clean output — you will need it for the quest submission
- If you made code changes during debugging, make sure to run the individual test suites too (`./build/monitor_test`, etc.) to confirm you did not break anything

## Verify

```bash
# Build and run
g++ -std=c++17 -o transparency_demo transparency_demo.cpp -lssl -lcrypto -lpthread
./transparency_demo

# Confirm all component tests still pass
./build/cas_test && ./build/merkle_test && ./build/log_test && ./build/monitor_test
```

The demo output should contain all five stages with no errors or assertion failures.

## Done When

The demo runs from start to finish without errors. All 5 steps produce the expected output. The output clearly shows entries appended, checkpoint signed, monitor verifying OK, consistency verified, and equivocation detected. All component tests still pass.
