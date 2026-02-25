---
id: w22-l04
title: "Threat Model Document"
order: 4
duration_minutes: 30
xp: 75
kind: lesson
part: w22
proof:
  type: paste
  instructions: "Paste the threat model summary showing at least 5 threats with their impact and mitigation status."
  regex_patterns:
    - "threat"
    - "mitigation|mitigated"
---

## Concept

A threat model is a formal document that answers four questions: (1) What are we building? (2) What can go wrong? (3) What are we doing about it? (4) Did we do a good enough job? You have already answered questions 1 and 3 throughout the program. Now you formalize the answers.

Use the STRIDE model to categorize threats: **S**poofing (pretending to be someone else), **T**ampering (modifying data), **R**epudiation (denying you did something), **I**nformation disclosure (leaking secrets), **D**enial of service (making the system unavailable), **E**levation of privilege (gaining unauthorized access).

For each threat, document: the threat name, the STRIDE category, the attack scenario (how would an attacker exploit it?), the impact (what happens if the attack succeeds?), the mitigation (what defense exists?), and the status (mitigated, partially mitigated, or unmitigated).

## Task

Write a threat model document (`docs/threat-model.txt`) with at least 5 threats:
1. **Signature forgery** (Spoofing) — attacker creates a fake signed document. Mitigated by Ed25519 verification.
2. **Log tampering** (Tampering) — attacker modifies a log entry. Mitigated by Merkle tree integrity checks.
3. **Key theft** (Information Disclosure) — attacker steals a signing key. Partially mitigated by key revocation and rotation.
4. **Denial of service** (DoS) — attacker floods the server with requests. Partially mitigated by connection limits and backpressure.
5. **Equivocation** (Repudiation) — log operator shows different views to different parties. Mitigated by monitors and gossip.

Add at least 2 more threats specific to your implementation.

## Hints

- For each threat, use this template: Name, Category (STRIDE), Scenario, Impact, Mitigation, Status
- Impact levels: Low (inconvenience), Medium (data loss or corruption), High (security breach), Critical (system compromise)
- Status: "Mitigated" means you have a defense that works. "Partially mitigated" means the defense helps but is not complete. "Unmitigated" means no defense exists yet
- Think about what your system does NOT protect against: insider threats? physical access? side-channel attacks?
- Include a summary section at the top listing all threats in a table

## Verify

```bash
cat docs/threat-model.txt | head -40
```

Threat model exists with at least 5 documented threats.

## Done When

Your threat model document has at least 7 threats with STRIDE categories, impacts, mitigations, and status.
