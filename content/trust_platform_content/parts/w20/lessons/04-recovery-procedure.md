---
id: w20-l04
title: "Recovery Procedure"
order: 4
duration_minutes: 25
xp: 50
kind: lesson
part: w20
proof:
  type: paste
  instructions: "Paste your recovery runbook showing step-by-step procedures for each failure mode."
  regex_patterns:
    - "recovery|runbook|procedure"
---

## Concept

Every production system needs a recovery runbook — a step-by-step procedure for recovering from each known failure mode. You have tested three failure modes this week: crash during issuance, network partition, and key compromise. Now write down the exact recovery steps for each one.

A runbook is not code — it is a document that an operator follows when things go wrong at 3 AM. It should be clear enough that someone who did not build the system can follow it. Each procedure should have: symptoms (how to detect the problem), steps (what to do), verification (how to confirm recovery), and prevention (how to avoid it next time).

Writing runbooks is a real-world SRE (Site Reliability Engineering) skill. Google, Amazon, and other companies require runbooks for every production service. It forces you to think about failure modes before they happen, not during a crisis.

## Task

Write a recovery runbook document with three procedures:

1. **Crash Recovery**: Symptoms: process died, partial issuance suspected. Steps: restart service, run `recover_partial_issuances()`, verify state hash. Verification: no orphaned CAS entries, log is consistent.

2. **Partition Recovery**: Symptoms: a node is unreachable, writes continue on remaining quorum. Steps: diagnose the network issue, restore connectivity, monitor catch-up progress, verify state hashes match across all nodes. Verification: all nodes have identical state hashes.

3. **Key Compromise Recovery**: Symptoms: suspected or confirmed key leak. Steps: immediately revoke the key, generate and register a new key, identify documents signed with the compromised key, re-issue critical documents with the new key, notify affected parties. Verification: revoked key cannot sign, new key works, old documents flagged.

Save the runbook as a text file in your project.

## Hints

- Keep each procedure on one page — operators need to find information fast
- Use numbered steps, not paragraphs
- Include the exact commands to run (e.g., `./civictrust recover --check-partial`)
- The "prevention" section is optional but valuable — e.g., "use hardware security modules to protect keys"
- Save as `docs/recovery-runbook.txt` in your project

## Verify

```bash
cat docs/recovery-runbook.txt | head -50
```

The runbook exists with all three procedures documented.

## Done When

Your recovery runbook has clear, step-by-step procedures for crash recovery, partition recovery, and key compromise recovery.
