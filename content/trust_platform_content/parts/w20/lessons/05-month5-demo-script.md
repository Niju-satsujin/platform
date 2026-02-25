---
id: w20-l05
title: "Month 5 Demo Script"
order: 5
duration_minutes: 25
xp: 50
kind: lesson
part: w20
proof:
  type: paste
  instructions: "Paste your demo script with numbered steps and expected output for each."
  regex_patterns:
    - "demo|script"
    - "step"
---

## Concept

The Month 5 demo is the biggest demo yet. You are showing the complete CivicTrust system: document issuance, transparency logging, receipt generation, offline verification, and resilience under chaos. The demo should tell a compelling story with five acts.

Act 1: Normal operation — issue documents, verify them, show receipts. Act 2: Crash — kill the server mid-issuance, show recovery. Act 3: Partition — disconnect a node, issue documents, reconnect, show catch-up. Act 4: Key compromise — revoke a key, show the impact, rotate to a new key. Act 5: Offline — create a verification bundle, verify it on a simulated air-gapped machine.

## Task

Write a numbered demo script with:
1. Each step has a description, the exact command to run, and the expected output
2. The script covers all 5 acts
3. Include timing estimates (the full demo should take 10-15 minutes)
4. Include talking points — what to say while each command runs

Save the script as `docs/month5-demo.txt`.

## Hints

- Start each act with a clear heading: "=== Act 1: Normal Operation ==="
- For each step: "Step 3: Issue 10 documents → Expected: 10 issued, 10 receipts generated"
- Include commands like: `./civictrust issue --type permit --subject "Alice" --count 10`
- Timing: Act 1 (3 min), Act 2 (2 min), Act 3 (3 min), Act 4 (3 min), Act 5 (2 min)
- Talking point example: "Notice that the receipt is only 520 bytes — small enough to store in a QR code"

## Verify

```bash
cat docs/month5-demo.txt | head -30
```

Demo script exists with all 5 acts.

## Done When

Your demo script has clear steps, commands, expected output, and talking points for all 5 acts.
