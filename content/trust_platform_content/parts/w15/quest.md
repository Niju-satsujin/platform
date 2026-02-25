---
id: w15-quest
title: "Week 15 Boss: Transparency Log"
part: w15
kind: boss
proof:
  type: paste
  instructions: "Paste output showing: (1) entries appended to the log with their indices, (2) a signed checkpoint with log_size, root_hash, and signature, (3) checkpoint verified by an independent client printing VERIFIED, (4) audit client detecting consistency between two checkpoints."
  regex_patterns:
    - "append|entry|index"
    - "checkpoint|signed"
    - "VERIFIED|verified|valid"
    - "consistent|PASS"
---
# Week 15 Boss: Transparency Log

## Goal

Prove your transparency log works end to end: entries are appended, the operator signs checkpoints, an independent client verifies those checkpoints, and an audit client confirms the log only grew (never changed).

## Requirements

1. **Append entries** — add at least 10 entries to the log, each returning a unique index
2. **Sign a checkpoint** — the log operator signs a checkpoint containing the log size, root hash, and a timestamp
3. **Verify the checkpoint** — a separate client program verifies the checkpoint signature using the operator's public key
4. **Inclusion proof** — the client requests and verifies an inclusion proof for at least one entry
5. **Append more entries** — add more entries to grow the log
6. **Sign a second checkpoint** — the operator signs a new checkpoint with the updated log state
7. **Audit consistency** — the audit client verifies that the second checkpoint is consistent with the first (the log only grew, no entries were changed)
8. **Detect tampering** — modify an old entry and show the audit client catches it

## Verify

```bash
# Run the full demo
./build/transparency_log_demo

# Or run components separately:
./build/log_server &
./build/log_client --append "test entry 1"
./build/log_client --checkpoint
./build/audit_client --verify
```

## Done When

Output shows entries appended with indices, checkpoint signed and verified, inclusion proof verified, consistency proof verified, and tampering detected. Quality gate checklist is all PASS.
