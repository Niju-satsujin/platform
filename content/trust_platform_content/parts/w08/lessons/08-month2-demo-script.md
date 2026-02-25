---
id: w08-l08
title: "Month 2 demo script"
order: 8
duration_minutes: 25
xp: 50
kind: lesson
part: w08
proof:
  type: paste
  instructions: "Paste your demo_month2.sh script content showing the sequence of commands for all crypto capabilities."
  regex_patterns:
    - "demo|script"
    - "attack|replay|forge|tamper|revoke|expire"
    - "server|crypto"
---
# Month 2 demo script

## Concept

A demo script is a repeatable sequence of commands that shows your system working. You wrote one for Month 1. This one is bigger because it covers everything from Month 1 plus all the crypto work from Month 2.

The Month 2 demo tells a story in three acts:

**Act 1 — Setup.** Start the server with crypto enabled. Show the key store. Register a client key. Print the configuration.

**Act 2 — Legitimate traffic.** Send 10 signed messages. All are accepted. Show the nonce store growing. Show the server log with verification results.

**Act 3 — Attack drills.** Run each of the five attack drills. Each one is rejected. Show the server log with the rejection reasons. This is the dramatic part — you are attacking your own system and watching it defend itself.

**Epilogue.** Print the performance numbers. Show the git tag. Clean up.

The script should run in under 3 minutes and require no manual intervention. Anyone should be able to clone your repo, build, and run the demo to see everything working.

## Task

1. Write `demo_month2.sh` that runs all three acts plus the epilogue
2. Each section prints a clear header: `echo "=== Act 1: Setup ==="`
3. Start the server in the background at the beginning, kill it at the end
4. Act 1: show server startup, key registration, configuration
5. Act 2: send 10 legitimate signed messages, show all accepted
6. Act 3: run all 5 attack drills (`attack_replay`, `attack_forge`, `attack_tamper`, `attack_revoked`, `attack_expired`)
7. Epilogue: print performance numbers from the benchmark, show the git tag
8. The script exits with code 0 only if all attacks were rejected and all legitimate messages were accepted
9. Total run time under 3 minutes

## Hints

- Start with `#!/bin/bash` and `set -e`
- Start server: `./server --port 9000 &` then `SERVER_PID=$!` then `sleep 2`
- Track pass/fail: `PASS=0; FAIL=0` and increment in each section
- At the end: `kill -INT $SERVER_PID; wait $SERVER_PID 2>/dev/null`
- Print a summary: `echo "TOTAL: $PASS passed, $FAIL failed"`
- Use `sleep 1` between sections for readable output
- Trap cleanup: `trap "kill $SERVER_PID 2>/dev/null" EXIT`
- The script should work on a fresh build — no leftover state from previous runs

## Verify

```bash
chmod +x demo_month2.sh
./demo_month2.sh
echo $?
```

Expected: the demo runs all sections, prints clear output for each act, and exits with code 0.

## Done When

`demo_month2.sh` runs end-to-end with no manual intervention and showcases all Month 2 crypto capabilities including all five attack drill rejections.
