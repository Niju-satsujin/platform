---
id: w04-l13
title: "Month 1 demo script"
order: 13
duration_minutes: 20
xp: 50
kind: lesson
part: w04
proof:
  type: paste
  instructions: "Paste your demo.sh script content showing the sequence of commands."
  regex_patterns:
    - "demo|script"
    - "server|client|stress"
---
# Month 1 demo script

## Concept

A demo script is a repeatable sequence of commands that shows your system working. It is not a test — it is a presentation. You run it to show someone (or remind yourself) what your system does.

A good demo script:
1. Starts clean (no leftover state from previous runs)
2. Shows each capability in order
3. Prints clear headers between sections
4. Handles errors gracefully (if a step fails, says what went wrong)
5. Runs in under 2 minutes

Your Month 1 demo shows:
- Logger: write entries, read them back with filters
- Server: start, accept connections, echo frames
- Protocol: envelope framing with version checking
- Thread pool: parallel processing under load
- Robustness: bad clients handled without affecting good ones
- Backpressure: overload detected, server-busy responses sent
- Clean shutdown: Ctrl+C drains queue and closes connections

## Task

1. Write `demo.sh` that runs all of the above in sequence
2. Each section prints a header: `echo "=== Logger ===" `
3. Between sections, pause briefly so the output is readable
4. The script starts the server in the background, runs tests, then shuts it down
5. Total run time should be under 2 minutes

## Hints

- `#!/bin/bash` and `set -e` (exit on any error)
- Start server in background: `./server --port 9000 --workers 4 &` then `SERVER_PID=$!`
- Wait for server to start: `sleep 1`
- At the end: `kill -INT $SERVER_PID; wait $SERVER_PID`
- Print headers: `echo ""; echo "=== Section Name ==="; echo ""`
- Use `sleep 1` between sections for readability

## Verify

```bash
chmod +x demo.sh
./demo.sh
```

Expected: the demo runs all sections, prints clear output, and exits cleanly.

## Done When

`demo.sh` runs end-to-end with no manual intervention and showcases all Month 1 capabilities.
