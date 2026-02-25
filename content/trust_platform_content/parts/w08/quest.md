---
id: w08-quest
title: "Week 8 Boss: Month 2 Demo"
part: w08
kind: boss
proof:
  type: paste
  instructions: "Paste: (1) all five attack drill outputs showing REJECTED, (2) Month 2 demo output showing all crypto capabilities, (3) performance comparison with/without crypto, (4) quality gate checklist with all items PASS."
  regex_patterns:
    - "REJECTED|rejected|REJECT"
    - "demo|month.2"
    - "PASS"
---
# Week 8 Boss: Month 2 Demo

## Goal

Demonstrate that your signed protocol withstands five distinct attacks and that all cryptographic capabilities work together in a live system.

## Requirements

1. **Replay attack** — server rejects replayed messages with the correct error
2. **Forgery attack** — server rejects messages with invalid signatures
3. **Tamper attack** — server rejects messages whose payload was modified after signing
4. **Revoked key attack** — server rejects messages signed with a revoked key
5. **Expired timestamp attack** — server rejects messages with stale timestamps
6. **Full integration** — all crypto features active simultaneously in the server
7. **Performance numbers** — throughput measured with and without crypto, overhead calculated
8. **Demo script** — runs all capabilities in sequence, captures output
9. **Quality gate** — 10-point Month 2 checklist, all items PASS

## Verify

```bash
./demo_month2.sh
```

The demo runs all attack drills, shows the signed protocol handling legitimate traffic, prints performance numbers, and exits cleanly.

## Done When

All five attacks are rejected, the demo runs end-to-end, performance overhead is documented, and the v2.0-month2 tag exists.
