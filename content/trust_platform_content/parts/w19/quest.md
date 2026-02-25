---
id: w19-quest
title: "Week 19 Boss: Air-Gapped Verification"
part: w19
kind: boss
proof:
  type: paste
  instructions: "Paste the output showing a verification bundle created, transferred (simulated), and verified with zero network access."
  regex_patterns:
    - "offline|air.gap"
    - "verified|valid"
---

## The Challenge

Create a verification bundle for an issued document. Simulate an air gap by running the verification in a separate process that has no access to the log server or key registry. The bundle must contain everything needed for verification.

## What to submit

Run your offline verification test and paste the full output. It should show:
1. Document issued on the "online" side
2. Bundle created with document + receipt + keys
3. Bundle verified on the "offline" side with no network access
4. Verification result: all checks pass
