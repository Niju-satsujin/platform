---
id: w02-quest
title: "Week 2 Boss: Stress-Tested Echo Server"
part: w02
kind: boss
proof:
  type: paste
  instructions: "Paste: (1) stress test output showing 50 clients × 100 frames with zero failures, (2) server log showing clean shutdown after Ctrl+C, (3) quality gate checklist."
  regex_patterns:
    - "50 clients"
    - "0 failures|zero failures"
    - "PASS"
---
# Week 2 Boss: Stress-Tested Echo Server

## Goal

Prove your TCP echo server survives real load: 50 concurrent clients each sending 100 length-prefixed frames, with zero data corruption and zero dropped connections.

## Requirements

1. **Server starts** and listens on a configurable port
2. **50 clients connect** simultaneously using your client program
3. **Each client sends 100 frames** using length-prefix framing (4-byte header + payload)
4. **Server echoes each frame back** — client verifies the response matches
5. **Zero failures** — every frame sent equals the frame received
6. **Clean shutdown** — after the test, Ctrl+C shuts down all connections gracefully
7. **Quality gate** — all checklist items pass

## Verify

```bash
# Terminal 1: start server
./build/echo_server --port 9000

# Terminal 2: run stress test
./build/stress_test --port 9000 --clients 50 --frames 100

# Terminal 1: Ctrl+C to shut down
```

## Done When

Stress test reports 50 clients × 100 frames = 5000 total frames, 0 failures. Server shuts down cleanly with no leaked connections.
