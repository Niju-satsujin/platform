---
id: w16-l05
title: "Month 4 demo script"
order: 5
duration_minutes: 25
xp: 50
kind: lesson
part: w16
proof:
  type: paste
  instructions: "Paste your numbered demo script with expected output for each step."
  regex_patterns:
    - "Step|step|1\\.|2\\."
    - "append|add|entry"
    - "checkpoint|sign"
    - "monitor|verify"
    - "equivocation|EQUIVOCATION"
---
# Month 4 demo script

## Concept

A demo is not just running the code. A good demo tells a story. For Month 4, your story is: "I built a tamper-evident system. Here is how it works, and here is how it catches a cheater." The demo should be clear enough that someone watching can follow along even if they do not know what a Merkle tree is.

Your demo has five acts. Act 1: add entries to the log. Act 2: the operator signs a checkpoint. Act 3: a monitor verifies the checkpoint. Act 4: the log grows and the monitor checks consistency. Act 5: the operator tries to cheat (equivocation) and gets caught. Each act builds on the previous one, and by the end, you have demonstrated the entire tamper-evident pipeline.

Writing the script before running it helps you think about what output to expect and catch bugs early. It also gives you a reference to compare against when you run the demo for real in the next lesson.

## Task

1. Write a demo program `transparency_demo.cpp` (or a script that calls your existing programs) that performs these steps in order:
   - **Step 1: Append entries** — add 4 entries to the transparency log (e.g., "alice.txt hash=...", "bob.txt hash=...", etc.). Print each entry as it is added
   - **Step 2: Sign checkpoint** — the operator signs a checkpoint for the current log state. Print the checkpoint: size, root hash (first 16 hex chars), and "checkpoint signed"
   - **Step 3: Monitor verifies** — a monitor fetches the checkpoint, verifies the signature, and prints `[Monitor] size=4 root=<hex> OK`
   - **Step 4: Grow and verify consistency** — append 3 more entries. Sign a new checkpoint. The monitor verifies the signature and checks consistency with the previous checkpoint. Print `[Monitor] consistency 4->7 OK`
   - **Step 5: Equivocation** — simulate the operator signing a conflicting checkpoint (same size=7, different root). A second monitor receives this via gossip. Print `EQUIVOCATION DETECTED` with both root hashes
2. For each step, write the expected output as a comment in your source file or in a separate text file. Example:

```
// Step 1 expected output:
// [Log] append entry 0: alice.txt hash=2cf2...
// [Log] append entry 1: bob.txt hash=486e...
// [Log] append entry 2: carol.txt hash=9f86...
// [Log] append entry 3: dave.txt hash=d7a8...
```

3. The demo should be a single program that runs all five steps sequentially. No manual intervention needed
4. Make sure the demo uses all the components you built: `ContentStore` (w13), `MerkleTree` (w14), `TransparencyLog` with signed checkpoints (w15), `Monitor` with gossip (w16)

## Hints

- Keep the demo output clean and readable. Use prefixes like `[Log]`, `[Monitor]`, `[Gossip]` so each line shows which component is acting
- For the entries, use simple strings like `"alice.txt"` or `"transaction-001"`. The content does not matter — the demo is about the infrastructure
- For equivocation, you can skip the TCP gossip and just call `detect_equivocation()` directly. The demo is about showing the detection, not the network transport
- Use short hash prefixes in the output (first 16 hex chars) so the output fits on screen. Print the full hash in debug mode if needed
- Think about what the audience needs to see. They need to see entries going in, a checkpoint being signed, verification succeeding, consistency holding, and equivocation being caught. Every line of output should advance the story
- Test your script mentally: read through the expected output top to bottom. Does it tell a coherent story?

## Verify

Review your demo script:
- Does it have all 5 steps clearly labeled?
- Does each step have expected output written down?
- Does it compile? `g++ -std=c++17 -o transparency_demo transparency_demo.cpp -lssl -lcrypto -lpthread`
- Do not run it yet — that is the next lesson

## Done When

You have a complete demo script (source code) and expected output for all 5 steps. The script compiles without errors. Each step is clearly labeled and the expected output tells a clear story of the transparency system working.
