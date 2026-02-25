---
id: w03-quest
title: "Week 3 Boss: Robust Protocol Server"
part: w03
kind: boss
proof:
  type: paste
  instructions: "Paste: (1) integration test output showing 20 good clients pass and 3 bad clients are handled, (2) server metrics showing frame counts and error counts, (3) quality gate checklist."
  regex_patterns:
    - "20.*pass|good.*20"
    - "3.*handled|bad.*3"
    - "PASS"
---
# Week 3 Boss: Robust Protocol Server

## Goal

Prove your server handles a mix of good and bad clients simultaneously. The good clients must not be affected by the bad ones.

## Requirements

1. **20 good clients** send 50 envelope-framed messages each, receive echoes, verify all match
2. **1 slow client** connects and reads responses extremely slowly (1 byte per second)
3. **1 garbage client** sends random bytes instead of valid envelopes
4. **1 disconnect client** connects, sends half a frame, then disconnects
5. All 20 good clients report 0 failures
6. All 3 bad clients are detected and disconnected without crashing the server
7. Server metrics show total frames processed and errors counted

## Verify

```bash
# Terminal 1
./server --port 9000

# Terminal 2
./integration_test --port 9000 --good-clients 20 --frames 50
```

## Done When

Integration test prints: 20 good clients passed, 3 bad clients handled, server still running.
