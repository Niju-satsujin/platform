---
id: w12-l01
title: "Plan the demo script"
order: 1
duration_minutes: 20
xp: 25
kind: lesson
part: w12
proof:
  type: paste
  instructions: "Paste your numbered demo script with at least 7 steps and expected output for each step."
  regex_patterns:
    - "step|Step"
    - "expected|expect"
---
# Plan the demo script

## Concept

Before you touch a terminal, write down exactly what you will do. A good demo is a story with a beginning, middle, and end. The beginning shows a working system. The middle breaks something. The end shows the system recovering on its own.

In C you probably tested by running the program and poking at it. That works for single-process programs. For a distributed system with 3 nodes, you need a script. Without a script you will forget steps, miss verifications, and waste time restarting because you did things out of order.

Your demo script is a numbered list. Each step has three parts: what you do, what command you run, and what output you expect. If the actual output does not match the expected output, you know something is wrong and you can debug it before the real demo.

Think of the script like a test plan in C — except instead of assert() calls, you are checking terminal output by eye. Later this week you will add state hash checks to make the verification automatic.

## Task

1. Create a file called `demo_plan.txt` in your project root
2. Write a numbered demo script with at least 7 steps:
   - Step 1: Start 3 nodes (give the exact commands with ports and node IDs)
   - Step 2: Wait for initial leader election, note which node becomes leader
   - Step 3: Write 50 key-value pairs to the leader
   - Step 4: Verify all 50 keys exist on all 3 nodes
   - Step 5: Kill the leader process
   - Step 6: Wait for new election, note the new leader
   - Step 7: Write 50 more key-value pairs (keys 51-100) to the new leader
   - Step 8: Verify all 100 keys on all surviving nodes
   - Step 9: Restart the old leader, wait for it to catch up
   - Step 10: Verify all 100 keys on all 3 nodes
3. For each step, write the exact command you will run
4. For each step, write what output you expect to see
5. Estimate how long each step takes (in seconds)

## Hints

- Use concrete port numbers. For example: node 1 on port 9001, node 2 on 9002, node 3 on 9003
- For writing 50 keys, you can use a loop in bash: `for i in $(seq 1 50); do ./kv_client put "key$i" "value$i" --port 9001; done`
- For verifying keys, read them back: `for i in $(seq 1 50); do ./kv_client get "key$i" --port 9001; done`
- The leader election step might take a few seconds — your election timeout should be somewhere between 150ms and 300ms
- Think about what you will see in the logs at each step — replication messages, heartbeat timeouts, vote requests

## Verify

```bash
# Check that the demo plan file exists and has enough steps
wc -l demo_plan.txt
cat demo_plan.txt
```

Expected: the file has at least 30 lines (7+ steps with commands and expected output for each). Each step has a clear action, command, and expected result.

## Done When

You have a written demo script with at least 7 numbered steps, each with an exact command and expected output. You can read the script and know exactly what to do at each point without thinking.
