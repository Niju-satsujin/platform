---
id: w16-quest
title: "Week 16 Boss: Tamper-Evident Demo"
part: w16
kind: boss
proof:
  type: paste
  instructions: "Paste your full demo output showing: (1) log entries appended, (2) checkpoint signed, (3) monitor verifies the checkpoint, (4) more entries appended and consistency verified, (5) equivocation simulated and detected by a monitor. Include the EQUIVOCATION DETECTED alert."
  regex_patterns:
    - "append|added|entry"
    - "checkpoint|signed"
    - "OK|verified|valid"
    - "consistency"
    - "EQUIVOCATION DETECTED"
---
# Week 16 Boss: Tamper-Evident Demo

## Goal

Prove your complete transparency system works end-to-end. You built it from the bottom up: hashes, Merkle trees, signed checkpoints, monitors, and gossip. Now show it all working together in a single demo run — including catching a cheating log operator.

## Requirements

1. **Append entries** — add at least 4 entries to the transparency log
2. **Sign a checkpoint** — the log operator signs a checkpoint committing to the current state
3. **Monitor verifies** — a monitor fetches the checkpoint, verifies the signature, and reports OK
4. **Consistency check** — append more entries, sign a new checkpoint, and the monitor verifies the log grew consistently (old entries unchanged)
5. **Equivocation detection** — simulate the operator signing two different root hashes for the same log size. Two monitors gossip and one of them detects the conflict, printing EQUIVOCATION DETECTED
6. **All Part 4 tests pass** — every test from weeks 13-16 is green
7. **Quality gate complete** — all 8 checklist items pass
8. **Tag exists** — `v0.16-transparency` tag is created

## Verify

```bash
# Run the demo
./build/transparency_demo

# Run all Part 4 tests
./build/cas_test && ./build/merkle_test && ./build/log_test && ./build/monitor_test

# Check the tag
git tag -l "v0.16*"
```

## Done When

The demo output shows all five stages (append, sign, verify, consistency, equivocation detection), all tests pass, the quality gate is green, and the `v0.16-transparency` tag exists.
