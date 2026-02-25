---
id: w04-quest
title: "Week 4 Boss: Month 1 Demo"
part: w04
kind: boss
proof:
  type: paste
  instructions: "Paste: (1) Month 1 benchmark output, (2) demo script run showing logger + server + protocol + pool working together, (3) quality gate checklist."
  regex_patterns:
    - "benchmark|throughput"
    - "demo|month.1"
    - "PASS"
---
# Week 4 Boss: Month 1 Demo

## Goal

Demonstrate everything you built in Month 1 working together as one system.

## Requirements

1. **Thread pool** running with 4 worker threads
2. **Server** using poll for I/O + thread pool for processing
3. **50 client stress test** passes with envelope protocol and thread pool
4. **Backpressure** — server responds "busy" when queue is full
5. **Clean shutdown** — Ctrl+C drains the queue and stops all threads
6. **Month 1 benchmark** — throughput and latency with and without thread pool
7. **Demo script** — runs all capabilities in sequence, shows output

## Verify

```bash
./demo.sh
```

The demo script runs everything: starts the server, runs the stress test, shows metrics, triggers shutdown, prints benchmark numbers.

## Done When

The demo runs cleanly, the benchmark numbers are recorded, and the Month 1 quality gate is fully green.
